from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Task
from models.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    category: Optional[str] = Query(None, description="Filter by category (e.g. Grad School, Work, Bills, Personal)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Zoomies, Purr-fect, Catnap)"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    search: Optional[str] = Query(None, description="Search in title and notes"),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    
    if category and category != "All":
        query = query.filter(Task.category == category)
    if priority and priority != "All":
        query = query.filter(Task.priority == priority)
    if completed is not None:
        query = query.filter(Task.completed == completed)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter((Task.title.ilike(search_pattern)) | (Task.notes.ilike(search_pattern)))
        
    # Sort order: incomplete tasks first, then by due_date ascending, then id
    return query.order_by(Task.completed.asc(), Task.due_date.asc(), Task.id.desc()).all()

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        title=task_in.title,
        category=task_in.category,
        priority=task_in.priority,
        due_date=task_in.due_date,
        source=task_in.source or "Manual",
        status=task_in.status or "Pending",
        completed=task_in.completed,
        notes=task_in.notes or ""
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    # Keep status in sync with completed if status wasn't explicitly provided
    if "completed" in update_data and "status" not in update_data:
        task.status = "Completed" if task.completed else "Pending"
        
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task.completed = not task.completed
    task.status = "Completed" if task.completed else "Pending"
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
