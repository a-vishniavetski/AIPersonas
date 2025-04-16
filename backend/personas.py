from sqlalchemy.orm import session

from security.db import *
from sqlalchemy import insert

def insert_persona(user_id, pers_name, descr):
    session.execute(
        insert(Personas),
        [
            {"user_id": user_id, "name": pers_name, "description": descr},
        ],
    )
    