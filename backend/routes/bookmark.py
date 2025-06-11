from flask import Blueprint, request, jsonify
from database import connection
from backend.models.bookmark import Bookmark
from flask_jwt_extended import jwt_required, get_jwt_identity

bookmark_bp = Blueprint('bookmark', __name__)

@bookmark_bp.route('/bookmark', methods=['POST'])
@jwt_required()
def bookmark_trip():
    data = request.json
    user_id = get_jwt_identity()
    trip_id = data.get('trip_id')

    if not trip_id:
        return jsonify({"error": "Trip ID required"}), 400

    new_bookmark = Bookmark(user_id=user_id, trip_id=trip_id)
    db.session.add(new_bookmark)
    db.session.commit()

    return jsonify({"message": "Trip bookmarked successfully"})