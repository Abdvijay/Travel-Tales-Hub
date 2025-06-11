from flask import Blueprint, request, jsonify
from database import connection
import bcrypt
from middleware import token_required
from werkzeug.utils import secure_filename
from config import Config
import jwt
from datetime import datetime, timezone
import random,string,os
from firebase_admin import auth

post_bp = Blueprint('post_routes', __name__)
conn = connection()
cursor = conn.cursor()

@post_bp.route('/create_post', methods=['POST'])
@token_required
def create_post(current_user):
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)

        # Extracting form data
        user_id = request.form['user_id']
        username = request.form['username']
        title = request.form['title']
        total_days = int(request.form['total_days'])
        total_charge = float(request.form['total_charge'])
        description = request.form['description']

        # Ensure user_id is a valid integer
        if not user_id or not user_id.isdigit():
            return jsonify({"error": "Invalid user ID"}), 400

        user_id = int(user_id)  # Convert to integer
        total_days = int(total_days)
        total_charge = float(total_charge)

        # Handle image
        image = request.files.get('image')
        if image:
            filename = secure_filename(f"{username}_{image.filename}")
            image_path = os.path.join('static/posts', filename)
            image.save(image_path)
        else:
            filename = None

        # Validate required fields
        if not all([user_id, username, title, total_days, total_charge, description, filename]):
            return jsonify({"error": "Missing required fields"}), 400

        # Insert into posts table
        query = """
        INSERT INTO posts (user_id, username, title, total_days, total_charge, description, image_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, username, title, total_days, total_charge, description, filename))

        # Get the newly inserted post_id
        post_id = cursor.lastrowid

        # --- Check and update trips posted column --- 
        update_query = """
        UPDATE trips 
        SET posted = 'yes' 
        WHERE user_id = %s AND posted != 'yes'
        """
        cursor.execute(update_query, (user_id,))

        cursor.execute("SELECT * FROM trips WHERE user_id = %s AND posted = 'yes'", (user_id,))
        trips = cursor.fetchall()

        for trip in trips:
        # Insert into highlighted_trips
            insert_query = """
                INSERT INTO highlighted_trips (
                user_id, title, trip_type, start_date, end_date,
                charge, start_location, end_location, description,
                image_path, created_at, image_filename, posted
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(insert_query, (
                trip['user_id'], trip['title'], trip['trip_type'], trip['start_date'], trip['end_date'],
                trip['charge'], trip['start_location'], trip['end_location'], trip['description'],
                trip['image_path'], trip['created_at'], trip['image_filename'], trip['posted']
            ))

            # Get the new highlighted_trip ID
            highlighted_trip_id = cursor.lastrowid

            # Insert into post_trips with highlighted_trip_id
            cursor.execute(
                "INSERT INTO post_trips (post_id, highlight_id, user_id) VALUES (%s, %s, %s)",
                (post_id, highlighted_trip_id, user_id)
            )

        # Delete trips from trips table where 'posted' is 'yes'
        delete_query = """
        DELETE FROM trips WHERE user_id = %s AND posted = 'yes'
        """
        cursor.execute(delete_query, (user_id,))

        # Commit all changes to the database
        conn.commit()

        return jsonify({"message": "Post created successfully!"}), 201

    except Exception as e:
        print(f"Failed to create post: {e}")
        return jsonify({"error": "Failed to create post"}), 500

    
@post_bp.route('/get_posts', methods=['GET'])
def get_posts():
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)

        # Get limit and offset from request args (default limit 10, offset 0)
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))

        # Updated query to include commentCount
        query = """
            SELECT 
                posts.*, 
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS commentCount
            FROM posts
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """

        cursor.execute(query, (limit, offset))
        posts = cursor.fetchall()

        return jsonify({"posts": posts}), 200
    except Exception as e:
        print("Error in get_posts:", e)
        return jsonify({"error": "Failed to fetch posts"}), 500

    
