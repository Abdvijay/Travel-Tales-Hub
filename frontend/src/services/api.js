const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ✅ Create Subscription Order
export const createSubscriptionOrder = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/create_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
};

// ✅ Verify Payment
export const verifySubscriptionPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(paymentData),
    });

    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return null;
  }
};