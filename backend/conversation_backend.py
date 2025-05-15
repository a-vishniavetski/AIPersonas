# (Using LangChain + Quadrant + Ollama)

import json
import torch
import requests
from transformers import AutoTokenizer, AutoModel
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.vectorstores.base import VectorStore
from langchain.schema import Document

# Configuration
JSON_FILE_PATH = "conversation_history.json"
QUADRANT_API_URL = "https://api.quadrant.xyz/v1/vectors/search"
QUADRANT_API_KEY = "your-quadrant-api-key"
OLLAMA_MODEL = "llama3.7b"

# 1. Embedding model
tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
embedding_model = AutoModel.from_pretrained("bert-base-multilingual-cased")

def embed_text(text: str) -> list:
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = embedding_model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
    return embeddings

# 2. Quadrant Vector Store Wrapper
class QuadrantRetriever(VectorStore):
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def similarity_search(self, query: str, k: int = 3) -> list:
        embedding = embed_text(query)
        payload = {"query_vector": embedding, "k": k}
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Quadrant API Error: {response.status_code} - {response.text}")
        
        docs = []
        for result in response.json().get("results", []):
            docs.append(Document(page_content=result.get("text", ""), metadata={}))
        return docs

# 3. JSON Logger
def save_to_json(input_text: str, output_text: str):
    try:
        with open(JSON_FILE_PATH, 'r') as f:
            conversation_data = json.load(f)
    except FileNotFoundError:
        conversation_data = []

    conversation_data.append({
        "input_text": input_text,
        "output_text": output_text
    })

    with open(JSON_FILE_PATH, 'w') as f:
        json.dump(conversation_data, f, indent=4)

# 4. LangChain QA Chain
def create_qa_chain():
    retriever = QuadrantRetriever(api_url=QUADRANT_API_URL, api_key=QUADRANT_API_KEY)
    llm = Ollama(model=OLLAMA_MODEL)
    return RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

# 5. Main process
def process_input(input_text: str) -> str:
    qa_chain = create_qa_chain()
    result = qa_chain.run(input_text)
    save_to_json(input_text, result)
    return result

# Example usage
if __name__ == "__main__":
    input_text = "Tell me about your mental health issues."
    response = process_input(input_text)
    print(response)
