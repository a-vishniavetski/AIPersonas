# tests/test_persona_images.py
import sys
import pytest
import os
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.append(
    os.path.dirname( # AIPersonas
        os.path.dirname( # AIPersonas\tests
            os.path.dirname( # AIPersonas\tests\backend
                os.path.abspath(  # AIPersonas\tests\backend\test_endpoints.py
                    __file__ 
                )
            )
        )
    )
)

from backend.app import app

client = TestClient(app)

# Add this test to see all registered routes
def test_debug_routes():
    for route in app.routes:
        print(f"Route: {route.path} - Methods: {getattr(route, 'methods', 'N/A')}")

def test_get_existing_persona_image():
    """Test getting a default persona image"""
    # Check what files exist in your personas directory
    personas_dir = Path("backend/personas")
    if personas_dir.exists():
        existing_files = list(personas_dir.glob("*.png"))
        if existing_files:
            # Test with the first existing file
            filename = existing_files[0].name
            response = client.get(f"/static/personas/{filename}")
            
            assert response.status_code == 200
            assert len(response.content) > 0
            # Check cache headers
            assert response.headers["cache-control"] == "no-cache, no-store, must-revalidate"
        else:
            pytest.skip("No default persona images found")
    else:
        pytest.skip("Personas directory doesn't exist")

def test_get_persona_image_not_found():
    """Test 404 when file doesn't exist"""
    response = client.get(url="/static/personas/nonexistent_image.png")
    
    assert response.status_code == 404
    assert response.json() == {"detail": "Image not found"}

@pytest.mark.parametrize("filename", [
    "../../../etc/passwd",
    "subdir/image.png", 
    "image..png"
])
def test_get_persona_image_invalid_paths(filename):
    """Test security - invalid file paths"""
    response = client.get(f"/static/personas/{filename}")
    
    # Should return 404 (file doesn't exist in personas dir)
    assert response.status_code == 404