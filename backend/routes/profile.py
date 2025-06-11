from flask import Blueprint, jsonify
from database import connection
from middleware import token_required

profile_bp = Blueprint("profile", __name__)

# ✅ Get Profile API (Own or Another User)
@profile_bp.route("/profile/<int:user_id>", methods=["GET"])
@token_required
def get_profile(current_user_id, user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Fetch user profile details
        cursor.execute("""
            SELECT id, username, email, followers_count, following_count, post_count, is_subscription_enabled
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        (id, username, email, followers_count, following_count, post_count, is_subscription_enabled) = user

        return jsonify({
            "id": id,
            "username": username,
            "email": email,
            "followers_count": followers_count,
            "following_count": following_count,
            "post_count": post_count,
            "is_subscription_enabled": is_subscription_enabled
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()