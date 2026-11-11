"""Admin trash: list, restore and permanently purge soft-deleted records."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import require_roles
from core import UNDELETE_FIELDS, db, now_iso

router = APIRouter()

# type -> (collection, title field, subtitle builder)
TRASH_TYPES = {
    "parents": (db.parents, "full_name", lambda d: d.get("email")),
    "announcements": (db.announcements, "title", lambda d: d.get("created_by_name")),
    "materials": (db.materials, "title", lambda d: d.get("uploader_name")),
    "invoices": (db.invoices, "invoice_number", lambda d: f"Rp {d.get('total_amount', 0):,.0f}".replace(",", ".")),
}


def _kind(kind: str):
    if kind not in TRASH_TYPES:
        raise HTTPException(404, "Unknown trash type")
    return TRASH_TYPES[kind]


async def _trashed_or_404(coll, rid: str) -> dict:
    doc = await coll.find_one({"id": rid, "deleted_at": {"$ne": None}}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Item not found in the trash")
    return doc


@router.get("/trash")
async def list_trash(type: Optional[str] = None, current=Depends(require_roles("admin"))):
    kinds = [type] if type else list(TRASH_TYPES)
    for k in kinds:
        _kind(k)
    items = []
    names = {}
    for k in kinds:
        coll, title_field, subtitle = TRASH_TYPES[k]
        for d in await coll.find({"deleted_at": {"$ne": None}}, {"_id": 0}).to_list(500):
            by = d.get("deleted_by")
            if by and by not in names:
                u = await db.users.find_one({"id": by}, {"_id": 0, "full_name": 1})
                names[by] = (u or {}).get("full_name")
            items.append({
                "type": k,
                "id": d["id"],
                "title": d.get(title_field),
                "subtitle": subtitle(d),
                "deleted_at": d["deleted_at"],
                "deleted_by": by,
                "deleted_by_name": names.get(by),
            })
    items.sort(key=lambda i: i["deleted_at"], reverse=True)
    return items


@router.post("/trash/{kind}/{rid}/restore")
async def restore_item(kind: str, rid: str, current=Depends(require_roles("admin"))):
    coll, _, _ = _kind(kind)
    doc = await _trashed_or_404(coll, rid)
    await coll.update_one({"id": rid}, {"$set": {**UNDELETE_FIELDS, "restored_at": now_iso()}})
    if kind == "parents":
        await db.users.update_one({"id": doc["user_id"]}, {"$set": {"is_active": True}})
        # re-attach children that are still unassigned (deleting the parent had unlinked them)
        if doc.get("children_ids"):
            await db.students.update_many(
                {"id": {"$in": doc["children_ids"]}, "parent_id": None}, {"$set": {"parent_id": doc["user_id"]}}
            )
    return {"ok": True}


@router.delete("/trash/{kind}/{rid}")
async def purge_item(kind: str, rid: str, current=Depends(require_roles("admin"))):
    coll, _, _ = _kind(kind)
    doc = await _trashed_or_404(coll, rid)
    if kind == "invoices" and (doc.get("amount_paid", 0) > 0 or await db.payments.count_documents({"invoice_id": rid})):
        raise HTTPException(400, "This invoice has payments and can't be deleted permanently")
    if kind == "materials" and doc.get("file_id"):
        await db.material_files.delete_one({"id": doc["file_id"]})
    if kind == "parents":
        await db.users.delete_one({"id": doc["user_id"]})
    await coll.delete_one({"id": rid})
    return {"ok": True}
