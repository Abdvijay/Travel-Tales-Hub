import razorpay
from flask import Blueprint, request, jsonify
from database import connection
from middleware import token_required
import datetime
import os

# 🔹 Load Razorpay API keys from environment variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# 🔹 Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

payment_bp = Blueprint("payment", __name__)

# ✅ Create Subscription Payment Order
@payment_bp.route("/subscription/create_order", methods=["POST"])
@token_required
def create_subscription_order(user_id):
    data = request.json
    amount = data.get("amount")  # Amount in INR (must be in paise)
    
    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    try:
        order_data = {
            "amount": amount * 100,  # Convert to paise
            "currency": "INR",
            "payment_capture": 1  # Auto capture
        }
        order = razorpay_client.order.create(order_data)
        
        return jsonify({"order_id": order["id"], "amount": amount}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Verify Payment and Activate Subscription
@payment_bp.route("/subscription/verify", methods=["POST"])
@token_required
def verify_payment(user_id):
    data = request.json
    order_id = data.get("order_id")
    payment_id = data.get("payment_id")
    signature = data.get("signature")

    if not order_id or not payment_id or not signature:
        return jsonify({"error": "Invalid payment details"}), 400

    try:
        # Verify payment signature
        params_dict = {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)

        conn = connection()
        cursor = conn.cursor()

        # Update user subscription status
        expiry_date = datetime.datetime.now() + datetime.timedelta(days=30)  # 1-month validity
        cursor.execute("UPDATE users SET is_subscribed = TRUE, subscription_expiry = %s WHERE id = %s", (expiry_date, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Subscription activated successfully!", "expiry_date": expiry_date}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500