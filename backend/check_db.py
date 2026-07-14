
from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''flood_reports'' ORDER BY ordinal_position;'))
for row in res:
    print(row)

