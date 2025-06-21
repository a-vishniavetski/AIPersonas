import uuid
from enum import Enum
import random
import asyncio
from typing import Dict
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, SearchParams
import numpy as np
from dotenv import load_dotenv
from qdrant_client.grpc import SearchParams
from qdrant_client.models import PointStruct, VectorParams, Distance
from qdrant_client import QdrantClient
import torch
# from torch_geometric.nn.nlp import SentenceTransformer
from transformers import AutoTokenizer, AutoModel, DistilBertTokenizer, DistilBertModel

from dotenv import load_dotenv
from qdrant_client import QdrantClient
import os

load_dotenv('./env/.env')

qdrant_client = QdrantClient(
    url="https://91dcb42b-7324-423c-9272-a469314e87b0.europe-west3-0.gcp.cloud.qdrant.io:6333",
    api_key=os.getenv("qdrant_key"),

)



# print(qdrant_client.get_collections())

# Definiujemy typy użytkowników (np. USER, BOT)
class SenderType:
    USER = "USER"
    BOT = "BOT"

# Funkcja do zapisywania wiadomości w Qdrant (wektory)
def save_message_to_qdrant(conversation_id, sender_type, content, vector):
    qdrant_client.upsert(
        collection_name="conversations",  # Nazwa kolekcji w Qdrant
        points=[
            {
                'id': uuid.uuid4(),  # Generujemy nowy UUID dla punktu
                'payload': {
                    'conversation_id': conversation_id,
                    'sender_type': sender_type,  # Dodajemy typ użytkownika
                    'content': content
                },
                'vector': vector  # Wehikuł: wektor reprezentujący wiadomość
            }
        ]
    )

# Funkcja do wyszukiwania wiadomości w Qdrant
def search_messages_in_qdrant(conversation_id, sender_type=None, top_k=5):
    # Przygotowujemy filtr w zależności od podanego typu użytkownika
    filter_criteria = {"conversation_id": conversation_id}
    if sender_type:
        filter_criteria['sender_type'] = sender_type  # Dodajemy filtr na typ użytkownika

    search_results = qdrant_client.search(
        collection_name="conversations",  # Nazwa kolekcji
        query_vector=[],  # Tutaj należy dostarczyć wektor zapytania (np. średnią z poprzednich wiadomości)
        limit=top_k,  # Liczba wyników do zwrócenia
        filter=filter_criteria  # Filtrujemy po ID rozmowy i typie użytkownika
    )
    return search_results

# Funkcja przetwarzająca wyniki wyszukiwania z Qdrant
def process_qdrant_results(search_results):
    conversation_history = "\n".join([result['payload']['content'] for result in search_results])
    return conversation_history
