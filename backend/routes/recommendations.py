from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required

recommendations_bp = Blueprint("recommendations", __name__)

@recommendations_bp.route("/recommended-trips", methods=["GET"])
@token_required
def get_recommended_trips(user_id):
    """ Fetch AI-based recommended trips based on user activity """
    conn = connection()
    cursor = conn.cursor()

    try:
        # Fetch user's most liked and searched categories
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM user_activity
            WHERE user_id = %s AND action_type IN ('like', 'search')
            GROUP BY category
            ORDER BY count DESC
            LIMIT 3
        """, (user_id,))
        
        categories = cursor.fetchall()
        if not categories:
            return jsonify({"message": "No recommendations yet"}), 200

        # Extract top categories
        top_categories = [category[0] for category in categories]

        # Fetch trips matching top categories
        cursor.execute("""
            SELECT id, title, description, location, start_date, end_date
            FROM trips
            WHERE category IN (%s, %s, %s)
            ORDER BY RAND() 
            LIMIT 10
        """, tuple(top_categories))

        recommended_trips = cursor.fetchall()
        trips_data = [
            {"id": trip[0], "title": trip[1], "description": trip[2], "location": trip[3], "start_date": str(trip[4]), "end_date": str(trip[5])}
            for trip in recommended_trips
        ]

        return jsonify(trips_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()