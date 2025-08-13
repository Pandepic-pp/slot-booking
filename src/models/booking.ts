export interface Booking {
  _id: string;
  phone: string;
  id: number;
  bookedBy: string;
  customerType: string;
  bookingType: string;
  packageId: number;
  center: number;
  onDate: Date;
  onTime: string;
  forDate: Date;
  forTime: string;
  status: string;
  activationTime: string,
  expiryTime: string,
  activatedAt: string,
  overs: string,
  price: number
}
