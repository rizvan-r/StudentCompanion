import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import main
from app.repositories.conversation_repository import conversation_repository

client = TestClient(main.app)

AUTH_HEADER_STUDENT_A = {"Authorization": "Bearer test:student:user-student-a"}
AUTH_HEADER_STUDENT_B = {"Authorization": "Bearer test:student:user-student-b"}

def test_chat_creates_new_session_when_not_provided():
    """Verify posting a chat message without conversation_id starts a new session."""
    res = client.post(
        "/api/chat",
        json={"message": "What is the time complexity of QuickSort in the average case?"},
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "message_id" in data
    assert "answer" in data
    assert data["status"] == "completed"
    assert len(data["answer"]) > 0

    conv_id = data["conversation_id"]

    # Verify session is persisted in list
    res_list = client.get("/api/chat/conversations", headers=AUTH_HEADER_STUDENT_A)
    assert res_list.status_code == 200
    sessions = res_list.json()
    assert any(s["id"] == conv_id for s in sessions)

def test_chat_continues_existing_session():
    """Verify follow-up message appends to the specified conversation session."""
    # 1. Create conversation explicitly
    res_create = client.post(
        "/api/chat/conversations",
        json={"title": "Data Structures Revision"},
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res_create.status_code == 201
    conv_id = res_create.json()["id"]

    # 2. Send message to this session
    res_chat = client.post(
        "/api/chat",
        json={
            "conversation_id": conv_id,
            "message": "Explain the difference between a stack and a queue.",
        },
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res_chat.status_code == 200
    assert res_chat.json()["conversation_id"] == conv_id

    # 3. Verify messages are persisted
    res_msgs = client.get(
        f"/api/chat/conversations/{conv_id}/messages",
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res_msgs.status_code == 200
    msgs = res_msgs.json()
    assert len(msgs) >= 2  # user message + assistant message
    assert msgs[0]["role"] == "user"
    assert "stack and a queue" in msgs[0]["content"]
    assert msgs[1]["role"] == "assistant"

def test_conversation_ownership_isolation():
    """Verify Student B cannot view or delete Student A's conversation."""
    # Student A creates session
    res_create = client.post(
        "/api/chat/conversations",
        json={"title": "Student A Private Session"},
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res_create.status_code == 201
    conv_id = res_create.json()["id"]

    # Student B attempts to read messages
    res_read = client.get(
        f"/api/chat/conversations/{conv_id}/messages",
        headers=AUTH_HEADER_STUDENT_B,
    )
    assert res_read.status_code == 200
    assert len(res_read.json()) == 0  # Emptied / denied by ownership check

    # Student B attempts to post message to Student A's session
    res_post = client.post(
        "/api/chat",
        json={"conversation_id": conv_id, "message": "Trying to inject into A's chat"},
        headers=AUTH_HEADER_STUDENT_B,
    )
    assert res_post.status_code in (403, 404)

    # Student B attempts to delete Student A's session
    res_del = client.delete(
        f"/api/chat/conversations/{conv_id}",
        headers=AUTH_HEADER_STUDENT_B,
    )
    assert res_del.status_code == 404

    # Student A can delete their own session
    res_del_a = client.delete(
        f"/api/chat/conversations/{conv_id}",
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res_del_a.status_code == 200

def test_chat_empty_message_validation():
    """Verify empty chat message is rejected with 400 Bad Request."""
    res = client.post(
        "/api/chat",
        json={"message": "   "},
        headers=AUTH_HEADER_STUDENT_A,
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()
