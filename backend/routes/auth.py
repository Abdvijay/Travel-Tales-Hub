from flask import Blueprint, request, jsonify
from database import connection
import bcrypt
from middleware import token_required
from werkzeug.security import generate_password_hash
from config import Config
import jwt
import datetime
import random,string
from firebase_admin import auth

conn = connection()
cursor = conn.cursor()
reset_tokens = {}
otp_store = {}  # Temporary storage for OTPs
users_db = {
    "user@example.com": {"password": generate_password_hash("oldpassword")}
}

# Function to generate a 6-digit PIN
def generate_pin():
    return ''.join(random.choices(string.digits, k=6))

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/user/register", methods=["POST"])
def register():
    conn = connection()
    cursor = conn.cursor()

    try:

        data = request.json
        username = data["username"]
        email = data["email"]
        phone_number = data.get("phone_number")
        password = data["password"]

        # Generate a random PIN
        pin_number = generate_pin()

        if not username or not email or not phone_number or not password:
            return jsonify({"error": "All fields are required"}), 400
        
        if phone_number.startswith("+91"):
            phone_number = phone_number[3:]

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Always assign "user" role
        role = "user"
        followers_count = 0
        following_count = 0
        post_count = 0
        is_subscription_enabled = False
        is_admin = False

        # Insert user into the database with all fields
        cursor.execute(
            """INSERT INTO users 
            (username, email, password, role, followers_count, following_count, post_count, is_subscription_enabled, is_admin, phone_number, pin_number) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (username, email, hashed_password, role, followers_count, following_count, post_count, is_subscription_enabled, is_admin, phone_number, pin_number),
        )
        conn.commit()

        return jsonify({
            "message": "Registration successful! Please save your PIN for future logins.",
            "pin_number": pin_number  # Send PIN in response
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

@auth_bp.route("/user/login", methods=["POST"])
def login():
    try:
        conn = connection()
        cursor = conn.cursor()
        data = request.json
        email = data.get("email")
        password = data.get("password")

        
        if not email or not password:
            return jsonify({"error": "Email and password are required!"}), 400

        cursor.execute("SELECT id, username, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        user_id, username, stored_hashed_password = user

        if stored_hashed_password and bcrypt.checkpw(password.encode("utf-8"), stored_hashed_password.encode("utf-8")):
            token_payload = {
                "user_id": user_id,
                "username": username,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=5)  # Token expires in 5 hour
            }
            token = jwt.encode(token_payload, Config.SECRET_KEY, algorithm="HS256")

            return jsonify({"message": "Login successful", "token": token, "username": username ,"userId": user_id}), 200
        else:
            return jsonify({"error": "Invalid password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/user/logout", methods=["POST"])
@token_required
def logout(current_user):
    try:
        auth_header = request.headers.get("Authorization")

        if not auth_header or " " not in auth_header:
            return jsonify({"error": "Invalid Authorization header!"}), 400

        token = auth_header.split(" ")[1]  # Extract token from header

        # ✅ Check if token already exists in blacklist
        cursor.execute("SELECT COUNT(*) FROM token_blacklist WHERE token = %s", (token,))
        result = cursor.fetchone()

        if result[0] > 0:
            return jsonify({"message": "Already logged out!"}), 200  # Token already blacklisted

        # ✅ Store the token in the blacklist table
        cursor.execute("INSERT INTO token_blacklist (token) VALUES (%s)", (token,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Logged out successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/verify-pin', methods=['POST'])
def verify_pin():
    try:
        data = request.json
        phone_number = data.get('phone_number')
        pin_number = data.get('pin_number')

        conn = connection()
        cursor = conn.cursor()
        if not phone_number or not pin_number:
            return jsonify({"error": "Phone number and PIN are required!"}), 400

        # ✅ Check if phone and PIN match in the database
        cursor.execute("SELECT id FROM users WHERE phone_number = %s AND pin_number = %s", (phone_number, pin_number))
        user = cursor.fetchone()
        cursor.close()

        if user:
            return jsonify({"message": "PIN verified successfully!"}), 200
        else:
            return jsonify({"error": "Invalid phone number or PIN!"}), 401

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.json
        phone_number = data.get("phone_number")
        new_password = data.get("new_password")

        conn = connection()
        cursor = conn.cursor()

        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())

        # Update password in database
        cursor.execute("UPDATE users SET password = %s WHERE phone_number = %s", (hashed_password, phone_number))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Password updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@auth_bp.route("/get-pin", methods=["GET"])
@token_required
def get_user_pin(current_user):
    conn = connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT pin_number FROM users WHERE id = %s", (current_user,))
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if result:
        return jsonify({"status": "success", "pin": result['pin_number']}), 200
    else:
        return jsonify({"status": "fail", "message": "PIN not found"}), 404
    
@auth_bp.route("/verify-password", methods=["POST"])
def verify_password():
    try:
        # Get the current user's ID from the token
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing!"}), 400

        # Extract the token without 'Bearer'
        token = token.split(" ")[1]
        decoded_token = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_token["user_id"]

        # Get the password from the request
        data = request.json
        entered_password = data.get("password")

        if not entered_password:
            return jsonify({"error": "Password is required!"}), 400

        # Get the stored hashed password for the current user
        conn = connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found!"}), 404

        stored_hashed_password = user[2]

        # Compare entered password with the stored hashed password
        if bcrypt.checkpw(entered_password.encode("utf-8"), stored_hashed_password.encode("utf-8")):
            return jsonify({
                "status": "success", 
                "message": "Password verified successfully", 
                "user": {"id": user[0], "username": user[1]}
            }), 200
        else:
            return jsonify({"status": "error", "message": "Incorrect password"}), 401

    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    
@auth_bp.route("/update-pin", methods=["POST"])
def update_pin():
    try:
        conn = connection()
        cursor = conn.cursor()
        data = request.json

        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get("user_id")

        new_pin = data.get("newPin")

        if not new_pin or len(new_pin) != 6 or not new_pin.isdigit():
            return jsonify({"error": "PIN must be a 6-digit number"}), 400

        cursor.execute("UPDATE users SET pin_number = %s WHERE id = %s", (new_pin, user_id))
        conn.commit()

        return jsonify({"status": "success", "message": "PIN updated successfully"}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500