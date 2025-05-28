import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Neeko.embd_roles import embed_character
from Neeko.infer import load_model, ask_character
from fastapi.responses import StreamingResponse

# sys.path.append(os.path.join(os.path.dirname(__file__), '../security'))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(__file__)))

from fastapi import Depends

from backend.db import User, SenderType, Personas

from huggingface_hub import login
from pydantic import BaseModel
from backend.app import app
from backend.users import current_active_user
from backend.qdrant_interactions import *
import uuid
import uvicorn

from backend.database_interactions import (
    insert_persona_and_conversation,
    save_message,
    get_messages_from_conversation,
    get_all_user_personas,
    get_persona_by_conversation_id
)

from conversation_pdf import get_pdf_conversation

load_dotenv('./env/.env')

# login to HF
# you should place the HugginFace token in the .env
# hf_token=<hf_token>
hf_token = os.getenv('hf_token')
login(token=hf_token)

# app = FastAPI()

# Load the base model name
tokenizer, model = load_model(lora_path="../Neeko/data/train_output")


class UserMessage(BaseModel):
    prompt: str
    persona: str
    conversation_id: int


class UserPersonaData(BaseModel):
    persona_name: str
    persona_description: str


class ConversationHistory(BaseModel):
    conversation_id: int


class NewPersonaData(BaseModel):
    persona_name: str
    persona_description: str


class UserData(BaseModel):
    user_id: uuid.UUID


@app.post('/api/get_user_personas')
async def get_user_personas(request: UserData, user: User = Depends(current_active_user)):
    """
    Get all personas of the user
    """
    user_id = user.id
    persona_names = await get_all_user_personas(user_id)
    return {
        'persona_names': persona_names,
    }


@app.post('/api/add_persona')
async def add_persona(request: UserPersonaData, user: User = Depends(current_active_user)):
    user_id = user.id
    persona_id, conversation_id = await insert_persona_and_conversation(user_id, request.persona_name,
                                                                        request.persona_description)
    return {
        'persona_id': persona_id,
        'persona_name': request.persona_name,
        'user_id': user_id,
        'conversation_id': conversation_id,
    }


@app.post('/api/new_persona')
async def add_new_persona(request: NewPersonaData, user: User = Depends(current_active_user)):
    user_id = user.id
    user_email = user.email
    with open(f"{'../Neeko/data/seed_data/profiles'}/wiki_{request.persona_name}.txt", "w") as f:
        f.write(f"# {request.persona_name}\n\n{request.persona_description}\n")

    embed_character(character_name=request.persona_name, encoder_path="google-bert/bert-large-uncased",
                    seed_data_path="../Neeko/data/seed_data",
                    save_path="../Neeko/data/embed")
    persona_id, conversation_id = await insert_persona_and_conversation(user_id, request.persona_name,
                                                                        request.persona_description)
    return {
        'persona_id': persona_id,
        'persona_name': request.persona_name,
        'user_id': user_id,
        'conversation_id': conversation_id,
    }


@app.post('/api/chat_history')
async def get_chats_history(request: ConversationHistory, user: User = Depends(current_active_user)):
    """
    Get ONE specific conversation to load into the chat window.
    """
    messages = await get_messages_from_conversation(request.conversation_id)

    return {
        'messages': messages,
    }


@app.post('/api/user_message')
async def send_user_message(request: UserMessage, user: User = Depends(current_active_user)):
    # Extract user ID from token
    # token = authorization.replace("Bearer ", "") if authorization else None
    # if not token:
    #     raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    user_email = user.email
    return {
        'prompt': request.prompt,
        'response': 'I got your message',
        'user_id': user_id,
        'user_email': user_email,
    }


@app.post('/api/get_answer')
async def get_answer(request: UserMessage, User: User = Depends(current_active_user)):
    await save_message(request.conversation_id, SenderType.USER, request.prompt)

    # Search in qdrant before generating message
    # search_results = search_messages_in_qdrant(request.conversation_id)

    # Prepare message from qdrant
    # conversation_history = process_qdrant_results(search_results)

    generated_text = ask_character(model=model, tokenizer=tokenizer, character=request.persona,
                                    profile_dir="../Neeko/data/seed_data/profiles", embed_dir="../Neeko/data/embed",
                                   question=request.prompt, temperature=request.temperature)

    # Generate the vector (embedding) for the generated text (use model's embedding layer)
    # inputs_for_vector = tokenizer(generated_text, return_tensors="pt")
    # vector = model.encode(inputs_for_vector['input_ids']).detach().numpy().flatten()  # Generate the embedding
    # vector = vector.tolist()  # Convert to list to save to Qdrant

    # Save the generated message (or raw token output if desired) to Qdrant
    # save_message_to_qdrant(request.conversation_id, SenderType.BOT, generated_text, vector)

    await save_message(request.conversation_id, SenderType.BOT, generated_text)
    return generated_text


@app.post('/api/pdf_conversation')
async def pdf_conversation(request: ConversationHistory, user: User = Depends(current_active_user)):
    """
    Get ONE specific conversation to load into the chat window.
    """
    persona: Personas = await get_persona_by_conversation_id(request.conversation_id)
    metadata = {
        "date": "TODO",
        "username": User.email,
        "bot_name": persona.name,
    }
    messages = await get_messages_from_conversation(request.conversation_id)
    pdf = get_pdf_conversation(metadata, messages)
    filename = f"conversation_with_{persona.name}.pdf"
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename={0}".format(filename)},
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, ssl_keyfile="env/key.pem", ssl_certfile="env/cert.pem")
    print(app.routes)
