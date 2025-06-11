import React, { useState, useEffect, useCallback } from "react";
import "../styles/CreateTripPage.css";
import NewTripForm from "../components/NewTripForm.js";
import PreviewDialog from "../components/PreviewDialog.js";
import HighlightDialog from "../components/HighlightDialog.js";
import axios from "axios";

const CreateTripPage = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userTrips, setUserTrips] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [tripToEdit, setTripToEdit] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);

  useEffect(() => {
    fetchUserTrips(); // Fetch trips on load
    if (tripToEdit) {
      setFormKey(Date.now()); // Trigger a fresh render whenever `tripToEdit` changes
      setShowForm(true); // Ensure the form shows after setting the new trip
    }
  }, [tripToEdit]);

  const fetchUserTrips = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/trips/get-user-trips",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data.status === "success" &&
        Array.isArray(response.data.data)
      ) {
        setUserTrips(response.data.data);
        console.log(response.data.data);
      } else {
        console.error("Failed to fetch user trips:", response.data.message);
      }
    } catch (err) {
      console.error("Error fetching user trips:", err);
    }
  };

  const handleCreateClick = () => {
    setShowDialog(true);
  };

  const handleNewClick = () => {
    setShowDialog(false);
    setShowForm(true);
  };

  // Edit button handler
  const handleEditTrip = (trip) => {
    setShowForm(false);
    setTripToEdit(null);
    setFormKey(Date.now());

    setTimeout(() => {
      setTripToEdit(trip);
      setFormKey(Date.now());
      setShowForm(true);
    }, 50);
  };

  const handleDraftClick = () => {
    setShowDialog(false);
    setShowPreview(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleOpenNewTripForm = () => {
    setShowPreview(false);
    setShowForm(true);
  };

  const handleHighlightTrip = () => {
    console.log("Triggering HighlightDialog open...");
    // setShowPreview(false);
    setShowHighlightDialog(true);
  };

  const hasTrips = userTrips.some((trip) => trip.posted === "no");

  return (
    <div className="create-trip-page">
      {!showForm && (
        <div className="create-trip-center-content">
          <h2 className="create-trip-quote-message">
            "Travel isn't always pretty. It isn't always comfortable. But that's
            okay. The journey changes you; it should change you."
          </h2>
          <button className="create-button" onClick={handleCreateClick}>
            Create
          </button>
        </div>
      )}

      {showDialog && (
        <div className="create-trip-dialog-overlay">
          <div className="create-trip-dialog-box">
            <div className="create-trip-dialog-header">
              <h3>Choose how you want to proceed</h3>
              <button
                className="create-trip-close-btn"
                onClick={handleCloseDialog}
              >
                ×
              </button>
            </div>
            <div className="create-trip-dialog-actions">
              <button
                className="create-trip-dialog-btn create-trip-new-btn"
                onClick={handleNewClick}
                disabled={hasTrips}
                data-tooltip={
                  hasTrips
                    ? "You have already created a trip. Please manage it through the Drafts section before creating a new one."
                    : ""
                }
              >
                New
              </button>
              <div
                className={`create-trip-tooltip-wrapper ${
                  userTrips.length === 0 ? "disabled-state" : ""
                }`}
              >
                <button
                  className="create-trip-dialog-btn create-trip-draft-btn"
                  onClick={handleDraftClick}
                  disabled={userTrips.length === 0}
                >
                  Draft
                </button>
                {userTrips.length === 0 && (
                  <span className="create-trip-tooltip-text">
                    You need to create at least one trip before using Draft.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <NewTripForm
          key={formKey}
          tripToEdit={tripToEdit}
          setTripToEdit={setTripToEdit}
          fetchUserTrips={fetchUserTrips}
          onBack={() => {
            setShowForm(false);
            setTripToEdit(null);
            fetchUserTrips(); // Refresh trip list
          }}
        />
      )}
      {showPreview && (
        <PreviewDialog
          open={showPreview}
          trips={userTrips}
          onClose={handleClosePreview}
          onAddTrip={handleOpenNewTripForm}
          onEditTrip={handleEditTrip}
          setTripToEdit={setTripToEdit} // Ensure setTripToEdit is passed here
          fetchUserTrips={fetchUserTrips}
          onHighlightTrip={handleHighlightTrip}
        />
      )}
      {showHighlightDialog && (
        <HighlightDialog
          open={showHighlightDialog}
          onClose={() => setShowHighlightDialog(false)}
          trips={userTrips}
        />
      )}
    </div>
  );
};

export default CreateTripPage;
