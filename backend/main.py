from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid
import base64

from database import users_col, listings_col, messages_col, orders_col, reports_col, create_indexes
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(title="TemocTrade API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await create_indexes()
        # Seed categories if empty
        count = await listings_col.database["categories"].count_documents({})
        if count == 0:
            cats = [
                "Electronics", "Clothes", "Textbooks", "Furniture",
                "Sporting Goods", "Vehicles", "Household Items",
                "Gaming", "Music Instruments", "Other"
            ]
            await listings_col.database["categories"].insert_many(
                [{"_id": str(uuid.uuid4()), "name": c} for c in cats]
            )
        print("✅ MongoDB connected successfully.")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("   Fix your MONGODB_URI in backend/.env and restart.")

# ─────────────────────────────────────────────
# Enums (from class diagram)
# ─────────────────────────────────────────────

class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    completed = "completed"
    cancelled = "cancelled"

class ListingStatus(str, Enum):
    active = "active"
    sold = "sold"
    archived = "archived"

class ListingType(str, Enum):
    fixed = "fixed"
    auction = "auction"

class PaymentMethod(str, Enum):
    cash = "cash"
    venmo = "venmo"
    paypal = "paypal"
    zelle = "zelle"

class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class UserRole(str, Enum):
    buyer = "buyer"
    seller = "seller"
    both = "both"

class ItemCondition(str, Enum):
    new = "new"
    like_new = "like_new"
    good = "good"
    fair = "fair"
    poor = "poor"

# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

# --- User / Auth ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.both

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    created_at: datetime

# --- Listing ---
class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    category_id: str
    condition: ItemCondition = ItemCondition.good
    listing_type: ListingType = ListingType.fixed
    auction_end: Optional[datetime] = None
    meetup_location: Optional[str] = None
    shipping_available: bool = False

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[str] = None
    condition: Optional[ItemCondition] = None
    status: Optional[ListingStatus] = None
    meetup_location: Optional[str] = None
    shipping_available: Optional[bool] = None

class ListingOut(BaseModel):
    id: str
    title: str
    description: str
    price: float
    category_id: str
    category_name: Optional[str] = None
    condition: str
    listing_type: str
    auction_end: Optional[datetime] = None
    images: List[str] = []
    seller_id: str
    seller_name: Optional[str] = None
    status: str
    meetup_location: Optional[str] = None
    shipping_available: bool = False
    created_at: datetime

# --- Message ---
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageOut(BaseModel):
    id: str
    listing_id: str
    sender_id: str
    sender_name: Optional[str] = None
    receiver_id: str
    content: str
    sent_at: datetime

# --- Cart ---
class CartItem(BaseModel):
    listing_id: str
    qty: int = 1

# --- Order / Payment ---
class PaymentInfo(BaseModel):
    method: PaymentMethod
    amount: float

class OrderCreate(BaseModel):
    listing_id: str
    payment: PaymentInfo

class OrderOut(BaseModel):
    id: str
    buyer_id: str
    listing_id: str
    listing_title: Optional[str] = None
    status: str
    total: float
    payment_method: str
    payment_status: str
    created_at: datetime

# --- Bid ---
class BidCreate(BaseModel):
    amount: float

class BidOut(BaseModel):
    id: str
    listing_id: str
    bidder_id: str
    bidder_name: Optional[str] = None
    amount: float
    created_at: datetime

# --- Report ---
class ReportCreate(BaseModel):
    reason: str

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def new_id() -> str:
    return str(uuid.uuid4())

async def get_category_name(category_id: str) -> Optional[str]:
    cat = await listings_col.database["categories"].find_one({"_id": category_id})
    return cat["name"] if cat else None

async def get_user_name(user_id: str) -> Optional[str]:
    user = await users_col.find_one({"_id": user_id})
    return user["name"] if user else None

def serialize_listing(doc: dict, category_name: str = None, seller_name: str = None) -> dict:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "description": doc["description"],
        "price": doc["price"],
        "category_id": doc.get("category_id", ""),
        "category_name": category_name,
        "condition": doc.get("condition", "good"),
        "listing_type": doc.get("listing_type", "fixed"),
        "auction_end": doc.get("auction_end"),
        "images": doc.get("images", []),
        "seller_id": doc["seller_id"],
        "seller_name": seller_name,
        "status": doc.get("status", "active"),
        "meetup_location": doc.get("meetup_location"),
        "shipping_available": doc.get("shipping_available", False),
        "created_at": doc["created_at"],
    }

