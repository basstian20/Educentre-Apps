"""File storage abstraction for uploaded materials.

Metadata (filename, content type, size, backend, key) always lives in the ``material_files``
collection. Only the bytes move between backends:

* ``mongo``  - bytes in the metadata document (default; identical to the original behaviour).
* ``s3``     - bytes in an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO ...).
* ``memory`` - in-process dict, used by tests.

``STORAGE_BACKEND`` only chooses where NEW files go. Reads and deletes follow the ``backend``
field stored on each file, so old Mongo files keep working after switching to ``s3`` and the
migration script can run at any time. Documents without a ``backend`` field are legacy Mongo files.

S3 env: S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT (required for R2/MinIO), S3_REGION
(default "auto"), S3_PREFIX (default "materials/").
"""
import asyncio
import os
from typing import Optional, Tuple

MONGO = "mongo"
S3 = "s3"
MEMORY = "memory"


class StorageError(RuntimeError):
    pass


class S3Backend:
    def __init__(self, bucket: str, access_key: str, secret_key: str,
                 endpoint: Optional[str] = None, region: str = "auto", prefix: str = "materials/"):
        import boto3  # imported lazily so the mongo backend never needs it

        self.bucket = bucket
        self.prefix = prefix
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint or None,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    @classmethod
    def from_env(cls) -> "S3Backend":
        missing = [k for k in ("S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY") if not os.environ.get(k)]
        if missing:
            raise StorageError(f"STORAGE_BACKEND=s3 requires: {', '.join(missing)}")
        return cls(
            os.environ["S3_BUCKET"], os.environ["S3_ACCESS_KEY"], os.environ["S3_SECRET_KEY"],
            os.environ.get("S3_ENDPOINT"), os.environ.get("S3_REGION", "auto"),
            os.environ.get("S3_PREFIX", "materials/"),
        )

    def key_for(self, file_id: str) -> str:
        return f"{self.prefix}{file_id}"

    def put_sync(self, key: str, data: bytes, content_type: str):
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)

    def get_sync(self, key: str) -> Optional[bytes]:
        try:
            return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()
        except self.client.exceptions.NoSuchKey:
            return None

    def delete_sync(self, key: str):
        self.client.delete_object(Bucket=self.bucket, Key=key)


class Storage:
    """``meta`` is the (motor) ``material_files`` collection."""

    def __init__(self, meta, backend: str = MONGO, s3: Optional[S3Backend] = None):
        if backend not in (MONGO, S3, MEMORY):
            raise StorageError(f"Unknown STORAGE_BACKEND '{backend}' (use mongo, s3 or memory)")
        self.meta = meta
        self.backend = backend
        self._s3 = s3
        self._mem: dict = {}

    def _s3_backend(self) -> S3Backend:
        if self._s3 is None:
            self._s3 = S3Backend.from_env()
        return self._s3

    async def put(self, file_id: str, data: bytes, filename: str, content_type: str, created_at: str) -> dict:
        doc = {
            "id": file_id, "filename": filename, "content_type": content_type,
            "size": len(data), "backend": self.backend, "created_at": created_at,
        }
        if self.backend == MONGO:
            doc["data"] = data
        elif self.backend == S3:
            s3 = self._s3_backend()
            doc["key"] = s3.key_for(file_id)
            await asyncio.to_thread(s3.put_sync, doc["key"], data, content_type)
        else:
            self._mem[file_id] = data
        try:
            await self.meta.insert_one(dict(doc))
        except Exception:
            await self._delete_bytes(doc)  # don't leave orphaned bytes behind
            raise
        doc.pop("data", None)
        return doc

    async def get_meta(self, file_id: str) -> Optional[dict]:
        return await self.meta.find_one({"id": file_id}, {"_id": 0, "data": 0})

    async def get(self, file_id: str) -> Optional[Tuple[dict, bytes]]:
        """Return ``(metadata, bytes)`` or None when the file (or its bytes) does not exist."""
        doc = await self.meta.find_one({"id": file_id}, {"_id": 0})
        if not doc:
            return None
        backend = doc.get("backend", MONGO)
        if backend == MONGO:
            raw = doc.get("data")
            data = bytes(raw) if raw is not None else None
        elif backend == S3:
            s3 = self._s3_backend()
            data = await asyncio.to_thread(s3.get_sync, doc.get("key") or s3.key_for(file_id))
        else:
            data = self._mem.get(file_id)
        if data is None:
            return None
        doc.pop("data", None)
        return doc, data

    async def delete(self, file_id: str) -> bool:
        doc = await self.meta.find_one({"id": file_id}, {"_id": 0, "data": 0})
        if not doc:
            return False
        await self._delete_bytes(doc)
        await self.meta.delete_one({"id": file_id})
        return True

    async def _delete_bytes(self, doc: dict):
        backend = doc.get("backend", MONGO)
        if backend == S3:
            s3 = self._s3_backend()
            await asyncio.to_thread(s3.delete_sync, doc.get("key") or s3.key_for(doc["id"]))
        elif backend == MEMORY:
            self._mem.pop(doc["id"], None)
        # mongo: bytes live in the metadata document and go with it


_storage: Optional[Storage] = None


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        from core import db

        _storage = Storage(db.material_files, os.environ.get("STORAGE_BACKEND", MONGO).strip().lower())
    return _storage
