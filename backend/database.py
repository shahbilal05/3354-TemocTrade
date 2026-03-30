from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGODB_URI)
db = client["temoctrade"]

# Collections
users_col = db["users"]
listings_col = db["listings"]
messages_col = db["messages"]
orders_col = db["orders"]
reports_col = db["reports"]


async def create_indexes():
    await users_col.create_index("email", unique=True)
    await listings_col.create_index("seller_id")
    await listings_col.create_index("category_id")
    await messages_col.create_index([("listing_id", 1), ("sent_at", 1)])
