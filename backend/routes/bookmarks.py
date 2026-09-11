from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Bookmark
from models.schemas import BookmarkCreate, BookmarkResponse

router = APIRouter(prefix="/api/bookmarks", tags=["Bookmarks"])

@router.get("", response_model=List[BookmarkResponse])
def get_bookmarks(db: Session = Depends(get_db)):
    return db.query(Bookmark).order_by(Bookmark.id.asc()).all()

@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(bookmark_in: BookmarkCreate, db: Session = Depends(get_db)):
    bm = Bookmark(
        title=bookmark_in.title,
        url=bookmark_in.url,
        category=bookmark_in.category or "General",
        icon=bookmark_in.icon or "🔗"
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)
    return bm

@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    bm = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bm)
    db.commit()
    return None
