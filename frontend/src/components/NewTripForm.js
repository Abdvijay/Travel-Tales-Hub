import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/NewTripForm.css";
import PreviewDialog from "../components/PreviewDialog.js";
import HighlightDialog from "../components/HighlightDialog.js";

const NewTripForm = ({
  tripToEdit = {},
  onClose,
  setTripToEdit,
  onBack,
  fetchUserTrips,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    startDate: "",
    endDate: "",
    charge: "",
    startLocation: "",
    endLocation: "",
    description: "",
    image: null,
  });
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tripData, setTripData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (
      tripToEdit &&
      typeof tripToEdit === "object" &&
      Object.keys(tripToEdit).length > 0
    ) {
      console.log("Setting up edit mode with trip:", tripToEdit);
      setIsEditing(true);
      setFormData({
        title: tripToEdit.title || "",
        type: tripToEdit.trip_type || "",
        startDate: tripToEdit.start_date || "",
        endDate: tripToEdit.end_date || "",
        charge: tripToEdit.charge || "",
        startLocation: tripToEdit.start_location || "",
        endLocation: tripToEdit.end_location || "",
      });
      setDescription(tripToEdit.description || "");
      setImage(null);
      setPreviewImage(
        tripToEdit.image_filename
          ? `http://localhost:5000${tripToEdit.image_filename}`
          : ""
      );
    } else {
      // Reset form for new trip or when tripToEdit is cleared
      setIsEditing(false);
      setFormData({
        title: "",
        type: "",
        startDate: "",
        endDate: "",
        charge: "",
        startLocation: "",
        endLocation: "",
      });
      setDescription("");
      setImage(null);
      setPreviewImage(null);
    }
  }, [tripToEdit]);

  const maxWords = 25;
  const isEditMode = !!tripToEdit;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "description") {
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount <= maxWords) {
        setDescription(value);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("End date cannot be earlier than start date");
      return;
    }

    const confirmProceed = window.confirm("Do you want to save and proceed?");
    if (!confirmProceed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found.");
      return;
    }

    const url = tripToEdit?.id
      ? `http://localhost:5000/trips/update-trip/${tripToEdit.id}`
      : "http://localhost:5000/trips/save-trip";

    const method = tripToEdit?.id ? "put" : "post";

    const data = new FormData();
    data.append("title", formData.title);
    data.append("trip_type", formData.type);
    data.append("start_date", formData.startDate);
    data.append("end_date", formData.endDate);
    data.append("charge", formData.charge);
    data.append("start_location", formData.startLocation);
    data.append("end_location", formData.endLocation);
    data.append("description", description);
    if (image) {
      data.append("image", image);
    }

    try {
      const response = await axios({
        method: method,
        url: url,
        data: data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response Data:", response.data);
      if (response.data) {
        // Reset form fields after successful save or update
        setFormData({
          title: "",
          type: "",
          startDate: "",
          endDate: "",
          charge: "",
          startLocation: "",
          endLocation: "",
        });
        setDescription("");
        setImage(null); // Reset image to null
        setPreviewImage(null); // Clear the preview image as well
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }

        alert(
          tripToEdit?.id
            ? "Trip updated successfully"
            : "Trip saved successfully"
        );

        if (tripToEdit?.id) {
          setIsEditing(false);
          setTimeout(() => {
            setTripToEdit(null); // Clear editing trip
          }, 100);
        }

        if (onClose) {
          onClose(); // Close form if handler provided (useful for closing the form in the parent)
        }
        // Fetch the updated trip list or refresh the current trip
        fetchUserTrips(); // Ensure the updated trip is reflected in the list
        window.location.reload();
      } else {
        console.error("Error saving trip:", response.data.message);
        alert(response.data.message || "Failed to save trip");
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      if (error.response) {
        console.error("Server responded with:", error.response.data);
        alert(error.response.data.message || "Failed to save trip");
      } else {
        alert("An error occurred while saving the trip");
      }
    }
  };

  const handleCancel = () => {
    // onClose();
    window.location.reload();
  };

  const handlePreview = async () => {
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
        setTripData(response.data.data);
        console.log(response.data.data);
        setShowPreview(true); // Move this inside success condition
      } else {
        console.error("Error fetching trips:", response.data.message);
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleOpenNewTripForm = () => {
    setShowPreview(false);
    setShowForm(true);
  };

  const handleEditTrip = (trip) => {
    // setTripToEdit(trip);            // Set selected trip for editing
    setShowNewTripForm(true); // Open the form
    setShowPreviewDialog(false); // Close preview dialog
  };

  const handleHighlightTrip = () => {
    console.log("Triggering HighlightDialog open...");
    // setShowPreview(false);
    setShowHighlightDialog(true);
  };

  return (
    <div className="fixed-trip-container">
      <div className="trip-header">
        <span className="header-title">Create Trip</span>
        <div className="header-buttons">
          <div className="preview-container">
            <button
              className="preview-button"
              onClick={handlePreview}
              disabled={isEditing}
              aria-label="Preview trip"
            >
              Preview
            </button>
            {isEditing && (
              <span className="preview-tooltip">
                Preview is disabled while editing an existing trip
              </span>
            )}
          </div>
          <button className="btn-cancel" onClick={handleCancel}>
            X
          </button>
        </div>
      </div>

      <div className="main-form-body">
        {/* Left section */}
        <div className="left-section">
          <div className="input-row">
            <div className="input-field">
              <label>Trip Title</label>
              <input
                type="text"
                placeholder="e.g., Goa Getaway"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <label>Type of Trip</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="">Choose trip type</option>
                <option value="travel">Travel</option>
                <option value="hotel">Hotel</option>
                <option value="restaurant">Restaurant</option>
                <option value="mall">Mall</option>
                <option value="temple">Temple</option>
                <option value="beach">Beach</option>
                <option value="adventure">Adventure</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-field">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                min={formData.startDate} // This prevents selecting dates before start date
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <label>Trip Charge</label>
              <input
                type="number"
                placeholder="e.g., 1500 ₹"
                name="charge"
                value={formData.charge}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-field">
              <label>Starting Location</label>
              <input
                type="text"
                placeholder="e.g., Mumbai"
                name="startLocation"
                value={formData.startLocation}
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <label>Destination Location</label>
              <input
                type="text"
                placeholder="e.g., Goa"
                name="endLocation"
                value={formData.endLocation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-field full-width">
              <label>
                Description{" "}
                <span style={{ fontWeight: 400, fontSize: 12, color: "#666" }}>
                  ({maxWords - description.trim().split(/\s+/).length} words
                  left)
                </span>
              </label>
              <textarea
                placeholder="Write a short description of your trip..."
                name="description"
                value={description}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="right-section">
          <div className="input-field">
            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={imageInputRef}
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="image-upload-preview"
              />
            )}
          </div>

          <div className="trip-footer-fixed">
            {/* <button className="btn-end" onClick={handleEndTrip}>
                            End Trip
                        </button> */}
            {/* <button className="btn-preview" onClick={handlePreview}>
                            Preview
                        </button> */}
            <button className="btn-next" onClick={handleSubmit}>
              Save & Next
            </button>
          </div>
        </div>
      </div>
      {showPreview && (
        <PreviewDialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          trips={tripData}
          onAddTrip={handleOpenNewTripForm}
          fetchUserTrips={fetchUserTrips}
          onEditTrip={handleEditTrip}
          onHighlightTrip={handleHighlightTrip}
        />
      )}
      <HighlightDialog
        open={showHighlightDialog}
        onClose={() => setShowHighlightDialog(false)}
        trips={tripData}
        // Pass any other props like selected trip if needed
      />
    </div>
  );
};

export default NewTripForm;
