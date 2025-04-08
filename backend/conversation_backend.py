import json
import numpy as np
import requests
import torch  # Missing import for torch
from transformers import AutoTokenizer, AutoModel
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# JSON file configuration
JSON_FILE_PATH = "conversation_history.json"

#This is placeholder saving to/from json since we don't currently have postgres integration
def save_to_json(input_text, output_text):
    # Check if the file already exists
    try:
        with open(JSON_FILE_PATH, 'r') as f:
            conversation_data = json.load(f)
    except FileNotFoundError:
        conversation_data = []

    # Append the new conversation data
    conversation_data.append({
        "input_text": input_text,
        "output_text": output_text
    })

    # Save back to the JSON file
    with open(JSON_FILE_PATH, 'w') as f:
        json.dump(conversation_data, f, indent=4)



#Can try different models in the future, this is randomly chosen bert
# 1) Initialize Hugging Face Tokenizer and Embedding Model
tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
model = AutoModel.from_pretrained("bert-base-multilingual-cased")


def embed_text(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    # Get the embeddings (mean pooling of hidden states)
    embeddings = outputs.last_hidden_state.mean(dim=1).numpy()
    return embeddings


# 2) Here should be quadrant instance API keys
QUADRANT_API_URL = "https://api.quadrant.xyz/v1"  # Replace with the actual API endpoint for Quadrant DB
QUADRANT_API_KEY = "your-quadrant-api-key"  # Replace with your actual API key


def search_in_quadrant(query_vector, k=3):
    """Search for similar vectors in Quadrant DB."""
    url = f"{QUADRANT_API_URL}/vectors/search"
    headers = {"Authorization": f"Bearer {QUADRANT_API_KEY}"}
    data = {
        "query_vector": query_vector.tolist(),
        "k": k
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        results = response.json()
        return results["results"]  # Assuming the API returns a list of similar vectors and their text
    else:
        print(f"Error searching vectors: {response.status_code} - {response.text}")
        return []


# 3) Ollama Llama 3.7b API integration
# Need to change it to actual Llama endpoint and/or local llama
ollama_url = "http://your-ollama-server.com/llama3.7b"


def query_ollama_server(input_text, context):
    payload = {"input_text": input_text, "context": context}
    response = requests.post(ollama_url, json=payload)
    return response.json().get("generated_text", "No response from Ollama.")


# 4) Define a Retrieval QA chain with LangChain
def create_qa_chain():
    # Use Quadrant DB here instead of FAISS
    qa = RetrievalQA.from_chain_type(
        llm=Ollama(model="llama-3.7b"),
        chain_type="stuff",
        retriever=search_in_quadrant,  # Use Quadrant DB for retrieval
    )
    return qa


# 5) Process input and generate output
def process_input(input_text):
    # Step 1: Generate Embedding for the Input Text
    input_vector = embed_text(input_text)

    # Step 2: Search for similar documents from Quadrant DB (RAG)
    similar_docs = search_in_quadrant(input_vector, k=3)

    # Get the context based on similar documents (for simplicity, just using the input text itself here)
    context = "\n".join([doc["text"] for doc in similar_docs])  # Assuming response has a "text" field

    # Step 3: Query Ollama Llama for the final response
    output_text = query_ollama_server(input_text, context)

    # Step 4: Save input/output to JSON (optional)
    save_to_json(input_text, output_text)

    return output_text


# Example Usage
input_text = "Tell me about your mental health issues."
output_text = process_input(input_text)
print(output_text)
