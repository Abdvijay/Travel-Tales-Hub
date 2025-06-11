import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);
    const [loadingComplete, setLoadingComplete] = useState(false);

    const handleExplore = () => {
        navigate("/auth");
    };

    useEffect(() => {
        // Show content with a sequence of animations
        const contentTimer = setTimeout(() => {
            setShowContent(true);
            
            // Mark loading as complete after elements have appeared
            const completeTimer = setTimeout(() => {
                setLoadingComplete(true);
            }, 1500);
            
            return () => clearTimeout(completeTimer);
        }, 1000);
        
        return () => clearTimeout(contentTimer);
    }, []);

    return (
        <div className="landing-container">
            <div className="landing-overlay"></div>
            
            <div className="landing-content-wrapper">
                <div className={`landing-content ${showContent ? "landing-show" : "landing-hide"}`}>
                    <div className="landing-header">
                        <h1 className="landing-title">Travel Tales Hub</h1>
                        <div className="landing-tagline">
                            <span className={`landing-tagline-text ${loadingComplete ? "landing-tagline-visible" : ""}`}>
                                Document & Share Your Travel Experiences with the World
                            </span>
                        </div>
                    </div>
                    
                    <div className={`landing-feature-points ${loadingComplete ? "landing-feature-visible" : ""}`}>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">📝</div>
                            <div className="landing-feature-text">Create travel diaries</div>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">✈️</div>
                            <div className="landing-feature-text">Share your journeys</div>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">🌍</div>
                            <div className="landing-feature-text">Connect with travelers</div>
                        </div>
                    </div>
                    
                    <div className={`landing-button-container ${loadingComplete ? "landing-buttons-visible" : ""}`}>
                        <button className="landing-explore-btn" onClick={handleExplore}>
                            <span className="landing-btn-text">Start Your Journey</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;