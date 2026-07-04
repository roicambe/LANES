import sys
import os
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
try:
    response = client.get("/api/v1/reports/active-zones")
    print("Status:", response.status_code)
    if response.status_code != 200:
        print("Detail:", response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
