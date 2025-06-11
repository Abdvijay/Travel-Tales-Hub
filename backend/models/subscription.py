from database import db

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)