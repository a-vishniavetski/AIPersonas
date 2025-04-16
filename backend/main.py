from dotenv import load_dotenv
from huggingface_hub import login
import json
import os
from pydantic import BaseModel
from security.app import app
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import uuid
import uvicorn

from personas import insert_persona


sys.path.append(os.path.join(os.path.dirname(__file__), '../security'))

load_dotenv()


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


class UserPersonaData(BaseModel):
    user_id: uuid.UUID
    persona_name: str
    persona_description: str


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


@app.post('/api/get_answer')
async def get_answer(request: UserMessage):
    system_prompt = f"""
        I want you to act like {request.persona}. I want you to respond and answer like {request.persona},
        using the tone, manner and vocabulary {request.persona} would use. 
        You must know all of the knowledge of {request.persona}.

        The status of you is as follows:
        Location: Poland
    
        The interactions are as follows:
        """
    full_prompt = system_prompt + "\nUser: " + request.prompt + ":"
    # Tokenize input
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
    return generated_text


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
    print(app.routes)
