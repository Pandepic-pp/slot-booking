export interface Booking {
  id: number;
  bookedBy: string;
  customerType: string;
  bookingType: string;
  center: number;
  onDate: Date;
  onTime: string;
  forDate: Date;
  forTime: string;
  packageId: number;
  status: string;
}
