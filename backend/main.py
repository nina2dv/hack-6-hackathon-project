from fastapi import FastAPI, HTTPException
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
import certifi
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MONGO_DETAILS = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_DETAILS,tlsCAFile=certifi.where())
db = client.quizdb
quiz_collection = db.quizzes

@app.get("/quiz/{index}")
async def get_quiz_by_index(index: int):
    # Find one document at offset index
    quiz_cursor = quiz_collection.find().skip(index).limit(1)
    quiz = await quiz_cursor.to_list(length=1)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"No quiz found at index {index}")
    
    q = quiz[0]
    return {
        "question": q.get("question"),
        "answer": q.get("answer"),
        "reason": q.get("reason")
    }
