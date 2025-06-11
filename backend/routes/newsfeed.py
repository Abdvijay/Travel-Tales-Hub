from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required

newsfeed_bp = Blueprint("newsfeed", __name__)

# ✅ Newsfeed API
@newsfeed_bp.route("/newsfeed", methods=["GET"])
@token_required
def get_newsfeed(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Check if user is admin
        cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        user_status = cursor.fetchone()
        is_admin = user_status[0] if user_status else False

        # Fetch newsfeed posts
        cursor.execute("""
            SELECT t.id, t.user_id, t.title, t.description, t.location, t.start_date, t.end_date, t.is_subscriber_only, 
                   u.username 
            FROM trips t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        """)
        trips = cursor.fetchall()

        newsfeed = []

        for trip in trips:
            (trip_id, owner_id, title, description, location, start_date, end_date, is_subscriber_only, username) = trip

            # If admin or trip owner, show full details
            if is_admin or owner_id == user_id:
                newsfeed.append({
                    "id": trip_id,
                    "username": username,
                    "title": title,
                    "description": description,
                    "location": location,
                    "start_date": start_date,
                    "end_date": end_date
                })
                continue

            # Check if the user is subscribed to the trip owner
            cursor.execute("SELECT id FROM subscriptions WHERE subscriber_id = %s AND creator_id = %s", (user_id, owner_id))
            is_subscribed = cursor.fetchone() is not None

            # If the post is subscriber-only, show limited details unless the user is subscribed
            if is_subscriber_only and not is_subscribed:
                newsfeed.append({
                    "id": trip_id,
                    "username": username,
                    "title": title,
                    "location": location,
                    "start_date": start_date,
                    "end_date": end_date
                })
            else:
                newsfeed.append({
                    "id": trip_id,
                    "username": username,
                    "title": title,
                    "description": description,
                    "location": location,
                    "start_date": start_date,
                    "end_date": end_date
                })

        return jsonify(newsfeed), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()