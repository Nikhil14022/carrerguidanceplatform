from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
from passlib.context import CryptContext
import shutil
from utils.pdf_generator import generate_client_report

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

REPORTS_DIR = ROOT_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "client"
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_id: str
    user_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_stage: int = 1
    progress_percentage: float = 0.0
    assigned_team_member: Optional[str] = None
    status: str = "active"
    created_at: datetime
    updated_at: datetime

class Stage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    stage_id: str
    stage_number: int
    stage_name: str
    description: str
    requires_meeting: bool = False
    is_active: bool = True
    created_at: datetime

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str
    stage_id: str
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    is_required: bool = True
    order: int
    created_at: datetime

class Response(BaseModel):
    model_config = ConfigDict(extra="ignore")
    response_id: str
    client_id: str
    question_id: str
    stage_id: str
    answer: Any
    created_at: datetime
    updated_at: datetime

class Meeting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    meeting_id: str
    client_id: str
    stage_id: str
    meeting_date: datetime
    notes: str
    conducted_by: str
    status: str = "completed"
    created_at: datetime

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    report_id: str
    client_id: str
    report_title: str
    report_content: Dict[str, Any]
    generated_by: str
    generated_at: datetime
    is_finalized: bool = False

class ActionPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action_plan_id: str
    client_id: str
    title: str
    description: str
    tasks: List[Dict[str, Any]]
    created_by: str
    created_at: datetime
    updated_at: datetime

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    document_id: str
    client_id: str
    filename: str
    file_path: str
    uploaded_by: str
    uploaded_at: datetime

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    logger.info(f"Session exchange requested with session_id: {session_id[:20]}...")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Session verified for email: {data.get('email')}")
    except Exception as e:
        logger.error(f"Failed to verify session: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to verify session: {str(e)}")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    email = data.get("email")
    name = data.get("name")
    picture = data.get("picture")
    session_token = data.get("session_token")
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "client",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
        
        # Auto-create client profile for new users with client role
        client_exists = await db.clients.find_one({"user_id": user_id})
        if not client_exists:
            client_id = f"client_{uuid.uuid4().hex[:12]}"
            client_doc = {
                "client_id": client_id,
                "user_id": user_id,
                "full_name": name,
                "email": email,
                "phone": None,
                "current_stage": 1,
                "progress_percentage": 0.0,
                "assigned_team_member": None,
                "status": "active",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.clients.insert_one(client_doc)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_data}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/clients", response_model=Client)
