from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Note, Assignment
from models.schemas import NoteUpdate, NoteResponse, AssignmentCreate, AssignmentResponse

router = APIRouter(prefix="/api/notes", tags=["Notes & Assignments"])

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        # Create blank note if not existing
        note = Note(id=note_id, content="")
        db.add(note)
        db.commit()
        db.refresh(note)
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, note_in: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        note = Note(id=note_id, content=note_in.content)
        db.add(note)
    else:
        note.content = note_in.content
        
    db.commit()
    db.refresh(note)
    return note

# Assignments endpoints
@router.get("/msw/assignments", response_model=List[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(Assignment).order_by(Assignment.id.asc()).all()

@router.post("/msw/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(assignment_in: AssignmentCreate, db: Session = Depends(get_db)):
    assign = Assignment(
        course=assignment_in.course,
        prof=assignment_in.prof or "",
        name=assignment_in.name,
        due=assignment_in.due or "",
        weight=assignment_in.weight or "",
        status=assignment_in.status or "Not Started"
    )
    db.add(assign)
    db.commit()
    db.refresh(assign)
    return assign

@router.delete("/msw/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assign = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assign)
    db.commit()
    return None
