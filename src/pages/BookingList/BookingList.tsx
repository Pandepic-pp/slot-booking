import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BookingList.css";
import { BASE_URL } from "../../enviroment/enviroment";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { type Booking } from "../../models/booking";
import { type Membership } from "../../models/membership";

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
      // After fetching, check for expired bookings
      handleExpiredBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpiredBookings = async (bookingsData: Booking[]) => {
    const nowUTC = new Date();

    const expired = bookingsData.filter((b) => {
        return b.expiryTime && b.status?.toLowerCase() === "active" && new Date(b.expiryTime) < nowUTC
      }
    );

    if(expired.length > 0) {
      expired.forEach((booking) => {
        axios.patch(`${BASE_URL}bookings`, {_id: booking._id, action: "completed"});
      });
      const refreshed = await axios.get(`${BASE_URL}bookings`);
      setAllBookings(refreshed.data);
    }
    

    // if (expired.length > 0) {
    //   for (const booking of expired) {
    //     try {
    //       await axios.patch(`${BASE_URL}bookings`, {
    //         _id: booking._id,
    //         action: "completed",
    //       });
    //     } catch (err) {
    //       console.error(`Error marking booking ${booking._id} as completed`, err);
    //     }
    //   }

    //   // Refresh bookings after updates
    //   const refreshed = await axios.get(`${BASE_URL}bookings`);
    //   setAllBookings(refreshed.data);
    // }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const filterBookings = (phone: string, center: string) => {
    let filtered = allBookings;

    if (phone.trim()) {
      const phoneLower = phone.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookedBy.toLowerCase().includes(phoneLower) ||
          b.phone?.toLowerCase().includes(phoneLower)
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
      const response = await axios.patch(`${BASE_URL}bookings`, {
        _id: id,
        action: newStatus,
      });
      console.log(response.data);

      setAllBookings((prev) =>
        prev.map((booking) =>
          booking._id === id
            ? {
                ...booking,
                status: newStatus.toLowerCase(),
                activatedAt:
                  newStatus.toLowerCase() === "active"
                    ? new Date().toISOString()
                    : booking.activatedAt,
              }
            : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  async function checkPackage(phone: string | undefined): Promise<Membership[]> {
    const res = await axios.post<Membership[]>(`${BASE_URL}get-memberships`, { phone });
    return res.data;
  }

  const updatePackage = async (phone: string | undefined, overs: number) => {
    try {
      console.log(phone);
      await axios.patch(`${BASE_URL}memberships`, { phone, overs });
    } catch (err) {
      console.error("Unable to update the package", err);
    }
  }

  const handleActivate = async (id: Booking) => {
    console.log(id);
    updateBookingStatus(id._id, "active");
    const membership = await checkPackage(id.bookedBy); 
    if(membership) {
      const updPackage = await updatePackage(id.bookedBy, parseInt(id.overs));
      console.log(updPackage);
    }
  };

  const handleCancel = (id: string) => {
    updateBookingStatus(id, "cancelled");
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date) return "N/A";
    return `${date.split("T")[0].split("-").reverse().join("-")} at ${
      time || "N/A"
    }`;
  };

  const getStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "active":
        return "status-active";
      case "cancelled":
        return "status-cancelled";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  return (
    <div className="booking-wrapper">
      <div className="booking-container" style={{ width: "1200px" }}>
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
              const isCompleted = b.status?.toLowerCase() === "completed";
              return (
                <div key={b._id} className="booking-card">
                  <div className="booking-header">
                    <h3 className="booking-name">{b.bookedBy}</h3>
                    <span
                      className={`status-badge ${getStatusClass(b.status)}`}
                    >
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
                      <strong>Booked For:</strong>{" "}
                      {formatDateTime(new Date(b.forDate).toISOString(), b.forTime)}
                    </p>
                    <p>
                      <strong>Price:</strong> Rs{" "}
                      {b.price?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="booking-actions">
                    <button
                      className={`btn-action btn-activate ${
                        isActive || isCancelled || isCompleted
                          ? "btn-disabled"
                          : ""
                      }`}
                      onClick={() =>
                        !(isActive || isCancelled || isCompleted) &&
                        handleActivate(b)
                      }
                      disabled={isActive || isCancelled || isCompleted}
                    >
                      <FaCheckCircle /> Activate
                    </button>
                    <button
                      className={`btn-action btn-cancel ${
                        isCancelled || isCompleted || isActive
                          ? "btn-disabled"
                          : ""
                      }`}
                      onClick={() =>
                        !(isCancelled || isCompleted) && handleCancel(b._id)
                      }
                      disabled={isCancelled || isCompleted || isActive}
                    >
                      <FaTimesCircle /> Cancel
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