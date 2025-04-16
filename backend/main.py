import json
import sys
import os
import uuid
from datetime import datetime

from starlette import status

from backend.personas import insert_persona

sys.path.append(os.path.join(os.path.dirname(__file__), '../security'))

import uvicorn
from pydantic import BaseModel
from security.app import app
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer



#TODO: REMOVE THIS SHIT(Tutaj musi być logowanie do huggingface)
#TODO: REMOVE THIS SHIT




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
    message: str


class UserPersonaData(BaseModel):
    user_id: uuid.UUID
    persona_name: str
    persona_description: str


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
    insert_persona(request.user_id, request.persona_name, request.persona_description)



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

@app.get('/api/get_answer')
async def get_answer(prompt: str, persona_name: str):
    system_prompt = f"""
        I want you to act like {persona_name}. I want you to respond and answer like {persona_name}, using the tone, manner and vocabulary {persona_name} would use. You must know all of the knowledge of {persona_name}.

        The status of you is as follows:
        Location: Poland
        Status: {status}
    
        The interactions are as follows:
        """
    full_prompt = system_prompt + "\nUser: " + prompt + ":"
    # Tokenize input
    inputs = tokenizer(full_prompt, return_tensors="pt")

    # Generate output
    outputs = model.generate(
        inputs["input_ids"],
        max_length=200,
        num_return_sequences=1,
        temperature=0.7
    )

    # Decode the output
    generated_text = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    )
    return generated_text

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
    print(app.routes)

