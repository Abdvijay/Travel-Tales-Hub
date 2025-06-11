from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.trips import trips_bp
from routes.newsfeed import newsfeed_bp
from routes.users import users_bp
from routes.subscription import subscriptions_bp
from routes.post_routes import post_bp
# from routes.notifications import notifications_bp
# from routes.messages import messages_bp
from middleware import token_required
from config import Config
SECRET_KEY = Config.SECRET_KEY
from flask import send_from_directory


app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY
CORS(app)

@app.route('/trip_images/<filename>')
def serve_trip_image(filename):
    return send_from_directory('trip_images', filename)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(trips_bp, url_prefix="/trips")
app.register_blueprint(newsfeed_bp, url_prefix="/newsfeed")
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(subscriptions_bp, url_prefix="/subscription")
app.register_blueprint(post_bp, url_prefix="/posts")
# app.register_blueprint(notifications_bp, url_prefix="/notifications")
# app.register_blueprint(messages_bp, url_prefix="/messages")

if __name__ == "__main__":
    app.run(debug=True)
