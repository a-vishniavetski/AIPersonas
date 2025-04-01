from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class UserMessage(BaseModel):
    message: str


class UserPersonaData(BaseModel):
    persona_name: str


@app.get("/api/predefined_personas")
async def all_predefined_personas():
    """
    Returns list of predefined personas
    :return:
    :rtype:
    """
    personas = [
        {
            'name': 'Persona1',
            'id': '1',
            'description': 'Persona 1 description'
        },
        {
            'name': 'Persona2',
            'id': '2',
            'description': 'Persona 2 description'
        },
        {
            'name': 'Persona3',
            'id': '3',
            'description': 'Persona 3 description'
        }
    ]
    return personas


@app.post('/api/add_persona')
async def add_persona(request: UserPersonaData):
    """
    Adds persona to the user
    """


@app.get('api/chat_history')
async def get_chats_history():
    histories = [
        {
            'persona_id': '1'
        },
        {
            'persona_id': '2'
        },
        {
            'persona_id': '3'
        },
    ]
    return histories


@app.post('/api/user_message')
async def send_user_message(request: UserMessage):
    return {
        'message': request.message,
        'response': 'I got your message'
    }
