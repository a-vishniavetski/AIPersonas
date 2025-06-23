import os
import sys
from dotenv import load_dotenv

import logging
import tempfile
from datetime import datetime

from starlette.exceptions import HTTPException
from starlette.responses import FileResponse

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Neeko.embd_roles import embed_character
from Neeko.infer import load_model, ask_character
from fastapi.responses import StreamingResponse

# sys.path.append(os.path.join(os.path.dirname(__file__), '../security'))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(__file__)))

from fastapi import Depends, UploadFile, File, BackgroundTasks, Form
from fastapi.staticfiles import StaticFiles

from backend.db import User, SenderType, Personas

from huggingface_hub import login
from pydantic import BaseModel
from backend.app import app
from backend.users import current_active_user
from backend.qdrant_interactions import *
from backend.voice_communication import *
import uuid
import uvicorn
import whisper

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

##### Models loading
whisper_model = None
whisper_speech = None
neeko_model = None
neeko_tokenizer = None
logging.info("Loading AI models")
try:
    whisper_model = whisper.load_model("base")
    logging.info("Whisper model loaded.")
except Exception as e:
    logging.error(f"Failed to load Whisper model: {e}")

try:
    neeko_tokenizer, neeko_model = load_model(lora_path="../Neeko/data/train_output")
    logging.info("Neeko model loaded.")
except Exception as e:
    logging.error(f"Failed to load Neeko model: {e}")

# neeko_tokenizer, neeko_model = None, None

class UserMessage(BaseModel):
    prompt: str
    persona: str
    conversation_id: int
    temperature: float


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
async def get_user_personas(user: User = Depends(current_active_user)):
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

    # Retrieve actual semantic context messages as a string
    semantic_context = await retrieve_semantic_context(request.conversation_id, request.prompt)

    context_prefix = (
        "Below are a few relevant past messages from the conversation history. "
        "These should be taken into account when generating the response:\n\n"
    )

    # Compose the prompt by merging context + user's prompt
    prompt_with_context = context_prefix + semantic_context + "\n\nUser's question:\n" + request.prompt

    generated_text = ask_character(model=neeko_model, tokenizer=neeko_tokenizer, character=request.persona,
                                    profile_dir="../Neeko/data/seed_data/profiles", embed_dir="../Neeko/data/embed",
                                   question=prompt_with_context, temperature=request.temperature)

    await save_message(request.conversation_id, SenderType.BOT, generated_text)

    await save_message_to_qdrant(request.conversation_id, UserMessage.prompt, generated_text)

    return generated_text


@app.post('/api/pdf_conversation')
async def pdf_conversation(request: ConversationHistory, user: User = Depends(current_active_user)):
    """
    Get ONE specific conversation to load into the chat window.
    """
    persona: Personas = await get_persona_by_conversation_id(request.conversation_id)
    metadata = {
        "date": datetime.now(),
        "username": user.email,
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



def allowed_file(filename):
    allowed_extensions = {"mp3", "m4a"}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type. Only mp3 and m4a are allowed.")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file.filename.rsplit('.', 1)[1]) as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name

    try:
        result = transcribe_audio_file(whisper_model, temp_file_path)
        return {
            "text": result["text"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.post('/api/upload_persona_image')
async def upload_persona_image(
    persona_name: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(current_active_user)
):
    """
    Upload and save persona image
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check if it's PNG (if you want to enforce PNG only)
        if file.content_type != 'image/png':
            raise HTTPException(status_code=400, detail="Only PNG images are allowed")
        
        # Validate file size (e.g., max 5MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 8 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="File size too large (max 8MB)")
        
        # Create personas directory if it doesn't exist
        PERSONAS_DIR = "./personas"
        os.makedirs(PERSONAS_DIR, exist_ok=True)
        
        # Define the file path
        file_path = os.path.join(PERSONAS_DIR, f"{persona_name.lower()}.png")
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(content)
        
        logging.info(f"Persona image uploaded for {persona_name} by user {user.email}")
        
        return {
            "message": f"Image uploaded successfully for {persona_name}",
            "filename": f"{persona_name.lower()}.png",
            "size": file_size
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logging.error(f"Error uploading persona image for {persona_name}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
@app.get("/static/personas/{filename}")
async def get_persona_image(filename: str):
    file_path = f"./personas/{filename}"
    if os.path.exists(file_path):
        return FileResponse(
            file_path, 
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    else:
        raise HTTPException(status_code=404, detail="Image not found")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, ssl_keyfile="env/key.pem", ssl_certfile="env/cert.pem")
    print(app.routes)
