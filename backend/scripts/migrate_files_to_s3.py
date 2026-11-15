"""Move legacy material files from MongoDB to S3/R2. Safe to re-run; use --dry-run first.

    python -m scripts.migrate_files_to_s3 --dry-run
    python -m scripts.migrate_files_to_s3

Run from the backend/ directory with MONGO_URL, DB_NAME and the S3_* variables set (backend/.env is read).
Each file is uploaded, read back and size-checked, and only then is its Mongo ``data`` removed. Files that
already live in S3 are skipped, so an interrupted run can simply be repeated.
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services.storage import MONGO, S3, S3Backend  # noqa: E402


def migrate(coll, s3, dry_run=False, log=print):
    stats = {"migrated": 0, "skipped": 0, "failed": 0, "bytes": 0}
    query = {"data": {"$exists": True}, "$or": [{"backend": {"$exists": False}}, {"backend": MONGO}]}
    for doc in coll.find(query):
        fid, data = doc["id"], bytes(doc["data"])
        key = s3.key_for(fid)
        if dry_run:
            log(f"[dry-run] would move {fid} ({len(data)} bytes) -> {key}")
            stats["migrated"] += 1
            stats["bytes"] += len(data)
            continue
        try:
            s3.put_sync(key, data, doc.get("content_type") or "application/octet-stream")
            if s3.get_sync(key) != data:
                raise RuntimeError("read-back mismatch")
            coll.update_one({"_id": doc["_id"]}, {"$set": {"backend": S3, "key": key}, "$unset": {"data": ""}})
            stats["migrated"] += 1
            stats["bytes"] += len(data)
            log(f"moved {fid} ({len(data)} bytes)")
        except Exception as exc:
            stats["failed"] += 1
            log(f"FAILED {fid}: {exc}")
    stats["skipped"] = coll.count_documents({"backend": S3})
    return stats


def main():
    from pymongo import MongoClient

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="list what would move, change nothing")
    args = ap.parse_args()
    client = MongoClient(os.environ["MONGO_URL"])
    coll = client[os.environ["DB_NAME"]].material_files
    stats = migrate(coll, S3Backend.from_env(), args.dry_run)
    print(f"done: {stats}")
    sys.exit(1 if stats["failed"] else 0)


if __name__ == "__main__":
    main()
