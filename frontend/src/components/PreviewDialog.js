import React from 'react';
import { FaTimes } from "react-icons/fa";
import "../styles/PreviewDialog.css";
import axios from 'axios';

const PreviewDialog = ({ open, onClose, trips = [], onAddTrip, onEditTrip, fetchUserTrips, onHighlightTrip }) => {
    if (!open) return null;

    const hasTrips = trips.length > 0;

    const handleAddClick = () => {
        onClose();          // Close PreviewDialog
        onAddTrip();        // Notify parent to open NewTripForm
    };

    const handleEditClick = (trip) => {
        const confirmEdit = window.confirm("Do you want to edit this trip?");
        if (confirmEdit) {
            onClose();
            setTimeout(() => {
                onEditTrip(trip);  // Add a small timeout to ensure proper state updates
            }, 100);
        }
    };

    const handleDeleteTrip = async (tripId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:5000/trips/delete/${tripId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.status === 'success') {
                alert('Trip deleted successfully');
                fetchUserTrips(); // Refresh list
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
        <div className="preview-dialog-overlay">
            <div className="preview-dialog">
                {/* Header Buttons */}
                <div className="dialog-header">
                    <div className="highlight-btn-container">
                        <button className="highlight-btn" onClick={() => {
                            console.log("Highlight Trip button clicked");
                            onHighlightTrip();
                        }} disabled={trips.length === 0}>Highlight Trip</button>
                    </div>
                    <div className="icon-buttons">
                        <button className="back-btn" onClick={onClose}>Back</button>
                        <button className='add-btn' onClick={handleAddClick}>+</button>
                        <button className="icon-btn" onClick={onClose}><FaTimes /></button>
                    </div>
                </div>

                {/* Trip List */}
                <div className="preview-trip-list">
                    {!hasTrips || trips.filter(trip => trip.posted === 'no').length === 0 ? (
                        <p className="no-trips-text">No trips found.</p>
                    ) : (
                        trips.filter(trip => trip.posted === 'no').map((trip, index) => (
                            <div className="trip-preview-block" key={index}>
                                <div className="trip-body">
                                    <div className="trip-img">
                                        <img src={`http://localhost:5000${trip.image_filename}`} alt={`Trip ${index + 1}`} />
                                    </div>
                                    <div className="trip-details">
                                        <div className="trip-line"><strong>Title :</strong> {trip.title}</div>
                                        <div className="trip-line"><strong>Type :</strong> {trip.trip_type}</div>
                                        <div className="trip-line"><strong>From :</strong> {trip.start_location}</div>
                                        <div className="trip-line"><strong>To : </strong>{trip.end_location} </div>
                                        <div className="trip-line"><strong>Charge :</strong> ₹{trip.charge}</div>
                                        <div className="trip-line"><strong>Start Date :</strong> {trip.start_date}</div>
                                        <div className="trip-line"><strong>End Date :</strong> {trip.end_date}</div>
                                        <div className="trip-line"><strong>Description :</strong> {trip.description}</div>
                                        <div className="trip-line">
                                            <button className="edit-btn" onClick={() => handleEditClick(trip)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDeleteTrip(trip.id)}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                </div>
            </div>
        </div>
    );
};

export default PreviewDialog;