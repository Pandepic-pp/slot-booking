import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BookingList.css";
import { BASE_URL } from "../../enviroment/enviroment";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface Booking {
  _id: string;
  bookedBy: string;
  center: string | number;
  overs: number;
  customerType: string;
  bookingType: string;
  status?: string;
  id?: number;
  price?: number;
  onDate?: string;
  onTime?: string;
  forDate?: string;
  forTime?: string;
}

const BookingList: React.FC = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCenter, setSearchCenter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}bookings`);
      setAllBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const filterBookings = (phone: string, center: string) => {
    let filtered = allBookings;

    if (phone.trim()) {
      const phoneLower = phone.trim().toLowerCase();
      filtered = filtered.filter((b) =>
        b.bookedBy.toLowerCase().includes(phoneLower)
      );
    }
    if (center.trim()) {
      const centerLower = center.trim().toLowerCase();
      filtered = filtered.filter((b) =>
        b.center.toString().toLowerCase().includes(centerLower)
      );
    }
    setBookings(filtered);
  };

  useEffect(() => {
    filterBookings(searchPhone, searchCenter);
  }, [searchPhone, searchCenter, allBookings]);

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      // In a real application, you'd make an API call here:
      // const res = await axios.patch(`${BASE_URL}bookings/${id}/status`, { status: newStatus });
      
      const updatedBookings = allBookings.map((booking) =>
        booking._id === id ? { ...booking, status: newStatus } : booking
      );
      setAllBookings(updatedBookings);
      alert(`Booking ${id} status changed to ${newStatus}.`);
    } catch (err) {
      console.error(`Error updating booking status for ${id}:`, err);
      alert(`Failed to update booking status. Please try again.`);
    }
  };

  const handleActivate = (id: string) => {
    updateBookingStatus(id, 'Active');
  };

  const handleCancel = (id: string) => {
    updateBookingStatus(id, 'Cancelled');
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date) return 'N/A';
    return `${date} at ${time || 'N/A'}`;
  };

  const getStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'active': return 'status-active';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="booking-wrapper">
      <div className="booking-container" style={{width: '1200px'}}>
        <h1>Booking List</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name/phone number..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by center..."
            value={searchCenter}
            onChange={(e) => setSearchCenter(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-spinner">Loading bookings...</div>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="no-bookings">No bookings found.</p>
        ) : (
          <div className="booking-grid">
            {bookings.map((b) => {
              const isActive = b.status?.toLowerCase() === "active";
              const isCancelled = b.status?.toLowerCase() === "cancelled";
              return (
                <div key={b._id} className="booking-card">
                  <div className="booking-header">
                    <h3 className="booking-name">{b.bookedBy}</h3>
                    <span className={`status-badge ${getStatusClass(b.status)}`}>
                      <span className="status-dot"></span>
                      {b.status || "Pending"}
                    </span>
                  </div>
                  <div className="booking-details">
                    <p>
                      <strong>Center:</strong> {b.center}
                    </p>
                    <p>
                      <strong>Overs:</strong> {b.overs}
                    </p>
                    <p>
                      <strong>Customer Type:</strong> {b.customerType}
                    </p>
                    <p>
                      <strong>Booking Type:</strong> {b.bookingType}
                    </p>
                    <p>
                      <strong>Booked For:</strong> {formatDateTime(b.forDate, b.forTime)}
                    </p>
                    <p>
                      <strong>Price:</strong> Rs {b.price?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="booking-actions">
                    <button
                      className={`btn-action btn-activate ${isActive || isCancelled ? "btn-disabled" : ""}`}
                      onClick={() => !isActive && !isCancelled && handleActivate(b._id)}
                      disabled={isActive || isCancelled}
                    >
                      <FaCheckCircle />
                      Activate
                    </button>
                    <button
                      className={`btn-action btn-cancel ${isCancelled || isActive ? "btn-disabled" : ""}`}
                      onClick={() => !(isCancelled || isActive) && handleCancel(b._id)}
                      disabled={isCancelled || isActive}
                    >
                      <FaTimesCircle />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;