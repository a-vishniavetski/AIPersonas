# tests/integration/conftest.py
import pytest
import asyncio
import os
import tempfile
import sys
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timedelta

# Add project root to path FIRST
sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )
    )
)

# Set environment variables BEFORE any imports
os.environ['TESTING'] = 'True'
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///test_integration.db'
os.environ['JWT_SECRET'] = 'test-jwt-secret-key'
os.environ['GOOGLE_CLIENT_ID'] = 'test-google-client-id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test-google-client-secret'
os.environ['hf_token'] = 'test-hf-token'

# Mock data storage
MOCK_USERS = {}
MOCK_PERSONAS = {}
MOCK_CONVERSATIONS = {}

sys.modules['huggingface_hub'] = MagicMock()

class MockUser:
    def __init__(self, id: str, email: str, hashed_password: str = "", is_active: bool = True, is_verified: bool = True):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.is_active = is_active
        self.is_verified = is_verified

class MockPersona:
    def __init__(self, id: str, user_id: str, name: str, description: str):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.description = description

class MockConversation:
    def __init__(self, id: str, user_id: str, persona_id: str):
        self.id = id
        self.user_id = user_id
        self.persona_id = persona_id

class MockSession:
    def __init__(self):
        self.committed = False
        self.rollback_called = False
        
    def add(self, obj):
        if isinstance(obj, MockUser):
            MOCK_USERS[obj.id] = obj
        elif isinstance(obj, MockPersona):
            MOCK_PERSONAS[obj.id] = obj
        elif isinstance(obj, MockConversation):
            MOCK_CONVERSATIONS[obj.id] = obj
    
    async def commit(self):
        self.committed = True
    
    async def rollback(self):
        self.rollback_called = True
    
    async def refresh(self, obj):
        pass
    
    async def close(self):
        pass
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

# Mock database engine and session
class MockEngine:
    async def begin(self):
        return MockConnection()
    
    async def dispose(self):
        pass

class MockConnection:
    async def run_sync(self, func):
        pass
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

class MockBase:
    metadata = Mock()
    metadata.drop_all = Mock()
    metadata.create_all = Mock()

# Mock async session generator
async def mock_get_async_session():
    yield MockSession()

# Mock database interactions
async def mock_insert_persona_and_conversation(user_id: str, name: str, description: str):
    persona_id = str(uuid.uuid4())
    conversation_id = str(uuid.uuid4())
    
    persona = MockPersona(persona_id, user_id, name, description)
    conversation = MockConversation(conversation_id, user_id, persona_id)
    
    MOCK_PERSONAS[persona_id] = persona
    MOCK_CONVERSATIONS[conversation_id] = conversation
    
    return persona_id, conversation_id

async def mock_get_user_personas(user_id: str):
    return [p for p in MOCK_PERSONAS.values() if p.user_id == user_id]

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def setup_test_database():
    """Initialize test database with tables - now mocked"""
    # Mock the database imports
    with patch('backend.db.engine', MockEngine()):
        with patch('backend.db.Base', MockBase()):
            mock_engine = MockEngine()
            
            # Create all tables (mocked)
            async with mock_engine.begin() as conn:
                await conn.run_sync(MockBase.metadata.drop_all)  # Clean slate
                await conn.run_sync(MockBase.metadata.create_all)
            
            yield mock_engine
            
            # Cleanup (mocked)
            async with mock_engine.begin() as conn:
                await conn.run_sync(MockBase.metadata.drop_all)

@pytest.fixture
def disable_model_loading():
    """Disable heavy model loading for integration tests"""
    with patch('backend.main.whisper_model', None):
        with patch('backend.main.neeko_model', None):
            with patch('backend.main.neeko_tokenizer', None):
                yield

@pytest.fixture
def integration_env():
    """Provide test environment variables"""
    return {
        'jwt_secret': os.environ.get('JWT_SECRET', 'test-jwt-secret-key'),
        'database_url': os.environ.get('DATABASE_URL', 'sqlite+aiosqlite:///test_integration.db'),
        'google_client_id': os.environ.get('GOOGLE_CLIENT_ID', 'test-google-client-id'),
        'google_client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', 'test-google-client-secret'),
        'hf_token': os.environ.get('hf_token', 'test-hf-token')
    }

@pytest.fixture(autouse=True)
def mock_all_dependencies():
    """Automatically mock all external dependencies"""
    
    # Clear mock data before each test
    MOCK_USERS.clear()
    MOCK_PERSONAS.clear()
    MOCK_CONVERSATIONS.clear()
    
    with patch('backend.db.get_async_session', mock_get_async_session), \
         patch('backend.db.engine', MockEngine()), \
         patch('backend.db.Base', MockBase()), \
         patch('backend.db.User', MockUser), \
         patch('backend.database_interactions.insert_persona_and_conversation', mock_insert_persona_and_conversation), \
         patch('backend.database_interactions.get_user_personas', mock_get_user_personas), \
         patch('backend.users.current_active_user'), \
         patch('backend.main.whisper_model', None), \
         patch('backend.main.neeko_model', None), \
         patch('backend.main.neeko_tokenizer', None), \
         patch('transformers.pipeline') as mock_pipeline, \
         patch('whisper.load_model') as mock_whisper, \
         patch('torch.cuda.is_available', return_value=False), \
         patch('torch.load') as mock_torch_load, \
         patch('requests.get') as mock_requests, \
         patch('requests.post') as mock_requests_post, \
         patch('httpx.AsyncClient') as mock_httpx, \
         patch('sqlalchemy.create_engine') as mock_create_engine, \
         patch('sqlalchemy.ext.asyncio.create_async_engine') as mock_create_async_engine:
        
        # Configure mocks
        mock_pipeline.return_value = Mock()
        mock_whisper.return_value = Mock()
        mock_torch_load.return_value = Mock()
        mock_requests.return_value = Mock(status_code=200, json=Mock(return_value={}))
        mock_requests_post.return_value = Mock(status_code=200, json=Mock(return_value={}))
        mock_httpx.return_value = Mock()
        mock_create_engine.return_value = MockEngine()
        mock_create_async_engine.return_value = MockEngine()
        
        yield

@pytest.fixture
def mock_authenticated_user():
    """Create a mock authenticated user for testing"""
    user_id = str(uuid.uuid4())
    user_email = "test@example.com"
    
    mock_user = MockUser(
        id=user_id,
        email=user_email,
        hashed_password="",
        is_active=True,
        is_verified=True
    )
    
    MOCK_USERS[user_id] = mock_user
    return mock_user

@pytest.fixture
def mock_jwt_token(integration_env, mock_authenticated_user):
    """Create a mock JWT token for testing"""
    import jwt
    
    jwt_payload = {
        "sub": mock_authenticated_user.id,
        "email": mock_authenticated_user.email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    
    jwt_secret = integration_env['jwt_secret']
    token = jwt.encode(jwt_payload, jwt_secret, algorithm="HS256")
    return token

@pytest.fixture
def mock_test_personas(mock_authenticated_user):
    """Create mock test personas"""
    personas = []
    test_personas_data = [
        ("Assistant", "A helpful AI assistant"),
        ("Teacher", "An educational AI tutor"),
        ("Developer", "A coding assistant")
    ]
    
    for name, description in test_personas_data:
        persona_id = str(uuid.uuid4())
        persona = MockPersona(persona_id, mock_authenticated_user.id, name, description)
        MOCK_PERSONAS[persona_id] = persona
        personas.append(persona)
    
    return personas