import React, { useState, useEffect } from "react";
import "./Calender.css";
import axios from "axios";
import { BASE_URL } from "../../enviroment/enviroment";

interface CalendarProps {
  centerId: number;
  onSlotsChange: (selectedSlots: { date: string; time: string }[]) => void;
  initialSelectedSlots?: { date: string; time: string }[];
}

const Calendar: React.FC<CalendarProps> = ({ 
  centerId, 
  onSlotsChange, 
  initialSelectedSlots = [] 
}) => {
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string }[]>(initialSelectedSlots);
  const [availability, setAvailability] = useState<{ [date: string]: { [time: string]: boolean } }>({});
  const [loading, setLoading] = useState(false);

  const days = generateDays();
  const timeSlots = generateTimeSlots();

  // Initialize selected slots when component mounts or initialSelectedSlots changes
  useEffect(() => {
    setSelectedSlots(initialSelectedSlots);
  }, [initialSelectedSlots]);

  // Fetch availability from backend
  useEffect(() => {
    if (!centerId) return;

    setLoading(true);
    axios
      .get(`${BASE_URL}slots?centerId=${centerId}`)
      .then((res) => {
        const data = res.data.availability; // object with date keys

        const availabilityMap: { [date: string]: { [time: string]: boolean } } = {};

        // Initialize all slots as available by default
        days.forEach(date => {
          availabilityMap[date] = {};
          timeSlots.forEach(time => {
            availabilityMap[date][time] = true; // default to available
          });
        });

        // Override with actual availability data
        if (data) {
          Object.keys(data).forEach((date) => {
            if (availabilityMap[date]) {
              data[date].forEach((slotObj: { slot: string; status: string }) => {
                availabilityMap[date][slotObj.slot] = slotObj.status === "available";
              });
            }
          });
        }

        setAvailability(availabilityMap);
      })
      .catch((err) => {
        console.error("Error fetching availability", err);
        // Set default availability on error
        const defaultAvailability: { [date: string]: { [time: string]: boolean } } = {};
        days.forEach(date => {
          defaultAvailability[date] = {};
          timeSlots.forEach(time => {
            defaultAvailability[date][time] = true;
          });
        });
        setAvailability(defaultAvailability);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [centerId]);

  const toggleSlot = (date: string, time: string) => {
    if (!availability[date]?.[time]) return; // Prevent selecting unavailable slots

    const isSelected = selectedSlots.some((slot) => slot.date === date && slot.time === time);
    const updatedSlots = isSelected
      ? selectedSlots.filter((slot) => !(slot.date === date && slot.time === time))
      : [...selectedSlots, { date, time }];

    setSelectedSlots(updatedSlots);
    onSlotsChange(updatedSlots);
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
  };

  if (loading) {
    return <div className="calendar-loading">Loading availability...</div>;
  }

  return (
    <div className="calendar">
      <div className="selected-count">
        Selected: {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            {days.map((date) => (
              <th key={date}>{formatDateHeader(date)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="time-cell">{time}</td>
              {days.map((date) => {
                const isAvailable = availability[date]?.[time] ?? false;
                const isSelected = selectedSlots.some((slot) => slot.date === date && slot.time === time);

                return (
                  <td
                    key={`${date}-${time}`}
                    onClick={() => isAvailable && toggleSlot(date, time)}
                    className={`slot ${
                      isAvailable
                        ? isSelected
                          ? "selected"
                          : "available"
                        : "unavailable"
                    }`}
                    title={
                      isAvailable
                        ? isSelected
                          ? "Click to deselect"
                          : "Click to select"
                        : "Not available"
                    }
                  >
                    {isSelected ? "✓" : isAvailable ? "○" : "✗"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper: generate next N days in YYYY-MM-DD format
function generateDays() {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Format as YYYY-MM-DD to match frontend
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  
  return days;
}

// Helper: generate time slots in HH:mm format
function generateTimeSlots(): string[] {
  const slots = [];
  // Generate slots from 6 AM to 11 PM to match frontend
  for (let h = 0; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

export default Calendar;