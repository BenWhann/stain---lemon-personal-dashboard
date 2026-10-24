from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Subtask, Task, utcnow
from models.schemas import (
    ReorderRequest, SubtaskCreate, SubtaskResponse, SubtaskUpdate,
    TaskCreate, TaskResponse, TaskUpdate,
)

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _get_task(db: Session, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _apply_completion(task: Task, completed: bool) -> None:
    task.completed = completed
    if completed:
        task.status = "Completed"
        task.completed_at = task.completed_at or utcnow()
    else:
        if task.status == "Completed":
            task.status = "Pending"
        task.completed_at = None


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

    # Incomplete first, then dated tasks by due date (undated last), then manual order
    return query.order_by(
        Task.completed.asc(),
        Task.due_date.is_(None),
        Task.due_date.asc(),
        Task.position.asc(),
        Task.id.desc(),
    ).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        title=task_in.title.strip(),
        category=task_in.category,
        priority=task_in.priority,
        due_date=task_in.due_date,
        source=task_in.source or "Manual",
        status=task_in.status,
        notes=task_in.notes or "",
    )
    _apply_completion(task, task_in.completed or task_in.status == "Completed")
    task.subtasks = [
        Subtask(title=title.strip()[:255], position=i)
        for i, title in enumerate(task_in.subtasks) if title.strip()
    ]
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/reorder", response_model=List[TaskResponse])
def reorder_tasks(payload: ReorderRequest, db: Session = Depends(get_db)):
    tasks = {t.id: t for t in db.query(Task).filter(Task.id.in_(payload.ids)).all()}
    for position, task_id in enumerate(payload.ids):
        if task_id in tasks:
            tasks[task_id].position = position
    db.commit()
    return [tasks[i] for i in payload.ids if i in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return _get_task(db, task_id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = _get_task(db, task_id)
    update_data = task_in.model_dump(exclude_unset=True)

    completed = update_data.pop("completed", None)
    new_status = update_data.pop("status", None)
    for key, value in update_data.items():
        setattr(task, key, value)

    if new_status is not None:
        task.status = new_status
        _apply_completion(task, new_status == "Completed")
    elif completed is not None:
        _apply_completion(task, completed)

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    task = _get_task(db, task_id)
    _apply_completion(task, not task.completed)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = _get_task(db, task_id)
    db.delete(task)
    db.commit()
    return None


# --- Subtasks ---
@router.post("/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(task_id: int, sub_in: SubtaskCreate, db: Session = Depends(get_db)):
    task = _get_task(db, task_id)
    position = max((s.position for s in task.subtasks), default=-1) + 1
    sub = Subtask(task_id=task.id, title=sub_in.title.strip(), position=position)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _get_subtask(db: Session, task_id: int, sub_id: int) -> Subtask:
    sub = db.get(Subtask, sub_id)
    if not sub or sub.task_id != task_id:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return sub


@router.put("/{task_id}/subtasks/{sub_id}", response_model=SubtaskResponse)
def update_subtask(task_id: int, sub_id: int, sub_in: SubtaskUpdate, db: Session = Depends(get_db)):
    sub = _get_subtask(db, task_id, sub_id)
    for key, value in sub_in.model_dump(exclude_unset=True).items():
        setattr(sub, key, value)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{task_id}/subtasks/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(task_id: int, sub_id: int, db: Session = Depends(get_db)):
    sub = _get_subtask(db, task_id, sub_id)
    db.delete(sub)
    db.commit()
    return None