@post_bp.route('/update_post', methods=['PUT'])
@token_required
def update_post(current_user):
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)
        
        post_id = request.form['post_id']
        user_id = request.form['user_id']
        username = request.form['username']
        title = request.form['title']
        total_days = int(request.form['total_days'])
        total_charge = float(request.form['total_charge'])
        description = request.form['description']

        # Ensure post_id and user_id are valid integers
        if not post_id or not post_id.isdigit():
            return jsonify({"error": "Invalid post ID"}), 400
        if not user_id or not user_id.isdigit():
            return jsonify({"error": "Invalid user ID"}), 400

        post_id = int(post_id)
        user_id = int(user_id)

        # Handle image
        image = request.files.get('image')
        filename = None

        if image:
            filename = secure_filename(f"{username}_{image.filename}")
            image_path = os.path.join('static/posts', filename)
            image.save(image_path)

            # Update with image
            query = """
            UPDATE posts
            SET title = %s,
                total_days = %s,
                total_charge = %s,
                description = %s,
                image_path = %s
            WHERE id = %s AND user_id = %s
            """
            values = (title, total_days, total_charge, description, filename, post_id, user_id)
        else:
            # Update without changing image
            query = """
            UPDATE posts
            SET title = %s,
                total_days = %s,
                total_charge = %s,
                description = %s
            WHERE id = %s AND user_id = %s
            """
            values = (title, total_days, total_charge, description, post_id, user_id)

        cursor.execute(query, values)
        conn.commit()

        return jsonify({"message": "Post updated successfully!"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to update post"}), 500
    
@post_bp.route('/get_trips_by_post/<int:post_id>', methods=['GET'])
@token_required
def get_trips_by_post(current_user, post_id):
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT t.*
            FROM highlighted_trips t
            JOIN post_trips pt ON t.id = pt.highlight_id
            WHERE pt.post_id = %s
        """, (post_id,))
        trips = cursor.fetchall()

        return jsonify(trips), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to fetch trips for post"}), 500
    
@post_bp.route('/delete_post/<int:post_id>', methods=['DELETE'])
@token_required
def delete_post(current_user, post_id):
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch the image filename to delete the file
        cursor.execute("SELECT image_path FROM posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()

        if not post:
            return jsonify({"error": "Post not found"}), 404

        image_path = post['image_path']
        if image_path:
            full_path = os.path.join('static/posts', image_path)
            if os.path.exists(full_path):
                os.remove(full_path)
            else:
                print(f"Image file {full_path} not found for deletion.")

        # Delete related records in other tables in the correct order to avoid foreign key constraints
        
        # 1. Delete all notifications related to this post (likes and comments)
        cursor.execute("DELETE FROM notifications WHERE post_id = %s", (post_id,))
        
        # 2. Delete all comments for this post
        cursor.execute("DELETE FROM post_comments WHERE post_id = %s", (post_id,))
        
        # 3. Delete all likes for this post
        cursor.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
        
        # 4. Delete post-trip relationships
        cursor.execute("DELETE FROM post_trips WHERE post_id = %s", (post_id,))
        
        # 5. Finally delete the post itself
        cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))

        conn.commit()

        return jsonify({
            "message": "Post and all related data (comments, likes, notifications) deleted successfully!"
        }), 200

    except Exception as e:
        print(f"Error occurred during post deletion: {str(e)}")
        conn.rollback()  # Rollback changes if an error occurs
        return jsonify({"error": "Failed to delete post"}), 500
    finally:
        cursor.close()
        conn.close()
    
@post_bp.route('/likes/<int:post_id>', methods=['GET'])
def get_likes(post_id):
    user_id = request.args.get('user_id')

    conn = connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS count FROM post_likes WHERE post_id = %s", (post_id,))
    count = cursor.fetchone()['count']

    cursor.execute("SELECT * FROM post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
    liked = cursor.fetchone() is not None

    return jsonify({"count": count, "liked": liked})

@post_bp.route('/toggle_like', methods=['POST'])
@token_required
def toggle_like(current_user):
    data = request.get_json()
    post_id = data.get('post_id')
    user_id = int(data.get('user_id'))  # Ensure integer type

    conn = connection()
    cursor = conn.cursor()

    # Fetch post owner
    cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
    post_owner = cursor.fetchone()
    print(f"Post owner: {post_owner}, Liker: {user_id}")

    if not post_owner:
        return jsonify({"error": "Post not found"}), 404

    post_owner_id = int(post_owner[0])

    # Check if already liked
    cursor.execute("SELECT * FROM post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
    existing_like = cursor.fetchone()

    if existing_like:
        # Unlike
        cursor.execute("DELETE FROM post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))

        # Only delete notification if it's not a self-like
        if user_id != post_owner_id:
            cursor.execute("""
                DELETE FROM notifications 
                WHERE post_id = %s AND sender_id = %s AND type = 'like'
            """, (post_id, user_id))

        conn.commit()
        return jsonify({"liked": False})

    else:
        # Like
        cursor.execute("INSERT INTO post_likes (post_id, user_id) VALUES (%s, %s)", (post_id, user_id))

        # Only insert notification if not a self-like
        if user_id != post_owner_id:
            cursor.execute("""
                INSERT INTO notifications (recipient_id, sender_id, post_id, type) 
                VALUES (%s, %s, %s, 'like')
            """, (post_owner_id, user_id, post_id))

        conn.commit()
        return jsonify({"liked": True})


@post_bp.route('/comments/<int:post_id>', methods=['GET'])
def get_comments(post_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT pc.id, pc.comment, pc.created_at, pc.is_edited, u.username
        FROM post_comments pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.post_id = %s
        ORDER BY pc.created_at ASC
    """, (post_id,))

    comments = cursor.fetchall() 

    return jsonify(comments)


@post_bp.route('/comments', methods=['POST'])
@token_required
def add_comment(current_user):
    data = request.get_json()
    post_id = data.get('post_id')
    comment = data.get('comment')
    user_id = current_user  # Corrected

    conn = connection()
    cursor = conn.cursor()

    try:
        # Add the comment
        cursor.execute("""
            INSERT INTO post_comments (post_id, user_id, comment)
            VALUES (%s, %s, %s)
        """, (post_id, user_id, comment))
        conn.commit()

        comment_id = cursor.lastrowid  # Get the inserted comment ID

        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post_owner = cursor.fetchone()

        if post_owner and post_owner[0] != user_id:
            cursor.execute("""
                INSERT INTO notifications (recipient_id, sender_id, post_id, type) 
                VALUES (%s, %s, %s, 'comment')  
            """, (post_owner[0], user_id, post_id))
            conn.commit()
            print("Notification inserted")  # Debug


        # Get updated comment count
        cursor.execute("SELECT COUNT(*) FROM post_comments WHERE post_id = %s", (post_id,))
        count = cursor.fetchone()[0]

        return jsonify({
            "message": "Comment added successfully",
            "commentId": comment_id,
            "commentCount": count
        }), 201
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()

@post_bp.route('/comments/edit/<int:comment_id>', methods=['PUT'])
def edit_comment(comment_id):
    data = request.get_json()
    new_comment = data.get('comment')

    conn = connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE post_comments
            SET comment = %s, is_edited = TRUE
            WHERE id = %s
        """, (new_comment, comment_id))
        conn.commit()
        return jsonify({"message": "Comment updated successfully"}), 200
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()

    
@post_bp.route('/comments/delete/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    try:
        conn = connection()
        cursor = conn.cursor()

        # First, get the post_id for which the comment is being deleted
        cursor.execute("SELECT post_id, user_id FROM post_comments WHERE id = %s", (comment_id,))
        result = cursor.fetchone()

        if result is None:
            return jsonify({"error": "Comment not found"}), 404
        
        post_id = result[0]
        sender_id = result[1]

        cursor.execute("DELETE FROM post_comments WHERE id = %s", (comment_id,))
        conn.commit()

        # Delete related notification
        cursor.execute("""
            DELETE FROM notifications 
            WHERE post_id = %s AND sender_id = %s AND type = 'comment'
        """, (post_id, sender_id))

        conn.commit()
        
        # Get updated comment count
        cursor.execute("SELECT COUNT(*) FROM post_comments WHERE post_id = %s", (post_id,))
        count = cursor.fetchone()[0]

        return jsonify({
            "message": "Comment deleted successfully",
            "commentCount": count
        }), 200
    
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to delete comment"}), 500
    
@post_bp.route('/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    conn = connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
        SELECT n.id, n.type, n.created_at, u.username AS sender_username, p.title AS post_title
        FROM notifications n
        JOIN users u ON n.sender_id = u.id
        JOIN posts p ON n.post_id = p.id
        WHERE n.recipient_id = %s
        ORDER BY n.created_at DESC
    """, (user_id,))
        notifications = cursor.fetchall()
        return jsonify(notifications)
    except Exception as e:
        print("Error fetching notifications:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()

@post_bp.route('/search_posts', methods=['GET'])
def search_posts():
    try:
        conn = connection()
        cursor = conn.cursor(dictionary=True)

        search_query = request.args.get('query', '')
        
        if not search_query:
            return jsonify({"error": "No search query provided"}), 400
            
        # Search in title and description with LIKE query
        query = """
            SELECT 
                posts.*, 
                (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS commentCount
            FROM posts
            WHERE 
                posts.title LIKE %s OR 
                posts.description LIKE %s
            ORDER BY created_at DESC
        """
        
        # Add wildcards to search for partial matches
        search_param = f"%{search_query}%"
        cursor.execute(query, (search_param, search_param))
        
        posts = cursor.fetchall()

        return jsonify({"posts": posts}), 200
    except Exception as e:
        print("Error in search_posts:", e)
        return jsonify({"error": "Failed to search posts"}), 500