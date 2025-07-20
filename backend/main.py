import asyncio
import traceback
from fastapi import FastAPI, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
import certifi
from dotenv import load_dotenv
import os

# Vellum imports
from vellum.client import Vellum
import vellum.types as types

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
VELLUM_API_KEY = os.getenv("VELLUM_API_KEY")

client = AsyncIOMotorClient(MONGO_DETAILS, tlsCAFile=certifi.where())
db = client.quizdb
quiz_collection = db.quizzes

# Initialize Vellum client once
vellum_client = Vellum(api_key=VELLUM_API_KEY)

@app.get("/quiz/{index}")
async def get_quiz_by_index(index: int, request: Request):
    try:
        quiz_cursor = quiz_collection.find().skip(index).limit(1)
        quiz = await quiz_cursor.to_list(length=1)
        if not quiz:
            raise HTTPException(status_code=404, detail=f"No quiz found at index {index}")

        q = quiz[0]
        reason_text = q.get("reason", "")

        # Define blocking Vellum API call
        def call_vellum():
            return vellum_client.execute_workflow(
                workflow_deployment_name="prompting",
                release_tag="LATEST",
                inputs=[
                    types.WorkflowRequestStringInputRequest(
                        name="text",
                        type="STRING",
                        value=reason_text,
                    ),
                ],
            )

        # Run blocking call in thread to avoid blocking event loop
        result = await asyncio.to_thread(call_vellum)

        if result.data.state == "REJECTED":
            raise HTTPException(status_code=500, detail=f"Vellum API error: {result.data.error.message}")

        # result.data.outputs is a list; find the output named "text"
        llm_output = ""
        for output in result.data.outputs:
            if output.name == "text":
                llm_output = output.value
                break

        return {
            "question": q.get("question"),
            "answer": q.get("answer"),
            "reason": reason_text,
            "llm_output": llm_output,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
