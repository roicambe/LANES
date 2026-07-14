import httpx
import json
import os
from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.security import get_password_hash

BASE_URL = "http://localhost:8000/api/v1"

def setup_test_user():
    db = SessionLocal()
    db.execute(text("UPDATE users SET is_active=true WHERE username='testuser_survey'"))
    db.commit()
    db.close()

def test_integration():
    print("Testing backend integration...")
    setup_test_user()
    
    client = httpx.Client()
    
    # Login to get token
    login_data = {
        "username": "testuser_survey",
        "password": "password123"
    }
    resp = client.post(f"{BASE_URL}/auth/login/access-token", data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Submit a flood report with survey_data
    survey_data = {
        "passable_vehicles": "Motorcycles and SUVs",
        "hidden_hazards": "yes"
    }
    
    files = {
        "raw_text": (None, "The water is knee deep, flowing fast."),
        "source": (None, "direct_user"),
        "severity": (None, "medium"),
        "is_public": (None, "true"),
        "survey_data": (None, json.dumps(survey_data))
    }
    
    print("Submitting flood report with survey data...")
    report_resp = client.post(f"{BASE_URL}/reports", files=files, headers=headers)
    
    if report_resp.status_code in [200, 201]:
        data = report_resp.json()
        print(f"\nSuccess! Report created with ID {data['id']}")
        if "survey" in data and data["survey"]:
            print("Database successfully parsed and saved Survey Data (100% Normalized):")
            print(f" - Passable Vehicles: {data['survey']['passable_vehicles']}")
            print(f" - Hidden Hazards: {data['survey']['hidden_hazards']}")
            print("\nIntegration Test Passed! \u2705")
        else:
            print("Warning: Survey data was not returned in the response.")
    else:
        print(f"Failed to submit report: {report_resp.status_code} - {report_resp.text}")

if __name__ == "__main__":
    test_integration()
