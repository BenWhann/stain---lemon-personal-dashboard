from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Counter
from models.schemas import CounterResponse, CounterIncrementResponse

router = APIRouter(prefix="/api/counters", tags=["Counters"])

VALID_COUNTERS = {"lemon_pets", "stain_pets", "focus_paws"}

@router.get("", response_model=CounterResponse)
def get_counters(db: Session = Depends(get_db)):
    counters = db.query(Counter).all()
    data = {c.name: c.count for c in counters}
    return CounterResponse(
        lemon_pets=data.get("lemon_pets", 0),
        stain_pets=data.get("stain_pets", 0),
        focus_paws=data.get("focus_paws", 0)
    )

@router.post("/{counter_name}/increment", response_model=CounterIncrementResponse)
def increment_counter(counter_name: str, db: Session = Depends(get_db)):
    if counter_name not in VALID_COUNTERS:
        raise HTTPException(status_code=400, detail=f"Invalid counter. Allowed: {list(VALID_COUNTERS)}")
        
    counter = db.query(Counter).filter(Counter.name == counter_name).first()
    if not counter:
        counter = Counter(name=counter_name, count=1)
        db.add(counter)
    else:
        counter.count += 1
        
    db.commit()
    db.refresh(counter)
    return CounterIncrementResponse(name=counter.name, count=counter.count)
