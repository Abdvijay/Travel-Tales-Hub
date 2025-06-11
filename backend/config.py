import os
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "1234")
    MYSQL_DB = os.getenv("MYSQL_DB", "travel_tales")
    SECRET_KEY = os.getenv("SECRET_KEY", "s3cr3t_k3y_9876543210")