async def create_client(request: Request, full_name: str, email: EmailStr, phone: Optional[str] = None):
    user = await get_current_user(request)
    
    client_id = f"client_{uuid.uuid4().hex[:12]}"
    client_doc = {
        "client_id": client_id,
        "user_id": user.user_id,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "current_stage": 1,
        "progress_percentage": 0.0,
        "assigned_team_member": None,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.clients.insert_one(client_doc)
    return Client(**client_doc)

@api_router.get("/clients", response_model=List[Client])
async def get_clients(request: Request):
    user = await get_current_user(request)
    
    if user.role == "admin" or user.role == "team":
        clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    else:
        clients = await db.clients.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, request: Request):
    user = await get_current_user(request)
    
    client_doc = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if user.role not in ["admin", "team"] and client_doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Client(**client_doc)

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    client_doc = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if user.role not in ["admin", "team"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    body["updated_at"] = datetime.now(timezone.utc)
    await db.clients.update_one({"client_id": client_id}, {"$set": body})
    
    updated_client = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    return updated_client

@api_router.get("/stages", response_model=List[Stage])
async def get_stages():
    stages = await db.stages.find({"is_active": True}, {"_id": 0}).sort("stage_number", 1).to_list(100)
    return stages

@api_router.get("/stages/{stage_id}/questions", response_model=List[Question])
async def get_stage_questions(stage_id: str):
    questions = await db.questions.find({"stage_id": stage_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return questions

@api_router.post("/responses")
async def submit_response(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    response_id = f"response_{uuid.uuid4().hex[:12]}"
    response_doc = {
        "response_id": response_id,
        "client_id": body["client_id"],
        "question_id": body["question_id"],
        "stage_id": body["stage_id"],
        "answer": body["answer"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    existing = await db.responses.find_one({
        "client_id": body["client_id"],
        "question_id": body["question_id"]
    })
    
    if existing:
        await db.responses.update_one(
            {"client_id": body["client_id"], "question_id": body["question_id"]},
            {"$set": {"answer": body["answer"], "updated_at": datetime.now(timezone.utc)}}
        )
    else:
        await db.responses.insert_one(response_doc)
    
    return {"message": "Response saved"}

@api_router.get("/clients/{client_id}/responses")
async def get_client_responses(client_id: str, request: Request):
    user = await get_current_user(request)
    
    client_doc = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if user.role not in ["admin", "team"] and client_doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    responses = await db.responses.find({"client_id": client_id}, {"_id": 0}).to_list(1000)
    return responses

@api_router.post("/meetings")
async def create_meeting(request: Request):
    user = await get_current_user(request)
    
    if user.role not in ["admin", "team"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    meeting_id = f"meeting_{uuid.uuid4().hex[:12]}"
    meeting_doc = {
        "meeting_id": meeting_id,
        "client_id": body["client_id"],
        "stage_id": body["stage_id"],
        "meeting_date": datetime.now(timezone.utc),
        "notes": body["notes"],
        "conducted_by": user.user_id,
        "status": body.get("status", "completed"),
        "created_at": datetime.now(timezone.utc)
    }
    await db.meetings.insert_one(meeting_doc)
    return Meeting(**meeting_doc)

@api_router.get("/clients/{client_id}/meetings")
async def get_client_meetings(client_id: str, request: Request):
    user = await get_current_user(request)
    
    meetings = await db.meetings.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    return meetings

@api_router.post("/documents/upload")
async def upload_document(request: Request, file: UploadFile = File(...), client_id: str = ""):
    user = await get_current_user(request)
    
    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    file_ext = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{document_id}{file_ext}"
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    document_doc = {
        "document_id": document_id,
        "client_id": client_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "uploaded_by": user.user_id,
        "uploaded_at": datetime.now(timezone.utc)
    }
    await db.documents.insert_one(document_doc)
    
    return {"document_id": document_id, "filename": file.filename}

@api_router.get("/documents/{document_id}")
async def get_document(document_id: str, request: Request):
    user = await get_current_user(request)
    
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return FileResponse(doc["file_path"], filename=doc["filename"])

@api_router.get("/clients/{client_id}/documents")
async def get_client_documents(client_id: str, request: Request):
    user = await get_current_user(request)
    
    documents = await db.documents.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    return documents

@api_router.post("/reports")
async def create_report(request: Request):
    user = await get_current_user(request)
    
    if user.role not in ["admin", "team"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    report_id = f"report_{uuid.uuid4().hex[:12]}"
    report_doc = {
        "report_id": report_id,
        "client_id": body["client_id"],
        "report_title": body["report_title"],
        "report_content": body["report_content"],
        "generated_by": user.user_id,
        "generated_at": datetime.now(timezone.utc),
        "is_finalized": body.get("is_finalized", False)
    }
    await db.reports.insert_one(report_doc)
    return Report(**report_doc)

@api_router.get("/clients/{client_id}/reports")
async def get_client_reports(client_id: str, request: Request):
    user = await get_current_user(request)
    
    reports = await db.reports.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    return reports

@api_router.post("/clients/{client_id}/generate-report")
async def generate_report(client_id: str, request: Request):
    user = await get_current_user(request)
    
    if user.role not in ["admin", "team"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get client data
    client_doc = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get responses with question details
    responses = await db.responses.find({"client_id": client_id}, {"_id": 0}).to_list(1000)
    
    # Enrich responses with question text
    enriched_responses = []
    for response in responses:
        question = await db.questions.find_one({"question_id": response["question_id"]}, {"_id": 0})
        if question:
            enriched_responses.append({
                "question_text": question["question_text"],
                "answer": response["answer"]
            })
    
    # Generate PDF
    report_filename = f"report_{client_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    report_path = REPORTS_DIR / report_filename
    
    try:
        generate_client_report(client_doc, enriched_responses, str(report_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
    
    # Save report metadata to database
    report_id = f"report_{uuid.uuid4().hex[:12]}"
    report_doc = {
        "report_id": report_id,
        "client_id": client_id,
        "report_title": f"Journey Report - {client_doc['full_name']}",
        "report_content": {"file_path": str(report_path), "filename": report_filename},
        "generated_by": user.user_id,
        "generated_at": datetime.now(timezone.utc),
        "is_finalized": True
    }
    await db.reports.insert_one(report_doc)
    
    return {
        "report_id": report_id,
        "message": "Report generated successfully",
        "download_url": f"/api/reports/{report_id}/download"
    }

@api_router.get("/reports/{report_id}/download")
async def download_report(report_id: str, request: Request):
    user = await get_current_user(request)
    
    report_doc = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report_doc:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check access
    client_doc = await db.clients.find_one({"client_id": report_doc["client_id"]}, {"_id": 0})
    if user.role not in ["admin", "team"] and client_doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = report_doc["report_content"]["file_path"]
    filename = report_doc["report_content"]["filename"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    return FileResponse(file_path, filename=filename, media_type="application/pdf")


@api_router.post("/action-plans")
async def create_action_plan(request: Request):
    user = await get_current_user(request)
    
    if user.role not in ["admin", "team"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    action_plan_id = f"plan_{uuid.uuid4().hex[:12]}"
    action_plan_doc = {
        "action_plan_id": action_plan_id,
        "client_id": body["client_id"],
        "title": body["title"],
        "description": body["description"],
        "tasks": body["tasks"],
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.action_plans.insert_one(action_plan_doc)
    return ActionPlan(**action_plan_doc)

@api_router.get("/clients/{client_id}/action-plans")
async def get_client_action_plans(client_id: str, request: Request):
    user = await get_current_user(request)
    
    action_plans = await db.action_plans.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    return action_plans

@api_router.post("/admin/stages")
async def create_stage(request: Request):
    user = await get_current_user(request)
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    stage_id = f"stage_{uuid.uuid4().hex[:12]}"
    stage_doc = {
        "stage_id": stage_id,
        "stage_number": body["stage_number"],
        "stage_name": body["stage_name"],
        "description": body["description"],
        "requires_meeting": body.get("requires_meeting", False),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.stages.insert_one(stage_doc)
    return Stage(**stage_doc)

@api_router.post("/admin/questions")
async def create_question(request: Request):
    user = await get_current_user(request)
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    question_id = f"question_{uuid.uuid4().hex[:12]}"
    question_doc = {
        "question_id": question_id,
        "stage_id": body["stage_id"],
        "question_text": body["question_text"],
        "question_type": body["question_type"],
        "options": body.get("options"),
        "is_required": body.get("is_required", True),
        "order": body["order"],
        "created_at": datetime.now(timezone.utc)
    }
    await db.questions.insert_one(question_doc)
    return Question(**question_doc)

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    user = await get_current_user(request)
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    user = await get_current_user(request)
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in ["client", "team", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": new_role}})
    return {"message": "Role updated successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def seed_initial_data():
    existing_stages = await db.stages.count_documents({})
    if existing_stages == 0:
        stages_data = [
            {"stage_id": f"stage_{uuid.uuid4().hex[:12]}", "stage_number": 1, "stage_name": "Initial Assessment", "description": "Gather basic information and assess client needs", "requires_meeting": False, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"stage_id": f"stage_{uuid.uuid4().hex[:12]}", "stage_number": 2, "stage_name": "Deep Dive Analysis", "description": "Detailed questionnaire about specific areas", "requires_meeting": True, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"stage_id": f"stage_{uuid.uuid4().hex[:12]}", "stage_number": 3, "stage_name": "Strategy Development", "description": "Develop customized strategies based on responses", "requires_meeting": True, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"stage_id": f"stage_{uuid.uuid4().hex[:12]}", "stage_number": 4, "stage_name": "Action Planning", "description": "Create actionable steps and timelines", "requires_meeting": False, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"stage_id": f"stage_{uuid.uuid4().hex[:12]}", "stage_number": 5, "stage_name": "Review & Completion", "description": "Final review and next steps", "requires_meeting": True, "is_active": True, "created_at": datetime.now(timezone.utc)}
        ]
        await db.stages.insert_many(stages_data)
        logger.info("Seeded initial stages")
        
        first_stage = stages_data[0]
        questions_data = [
            {"question_id": f"question_{uuid.uuid4().hex[:12]}", "stage_id": first_stage["stage_id"], "question_text": "What are your primary goals?", "question_type": "text", "options": None, "is_required": True, "order": 1, "created_at": datetime.now(timezone.utc)},
            {"question_id": f"question_{uuid.uuid4().hex[:12]}", "stage_id": first_stage["stage_id"], "question_text": "Which areas need the most attention?", "question_type": "multiple_choice", "options": ["Finance", "Operations", "Marketing", "Technology", "Human Resources"], "is_required": True, "order": 2, "created_at": datetime.now(timezone.utc)},
            {"question_id": f"question_{uuid.uuid4().hex[:12]}", "stage_id": first_stage["stage_id"], "question_text": "On a scale of 1-10, how urgent is your need?", "question_type": "scale", "options": None, "is_required": True, "order": 3, "created_at": datetime.now(timezone.utc)},
            {"question_id": f"question_{uuid.uuid4().hex[:12]}", "stage_id": first_stage["stage_id"], "question_text": "Describe your current situation in detail", "question_type": "textarea", "options": None, "is_required": True, "order": 4, "created_at": datetime.now(timezone.utc)}
        ]
        await db.questions.insert_many(questions_data)
        logger.info("Seeded initial questions for stage 1")
