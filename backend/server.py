from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import json
import base64
from bson import ObjectId
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from google.cloud import firestore
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "drezzle-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Drezzle API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    email: str
    password: str
    username: str
    role: str = "listener"  # listener, creator, expert, label, admin

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str
    email: str
    username: str
    role: str
    verified_role: str  # Il ruolo effettivamente verificato
    is_verified: bool = False
    badge_status: Optional[str] = None  # pending, approved, rejected
    verification_documents: Optional[str] = None  # Base64 dei documenti per expert
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminStats(BaseModel):
    total_users: int
    total_contents: int
    pending_expert_requests: int
    pending_label_requests: int
    users_by_role: dict
    recent_registrations: int

class AdminUserDetails(BaseModel):
    id: str
    email: str
    username: str
    role: str
    verified_role: str
    is_verified: bool
    badge_status: Optional[str]
    created_at: datetime
    content_count: int
    last_active: Optional[datetime] = None

class VerificationDecision(BaseModel):
    decision: str  # "approve" or "reject"
    reason: Optional[str] = None

class VerificationRequest(BaseModel):
    documents: str  # Base64 encoded documents
    description: str  # Descrizione degli studi/qualifiche

class SavedContent(BaseModel):
    id: str
    user_id: str
    content_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str = "audio"  # "audio" or "video"
    audio_data: Optional[str] = None  # base64 encoded audio
    video_data: Optional[str] = None  # base64 encoded video
    cover_image: Optional[str] = None  # base64 encoded image
    duration: Optional[float] = None

class Content(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    content_type: str = "audio"  # "audio" or "video"
    audio_data: Optional[str] = None
    video_data: Optional[str] = None
    cover_image: Optional[str] = None
    duration: Optional[float] = None
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str
    content_id: str
    user_id: str
    username: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    text: str

class BadgeRequest(BaseModel):
    id: str
    user_id: str
    reason: str
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BadgeRequestCreate(BaseModel):
    reason: str

class LabelRequest(BaseModel):
    id: str
    user_id: str
    label_name: str
    description: str
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LabelRequestCreate(BaseModel):
    label_name: str
    description: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        role=user["role"],
        verified_role=user.get("verified_role", user["role"]),
        is_verified=user.get("is_verified", False),
        badge_status=user.get("badge_status"),
        verification_documents=user.get("verification_documents"),
        created_at=user["created_at"]
    )

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Check username uniqueness
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Determine verified role based on registration choice
    verified_role = user_data.role
    if user_data.role == "expert":
        verified_role = "listener"  # Expert must verify with documents
    elif user_data.role == "label":
        verified_role = "label"  # Label starts as label but needs admin approval
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "username": user_data.username,
        "password": hashed_password,
        "role": user_data.role,  # Desired role
        "verified_role": verified_role,  # Actual active role
        "is_verified": user_data.role in ["listener", "creator"],  # These don't need verification
        "badge_status": "approved" if user_data.role in ["listener", "creator"] else "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Expert Verification Routes
@api_router.post("/auth/verify-expert")
async def submit_expert_verification(verification: VerificationRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "expert":
        raise HTTPException(status_code=403, detail="Only expert applicants can submit verification")
    
    # Update user with verification documents
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "verification_documents": verification.documents,
                "verification_description": verification.description,
                "badge_status": "pending"
            }
        }
    )
    
    return {"message": "Verification documents submitted successfully"}

# Content Save/Unsave Routes
@api_router.post("/contents/{content_id}/save")
async def save_content(content_id: str, current_user: User = Depends(get_current_user)):
    # Check if content exists
    content = await db.contents.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already saved
    existing_save = await db.saved_contents.find_one({"content_id": content_id, "user_id": current_user.id})
    if existing_save:
        # Unsave
        await db.saved_contents.delete_one({"content_id": content_id, "user_id": current_user.id})
        return {"message": "Content unsaved", "saved": False}
    else:
        # Save
        await db.saved_contents.insert_one({
            "content_id": content_id,
            "user_id": current_user.id,
            "created_at": datetime.utcnow()
        })
        return {"message": "Content saved", "saved": True}

