from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required

subscriptions_bp = Blueprint("subscriptions", __name__)

# ✅ Subscribe to a User API
@subscriptions_bp.route("/subscribe/<int:creator_id>", methods=["POST"])
@token_required
def subscribe_user(user_id, creator_id):
    if user_id == creator_id:
        return jsonify({"error": "You cannot subscribe to yourself"}), 400

    conn = connection()
    cursor = conn.cursor()

    try:
        # ✅ Debugging: Print creator_id to check if it's received correctly
        print(f"Attempting to subscribe to creator_id: {creator_id}")

        # ✅ Step 1: Check if the creator exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (creator_id,))
        creator = cursor.fetchone()

        if not creator:
            print("Error: Creator not found!")  # Debugging
            return jsonify({"error": "Creator not found"}), 404

        # ✅ Step 2: Check if already subscribed
        cursor.execute("SELECT id FROM subscriptions WHERE subscriber_id = %s AND creator_id = %s", (user_id, creator_id))
        if cursor.fetchone():
            return jsonify({"message": "Already subscribed"}), 409  # Conflict

        # ✅ Step 3: Insert new subscription
        cursor.execute("INSERT INTO subscriptions (subscriber_id, creator_id) VALUES (%s, %s)", (user_id, creator_id))

        # ✅ Step 4: Increase follower count for creator
        cursor.execute("UPDATE users SET followers_count = followers_count + 1 WHERE id = %s", (creator_id,))

        # ✅ Step 5: Increase following count for subscriber
        cursor.execute("UPDATE users SET following_count = following_count + 1 WHERE id = %s", (user_id,))

        conn.commit()

        return jsonify({"message": "Subscription successful!"}), 201  # Created

    except Exception as e:
        print(f"Error: {str(e)}")  # Debugging
        return jsonify({"error": str(e)}), 500  # Internal Server Error

    finally:
        cursor.close()
        conn.close()



# ✅ Unsubscribe API
@subscriptions_bp.route("/unsubscribe/<int:creator_id>", methods=["DELETE"])
@token_required
def unsubscribe_user(user_id, creator_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Check if subscription exists
        cursor.execute("SELECT id FROM subscriptions WHERE subscriber_id = %s AND creator_id = %s", (user_id, creator_id))
        if not cursor.fetchone():
            return jsonify({"error": "Subscription not found"}), 404

        # Delete subscription
        cursor.execute("DELETE FROM subscriptions WHERE subscriber_id = %s AND creator_id = %s", (user_id, creator_id))

        # Decrease follower count for creator (Ensure it doesn't go below zero)
        cursor.execute("UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = %s", (creator_id,))

        # Decrease following count for subscriber (Ensure it doesn't go below zero)
        cursor.execute("UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = %s", (user_id,))

        conn.commit()

        return jsonify({"message": "Unsubscribed successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Enable Subscription API
@subscriptions_bp.route("/enable", methods=["PUT"])
@token_required
def enable_subscription(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Enable subscription for the user
        cursor.execute("UPDATE users SET is_subscription_enabled = TRUE WHERE id = %s", (user_id,))
        conn.commit()

        return jsonify({"message": "Subscription enabled successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Disable Subscription API
@subscriptions_bp.route("/disable", methods=["PUT"])
@token_required
def disable_subscription(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Disable subscription for the user
        cursor.execute("UPDATE users SET is_subscription_enabled = FALSE WHERE id = %s", (user_id,))
        conn.commit()

        return jsonify({"message": "Subscription disabled successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Check Subscription Status API
@subscriptions_bp.route("/subscription/status", methods=["GET"])
@token_required
def check_subscription_status(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        # Fetch subscription status
        cursor.execute("SELECT is_subscription_enabled FROM users WHERE id = %s", (user_id,))
        status = cursor.fetchone()

        if status is None:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"is_subscription_enabled": bool(status[0])}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()