# ─────────────────────────────────────────────
# AUTH ROUTES
# AuthenticationService.authenticate()
# ─────────────────────────────────────────────

@app.post("/auth/register", status_code=201)
async def register(body: UserRegister):
    if not body.email.endswith("@utdallas.edu"):
        raise HTTPException(400, "Only @utdallas.edu email addresses are allowed.")
    existing = await users_col.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered.")
    user_id = new_id()
    doc = {
        "_id": user_id,
        "name": body.name,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "role": body.role.value,
        "avatar": None,
        "cart": [],
        "created_at": datetime.utcnow(),
    }
    await users_col.insert_one(doc)
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user_id, "name": body.name, "email": body.email, "role": body.role.value}}


@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """User.login() — returns JWT"""
    user = await users_col.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_access_token({"sub": user["_id"]})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user["_id"], "name": user["name"], "email": user["email"], "role": user["role"]}}


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "avatar": current_user.get("avatar"),
        "created_at": current_user["created_at"],
    }


@app.put("/auth/me")
async def update_profile(name: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    updates = {}
    if name:
        updates["name"] = name
    if updates:
        await users_col.update_one({"_id": current_user["_id"]}, {"$set": updates})
    return {"message": "Profile updated"}


# ─────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────

@app.get("/categories")
async def get_categories():
    cats = await listings_col.database["categories"].find({}).to_list(100)
    return [{"id": c["_id"], "name": c["name"]} for c in cats]


# ─────────────────────────────────────────────
# LISTINGS
# Seller.createListing() / Seller.updateListing()
# ─────────────────────────────────────────────

@app.get("/listings")
async def get_listings(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    listing_type: Optional[str] = None,
    sort: Optional[str] = "created_at",
    skip: int = 0,
    limit: int = 20,
):
    query: dict = {"status": "active"}
    if category_id:
        query["category_id"] = category_id
    if listing_type:
        query["listing_type"] = listing_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    sort_field = sort if sort in ("created_at", "price") else "created_at"
    cursor = listings_col.find(query).sort(sort_field, -1).skip(skip).limit(limit)
    docs = await cursor.to_list(limit)

    result = []
    for d in docs:
        cat_name = await get_category_name(d.get("category_id", ""))
        seller_name = await get_user_name(d["seller_id"])
        result.append(serialize_listing(d, cat_name, seller_name))
    total = await listings_col.count_documents(query)
    return {"listings": result, "total": total}


@app.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    doc = await listings_col.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    cat_name = await get_category_name(doc.get("category_id", ""))
    seller_name = await get_user_name(doc["seller_id"])
    return serialize_listing(doc, cat_name, seller_name)


@app.post("/listings", status_code=201)
async def create_listing(body: ListingCreate, current_user: dict = Depends(get_current_user)):
    """Seller.createListing()"""
    listing_id = new_id()
    doc = {
        "_id": listing_id,
        **body.dict(),
        "auction_end": body.auction_end,
        "seller_id": current_user["_id"],
        "images": [],
        "status": "active",
        "created_at": datetime.utcnow(),
    }
    await listings_col.insert_one(doc)
    return {"id": listing_id, "message": "Listing created"}


@app.put("/listings/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdate, current_user: dict = Depends(get_current_user)):
    """Seller.updateListing()"""
    doc = await listings_col.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if doc["seller_id"] != current_user["_id"]:
        raise HTTPException(403, "Not your listing")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    await listings_col.update_one({"_id": listing_id}, {"$set": updates})
    return {"message": "Listing updated"}


@app.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    doc = await listings_col.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if doc["seller_id"] != current_user["_id"]:
        raise HTTPException(403, "Not your listing")
    await listings_col.update_one({"_id": listing_id}, {"$set": {"status": "archived"}})
    return {"message": "Listing removed"}


@app.post("/listings/{listing_id}/images")
async def upload_image(listing_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    doc = await listings_col.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if doc["seller_id"] != current_user["_id"]:
        raise HTTPException(403, "Not your listing")
    content = await file.read()
    b64 = f"data:{file.content_type};base64," + base64.b64encode(content).decode()
    await listings_col.update_one({"_id": listing_id}, {"$push": {"images": b64}})
    return {"message": "Image uploaded"}


@app.get("/my-listings")
async def my_listings(current_user: dict = Depends(get_current_user)):
    docs = await listings_col.find({"seller_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    result = []
    for d in docs:
        cat_name = await get_category_name(d.get("category_id", ""))
        result.append(serialize_listing(d, cat_name, current_user["name"]))
    return result


# ─────────────────────────────────────────────
# BIDS (Auction)
# ─────────────────────────────────────────────

@app.get("/listings/{listing_id}/bids")
async def get_bids(listing_id: str):
    bids = await listings_col.database["bids"].find({"listing_id": listing_id}).sort("amount", -1).to_list(100)
    result = []
    for b in bids:
        bidder_name = await get_user_name(b["bidder_id"])
        result.append({
            "id": b["_id"],
            "listing_id": b["listing_id"],
            "bidder_id": b["bidder_id"],
            "bidder_name": bidder_name,
            "amount": b["amount"],
            "created_at": b["created_at"],
        })
    return result


@app.post("/listings/{listing_id}/bids", status_code=201)
async def place_bid(listing_id: str, body: BidCreate, current_user: dict = Depends(get_current_user)):
    listing = await listings_col.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.get("listing_type") != "auction":
        raise HTTPException(400, "Listing is not an auction")
    if listing.get("status") != "active":
        raise HTTPException(400, "Auction is not active")
    # Check top bid
    top = await listings_col.database["bids"].find_one({"listing_id": listing_id}, sort=[("amount", -1)])
    min_bid = listing["price"] if not top else top["amount"] + 0.01
    if body.amount < min_bid:
        raise HTTPException(400, f"Bid must be at least ${min_bid:.2f}")
    bid_id = new_id()
    await listings_col.database["bids"].insert_one({
        "_id": bid_id,
        "listing_id": listing_id,
        "bidder_id": current_user["_id"],
        "amount": body.amount,
        "created_at": datetime.utcnow(),
    })
    return {"id": bid_id, "message": "Bid placed"}


# ─────────────────────────────────────────────
# MESSAGES
# Message class
# ─────────────────────────────────────────────

@app.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    pipeline = [
        {"$match": {"$or": [{"sender_id": uid}, {"receiver_id": uid}]}},
        {"$sort": {"sent_at": -1}},
        {"$group": {"_id": "$listing_id", "last_message": {"$first": "$$ROOT"}}},
    ]
    convos = await messages_col.aggregate(pipeline).to_list(50)
    result = []
    for c in convos:
        lm = c["last_message"]
        listing = await listings_col.find_one({"_id": c["_id"]})
        other_id = lm["receiver_id"] if lm["sender_id"] == uid else lm["sender_id"]
        other_name = await get_user_name(other_id)
        result.append({
            "listing_id": c["_id"],
            "listing_title": listing["title"] if listing else "Unknown",
            "other_user_id": other_id,
            "other_user_name": other_name,
            "last_message": lm["content"],
            "last_sent_at": lm["sent_at"],
        })
    return result


@app.get("/messages/{listing_id}")
async def get_messages(listing_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    msgs = await messages_col.find({
        "listing_id": listing_id,
        "$or": [{"sender_id": uid}, {"receiver_id": uid}],
    }).sort("sent_at", 1).to_list(200)
    result = []
    for m in msgs:
        sender_name = await get_user_name(m["sender_id"])
        result.append({
            "id": m["_id"],
            "listing_id": m["listing_id"],
            "sender_id": m["sender_id"],
            "sender_name": sender_name,
            "receiver_id": m["receiver_id"],
            "content": m["content"],
            "sent_at": m["sent_at"],
        })
    return result


@app.post("/messages/{listing_id}", status_code=201)
async def send_message(listing_id: str, body: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg_id = new_id()
    await messages_col.insert_one({
        "_id": msg_id,
        "listing_id": listing_id,
        "sender_id": current_user["_id"],
        "receiver_id": body.receiver_id,
        "content": body.content,
        "sent_at": datetime.utcnow(),
    })
    return {"id": msg_id, "message": "Message sent"}


# ─────────────────────────────────────────────
# CART  (Buyer.addToCart)
# ─────────────────────────────────────────────

@app.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = current_user.get("cart", [])
    result = []
    for item in cart:
        listing = await listings_col.find_one({"_id": item["listing_id"]})
        if listing:
            result.append({
                "listing_id": item["listing_id"],
                "qty": item["qty"],
                "title": listing["title"],
                "price": listing["price"],
                "images": listing.get("images", []),
            })
    return result


@app.post("/cart")
async def add_to_cart(body: CartItem, current_user: dict = Depends(get_current_user)):
    """Buyer.addToCart()"""
    cart = current_user.get("cart", [])
    for item in cart:
        if item["listing_id"] == body.listing_id:
            item["qty"] += body.qty
            await users_col.update_one({"_id": current_user["_id"]}, {"$set": {"cart": cart}})
            return {"message": "Cart updated"}
    cart.append({"listing_id": body.listing_id, "qty": body.qty})
    await users_col.update_one({"_id": current_user["_id"]}, {"$set": {"cart": cart}})
    return {"message": "Added to cart"}


@app.delete("/cart/{listing_id}")
async def remove_from_cart(listing_id: str, current_user: dict = Depends(get_current_user)):
    cart = [i for i in current_user.get("cart", []) if i["listing_id"] != listing_id]
    await users_col.update_one({"_id": current_user["_id"]}, {"$set": {"cart": cart}})
    return {"message": "Removed from cart"}


# ─────────────────────────────────────────────
# ORDERS  (Buyer.placeOrder, Order, Payment)
# ─────────────────────────────────────────────

@app.post("/orders", status_code=201)
async def place_order(body: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Buyer.placeOrder() — creates Order containing Payment"""
    listing = await listings_col.find_one({"_id": body.listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["status"] != "active":
        raise HTTPException(400, "Listing is not available")
    order_id = new_id()
    order_doc = {
        "_id": order_id,
        "buyer_id": current_user["_id"],
        "listing_id": body.listing_id,
        "status": OrderStatus.pending.value,
        "total": body.payment.amount,
        "payment": {
            "_id": new_id(),
            "amount": body.payment.amount,
            "method": body.payment.method.value,
            "status": PaymentStatus.pending.value,
            "paid_at": None,
        },
        "created_at": datetime.utcnow(),
    }
    await orders_col.insert_one(order_doc)
    await listings_col.update_one({"_id": body.listing_id}, {"$set": {"status": ListingStatus.sold.value}})
    # Remove from cart
    cart = [i for i in current_user.get("cart", []) if i["listing_id"] != body.listing_id]
    await users_col.update_one({"_id": current_user["_id"]}, {"$set": {"cart": cart}})
    return {"id": order_id, "message": "Order placed"}


@app.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    docs = await orders_col.find({"buyer_id": current_user["_id"]}).sort("created_at", -1).to_list(50)
    result = []
    for d in docs:
        listing = await listings_col.find_one({"_id": d["listing_id"]})
        result.append({
            "id": d["_id"],
            "buyer_id": d["buyer_id"],
            "listing_id": d["listing_id"],
            "listing_title": listing["title"] if listing else "Unknown",
            "status": d["status"],
            "total": d["total"],
            "payment_method": d["payment"]["method"],
            "payment_status": d["payment"]["status"],
            "created_at": d["created_at"],
        })
    return result


@app.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await orders_col.find_one({"_id": order_id, "buyer_id": current_user["_id"]})
    if not doc:
        raise HTTPException(404, "Order not found")
    listing = await listings_col.find_one({"_id": doc["listing_id"]})
    return {
        "id": doc["_id"],
        "buyer_id": doc["buyer_id"],
        "listing_id": doc["listing_id"],
        "listing_title": listing["title"] if listing else "Unknown",
        "status": doc["status"],
        "total": doc["total"],
        "payment": doc["payment"],
        "created_at": doc["created_at"],
    }


# ─────────────────────────────────────────────
# REPORTING
# ─────────────────────────────────────────────

@app.post("/listings/{listing_id}/report", status_code=201)
async def report_listing(listing_id: str, body: ReportCreate, current_user: dict = Depends(get_current_user)):
    listing = await listings_col.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    await reports_col.insert_one({
        "_id": new_id(),
        "listing_id": listing_id,
        "reporter_id": current_user["_id"],
        "reason": body.reason,
        "created_at": datetime.utcnow(),
    })
    return {"message": "Report submitted"}


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "TemocTrade API is running 🚀"}
