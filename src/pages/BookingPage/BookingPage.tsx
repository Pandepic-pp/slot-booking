import React, { useState } from "react";
import "./BookingPage.css";
import Calendar from "../../components/Calender/Calender";
import Button from "../../components/Button/Button";
import { centers, packages, type Packages } from "../../config";
import axios from "axios";
import type { Customer } from "../../models/customer";
import type { Membership } from "../../models/membership";
import { BASE_URL } from '../../enviroment/enviroment';

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

interface BookingPayload {
  id: number;
  bookedBy: string;
  customerType: "New Customer" | "Existing Customer";
  bookingType: "Package Buy" | "Pay and Play";
  packageId: number;
  center: number;
  onDate: Date;
  onTime: string;
  forDate: Date;
  forTime: string;
  status: "Booked";
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
  const [error, setError] = useState<string>("");

  // Utility to format time in 24-hour format (HH:mm:ss)
  const formatTime = (timeString: string): string => {
    if (timeString.includes(':') && timeString.split(':').length === 2) {
      return `${timeString}:00`;
    }
    return timeString;
  };

  // Utility to get current time in HH:mm:ss format
  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  async function checkCustomer(phone: string): Promise<Customer[]> {
    try {
      const res = await axios.post<Customer[]>(`${BASE_URL}get-customers`, { phone });
      return res.data;
    } catch (error) {
      console.error("Error checking customer:", error);
      return [];
    }
  }

  async function checkPackage(phone: string): Promise<Membership[]> {
    try {
      const res = await axios.post<Membership[]>(`${BASE_URL}get-memberships`, { phone });
      return res.data;
    } catch (error) {
      console.error("Error checking package:", error);
      return [];
    }
  }

  // Check if customer exists and retrieve packages
  const handlePhoneBlur = async () => {
    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }

    setError("");
    const customers = await checkCustomer(formData.phone);

    if (customers.length === 1) {
      setFormData((prev) => ({ ...prev, customerType: "Existing Customer" }));
      const memberships = await checkPackage(formData.phone);
      memberships.sort((a, b) => Number(b.package_id) - Number(a.package_id));

      if (memberships.length > 0) {
        setOversLeft(memberships[0].oversLeft);
        setPackageMessage(`${memberships[0].oversLeft} overs left`);
      } else {
        setPackageMessage("No packages taken");
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
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (formData.selectedSlots.length === 0) {
      setError("Please select at least one slot");
      return;
    }

    if (!formData.center) {
      setError("Please select a center");
      return;
    }

    setError("");

    const centerItem = centers.find((center) => center.id === parseInt(formData.center));

    let selectedPackage: Packages | undefined;
    let packageId = 0;

    if (formData.bookingType === 'Package Buy') {
      selectedPackage = packages.find((item) => item.id === parseInt(formData.packageId));
      if (!selectedPackage) {
        setError("Please select a valid package");
        return;
      }
      packageId = selectedPackage.id;
    }

    const formBody: BookingPayload[] = formData.selectedSlots.map((slot, i) => ({
      id: i + 1,
      bookedBy: formData.phone,
      customerType: formData.customerType,
      bookingType: formData.bookingType,
      packageId,
      center: centerItem ? centerItem.id : 1,
      onDate: new Date(),
      onTime: getCurrentTime(),
      forDate: new Date(slot.date),
      forTime: formatTime(slot.time),
      status: "Booked"
    }));

    try {
      const response = await axios.post(`${BASE_URL}bookings`, formBody);
      
      if (response.status === 201 && formData.customerType === 'New Customer') {
        const newCustomer: Customer = {
          name: formData.name,
          phone: formData.phone
        };
        await axios.post(`${BASE_URL}customers`, newCustomer);
      }

      // Reset form
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
      alert("Booking successful!");
    } catch (error) {
      console.error("Booking failed:", error);
      setError("Booking failed. Please try again.");
    }
  };

  return (
    <div className="booking-wrapper h-200">
      <div className="booking-container">
        <h1>Book Your Slot</h1>
        {error && <p className="error-message">{error}</p>}
        <div className="booking-form">
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
                onBlur={handlePhoneBlur}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Customer Type:
              <input
                type="text"
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                disabled={customerTypeLocked}
                readOnly
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
                  <option value="Package Buy">Package Buy</option>
                  <option value="Pay and Play">Pay and Play</option>
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
                    {item.package} overs - Rs. {item.price}
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

          <Button type="button" className="btn-primary" onClick={handleSubmit}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;