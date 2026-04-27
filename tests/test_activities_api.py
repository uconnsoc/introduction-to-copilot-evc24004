from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def restore_activities():
    original_activities = deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original_activities))


def test_signup_adds_student_to_activity():
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "alex@mergington.edu"},
    )

    assert response.status_code == 200
    assert "alex@mergington.edu" in app_module.activities["Chess Club"]["participants"]


def test_signup_rejects_duplicate_student():
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "michael@mergington.edu"},
    )

    participants = app_module.activities["Chess Club"]["participants"]
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up"
    assert participants.count("michael@mergington.edu") == 1


def test_signup_rejects_unknown_activity():
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "alex@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_removes_student_from_activity():
    response = client.delete(
        "/activities/Chess%20Club/participants/michael%40mergington.edu"
    )

    assert response.status_code == 200
    assert "michael@mergington.edu" not in app_module.activities["Chess Club"]["participants"]


def test_unregister_rejects_student_not_signed_up():
    response = client.delete(
        "/activities/Chess%20Club/participants/alex%40mergington.edu"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up"
