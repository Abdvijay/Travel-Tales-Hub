from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required
import datetime

activity_bp = Blueprint("activity", __name__)

@activity_bp.route("/track-activity", methods=["POST"])
@token_required
def track_activity(user_id):
    """ Store user interactions for AI recommendations """
    data = request.json
    trip_id = data.get("trip_id")
    action_type = data.get("action_type")  # 'search', 'like', 'view'
    category = data.get("category")

    if not trip_id or not action_type:
        return jsonify({"error": "Trip ID and action type are required"}), 400

    conn = connection()
    cursor = conn.cursor()

    try:
        timestamp = datetime.datetime.now()

        # Insert interaction record
        cursor.execute(
            "INSERT INTO user_activity (user_id, trip_id, action_type, category, timestamp) VALUES (%s, %s, %s, %s, %s)",
            (user_id, trip_id, action_type, category, timestamp),
        )
        conn.commit()

        return jsonify({"message": "Activity tracked successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()