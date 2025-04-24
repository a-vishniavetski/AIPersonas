from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from security.db import Personas, engine
import uuid


# Async version for async contexts
async def insert_persona(user_id, pers_name, descr):
    async with AsyncSession(engine) as session:
        # First check if the persona already exists
        query = select(Personas).filter_by(user_id=user_id, name=pers_name)
        result = await session.execute(query)
        existing_persona = result.scalars().first()
        if existing_persona:
            return existing_persona.id

        # If not found, create new persona
        new_persona = Personas(user_id=user_id, name=pers_name, description=descr)
        session.add(new_persona)
        await session.commit()
        await session.refresh(new_persona)
        return new_persona.id