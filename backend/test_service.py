import asyncio
import json
from sqlalchemy import text
from app.core.database import SessionLocal
from app.services.report_service import process_new_report

async def test_func():
    db = SessionLocal()
    survey_data = {
        "passable_vehicles": "Motorcycles and SUVs",
        "hidden_hazards": "yes"
    }
    
    user_res = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
    real_user_id = user_res[0] if user_res else None
    
    if not real_user_id:
        print("No users in db, cannot test.")
        return

    try:
        report = await process_new_report(
            db=db,
            raw_text="The water is knee deep.",
            source="direct_user",
            severity="medium",
            human_readable_location=None,
            is_public=True,
            geometry=None,
            image_url=None,
            user_id=real_user_id,
            survey_data=survey_data
        )
        print("Success! Report ID:", report.id)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_func())
