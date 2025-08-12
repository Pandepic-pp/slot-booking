export interface Booking {
  _id: string;
  bookedBy: string;
  phone?: string;
  center: string | number;
  overs: number;
  customerType: string;
  bookingType: string;
  status?: string;
  price?: number;
  forDate?: string;
  forTime?: string;
  activatedAt?: string;
  expiryTime?: string; // Added for expiry check
}