@api_router.get("/saved-contents")
async def get_saved_contents(current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 20):
    saved_items = await db.saved_contents.find({"user_id": current_user.id}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    result = []
    for saved_item in saved_items:
        content = await db.contents.find_one({"_id": ObjectId(saved_item["content_id"])})
        if content:
            result.append(Content(
                id=str(content["_id"]),
                user_id=content["user_id"],
                title=content["title"],
                description=content.get("description"),
                content_type=content.get("content_type", "audio"),
                audio_data=content.get("audio_data"),
                video_data=content.get("video_data"),
                cover_image=content.get("cover_image"),
                duration=content.get("duration"),
                likes_count=content.get("likes_count", 0),
                comments_count=content.get("comments_count", 0),
                created_at=content["created_at"]
            ))
    
    return result

# Content Routes
@api_router.post("/contents", response_model=Content)
async def create_content(content_data: ContentCreate, current_user: User = Depends(get_current_user)):
    # Check if user can upload based on verified role
    if current_user.verified_role not in ["creator"]:
        raise HTTPException(status_code=403, detail="Only verified creators can upload content")
    
    # Validate content type and data
    if content_data.content_type == "audio" and not content_data.audio_data:
        raise HTTPException(status_code=400, detail="Audio data is required for audio content")
    elif content_data.content_type == "video" and not content_data.video_data:
        raise HTTPException(status_code=400, detail="Video data is required for video content")
    
    content_dict = {
        "user_id": current_user.id,
        "username": current_user.username,
        "user_role": current_user.verified_role,
        "title": content_data.title,
        "description": content_data.description,
        "content_type": content_data.content_type,
        "audio_data": content_data.audio_data,
        "video_data": content_data.video_data,
        "cover_image": content_data.cover_image,
        "duration": content_data.duration,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.utcnow()
    }
    
    result = await db.contents.insert_one(content_dict)
    content_id = str(result.inserted_id)
    
    return Content(
        id=content_id,
        user_id=current_user.id,
        title=content_data.title,
        description=content_data.description,
        content_type=content_data.content_type,
        audio_data=content_data.audio_data,
        video_data=content_data.video_data,
        cover_image=content_data.cover_image,
        duration=content_data.duration,
        likes_count=0,
        comments_count=0,
        created_at=content_dict["created_at"]
    )

@api_router.get("/contents", response_model=List[Content])
async def get_contents(skip: int = 0, limit: int = 20):
    contents = await db.contents.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    result = []
    for content in contents:
        result.append(Content(
            id=str(content["_id"]),
            user_id=content["user_id"],
            title=content["title"],
            description=content.get("description"),
            content_type=content.get("content_type", "audio"),
            audio_data=content.get("audio_data"),
            video_data=content.get("video_data"),
            cover_image=content.get("cover_image"),
            duration=content.get("duration"),
            likes_count=content.get("likes_count", 0),
            comments_count=content.get("comments_count", 0),
            created_at=content["created_at"]
        ))
    
    return result

@api_router.post("/contents/{content_id}/like")
async def like_content(content_id: str, current_user: User = Depends(get_current_user)):
    # Check if content exists
    content = await db.contents.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already liked
    existing_like = await db.likes.find_one({"content_id": content_id, "user_id": current_user.id})
    if existing_like:
        # Unlike
        await db.likes.delete_one({"content_id": content_id, "user_id": current_user.id})
        await db.contents.update_one(
            {"_id": ObjectId(content_id)},
            {"$inc": {"likes_count": -1}}
        )
        return {"message": "Content unliked", "liked": False}
    else:
        # Like
        await db.likes.insert_one({
            "content_id": content_id,
            "user_id": current_user.id,
            "created_at": datetime.utcnow()
        })
        await db.contents.update_one(
            {"_id": ObjectId(content_id)},
            {"$inc": {"likes_count": 1}}
        )
        return {"message": "Content liked", "liked": True}

@api_router.post("/contents/{content_id}/comments", response_model=Comment)
async def create_comment(content_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    # Check if content exists
    content = await db.contents.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    comment_dict = {
        "content_id": content_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "text": comment_data.text,
        "created_at": datetime.utcnow()
    }
    
    result = await db.comments.insert_one(comment_dict)
    
    # Increment comments count
    await db.contents.update_one(
        {"_id": ObjectId(content_id)},
        {"$inc": {"comments_count": 1}}
    )
    
    return Comment(
        id=str(result.inserted_id),
        content_id=content_id,
        user_id=current_user.id,
        username=current_user.username,
        text=comment_data.text,
        created_at=comment_dict["created_at"]
    )

@api_router.get("/contents/{content_id}/comments", response_model=List[Comment])
async def get_comments(content_id: str, skip: int = 0, limit: int = 20):
    comments = await db.comments.find({"content_id": content_id}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    result = []
    for comment in comments:
        result.append(Comment(
            id=str(comment["_id"]),
            content_id=comment["content_id"],
            user_id=comment["user_id"],
            username=comment["username"],
            text=comment["text"],
            created_at=comment["created_at"]
        ))
    
    return result

# Badge Request Routes
@api_router.post("/badge-requests", response_model=BadgeRequest)
async def create_badge_request(request_data: BadgeRequestCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "creator":
        raise HTTPException(status_code=403, detail="Only creators can request badges")
    
    # Check if already has pending request
    existing_request = await db.badge_requests.find_one({"user_id": current_user.id, "status": "pending"})
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending badge request")
    
    request_dict = {
        "user_id": current_user.id,
        "reason": request_data.reason,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.badge_requests.insert_one(request_dict)
    
    return BadgeRequest(
        id=str(result.inserted_id),
        user_id=current_user.id,
        reason=request_data.reason,
        status="pending",
        created_at=request_dict["created_at"]
    )

# Label Request Routes
@api_router.post("/label-requests", response_model=LabelRequest)
async def create_label_request(request_data: LabelRequestCreate, current_user: User = Depends(get_current_user)):
    request_dict = {
        "user_id": current_user.id,
        "label_name": request_data.label_name,
        "description": request_data.description,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.label_requests.insert_one(request_dict)
    
    return LabelRequest(
        id=str(result.inserted_id),
        user_id=current_user.id,
        label_name=request_data.label_name,
        description=request_data.description,
        status="pending",
        created_at=request_dict["created_at"]
    )

# Admin Routes
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(admin_user: User = Depends(require_admin)):
    # Get total counts
    total_users = await db.users.count_documents({})
    total_contents = await db.contents.count_documents({})
    
    # Get pending requests
    pending_expert_requests = await db.users.count_documents({
        "role": "expert", 
        "badge_status": "pending"
    })
    pending_label_requests = await db.users.count_documents({
        "role": "label", 
        "badge_status": "pending"
    })
    
    # Get users by role
    pipeline = [
        {"$group": {"_id": "$verified_role", "count": {"$sum": 1}}}
    ]
    role_aggregation = await db.users.aggregate(pipeline).to_list(100)
    users_by_role = {item["_id"]: item["count"] for item in role_aggregation}
    
    # Get recent registrations (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_registrations = await db.users.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    return AdminStats(
        total_users=total_users,
        total_contents=total_contents,
        pending_expert_requests=pending_expert_requests,
        pending_label_requests=pending_label_requests,
        users_by_role=users_by_role,
        recent_registrations=recent_registrations
    )

@api_router.get("/admin/users")
async def get_all_users(admin_user: User = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    result = []
    for user in users:
        # Get content count for each user
        content_count = await db.contents.count_documents({"user_id": str(user["_id"])})
        
        result.append(AdminUserDetails(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            role=user["role"],
            verified_role=user.get("verified_role", user["role"]),
            is_verified=user.get("is_verified", False),
            badge_status=user.get("badge_status"),
            created_at=user["created_at"],
            content_count=content_count,
            last_active=user.get("last_active")
        ))
    
    return result

@api_router.get("/admin/pending-verifications")
async def get_pending_verifications(admin_user: User = Depends(require_admin)):
    # Get expert requests
    expert_requests = await db.users.find({
        "role": "expert",
        "badge_status": "pending",
        "verification_documents": {"$exists": True}
    }).to_list(100)
    
    # Get label requests  
    label_requests = await db.users.find({
        "role": "label",
        "badge_status": "pending"
    }).to_list(100)
    
    result = {
        "expert_requests": [],
        "label_requests": []
    }
    
    for user in expert_requests:
        result["expert_requests"].append({
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "verification_documents": user.get("verification_documents"),
            "verification_description": user.get("verification_description"),
            "created_at": user["created_at"],
            "submitted_at": user.get("updated_at", user["created_at"])
        })
    
    for user in label_requests:
        result["label_requests"].append({
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "created_at": user["created_at"]
        })
    
    return result

@api_router.post("/admin/verify-expert/{user_id}")
async def verify_expert_request(
    user_id: str, 
    decision: VerificationDecision,
    admin_user: User = Depends(require_admin)
):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] != "expert":
        raise HTTPException(status_code=400, detail="User is not an expert applicant")
    
    if decision.decision == "approve":
        # Approve expert status
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "verified_role": "expert",
                    "is_verified": True,
                    "badge_status": "approved",
                    "verified_at": datetime.utcnow(),
                    "verified_by": admin_user.id
                }
            }
        )
        message = "Expert verification approved"
    else:
        # Reject expert status - revert to listener
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "verified_role": "listener",
                    "is_verified": False,
                    "badge_status": "rejected",
                    "rejection_reason": decision.reason,
                    "rejected_at": datetime.utcnow(),
                    "rejected_by": admin_user.id
                }
            }
        )
        message = "Expert verification rejected"
    
    return {"message": message, "decision": decision.decision}

