import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/NotificationPage.css"; // Optional CSS file for styling

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);

  // ✅ Assuming user ID is stored in localStorage
  const userId = localStorage.getItem("userId");
  console.log(userId);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/posts/notifications/${userId}`);
        setNotifications(res.data);
        console.log(res.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return (
    <div className="notification-container">
      <h2 style={{padding: 35}}>Notifications</h2>
      {notifications.length === 0 ? (
        <p className="no-notification">No notifications yet.</p>
      ) : (
        notifications.map((notif) => (
          <div className="notification-card" key={notif.id}>
            <div className="notification-profile-icon">
              {notif.sender_username ? notif.sender_username.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="notification-content">
              <span className="notification-text">
                <strong>{notif.sender_username}</strong>{" "}
                {notif.type === "like" ? "liked" : "commented on"} your <strong>{notif.post_title}</strong> post.
              </span>
              <span className="notification-time">
                {new Date(notif.created_at).toUTCString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationPage;