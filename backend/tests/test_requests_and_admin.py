import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import main
from app.services.supabase_client import db_service

client = TestClient(main.app)

AUTH_STUDENT_GOOGLE = {"Authorization": "Bearer test:student:google-student-uuid-99"}
AUTH_ADMIN = {"Authorization": "Bearer test:admin:admin-uuid-01"}

def test_create_and_list_student_complaint():
    """Verify students can submit campus complaints and grievances and they persist."""
    payload = {
        "title": "Broken Air Conditioner in Lab 302",
        "description": "The central unit is not cooling and making loud rattling noise during lectures.",
        "request_type": "complaint",
        "category": "Campus Facilities Grievance",
        "department_name": "Computer Science & Engineering",
        "priority": "high",
        "metadata": {"location": "Lab 302", "block": "Academic Block 3"},
    }

    res_post = client.post("/api/requests", json=payload, headers=AUTH_STUDENT_GOOGLE)
    assert res_post.status_code == 201
    created = res_post.json()
    assert created["title"] == payload["title"]
    assert created["request_type"] == "grievance"  # Normalized to PostgreSQL enum
    assert "reference_number" in created
    req_id = created["id"]

    # Verify student can list their request
    res_list = client.get("/api/requests", headers=AUTH_STUDENT_GOOGLE)
    assert res_list.status_code == 200
    requests = res_list.json()
    assert any(r["id"] == req_id for r in requests)

def test_admin_list_users_and_role_governance():
    """Verify admin user directory lists users including newly registered Google students."""
    # Ensure a Google user is registered
    res_users = client.get("/api/admin/users", headers=AUTH_ADMIN)
    assert res_users.status_code == 200
    users = res_users.json()
    assert len(users) >= 3

    # Check update user role
    target_user = users[0]["id"]
    res_patch = client.patch(
        f"/api/admin/users/{target_user}/role",
        json={"role": "staff"},
        headers=AUTH_ADMIN,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["role"] == "staff"

def test_role_switch_header_handling():
    """Verify X-User-Role header updates the resolved context role for testing."""
    headers_with_role = {
        "Authorization": "Bearer test:student:google-student-uuid-99",
        "X-User-Role": "admin",
    }
    res_stats = client.get("/api/admin/stats", headers=headers_with_role)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "totalStudents" in stats
    assert "totalOpenRequests" in stats
