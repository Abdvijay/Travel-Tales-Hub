import React from "react";
import { createSubscriptionOrder, verifySubscriptionPayment } from "../services/api";

const SubscriptionPayment = ({ userId }) => {
  const handlePayment = async () => {
    try {
      // Step 1: Create Order
      const orderResponse = await createSubscriptionOrder(userId);
      if (!orderResponse || !orderResponse.order_id) {
        alert("Failed to create payment order.");
        return;
      }

      // Step 2: Initialize Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY, // Razorpay API Key
        amount: orderResponse.amount,
        currency: "INR",
        name: "Travel Tales Hub",
        description: "Subscription Payment",
        order_id: orderResponse.order_id,
        handler: async (response) => {
          // Step 3: Verify Payment
          const verifyResponse = await verifySubscriptionPayment(response);
          if (verifyResponse.success) {
            alert("Subscription successful!");
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: orderResponse.user_name,
          email: orderResponse.user_email,
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div>
      <h2>Subscribe to Unlock Full Trips</h2>
      <button onClick={handlePayment} className="subscribe-btn">
        Subscribe Now
      </button>
    </div>
  );
};

export default SubscriptionPayment;