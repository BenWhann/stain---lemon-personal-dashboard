import json
from sqlalchemy.orm import Session
from models.db_models import Task, Event, Habit, Bookmark, Counter, Note, Assignment

def seed_initial_data(db: Session):
    # Check if data already exists
    if db.query(Task).first():
        return

    # Seed Tasks
    tasks = [
        Task(id=1, title='Submit Forum #0 & Forum #1', category='Grad School', priority='Zoomies', due_date='2026-09-03', source='Augsburg MSW', completed=True, notes='Initial discussion forum posts'),
        Task(id=2, title='Learning Agreement Brainstorming Forum #1', category='Grad School', priority='Zoomies', due_date='2026-09-03', source='Field Seminar', completed=True, notes='Brainstorming practicum goals'),
        Task(id=3, title='Submit Introduction Forum post', category='Grad School', priority='Purr-fect', due_date='2026-09-04', source='Augsburg MSW', completed=True, notes='Course introduction on Moodle'),
        Task(id=4, title='UHHC Payroll verification & submission', category='Work', priority='Zoomies', due_date='2026-09-04', source='UHHC', completed=True, notes='Timesheets verification'),
        Task(id=5, title='Banfield Pet Hospital check-in for Lemon & Stain 🐾', category='Personal', priority='Purr-fect', due_date='2026-09-05', source='Banfield', completed=False, notes='Routine wellness check-in'),
        Task(id=6, title='Forum #0 Peer Responses', category='Grad School', priority='Purr-fect', due_date='2026-09-07', source='Augsburg MSW', completed=False, notes='Peer dialogue replies'),
        Task(id=7, title='CARE Practicum Training Day (Mendota Heights)', category='Work', priority='Zoomies', due_date='2026-09-08', source='CARE Counseling', completed=False, notes='1155 Northland Dr, 9 AM - 4 PM'),
        Task(id=8, title='Supervision sync with Micalah (Remote)', category='Work', priority='Purr-fect', due_date='2026-09-09', source='CARE Counseling', completed=False, notes='Remote video sync (2-3 PM)'),
        Task(id=9, title='In Treatment Forum 1 Initial Post', category='Grad School', priority='Zoomies', due_date='2026-09-11', source='Diversity & Inequality', completed=False, notes='Clinical reflection post'),
        Task(id=10, title='Resilience Survival Guide Handbook (NASW Ethics)', category='Grad School', priority='Zoomies', due_date='2026-09-12', source='AOCP Individuals', completed=False, notes='Zine/slides/handbook for Prof. Powers'),
        Task(id=11, title='In Treatment Forum 1 Peer Response', category='Grad School', priority='Purr-fect', due_date='2026-09-13', source='Diversity & Inequality', completed=False, notes='Classmate responses'),
        Task(id=12, title='Auto Car Payment due date', category='Bills', priority='Purr-fect', due_date='2026-09-15', source='Auto Bank', completed=False, notes='Monthly auto loan payment'),
        Task(id=13, title='Role-Play Family & Client Overview Paper Due', category='Grad School', priority='Zoomies', due_date='2026-09-21', source='AOCP Families', completed=False, notes='Case overview for Prof. Spicer'),
        Task(id=14, title='Final MSW Learning Agreement Due', category='Grad School', priority='Zoomies', due_date='2026-09-26', source='Field Seminar', completed=False, notes='Official practicum agreement'),
    ]
    db.add_all(tasks)

    # Seed Events
    events = [
        Event(id=1, title='Learning Agreement Forum #1 Due', time='11:59 PM', date='2026-09-03', category='Academic', icon='🎓', location='Augsburg Moodle'),
        Event(id=2, title='UHHC - In Person Shift', time='8:00 AM - 4:00 PM', date='2026-09-04', category='Work', icon='💼', location='Universal Home Health Care'),
        Event(id=3, title='Introduction Forum Due', time='11:59 PM', date='2026-09-04', category='Academic', icon='🎓', location='Augsburg Moodle'),
        Event(id=4, title='Banfield Pet Care Plan Due', time='All Day', date='2026-09-05', category='Bills', icon='🐾', location='Banfield Pet Hospital'),
        Event(id=5, title='Morning Workout & Stretch', time='5:00 AM - 6:00 AM', date='2026-09-07', category='Wellness', icon='🧘‍♀️', location='Home Gym'),
        Event(id=6, title='Forum #0 Response Due', time='11:59 PM', date='2026-09-07', category='Academic', icon='🎓', location='Augsburg Moodle'),
        Event(id=7, title='CARE Practicum Training Day', time='9:00 AM - 4:00 PM', date='2026-09-08', category='Work', icon='💼', location='1155 Northland Dr, Mendota Heights'),
        Event(id=8, title='Supervision w/ Micalah (Remote)', time='2:00 PM - 3:00 PM', date='2026-09-09', category='Work', icon='💻', location='Google Meet'),
        Event(id=9, title='UHHC - In Person Shift', time='7:00 AM - 7:00 PM', date='2026-09-09', category='Work', icon='💼', location='UHHC'),
        Event(id=10, title='UHHC - In Person Shift', time='7:00 AM - 7:00 PM', date='2026-09-10', category='Work', icon='💼', location='UHHC'),
        Event(id=11, title='CARE - Remote Practicum', time='11:00 AM - 3:00 PM', date='2026-09-11', category='Work', icon='💼', location='Remote EHR'),
        Event(id=12, title='AOCP w/ Individuals - Class', time='6:00 PM - 9:00 PM', date='2026-09-11', category='Academic', icon='🎓', location='Hagfors 151 (Prof. Powers)'),
        Event(id=13, title='AOCP w/ Families - Class', time='9:00 AM - 12:00 PM', date='2026-09-12', category='Academic', icon='🎓', location='Hagfors 151 (Prof. Spicer)'),
        Event(id=14, title='Field Seminar - Class', time='1:00 PM - 3:00 PM', date='2026-09-12', category='Academic', icon='🎓', location='Hagfors 301'),
        Event(id=15, title='Diversity & Inequality - Class', time='3:00 PM - 5:00 PM', date='2026-09-12', category='Academic', icon='🎓', location='Hagfors 151'),
        Event(id=16, title='Resilience Survival Guide Due', time='11:59 PM', date='2026-09-12', category='Academic', icon='📝', location='Moodle Portal'),
        Event(id=17, title='CARE - In Person Practicum', time='8:00 AM - 4:00 PM', date='2026-09-14', category='Work', icon='💼', location='8980 Hudson Blvd N, Lake Elmo'),
        Event(id=18, title='CARE - In Person Practicum', time='8:00 AM - 4:00 PM', date='2026-09-15', category='Work', icon='💼', location='8980 Hudson Blvd N, Lake Elmo'),
        Event(id=19, title='Car Payment Due', time='All Day', date='2026-09-15', category='Bills', icon='💳', location='Auto Bank'),
        Event(id=20, title='Role-Play Family & Client Overview', time='11:59 PM', date='2026-09-21', category='Academic', icon='📝', location='Moodle Portal'),
        Event(id=21, title='Final Learning Agreement Due', time='11:59 PM', date='2026-09-26', category='Academic', icon='🎓', location='Augsburg Moodle'),
    ]
    db.add_all(events)

    # Seed Habits
    habits = [
        Habit(id=1, name='Morning 5:00 AM Workout', icon='🏃‍♀️', days_json=json.dumps([True, True, True, True, False, False, False]), streak=4),
        Habit(id=2, name='Pack a Healthy Lunch for Tomorrow', icon='🥗', days_json=json.dumps([True, True, True, True, True, False, False]), streak=5),
        Habit(id=3, name='Playtime & Biscuits with Lemon & Stain', icon='🐾', days_json=json.dumps([True, True, True, True, True, True, True]), streak=21),
        Habit(id=4, name='Clinical Field Journal & Notes (20m)', icon='📖', days_json=json.dumps([True, True, True, False, True, True, False]), streak=5),
        Habit(id=5, name='Hydration Goal (2.5L Water)', icon='💧', days_json=json.dumps([True, True, True, True, True, True, True]), streak=7),
    ]
    db.add_all(habits)

    # Seed Bookmarks
    bookmarks = [
        Bookmark(id=1, title='Augsburg Moodle LMS', url='https://moodle.augsburg.edu', category='MSW School', icon='🎓'),
        Bookmark(id=2, title='Augsburg University Mail', url='https://mail.google.com/a/augsburg.edu', category='School Inbox', icon='💌'),
        Bookmark(id=3, title='Google Calendar (All Feeds)', url='https://calendar.google.com', category='Schedule', icon='📅'),
        Bookmark(id=4, title='CARE Counseling Portal', url='https://care-clinics.com', category='Practicum', icon='🏥'),
        Bookmark(id=5, title='Google Drive Study Folder', url='https://drive.google.com/drive/folders/1mAhtQCwI3QNLQ_YShqiEvKOREpaO4RlR', category='Workspace', icon='📁'),
        Bookmark(id=6, title='Master Task Tracker Sheet', url='https://docs.google.com/spreadsheets/d/14KDi1BMtDPFdYsReC31bNAj-uU3CR0VvcUXVg1XR-lE/edit', category='Sheets', icon='📊'),
        Bookmark(id=7, title='Meals & Recipes Doc', url='https://docs.google.com/document/d/1xb7zWOFOnFzJV6143aZcW5toa-D2ubPCCAHOIvZUKKA/edit', category='Personal', icon='🍲'),
        Bookmark(id=8, title='Banfield Pet Health (Lemon & Stain)', url='https://www.banfield.com', category='Pets', icon='🐱'),
    ]
    db.add_all(bookmarks)

    # Seed Counters
    counters = [
        Counter(name='lemon_pets', count=28),
        Counter(name='stain_pets', count=32),
        Counter(name='focus_paws', count=5),
    ]
    db.add_all(counters)

    # Seed Notes
    initial_notes = (
        "# 🐾 MSW Field & Study Notes (Lemon & Stain Co.)\n\n"
        "- **Prof. Alicia Powers (AOCP w/ Individuals):** HC 151 Fridays 6-9 PM | nguyenp2@augsburg.edu\n"
        "- **Prof. Jasmyn Spicer (AOCP w/ Families):** HC 151 Saturdays 9 AM-12 PM | taylor14@augsburg.edu\n"
        "- **CARE Practicum:** 8980 Hudson Blvd N, Lake Elmo | Supervisor: Micalah\n"
        "- **Reminder:** Survival guide assignment allows zines, slides, or collages incorporating NASW Code of Ethics!\n"
        "- Lemon is sunbathing on the rug ☀️\n"
        "- Stain is keeping guard from the study desk 🐈‍⬛"
    )
    db.add(Note(id='study_notes', content=initial_notes))

    # Seed Assignments
    assignments = [
        Assignment(id=1, course='AOCP: Individuals', prof='Alicia Nguyen Powers, MSW, LICSW', name='Resilience Survival Guide Handbook', due='2026-09-12', weight='20%', status='In Progress'),
        Assignment(id=2, course='AOCP: Families', prof='Jasmyn Spicer, MSW, LICSW', name='Role-Play Family & Client Overview', due='2026-09-21', weight='25%', status='Not Started'),
        Assignment(id=3, course='Field Seminar', prof='Augsburg MSW Faculty', name='Final Field Learning Agreement', due='2026-09-26', weight='Pass/Fail', status='In Progress'),
        Assignment(id=4, course='Diversity & Inequality', prof='Augsburg MSW Faculty', name='In Treatment Reflection & Forum 1', due='2026-09-11', weight='15%', status='Not Started'),
    ]
    db.add_all(assignments)

    db.commit()
