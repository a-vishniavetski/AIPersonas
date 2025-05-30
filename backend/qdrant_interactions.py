import uuid
from enum import Enum
import random
import asyncio
from typing import Dict

from dotenv import load_dotenv
from qdrant_client.grpc import SearchParams
from qdrant_client.models import PointStruct, VectorParams, Distance
from qdrant_client import QdrantClient
import torch
from torch_geometric.nn.nlp import SentenceTransformer
from transformers import AutoTokenizer, AutoModel, DistilBertTokenizer, DistilBertModel

import os
from datetime import datetime, timezone

load_dotenv('./env/.env')

qdrant_client = QdrantClient(
    url="https://91dcb42b-7324-423c-9272-a469314e87b0.europe-west3-0.gcp.cloud.qdrant.io:6333",
    api_key=os.getenv("qdrant_key"),

)

COLLECTION_NAME = "conversation_messages"

print(qdrant_client.get_collections())

#create collection
#
# qdrant_client.recreate_collection(
#     collection_name=COLLECTION_NAME,
#     vectors_config=VectorParams(size=768, distance=Distance.COSINE),
# )


tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
model = AutoModel.from_pretrained("bert-base-multilingual-cased")

print("BBBB")

async def get_embeddings(text: str) -> list:
    """Generate embeddings for the input text using DistilBERT model."""
    print("generating_embed")
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
    return embeddings


print(qdrant_client.get_collections())

# #
# def build_context_from_points(points: list[dict]) -> str:
#     """
#     Build conversation context string from Qdrant points payload.
#     """
#     # Sort points by timestamp to preserve message order
#     sorted_points = sorted(points, key=lambda p: p.payload.get("timestamp", 0))
#
#     context_lines = []
#     for point in sorted_points:
#         payload = point.payload
#         sender = payload.get("sender", "Unknown")
#         text = payload.get("text", "")
#         context_lines.append(f"{sender}: {text}")
#
#     return "\n".join(context_lines) + "\n"
#
#
# async def get_conversation_embeddings(conversation_id: str) -> list[dict]:
#     filter = Filter(
#         must=[
#             FieldCondition(
#                 key="conversation_id",
#                 match=MatchValue(value=conversation_id)
#             )
#         ]
#     )
#     dummy_vector = [0.0] * 768
#
#     response = qdrant_client.search(
#         collection_name=COLLECTION_NAME,
#         query_filter=filter,
#         with_payload=True,
#         query_vector=dummy_vector,
#         limit=1000
#     )
#     return response
#
#
# model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')

async def save_message_to_qdrant(conversation_id, user_message, response):
    # Combine prompt and response into a single string
    combined_text = f"User: {user_message}\nBot: {response}"

    # Generate embedding vector
    embedding_vector = await get_embeddings(combined_text)

    # Metadata for retrieval
    metadata: Dict = {
        "conversation_id": conversation_id,
        "user_prompt": user_message,
        "bot_response": response,
        "timestamp": datetime.utcnow()
    }

    # Save to Qdrant
    point = PointStruct(
        id=str(uuid.uuid4()),  # string UUID
        vector=embedding_vector,
        payload=metadata
    )

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=[point]
    ))



# ## test of saving conversation:
# async def main():
#     user_msg = "Hello, how are you?"
#     bot_response = "I'm doing well, thanks!"
#     await save_message_to_qdrant("123", user_msg, bot_response)
#     print("Message saved to Qdrant.")
#
# if __name__ == "__main__":
#     asyncio.run(main())()