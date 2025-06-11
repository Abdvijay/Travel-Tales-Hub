import React from 'react';
import { FaTimes } from "react-icons/fa";
import "../styles/FullTripDialog.css";
import axios from 'axios';

const FullTripDialog = ({ onClose, trips = [], onEditTrip, onDeleteTrip }) => {
    console.log(trips);

    const handleEditClick = (trip) => {
        const confirmEdit = window.confirm("Do you want to edit this trip?");
        if (confirmEdit) {
            onClose();
            onEditTrip(trip);
        }
    };

    const handleDeleteTrip = async (tripId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:5000/trips/delete/${tripId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status === 'success') {
                alert('Trip deleted successfully');
                onClose();
            } else {
                alert(response.data.message || 'Failed to delete trip');
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
            alert('Something went wrong');
        }
    };

    return (
        <div className="full-trip-dialog-overlay">
            <div className="full-trip-dialog">
                <div className="fullTrip-dialog-header">
                    {/* <button className="fullTrip-back-btn" onClick={onClose}>Back</button> */}
                    <button className="fullTrip-close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                {/* Check if there are no trips or no trips with 'posted' value as 'yes' */}
                {trips.length === 0 ? (
                    <p className="no-trips-text">No trips found for this post.</p>
                ) : (
                    <div className="table-container">
                        <table className="trip-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Title</th>
                                    <th>Picture of the trip</th>
                                    <th>Trip Type</th>
                                    <th>Start Location</th>
                                    <th>End Location</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Trip Charge</th>
                                    <th>Trip Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.filter(trip => Object.keys(trip).length !== 0).map((trip, index) => (
                                    <tr key={trip.id}>
                                        <td>{index + 1}</td>
                                        <td>{trip.title}</td>
                                        <td><img
                                            src={`http://localhost:5000/static/trip_images/${trip.image_filename}`}
                                            alt="Trip"
                                            style={{ width: '100px', height: '80px', objectFit: 'cover' }}
                                        /></td>
                                        <td>{trip.trip_type}</td>
                                        <td>{trip.start_location}</td>
                                        <td>{trip.end_location}</td>
                                        <td>{new Date(trip.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>{new Date(trip.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>₹{trip.charge}</td>
                                        <td>{trip.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullTripDialog;