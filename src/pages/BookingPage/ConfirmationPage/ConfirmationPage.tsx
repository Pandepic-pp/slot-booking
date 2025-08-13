import React from "react";
import { useNavigate } from "react-router-dom";
import "./ConfirmationPage.css";
import { FaCheckCircle } from "react-icons/fa";

const ThankYou: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="booking-wrapper">
      <div className="thankyou-container">
        <div className="thankyou-card">
          <FaCheckCircle className="thankyou-icon" />
          <h1>Booking Confirmed!</h1>
          <p className="thankyou-message">
            Thank you for booking with us. Your slot has been successfully
            reserved. We look forward to seeing you!
          </p>

          <div className="thankyou-actions">
            <button
              className="btn-action btn-activate"
              onClick={() => navigate("/booking-list")}
            >
              View My Bookings
            </button>
            <button
              className="btn-action btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