@api_router.post("/admin/verify-label/{user_id}")
async def verify_label_request(
    user_id: str,
    decision: VerificationDecision, 
    admin_user: User = Depends(require_admin)
):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] != "label":
        raise HTTPException(status_code=400, detail="User is not a label applicant")
    
    if decision.decision == "approve":
        # Approve label status
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "verified_role": "label",
                    "is_verified": True,
                    "badge_status": "approved",
                    "verified_at": datetime.utcnow(),
                    "verified_by": admin_user.id
                }
            }
        )
        message = "Label verification approved"
    else:
        # Reject label status - revert to listener
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "verified_role": "listener",
                    "is_verified": False,
                    "badge_status": "rejected",
                    "rejection_reason": decision.reason,
                    "rejected_at": datetime.utcnow(),
                    "rejected_by": admin_user.id
                }
            }
        )
        message = "Label verification rejected"
    
    return {"message": message, "decision": decision.decision}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin_user: User = Depends(require_admin)):
    # Prevent admin from deleting themselves
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting other admins
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    # Delete user and all related data
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.contents.delete_many({"user_id": user_id})
    await db.comments.delete_many({"user_id": user_id})
    await db.likes.delete_many({"user_id": user_id})
    await db.saved_contents.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.delete("/admin/contents/{content_id}")
async def delete_content(content_id: str, admin_user: User = Depends(require_admin)):
    content = await db.contents.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Delete content and related data
    await db.contents.delete_one({"_id": ObjectId(content_id)})
    await db.comments.delete_many({"content_id": content_id})
    await db.likes.delete_many({"content_id": content_id})
    await db.saved_contents.delete_many({"content_id": content_id})
    
    return {"message": "Content deleted successfully"}

# Basic Routes
@api_router.get("/")
async def root():
    return {"message": "Drezzle API v1.0.0", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()