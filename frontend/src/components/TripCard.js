import React, { useState } from "react";
import axios from "axios";

const TripCard = ({ trip }) => {
  const userToken = localStorage.getItem("token");
  const [likes, setLikes] = useState(trip.likes || 0);
  const [comment, setComment] = useState("");

  const handleLike = async () => {
    await axios.post(
      `http://localhost:5000/trip/${trip.id}/like`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    setLikes(likes + 1);
  };

  const handleComment = async () => {
    await axios.post(
      `http://localhost:5000/trip/${trip.id}/comment`,
      { comment },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    setComment("");
  };

  return (
    <div>
      <h3>{trip.title}</h3>
      <p>{trip.description}</p>
      <button onClick={handleLike}>Like ({likes})</button>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
      />
      <button onClick={handleComment}>Comment</button>
    </div>
  );
};

export default TripCard;