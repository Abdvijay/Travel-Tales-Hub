from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required

search_bp = Blueprint("search", __name__)

# ✅ Search Trips API
@search_bp.route("/search", methods=["GET"])
@token_required
def search_trips(user_id):
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    conn = connection()
    cursor = conn.cursor()

    try:
        # Check if the user is an admin
        cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        user_status = cursor.fetchone()
        is_admin = user_status[0] if user_status else False

        # Search trips by title, location, or username
        search_query = f"%{query}%"
        cursor.execute("""
            SELECT t.id, t.user_id, t.title, t.description, t.location, t.start_date, t.end_date, t.is_subscriber_only, 
                   u.username 
            FROM trips t
            JOIN users u ON t.user_id = u.id
            WHERE t.title LIKE %s OR t.location LIKE %s OR u.username LIKE %s
            ORDER BY t.created_at DESC
        """, (search_query, search_query, search_query))

        trips = cursor.fetchall()
        search_results = []

        for trip in trips:
            (trip_id, owner_id, title, description, location, start_date, end_date, is_subscriber_only, username) = trip

            # If admin or trip owner, show full details
            if is_admin or owner_id == user_id:
                search_results.append({
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

            # If subscriber-only, restrict access unless subscribed
            if is_subscriber_only and not is_subscribed:
                search_results.append({
                    "id": trip_id,
                    "username": username,
                    "title": title,
                    "location": location,
                    "start_date": start_date,
                    "end_date": end_date
                })
            else:
                search_results.append({
                    "id": trip_id,
                    "username": username,
                    "title": title,
                    "description": description,
                    "location": location,
                    "start_date": start_date,
                    "end_date": end_date
                })

        return jsonify(search_results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()