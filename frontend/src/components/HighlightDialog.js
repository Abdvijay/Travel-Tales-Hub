import React, { useState, useEffect } from 'react';
import { FaTimes } from "react-icons/fa"; // Import the close icon
import "../styles/HighlightDialog.css";
import axios from 'axios';

const HighlightDialog = ({ open, onClose, trips, editableData, fetchPosts, fromNewsfeed = false, fromProfile = false, handleCloseBothDialogs }) => {

    if (!open) return null;

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [totalDays, setTotalDays] = useState('');
    const [charge, setCharge] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");
    const [isValidDescription, setIsValidDescription] = useState(true);

    // console.log(localStorage);

    useEffect(() => {
        if (open) {
            if (!editableData && trips && trips.length > 0) {
                let uniqueDates = new Set();
                let totalChargeSum = 0;

                trips.forEach(trip => {
                    const startDate = new Date(trip.start_date);
                    const endDate = new Date(trip.end_date);
                    let currentDate = new Date(startDate);

                    while (currentDate <= endDate) {
                        uniqueDates.add(currentDate.toISOString().split('T')[0]);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }

                    totalChargeSum += parseFloat(trip.charge) || 0;
                });

                const totalDaysSum = uniqueDates.size;
                setTotalDays(totalDaysSum);
                setCharge(totalChargeSum);
            }

            if (editableData) {
                setTitle(editableData.title || '');
                setDescription(editableData.description || '');
                setTotalDays(editableData.total_days || '');
                setCharge(editableData.total_charge || '');
                setImagePreview(`http://localhost:5000/static/posts/${editableData.image_path}`);
            }
        }
    }, [open, editableData, trips]);

    if (!open) return null;
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const previewURL = URL.createObjectURL(file);
            setImagePreview(previewURL);
        }
    };

    const handleSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('username', username);
            formData.append('title', title);
            formData.append('total_days', totalDays);
            formData.append('total_charge', charge);
            formData.append('description', description);

            if (image) {
                formData.append('image', image);
            }

            const token = localStorage.getItem('token');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            let url = 'http://localhost:5000/posts/create_post'; // Default: create
            let method = 'post';                                 // Default: POST

            if (editableData) { // If editing existing post
                formData.append('post_id', editableData.id); // send post id for update
                url = 'http://localhost:5000/posts/update_post'; // Switch to update URL
                method = 'put';                                  // Use PUT method
            }

            const response = await axios({
                method: method,
                url: url,
                data: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 201 || response.status === 200) {
                alert(editableData ? 'Post updated successfully!' : 'Post created successfully!');
                if (onClose) {
                    onClose();
                }
                if (fetchPosts) {
                    fetchPosts();
                } 

                // Only reload if NOT from profile
                if (editableData && !fromProfile) {
                    window.location.reload();
                } else {
                    if (onClose) {
                        window.location.reload();
                        onClose();
                    }
                }
            }
        } catch (error) {
            console.error(error);
            alert(editableData ? 'Failed to update post!' : 'Failed to create post!');
        }
    };

    const handleClose = () => {
        setImage(null);
        setImagePreview(null);
        setTotalDays('');
        setCharge('');
        setTitle('');
        setDescription('');
        onClose();
    };

    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        const wordCount = text.trim().split(/\s+/).filter(word => word).length;
        const lineCount = text.split('\n').length;

        // Check if it exceeds 25 words or 4 lines
        if (wordCount > 25 || lineCount > 4) {
            setIsValidDescription(false);
        } else {
            setIsValidDescription(true);
        }

        setDescription(text);
    };

    return (
        <div className="highlight-dialog-overlay">
            <div className="highlight-dialog">
                {/* Close Button */}
                <div className="highlight-header">
                    <div className="highlight-title">{editableData ? "Edit Post" : "Highlight Trip"}</div>
                    <div className="highlight-close-btn" onClick={handleClose}>
                        <FaTimes />
                    </div>
                </div>

                {/* Content Section */}
                <div className="highlight-content">
                    {/* Image and Preview Section */}
                    <div className="highlight-row image-row">
                        <div className="image-input">
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <div className="image-preview">
                            {imagePreview && <img src={imagePreview} alt="Preview" />}
                        </div>
                    </div>

                    {/* Title, Total Days, and Total Charge Row */}
                    <div className="highlight-title-days-charge-row">
                        {/* Title on the left */}
                        <div className="title-container">
                            <label htmlFor="highlight-title">Title</label>
                            <input
                                id="highlight-title"
                                type="text"
                                placeholder="Enter Title of Post..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Total Days and Charge on the right */}
                        <div className="days-charge-container">
                            <div className="highlight-row">
                                <label htmlFor="highlight-days">Total Days</label>
                                <input
                                    id="highlight-days"
                                    type="number"
                                    placeholder="Total Days"
                                    value={totalDays}
                                    onChange={(e) => setTotalDays(e.target.value)}
                                />
                            </div>
                            <div className="highlight-row">
                                <label htmlFor="highlight-charge">Charge (₹)</label>
                                <input
                                    id="highlight-charge"
                                    type="number"
                                    placeholder="Charge (₹)"
                                    value={charge}
                                    onChange={(e) => setCharge(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="highlight-row">
                        <label htmlFor="highlight-description">
                            Description
                            <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: isValidDescription ? 'green' : 'red' }}>
                                ({description.trim().split(/\s+/).filter(word => word).length}/25 words, {description.split('\n').length}/4 lines)
                            </span>
                        </label>
                        <textarea
                            id="highlight-description"
                            placeholder="Description"
                            value={description}
                            onChange={handleDescriptionChange}
                        ></textarea>
                    </div>

                    {/* Post Button */}
                    <div className="highlight-row">
                        <button className="highlight-post-btn" onClick={handleSubmit} disabled={!isValidDescription}>{editableData ? "Update Post" : "Post"}</button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default HighlightDialog;