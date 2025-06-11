from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

# Load environment variables from .env file
dotenv_loaded = load_dotenv()

# Debugging: Check if dotenv is loaded
print("Dotenv Loaded:", dotenv_loaded)

# Debugging: Print DATABASE_URI to check if it is being read
print("Loaded DATABASE_URI:", os.getenv("DATABASE_URI"))

# Create Flask App
app = Flask(__name__)

# Get values from .env
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URI = os.getenv("DATABASE_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Validate database URI before setting it
if not DATABASE_URI:
    raise ValueError("Error: DATABASE_URI is missing in the .env file")

# Configure Flask App
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Test Route
@app.route("/")
def home():
    return "Flask app is running!"

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
