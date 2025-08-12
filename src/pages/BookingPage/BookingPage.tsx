import React, { useState } from "react";
import "./BookingPage.css";
import Calendar from "../../components/Calender/Calender";
import Button from "../../components/Button/Button";
import { centers, packages, type Packages } from "../../config";
import axios from "axios";
import type { Customer } from "../../models/customer";
import type { Membership } from "../../models/membership";
import { BASE_URL } from '../../enviroment/enviroment';
import type { Booking } from "../../models/booking";

interface FormData {
  name: string;
  phone: string;
  customerType: "New Customer" | "Existing Customer";
  bookingType: "Package Buy" | "Pay and Play";
  packageId: string;
  center: string;
  selectedSlots: { date: string; time: string }[];
  status: 'Booked';
}

const BookingPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    customerType: "New Customer",
    bookingType: "Pay and Play",
    packageId: "",
    center: "",
    selectedSlots: [],
    status: 'Booked',
  });

  const [oversLeft, setOversLeft] = useState<number | null>(null);
  const [customerTypeLocked, setCustomerTypeLocked] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [packageMessage, setPackageMessage] = useState("");

  // Utility to format time in 24-hour format (HH:mm:ss)
  const formatTime = (timeString: string) => {
    // If timeString is already in HH:mm format, convert to HH:mm:ss
    if (timeString.includes(':') && timeString.split(':').length === 2) {
      return `${timeString}`;
    }
    return timeString;
  };

  // Utility to get current time in HH:mm:ss format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  async function checkCustomer(phone: string): Promise<Customer[]> {
    const res = await axios.post<Customer[]>(`${BASE_URL}get-customers`, { phone });
    return res.data;
  }

  async function checkPackage(phone: string): Promise<Membership[]> {
    const res = await axios.post<Membership[]>(`${BASE_URL}get-memberships`, { phone });
    return res.data;
  }

  // Check if customer exists and retrieve packages
  const handlePhoneBlur = async () => {
    if (!formData.phone) return;

    const customer = await checkCustomer(formData.phone);

    if (customer.length === 1) {
      setFormData((prev) => ({ ...prev, customerType: "Existing Customer" }));
      const membership = await checkPackage(formData.phone);
      membership.sort((a, b) => b.package_id - a.package_id);

      if (membership.length > 0) {
        setOversLeft(membership[0].oversLeft);
        setPackageMessage(`${membership[0].oversLeft} overs left`);
      } else {
        setPackageMessage(`No packages taken`);
      }
    } else {
      setFormData((prev) => ({ ...prev, customerType: "New Customer" }));
      setOversLeft(null);
      setPackageMessage("");
    }
    setCustomerTypeLocked(true);
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calendar slot selection
  const handleSlotsChange = (slots: { date: string; time: string }[]) => {
    setFormData((prev) => ({ ...prev, selectedSlots: slots }));
  };

  // Submit booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selectedSlots.length === 0) {
      alert("Please select at least one slot");
      return;
    }

    const centerItem = centers.find((center) => center.id === parseInt(formData.center));

    let selectedPackage = {};
    let packageId = 0;

    if (formData.bookingType === 'Package Buy') {
      selectedPackage = packages.find((item) => item.id === parseInt(formData.packageId)) || {};
      packageId = (selectedPackage as Packages)?.id ?? 0;
    }

    const formBody: Booking[] = formData.selectedSlots.map((slot, i) => ({
      id: i + 1,
      bookedBy: formData.phone,
      customerType: formData.customerType,
      bookingType: formData.bookingType,
      packageId,
      center: centerItem ? centerItem.id : 1,
      onDate: new Date(),
      onTime: getCurrentTime(), // current time in 24-hour format
      forDate: new Date(slot.date), // slot date as Date object
      forTime: formatTime(slot.time), // slot time in HH:mm:ss format
      status: "Booked",
    }));

    try {
      console.log('Submitting booking data:', formBody);
      let response = await axios.post(`${BASE_URL}bookings`, formBody);
      console.log('Booking response:', response.data);

      if (response.status === 201 && formData.customerType === 'New Customer') {
        const newCustomer: Customer = {
          name: formData.name,
          phone: formData.phone
        };
        const customerRes = await axios.post(`${BASE_URL}customers`, newCustomer);
        console.log("Customer created:", customerRes.data);
      }

      // Reset form or show success message
      alert("Booking successful!");
      setFormData({
        name: "",
        phone: "",
        customerType: "New Customer",
        bookingType: "Pay and Play",
        packageId: "",
        center: "",
        selectedSlots: [],
        status: 'Booked',
      });
      setCustomerTypeLocked(false);
      setOversLeft(null);
      setPackageMessage("");
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    }
  };

  return (
    <div className="booking-wrapper h-200">
      <div className="booking-container">
        <h1>Book Your Slot</h1>
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Phone:
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <span className="verify" onClick={handlePhoneBlur}>verify</span>
            </label>
          </div>

          <div className="form-row">
            <label>
              Customer Type:
              <input
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                disabled={customerTypeLocked}
              />
            </label>

            {(formData.customerType === "New Customer" || packageMessage === 'No packages taken' || oversLeft === 0) && (
              <label>
                Booking Type:
                <select
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                >
                  <option>Package Buy</option>
                  <option>Pay and Play</option>
                </select>
              </label>
            )}
          </div>

          {oversLeft !== null && (
            <p className="overs-left">Overs left: {oversLeft}</p>
          )}

          {formData.bookingType === "Package Buy" && (
            <label>
              Select Package:
              <select
                name="packageId"
                value={formData.packageId}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                {packages.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.package} overs
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Center:
            <select
              name="center"
              value={formData.center}
              onChange={handleChange}
              required
            >
              <option value="">Select center</option>
              {centers.map(center => (
                <option key={center.id} value={center.id}>{center.name}</option>
              ))}
            </select>
          </label>

          {/* Display selected slots */}
          {formData.selectedSlots.length > 0 && (
            <div className="selected-slots">
              <h3>Selected Slots:</h3>
              {formData.selectedSlots.map((slot, index) => (
                <p key={index}>
                  {new Date(slot.date).toLocaleDateString()} at {slot.time}
                </p>
              ))}
            </div>
          )}

          {/* Calendar Modal */}
          <Button
            type="button"
            className="btn-secondary"
            onClick={() => setIsCalendarOpen(true)}
          >
            Select Slots ({formData.selectedSlots.length} selected)
          </Button>

          {isCalendarOpen && (
            <div className="modal-overlay" onClick={() => setIsCalendarOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Select Your Slots</h2>
                <div className="calendar-scroll-wrapper">
                  <Calendar
                    centerId={parseInt(formData.center) || 0}
                    onSlotsChange={handleSlotsChange}
                    initialSelectedSlots={formData.selectedSlots}
                  />
                </div>
                <Button className="btn-primary" onClick={() => setIsCalendarOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" className="btn-primary">
            Book Now
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;