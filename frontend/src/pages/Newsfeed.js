import React, { useEffect, useState } from "react";
import axios from "axios";

const Newsfeed = () => {
  const [trips, setTrips] = useState([]);
  const userToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/trips/newsfeed",
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setTrips(response.data);
      } catch (error) {
        console.error("Error fetching newsfeed", error);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div>
      <h2>Newsfeed</h2>
      {trips.map((trip) => (
        <div key={trip.id}>
          <h3>{trip.title}</h3>
          <p>{trip.description}</p>
          <span>{trip.location} - {trip.start_date} to {trip.end_date}</span>
        </div>
      ))}
    </div>
  );
};

export default Newsfeed;