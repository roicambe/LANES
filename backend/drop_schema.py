from app.core.database import SessionLocal
from sqlalchemy import text

def drop_schema():
    db = SessionLocal()
    try:
        db.execute(text('DROP TABLE IF EXISTS flood_report_surveys CASCADE;'))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error dropping table: {e}")
        
    try:
        db.execute(text('DROP INDEX IF EXISTS ix_flood_report_surveys_report_id CASCADE;'))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error dropping index 1: {e}")
        
    try:
        db.execute(text('DROP INDEX IF EXISTS ix_flood_report_surveys_id CASCADE;'))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error dropping index 2: {e}")
        
    try:
        db.execute(text('DROP TYPE IF EXISTS hazardpresence CASCADE;'))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error dropping type: {e}")
        
    print("Cleanup complete.")

if __name__ == '__main__':
    drop_schema()
