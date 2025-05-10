export interface CalendarData {
  [month: string]: Array<{
    date: string;
    occupancy: number;
  }>;
}

export interface BookingFormData {
  dateBooked: string;
  guestName: string;
  contact?: string;
  plan: string;
  checkIn: string;
  checkOut: string;
  hotelName: string;
  status: string;
  totalBill: number;
  guests?: number;
  action?: string;
  pax?: string;
  db?: string;
  tb?: string;
  fb?: string;
  extraBed?: string;
  kitchen?: string;
  dbRate?: string;
  tbRate?: string;
  fbRate?: string;
  extraRate?: string;
  kitchenRate?: string;
  dbDiscount?: string;
  tbDiscount?: string;
  fbDiscount?: string;
  extraDiscount?: string;
  kitchenDiscount?: string;
  advance?: string;
  cashIn?: string;
  paymentMethod?: string;
}

export interface Summary {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  revenue: number;
  advance: number;
  due: number;
  expenses: number;
}

export interface BookingDetail {
  guestName: string;
  plan: string;
  mealPlan?: string;
  checkIn: string;
  checkOut: string;
  hotelName: string;
  status: string;
  totalBill: number;
  pax?: string | number;
  noOfRooms?: number | string;
  extraBed?: number | string;
  kitchen?: string;
  advance?: number | string;
  search?: string;
}

export interface FilterDetail {
  name: string;
  plan: string;
  checkIn: string;
  checkOut: string;
  hotel: string;
  day: string;
  pax: string;
  db: string;
  tb: string;
  fb: string;
  extra: string;
  status: string;
  totalBill: number;
  advance: number;
  due: number;
}

export interface Enquiry {
  dateBooked: string;
  guestName: string;
  contact: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  day: string;
  pax: string;
  roomName: {
    doubleBed: string;
    tripleBed: string;
    fourBed: string;
    extraBed: string;
    kitchen: string;
  };
  roomRent: {
    doubleBed: number;
    tripleBed: number;
    fourBed: number;
    extraBed: number;
    kitchen: number;
  };
  discount: {
    doubleBed: number;
    tripleBed: number;
    fourBed: number;
    extraBed: number;
    kitchen: number;
  };
  billAmount: number;
  advance: number;
  due: number;
  cashIn: number;
  modeOfPayment: string;
  cashOut: number;
  date: string;
  toAccount: string;
  scheme: string;
  status: string;
}

export interface RateType {
  roomType: string;
  rate: string;
}