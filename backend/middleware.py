from flask import request, jsonify
import jwt
from functools import wraps
from database import connection
from config import Config
SECRET_KEY = Config.SECRET_KEY

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        
        try:
            conn = connection()
            cursor = conn.cursor()

            # Check if token is blacklisted
            cursor.execute("SELECT id FROM token_blacklist WHERE token = %s", (token,))
            blacklisted = cursor.fetchone()
            if blacklisted:
                return jsonify({"error": "Token is invalid. Please log in again!"}), 401

            # Decode token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = data["user_id"]

            cursor.close()
            conn.close()

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token!"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return f(current_user, *args, **kwargs)
    
    return decorated