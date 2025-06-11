from flask import Blueprint, request, jsonify, current_app as app
from database import connection
from middleware import token_required
from collections import OrderedDict
import json,os
import jwt
from datetime import datetime
from werkzeug.utils import secure_filename
from config import Config
SECRET_KEY = Config.SECRET_KEY

trips_bp = Blueprint("trips", __name__)

UPLOAD_FOLDER = "static/trip_images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ Create Trip API
@trips_bp.route('/save-trip', methods=['POST'])
def save_trip():
    conn = connection()
    cursor = conn.cursor()
    token = request.headers.get("Authorization")
    
    if not token or not token.startswith("Bearer "):
        return jsonify({"status": "error", "message": "Token missing or invalid"}), 401

    try:
        token = token.split(" ")[1]
        decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = decoded.get("user_id")
        if not user_id:
            return jsonify({"status": "error", "message": "Invalid user ID"}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401

    try:
        title = request.form.get("title")
        trip_type = request.form.get("trip_type")
        start_date = request.form.get("start_date")
        end_date = request.form.get("end_date")
        charge = request.form.get("charge")
        start_location = request.form.get("start_location")
        end_location = request.form.get("end_location")
        description = request.form.get("description")
        image = request.files.get("image")
        posted = "no"

        # ✅ Validation for missing or empty fields
        required_fields = {
            "title": title,
            "trip_type": trip_type,
            "start_date": start_date,
            "end_date": end_date,
            "charge": charge,
            "start_location": start_location,
            "end_location": end_location,
            "description": description,
            "image": image
        }

        missing_fields = [key for key, value in required_fields.items() if not value]
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing or empty field(s): {', '.join(missing_fields)}"
            }), 400

        if image and image.filename:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            safe_filename = secure_filename(image.filename)
            filename = f"{user_id}_{timestamp}_{safe_filename}"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(image_path)
            image_filename = filename
        else:
            image_filename = None  # This case shouldn't occur due to validation

        # Save to DB
        cursor.execute("""
            INSERT INTO trips (
                user_id, title, trip_type, start_date, end_date, charge, 
                start_location, end_location, description, image_filename, posted
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, title, trip_type, start_date, end_date, charge,
            start_location, end_location, description, image_filename, posted
        ))
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Trip saved successfully"
        }), 200

    except Exception as e:
        import traceback
        print("Save trip error:", e)
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
        

# ✅ Get All Trips API
@trips_bp.route("/get-user-trips", methods=["GET"])
@token_required
def get_user_trips(current_user):
    conn = connection()
    cursor = conn.cursor()
    
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"status": "error", "message": "Token missing or invalid"}), 401

    try:
        token = token.split(" ")[1]
        decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = decoded.get("user_id")
        if not user_id:
            return jsonify({"status": "error", "message": "Invalid user ID"}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401

    try:
        cursor.execute("""
            SELECT id, title, trip_type, start_date, end_date, description, image_filename, start_location, end_location, charge, posted
            FROM trips 
            WHERE user_id = %s
        """, (user_id,))
        trips = cursor.fetchall()

        result = []
        for trip in trips:
            result.append({
                "id": trip[0],
                "title": trip[1],
                "trip_type": trip[2],
                "start_date": trip[3].strftime('%Y-%m-%d'),
                "end_date": trip[4].strftime('%Y-%m-%d'),
                "description": trip[5],
                "image_filename": f"/static/trip_images/{trip[6]}" if trip[6] else None,
                "start_location": trip[7],
                "end_location": trip[8],
                "charge" : trip[9],
                "posted" : trip[10]
            })

        return jsonify({"status": "success", "data": result})
    
    except Exception as e:
        print(f"Error fetching trips: {e}")  # For debug
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# ✅ Get Single Trip by ID API
@trips_bp.route("/trip/<int:trip_id>", methods=["GET"])
@token_required
def get_trip_details(user_id, trip_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # ✅ Check if user is an admin
        cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        user_status = cursor.fetchone()
        is_admin = user_status["is_admin"] if user_status else False

        # ✅ Fetch trip details
        cursor.execute("""
            SELECT user_id, title, description, location, start_date, end_date, is_subscriber_only 
            FROM trips WHERE id = %s
        """, (trip_id,))
        trip = cursor.fetchone()

        if not trip:
            return jsonify({"error": "Trip not found"}), 404

        owner_id = trip["user_id"]
        is_subscriber_only = trip["is_subscriber_only"]

        # ✅ Convert dates to string format
        start_date = trip["start_date"].strftime("%Y-%m-%d")
        end_date = trip["end_date"].strftime("%Y-%m-%d")

        # ✅ Define correct order response
        response_data = {
            "id": trip_id,
            "title": trip["title"],
            "description": trip["description"],
            "location": trip["location"],
            "start_date": start_date,
            "end_date": end_date
        }

        # ✅ Allow access for admins & trip owners
        if is_admin or owner_id == user_id:
            return json.dumps(response_data), 200, {"Content-Type": "application/json"}

        # ✅ Check if the trip is subscriber-only
        if is_subscriber_only:
            cursor.execute("SELECT id FROM subscriptions WHERE subscriber_id = %s AND creator_id = %s", (user_id, owner_id))
            subscription = cursor.fetchone()

            if not subscription:
                # ✅ Show only limited details if not subscribed
                limited_response = {
                    "id": trip_id,
                    "title": trip["title"],
                    "location": trip["location"],
                    "start_date": start_date,
                    "end_date": end_date
                }
                return json.dumps(limited_response), 200, {"Content-Type": "application/json"}

        # ✅ Show full details for subscribers
        return json.dumps(response_data), 200, {"Content-Type": "application/json"}

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# ✅ Update Trip API
@trips_bp.route('/update-trip/<int:trip_id>', methods=['PUT'])
@token_required
def update_trip(current_user, trip_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch the form data from the request
    data = request.form
    title = data.get('title')
    trip_type = data.get('trip_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    charge = data.get('charge')
    start_location = data.get('start_location')
    end_location = data.get('end_location')
    description = data.get('description')

    # Handle optional image upload
    image = request.files.get('image')
    image_filename = None

    if image and image.filename and allowed_file(image.filename):
        # Generate a safe and unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = secure_filename(image.filename)
        filename = f"{current_user}_{timestamp}_{safe_filename}"

        # Ensure the upload folder exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Save the file to the upload folder
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)

        # Save only the filename (no path) in DB
        image_filename = filename

    # Update the trip in the database
    if image_filename:
        cursor.execute("""
            UPDATE trips 
            SET title=%s, trip_type=%s, start_date=%s, end_date=%s,
                charge=%s, start_location=%s, end_location=%s, description=%s, image_filename=%s
            WHERE id=%s AND user_id=%s
        """, (title, trip_type, start_date, end_date, charge, start_location, end_location, description, image_filename, trip_id, current_user))
    else:
        cursor.execute("""
            UPDATE trips 
            SET title=%s, trip_type=%s, start_date=%s, end_date=%s,
                charge=%s, start_location=%s, end_location=%s, description=%s
            WHERE id=%s AND user_id=%s
        """, (title, trip_type, start_date, end_date, charge, start_location, end_location, description, trip_id, current_user))

    # Commit the transaction
    conn.commit()

    # Fetch the updated trip to return in the response
    cursor.execute("SELECT * FROM trips WHERE id = %s AND user_id = %s", (trip_id, current_user))
    updated_trip = cursor.fetchone()

    # Close the cursor and connection
    cursor.close()
    conn.close()

    # Return the success message and updated trip details
    return jsonify({
        "message": "Trip updated successfully!",
        "updated_trip": updated_trip
    }), 200


# ✅ Delete Trip API
@trips_bp.route("/delete/<int:trip_id>", methods=["DELETE"])
@token_required
def delete_trip(current_user,trip_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    # Check if the trip exists and belongs to the current user
    cursor.execute("SELECT * FROM trips WHERE id = %s AND user_id = %s", (trip_id, current_user))
    trip = cursor.fetchone()

    if not trip:
        cursor.close()
        conn.close()
        return jsonify({"status": "fail", "message": "Trip not found or not authorized"}), 404

    # Optional: Delete associated image from filesystem
    image_filename = trip.get("image_filename")
    if image_filename:
        image_path = os.path.join(UPLOAD_FOLDER, image_filename)
        if os.path.exists(image_path):
            os.remove(image_path)

    # Delete the trip from the database
    cursor.execute("DELETE FROM trips WHERE id = %s AND user_id = %s", (trip_id, current_user))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"status": "success", "message": "Trip deleted successfully"}), 200

@trips_bp.route("/trip/set-subscriber-only/<int:trip_id>", methods=["PUT"])
@token_required
def set_subscriber_only(user_id, trip_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM trips WHERE id = %s AND user_id = %s", (trip_id, user_id))
        trip = cursor.fetchone()

        if not trip:
            return jsonify({"error": "Trip not found or unauthorized"}), 404

        data = request.json
        is_subscriber_only = data.get("is_subscriber_only", False)

        cursor.execute("UPDATE trips SET is_subscriber_only = %s WHERE id = %s", (is_subscriber_only, trip_id))
        conn.commit()

        return jsonify({"message": "Post visibility updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@trips_bp.route("/admin/delete-trip/<int:trip_id>", methods=["DELETE"])
@token_required
def admin_delete_trip(user_id, trip_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        user_status = cursor.fetchone()
        is_admin = user_status[0] if user_status else False

        if not is_admin:
            return jsonify({"error": "Unauthorized access"}), 403

        cursor.execute("SELECT user_id FROM trips WHERE id = %s", (trip_id,))
        trip = cursor.fetchone()

        if not trip:
            return jsonify({"error": "Trip not found"}), 404

        owner_id = trip[0]

        cursor.execute("DELETE FROM trips WHERE id = %s", (trip_id,))
        conn.commit()

        cursor.execute("INSERT INTO notifications (user_id, message, created_at) VALUES (%s, %s, NOW())", 
                       (owner_id, f"Your trip post (ID: {trip_id}) has been removed by an admin."))
        conn.commit()

        return jsonify({"message": "Trip deleted successfully and user notified!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@trips_bp.route("/trip/<int:trip_id>/like", methods=["POST"])
@token_required
def like_trip(user_id, trip_id):
    conn = connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO likes (user_id, trip_id) VALUES (%s, %s)", (user_id, trip_id))
        conn.commit()
        return jsonify({"message": "Trip liked successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@trips_bp.route("/trip/<int:trip_id>/comment", methods=["POST"])
@token_required
def comment_trip(user_id, trip_id):
    data = request.json
    comment_text = data.get("comment")

    if not comment_text:
        return jsonify({"error": "Comment cannot be empty"}), 400

    conn = connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO comments (user_id, trip_id, comment) VALUES (%s, %s, %s)", 
                      (user_id, trip_id, comment_text))
        conn.commit()
        return jsonify({"message": "Comment added successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ✅ Get All Trips API
@trips_bp.route("/get-user-highlighted-trips", methods=["GET"])
@token_required
def get_user_highlighted_trips(current_user):
    conn = connection()
    cursor = conn.cursor()
    
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"status": "error", "message": "Token missing or invalid"}), 401

    try:
        token = token.split(" ")[1]
        decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = decoded.get("user_id")
        if not user_id:
            return jsonify({"status": "error", "message": "Invalid user ID"}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401

    try:
        cursor.execute("""
            SELECT id, title, trip_type, start_date, end_date, description, image_filename, start_location, end_location, charge, posted
            FROM highlighted_trips 
            WHERE user_id = %s
        """, (user_id,))
        trips = cursor.fetchall()

        result = []
        for trip in trips:
            result.append({
                "id": trip[0],
                "title": trip[1],
                "trip_type": trip[2],
                "start_date": trip[3].strftime('%Y-%m-%d'),
                "end_date": trip[4].strftime('%Y-%m-%d'),
                "description": trip[5],
                "image_filename": f"/static/trip_images/{trip[6]}" if trip[6] else None,
                "start_location": trip[7],
                "end_location": trip[8],
                "charge" : trip[9],
                "posted" : trip[10]
            })

        return jsonify({"status": "success", "data": result})
    
    except Exception as e:
        print(f"Error fetching trips: {e}")  # For debug
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()