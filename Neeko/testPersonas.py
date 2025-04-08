import json

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load the base model name
with open("./train_output/adapter_config.json", "r") as f:
    adapter_config = json.load(f)

base_model_path = adapter_config["base_model_name_or_path"]

# Load the base model
model = AutoModelForCausalLM.from_pretrained(base_model_path)
tokenizer = AutoTokenizer.from_pretrained(base_model_path)

# Load the LoRA adapter to base model
adapter_weights = torch.load("./train_output/adapter_model.bin")
model.load_state_dict(adapter_weights, strict=False)


def ask_model(prompt):
    system_prompt = """
    I want you to act like {character}. I want you to respond and answer like {character}, using the tone, manner and vocabulary {character} would use. You must know all of the knowledge of {character}. 

    The status of you is as follows:
    Location: {loc_time}
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


while True:
    input_text = input("Ask your question: ")
    response = ask_model(input_text)
    print("Model's response:", response)
    cont = input("Continue?(Y/n)")
    if cont == 'n':
        break
