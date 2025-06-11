from flask import Blueprint, request, jsonify
from database import connection
import bcrypt
from middleware import token_required
from datetime import datetime, timedelta

users_bp = Blueprint("users", __name__)

# ✅ Get All Users API
@users_bp.route("/users", methods=["GET"])
@token_required
def list_users(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, username, email FROM users")
        users = cursor.fetchall()

        if not users:
            return jsonify({"error": "No users found"}), 404

        users_data = [{"id": user[0], "username": user[1], "email": user[2]} for user in users]

        return jsonify(users_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# Get User Profile by ID or Username
@users_bp.route("/user/profile", methods=["GET"])
@token_required
def get_user_profile(current_user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        username = request.args.get("username")

        if username:
            cursor.execute("""
                SELECT id, username, email, role, followers_count, following_count, post_count, 
                       is_subscription_enabled, COALESCE(bio, ''), COALESCE(profile_pic, '') 
                FROM users WHERE username = %s
            """, (username,))
        else:
            cursor.execute("""
                SELECT id, username, email, role, followers_count, following_count, post_count, 
                       is_subscription_enabled, COALESCE(bio, ''), COALESCE(profile_pic, '') 
                FROM users WHERE id = %s
            """, (current_user_id,))

        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Avatar fallback: first letter of username
        profile_pic_url = f"http://localhost:5000/static/{user[9]}" if user[9] else \
                          f"https://ui-avatars.com/api/?name={user[1][0]}&background=random"

        return jsonify({
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3],
            "followers_count": user[4],
            "following_count": user[5],
            "post_count": user[6],
            "is_subscription_enabled": bool(user[7]),
            "bio": user[8],
            "profile_pic": profile_pic_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# Update Profile Endpoint
@users_bp.route("/profile/update", methods=["PUT"])
@token_required
def update_user_profile(current_user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT username FROM users WHERE id = %s", (current_user_id,))
        user_data = cursor.fetchone()
        username = user_data[0] if user_data else f"user_{current_user_id}"

        bio = request.form.get("bio", "").strip()
        profile_pic = request.files.get("profile_pic")

        # Word count validation (25 words)
        if len(bio.split()) > 25:
            return jsonify({"error": "Bio cannot exceed 25 words."}), 400

        updated_fields = []

        if profile_pic:
            pic_filename = f"profile_pics/{username}_{current_user_id}.jpg"
            profile_pic.save(f"static/{pic_filename}")
            cursor.execute("UPDATE users SET profile_pic = %s WHERE id = %s", (pic_filename, current_user_id))
            updated_fields.append("profile_pic")

        if bio:
            cursor.execute("UPDATE users SET bio = %s WHERE id = %s", (bio, current_user_id))
            updated_fields.append("bio")

        conn.commit()

        # Get updated user info
        cursor.execute("""
            SELECT username, followers_count, following_count, post_count, bio, profile_pic 
            FROM users WHERE id = %s
        """, (current_user_id,))
        user = cursor.fetchone()

        return jsonify({
            "username": user[0],
            "followers_count": user[1],
            "following_count": user[2],
            "post_count": user[3],
            "bio": user[4],
            "profile_pic": f"http://localhost:5000/static/{user[5]}" if user[5] else None
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# ✅ Change Password API
@users_bp.route("/user/change-password", methods=["PUT"])
@token_required
def change_password(user_id):
    data = request.json
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Both old and new passwords are required"}), 400

    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(old_password.encode('utf-8'), user[0].encode('utf-8')):
            return jsonify({"error": "Old password is incorrect"}), 400

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, user_id))
        conn.commit()

        return jsonify({"message": "Password changed successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Delete User Account API
@users_bp.route('/user/delete', methods=['DELETE'])
@token_required
def delete_user(user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User not found"}), 404

        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()

        return jsonify({"message": "User deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Follow a User API
@users_bp.route('/user/follow/<int:user_id>', methods=['POST'])
@token_required
def follow_user(current_user_id, user_id):
    if current_user_id == user_id:
        return jsonify({"error": "You cannot follow yourself."}), 400

    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM followers WHERE user_id = %s AND follower_id = %s", (user_id, current_user_id))
        if cursor.fetchone():
            return jsonify({"message": "Already following this user."}), 400

        cursor.execute("INSERT INTO followers (user_id, follower_id) VALUES (%s, %s)", (user_id, current_user_id))
        cursor.execute("UPDATE users SET followers_count = followers_count + 1 WHERE id = %s", (user_id,))
        cursor.execute("UPDATE users SET following_count = following_count + 1 WHERE id = %s", (current_user_id,))
        conn.commit()

        return jsonify({"message": "Followed successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ Unfollow a User API
@users_bp.route('/user/unfollow/<int:user_id>', methods=['DELETE'])
@token_required
def unfollow_user(current_user_id, user_id):
    conn = connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM followers WHERE user_id = %s AND follower_id = %s", (user_id, current_user_id))
        if not cursor.fetchone():
            return jsonify({"message": "You are not following this user."}), 400

        cursor.execute("DELETE FROM followers WHERE user_id = %s AND follower_id = %s", (user_id, current_user_id))
        cursor.execute("UPDATE users SET followers_count = followers_count - 1 WHERE id = %s", (user_id,))
        cursor.execute("UPDATE users SET following_count = following_count - 1 WHERE id = %s", (current_user_id,))
        conn.commit()

        return jsonify({"message": "Unfollowed successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@users_bp.route("/user-posts", methods=["GET"])
@token_required
def get_user_posts(current_user_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    try:
        username = request.args.get("username")

        if username:
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            user_id = user["id"]
        else:
            user_id = current_user_id

        cursor.execute("""
            SELECT 
                posts.*, 
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS commentCount
            FROM posts 
            WHERE posts.user_id = %s
            ORDER BY posts.created_at DESC
        """, (user_id,))
        posts = cursor.fetchall()

        for post in posts:
            post['image_url'] = f"http://localhost:5000/static/posts/{post['image_path']}" if post['image_path'] else ""

        return jsonify(posts), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@users_bp.route("/admin/all-posts", methods=["GET"])
@token_required
def get_all_posts(current_user_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check if user is admin by email
        cursor.execute("SELECT email FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        if not user or user['email'] != 'adminuser@gmail.com':
            return jsonify({"error": "Access denied. Admin access required."}), 403

        cursor.execute("""
            SELECT 
                posts.*, 
                users.username,
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS commentCount
            FROM posts 
            LEFT JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC
        """)
        posts = cursor.fetchall()

        return jsonify(posts), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@users_bp.route("/admin/dashboard-stats", methods=["GET"])
@token_required
def get_dashboard_stats(current_user_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check if user is admin by email
        cursor.execute("SELECT email FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        if not user or user['email'] != 'adminuser@gmail.com':
            return jsonify({"error": "Access denied. Admin access required."}), 403

        # Get total users count
        cursor.execute("SELECT COUNT(*) as total_users FROM users")
        total_users_result = cursor.fetchone()
        total_users = total_users_result['total_users']

        # Get total posts count
        cursor.execute("SELECT COUNT(*) as total_posts FROM posts")
        total_posts_result = cursor.fetchone()
        total_posts = total_posts_result['total_posts']

        return jsonify({
            "totalUsers": total_users,
            "totalPosts": total_posts
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@users_bp.route('/admin/weekly-activity', methods=['GET'])
@token_required
def get_weekly_activity(current_user):
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get the start of current week (Monday)
        today = datetime.now()
        start_of_week = today - timedelta(days=today.weekday())
        
        weekly_data = []
        
        for i in range(7):  # 7 days of the week
            current_date = start_of_week + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Count posts created on this date
            cursor.execute("""
                SELECT COUNT(*) as post_count 
                FROM posts 
                WHERE DATE(created_at) = %s
            """, (date_str,))
            post_result = cursor.fetchone()
            post_count = post_result['post_count'] if post_result else 0
            
            weekly_data.append({
                'day': current_date.strftime('%a'),  # Mon, Tue, etc.
                'date': date_str,
                'posts_created': post_count,
                'total_activity': post_count
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({"weekly_data": weekly_data}), 200
        
    except Exception as e:
        print(f"Error fetching weekly activity: {e}")
        return jsonify({"error": "Failed to fetch weekly activity"}), 500