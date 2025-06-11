import React, { useState } from "react";
import axios from "axios";

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(false);
  const userToken = localStorage.getItem("token");

  const handleSubscription = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/subscription/create_order",
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const { order_id, key } = response.data;

      const options = {
        key: key,
        amount: response.data.amount,
        currency: "INR",
        name: "Travel Tales Hub",
        description: "Subscription Payment",
        order_id: order_id,
        handler: async (response) => {
          await axios.post(
            "http://localhost:5000/subscription/verify",
            response,
            { headers: { Authorization: `Bearer ${userToken}` } }
          );
          alert("Subscription Successful!");
        },
        prefill: { name: "User", email: "user@example.com" },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      alert("Payment Failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Subscribe to Access Premium Travel Stories</h2>
      <button onClick={handleSubscription} disabled={loading}>
        {loading ? "Processing..." : "Subscribe Now"}
      </button>
    </div>
  );
};

export default SubscriptionPage;