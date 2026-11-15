"""Unit tests for services.storage (in-process; no server or real database needed)."""
import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.storage import MEMORY, MONGO, S3, S3Backend, Storage, StorageError  # noqa: E402


class FakeColl:
    """Just enough of a motor collection for Storage."""

    def __init__(self):
        self.docs = {}

    async def insert_one(self, doc):
        self.docs[doc["id"]] = dict(doc)

    async def find_one(self, q, proj=None):
        d = self.docs.get(q["id"])
        if d is None:
            return None
        d = dict(d)
        for k, v in (proj or {}).items():
            if v == 0:
                d.pop(k, None)
        return d

    async def delete_one(self, q):
        self.docs.pop(q["id"], None)


class FakeS3:
    """Dict-backed stand-in with the S3Backend sync interface."""

    def __init__(self):
        self.objects = {}

    def key_for(self, fid):
        return f"materials/{fid}"

    def put_sync(self, key, data, content_type):
        self.objects[key] = data

    def get_sync(self, key):
        return self.objects.get(key)

    def delete_sync(self, key):
        self.objects.pop(key, None)


def run(coro):
    return asyncio.run(coro)


@pytest.mark.parametrize("backend", [MONGO, MEMORY])
def test_put_get_delete_roundtrip(backend):
    coll = FakeColl()
    st = Storage(coll, backend)
    meta = run(st.put("f1", b"hello", "a.txt", "text/plain", "2026-01-01"))
    assert meta["size"] == 5 and meta["backend"] == backend and "data" not in meta
    m, data = run(st.get("f1"))
    assert data == b"hello" and m["filename"] == "a.txt" and m["content_type"] == "text/plain"
    assert ("data" in coll.docs["f1"]) == (backend == MONGO)  # bytes stay out of Mongo for other backends
    assert run(st.delete("f1")) is True
    assert run(st.get("f1")) is None
    assert run(st.delete("f1")) is False


def test_legacy_doc_without_backend_field_is_readable():
    coll = FakeColl()
    coll.docs["old"] = {"id": "old", "filename": "x", "content_type": "text/plain", "size": 3, "data": b"abc"}
    st = Storage(coll, MEMORY)  # new writes go elsewhere; old files still read via their own backend
    assert run(st.get("old"))[1] == b"abc"
    assert run(st.delete("old")) is True


def test_unknown_backend_rejected():
    with pytest.raises(StorageError):
        Storage(FakeColl(), "ftp")


def test_s3_requires_env(monkeypatch):
    for k in ("S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"):
        monkeypatch.delenv(k, raising=False)
    with pytest.raises(StorageError):
        run(Storage(FakeColl(), S3).put("f", b"x", "a", "text/plain", "t"))


def test_s3_backend_roundtrip_with_fake_client():
    coll, s3 = FakeColl(), FakeS3()
    st = Storage(coll, S3, s3)
    run(st.put("f2", b"payload", "b.pdf", "application/pdf", "t"))
    assert s3.objects == {"materials/f2": b"payload"}
    assert "data" not in coll.docs["f2"] and coll.docs["f2"]["key"] == "materials/f2"
    assert run(st.get("f2"))[1] == b"payload"
    run(st.delete("f2"))
    assert s3.objects == {} and "f2" not in coll.docs


def test_failed_metadata_insert_removes_stored_bytes():
    class Boom(FakeColl):
        async def insert_one(self, doc):
            raise RuntimeError("db down")

    s3 = FakeS3()
    with pytest.raises(RuntimeError):
        run(Storage(Boom(), S3, s3).put("f3", b"x", "a", "text/plain", "t"))
    assert s3.objects == {}


def test_real_s3_client_against_moto():
    moto = pytest.importorskip("moto")
    boto3 = pytest.importorskip("boto3")
    with moto.mock_aws():
        boto3.client("s3", region_name="us-east-1").create_bucket(Bucket="edu-test-bucket")
        be = S3Backend("edu-test-bucket", "k", "s", None, "us-east-1")
        st = Storage(FakeColl(), S3, be)
        run(st.put("m1", b"real", "r.txt", "text/plain", "t"))
        assert run(st.get("m1"))[1] == b"real"
        run(st.delete("m1"))
        assert run(st.get("m1")) is None
        assert be.get_sync("materials/m1") is None


def test_migration_script_moves_legacy_files_idempotently():
    from scripts.migrate_files_to_s3 import migrate

    class SyncColl:
        def __init__(self, docs):
            self.docs = docs

        def find(self, q):
            return [d for d in self.docs if "data" in d and d.get("backend", MONGO) == MONGO]

        def update_one(self, flt, upd):
            d = next(x for x in self.docs if x["_id"] == flt["_id"])
            d.update(upd["$set"])
            for k in upd["$unset"]:
                d.pop(k, None)

        def count_documents(self, q):
            return sum(1 for d in self.docs if d.get("backend") == q["backend"])

    docs = [
        {"_id": 1, "id": "a", "data": b"AA", "content_type": "text/plain"},
        {"_id": 2, "id": "b", "data": b"BB", "backend": MONGO},
    ]
    coll, s3 = SyncColl(docs), FakeS3()

    def quiet(*_):
        return None

    assert migrate(coll, s3, dry_run=True, log=quiet)["migrated"] == 2 and "data" in docs[0]
    assert s3.objects == {}
    assert migrate(coll, s3, log=quiet)["migrated"] == 2
    assert all("data" not in d and d["backend"] == S3 for d in docs)
    assert s3.objects == {"materials/a": b"AA", "materials/b": b"BB"}
    again = migrate(coll, s3, log=quiet)
    assert again["migrated"] == 0 and again["skipped"] == 2
