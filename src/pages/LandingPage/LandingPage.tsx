import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card" onClick={() => navigate("/new-booking")}>
        <h2>➕ New Booking</h2>
        <p>Create a new booking for a customer.</p>
      </div>

      <div className="dashboard-card" onClick={() => navigate("/booking-list")}>
        <h2>📋 Booking List</h2>
        <p>View and search existing bookings.</p>
      </div>
    </div>
  );
};

export default Dashboard;
