import os
import sys

from fastapi import Depends

from Neeko.embd_roles import embed_character
from backend.db import User

# sys.path.append(os.path.join(os.path.dirname(__file__), '../security'))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from huggingface_hub import login
import json
from pydantic import BaseModel
from backend.app import app
from backend.users import current_active_user
from backend.qdrant_interactions import *
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import uuid
import uvicorn

from backend.database_interactions import (
    insert_persona_and_conversation,
    save_message,
    get_messages_from_conversation,
    get_all_user_personas
)


load_dotenv('./env/.env')


# login to HF
# you should place the HugginFace token in the .env
# hf_token=<hf_token>
hf_token = os.getenv('hf_token')
login(token=hf_token)

# app = FastAPI()

# Load the base model name
with open("../Neeko/data/train_output/adapter_config.json", "r") as f:
    adapter_config = json.load(f)
base_model_path = adapter_config["base_model_name_or_path"]

# Load the base model
model = AutoModelForCausalLM.from_pretrained(base_model_path)
tokenizer = AutoTokenizer.from_pretrained(base_model_path)

# Load the LoRA adapter to base model
adapter_weights = torch.load("../Neeko/data/train_output/adapter_model.bin")
model.load_state_dict(adapter_weights, strict=False)


class UserMessage(BaseModel):
    prompt: str
    persona: str
    conversation_id: int


class UserPersonaData(BaseModel):
    persona_name: str
    persona_description: str

class ConversationHistory(BaseModel):
    conversation_id: int

class NewPersonaData:
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
    persona_id, conversation_id = await insert_persona_and_conversation(user_id, request.persona_name, request.persona_description)
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
    with open(f"{'../Neeko/data/seed_data/profiles'}/wiki_{request.persona_name}", "w") as f:
        f.write(f"# {request.persona_name}\n\n{request.persona_description}\n")

    embed_character(character_name=request.persona_name, encoder_path="google-bert/bert-large-uncased",
                    seed_data_path="../Neeko/data/seed_data",
                    save_path="../Neeko/data/embed")
    #persona_id, conversation_id = await insert_persona_and_conversation(user_id, request.persona_name, request.persona_description)
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
    search_results = search_messages_in_qdrant(request.conversation_id)

    # Prepare message from qdrant
    conversation_history = process_qdrant_results(search_results)

    system_prompt = f"""
        I want you to act like {request.persona}. I want you to respond and answer like {request.persona},
        using the tone, manner and vocabulary {request.persona} would use.
        You must know all of the knowledge of {request.persona}.

        The status of you is as follows:
        Location: Poland

        The interactions are as follows:
        {conversation_history}
        Now, this is a new message from user: {request.prompt}:
    """

    full_prompt = system_prompt + "\nUser: " + request.prompt + ":"

    inputs = tokenizer(full_prompt, return_tensors="pt")

    # Generate output
    outputs = model.generate(
        inputs["input_ids"],
        max_length=200,
        num_return_sequences=1,
        temperature=0.6
    )

    # Decode the output
    generated_text = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    )

    # Generate the vector (embedding) for the generated text (use model's embedding layer)
    inputs_for_vector = tokenizer(generated_text, return_tensors="pt")
    vector = model.encode(inputs_for_vector['input_ids']).detach().numpy().flatten()  # Generate the embedding
    vector = vector.tolist()  # Convert to list to save to Qdrant

    # Save the generated message (or raw token output if desired) to Qdrant
    save_message_to_qdrant(request.conversation_id, SenderType.BOT, generated_text, vector)

    await save_message(request.conversation_id, SenderType.BOT, generated_text)
    return generated_text


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, ssl_keyfile="env/key.pem", ssl_certfile="env/cert.pem")
    print(app.routes)
