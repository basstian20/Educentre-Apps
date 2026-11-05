"""uploads routes."""
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from auth import get_current_user, require_roles
from core import db, new_id, now_iso
from routers.materials import list_materials

router = APIRouter()


# ── Material file upload (stored in MongoDB, max 5 MB) ──
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.post("/materials/upload")
async def upload_material(
    class_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current=Depends(require_roles("admin", "educator")),
):
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File is too large (max 5 MB)")
    if not data:
        raise HTTPException(400, "The file is empty")
    file_id = new_id()
    await db.material_files.insert_one({
        "id": file_id,
        "filename": file.filename or "file",
        "content_type": file.content_type or "application/octet-stream",
        "size": len(data),
        "data": data,
        "created_at": now_iso(),
    })
    doc = {
        "id": new_id(),
        "class_id": class_id,
        "title": title,
        "type": "file",
        "description": description,
        "file_id": file_id,
        "file_url": f"/api/files/{file_id}",
        "file_name": file.filename,
        "file_size": len(data),
        "uploaded_by": current["id"],
        "uploader_name": current["full_name"],
        "created_at": now_iso(),
    }
    await db.materials.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/files/{file_id}")
async def download_file(file_id: str, current=Depends(get_current_user)):
    f = await db.material_files.find_one({"id": file_id}, {"_id": 0})
    if not f:
        raise HTTPException(404, "File not found")
    # only people who can see the owning material may download
    mat = await db.materials.find_one({"file_id": file_id}, {"_id": 0})
    if mat and current["role"] in ("student", "parent", "educator"):
        visible = await list_materials(None, current)
        if not any(m["id"] == mat["id"] for m in visible):
            raise HTTPException(403, "Not allowed to open this file")
    safe_name = (f["filename"] or "file").replace('"', "")
    return Response(
        content=bytes(f["data"]),
        media_type=f["content_type"],
        headers={"Content-Disposition": f'inline; filename="{safe_name}"'},
    )
