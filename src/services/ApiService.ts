import axios from "axios";
import { 
  BookingFormData, 
  CalendarData, 
  Summary, 
  BookingDetail, 
  Enquiry,
  FilterDetail,
  ExtendedBookingDetail
} from "../types";

const WEB_APP_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error || error.response?.data?.message;
    return serverMessage || error.message || "Unknown server error";
  }
  return (error as Error).message || "Unknown error occurred";
};

export const fetchCalendarData = async (month?: string): Promise<CalendarData> => {
  try {
    const url = month 
      ? `${WEB_APP_URL}?action=getCalendar&month=${month}`
      : `${WEB_APP_URL}?action=getCalendar`;
    const response = await axios.get(url);
    if (response.data.error) throw new Error(response.data.error);
    return response.data.data || {};
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchSummaryData = async (): Promise<Summary> => {
  try {
    const response = await axios.get(`${WEB_APP_URL}?action=getSummary`);
    if (response.data.error) throw new Error(response.data.error);
    return response.data.data || {
      totalBookings: 0,
      totalRevenue: 0,
      occupancyRate: 0,
      revenue: 0,
      advance: 0,
      due: 0,
      expenses: 0
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const submitBooking = async (data: BookingFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await axios.post(WEB_APP_URL, {
      action: "submitBooking",
      ...data
    });
    if (response.data.error) throw new Error(response.data.error);
    return response.data.data || { success: true };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const submitData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await axios.post(WEB_APP_URL, {
      action: "refreshData"
    });
    if (response.data.error) throw new Error(response.data.error);
    return response.data.data || { success: true };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchBookingDetails = async (startDate: string, endDate?: string): Promise<BookingDetail[]> => {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error("Valid startDate parameter is required in YYYY-MM-DD format");
  }
  if (endDate && !/^\d{4}-\d{2}-\d{endDate}/.test(endDate)) {
    throw new Error("endDate must be in YYYY-MM-DD format if provided");
  }
  try {
    const url = endDate 
      ? `${WEB_APP_URL}?action=getDetails&startDate=${startDate}&endDate=${endDate}`
      : `${WEB_APP_URL}?action=getDetails&startDate=${startDate}`;
    const response = await axios.get(url);
    if (response.data.error) throw new Error(response.data.error);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchEnquiryData = async (): Promise<Enquiry[]> => {
  try {
    const response = await axios.get(`${WEB_APP_URL}?action=getEnquiries`);
    if (response.data.error) throw new Error(response.data.error);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchFilterDetails = async (filters: {
  hotel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<FilterDetail[]> => {
  try {
    const params = new URLSearchParams({ action: "getFilterDetails" });
    if (filters.hotel) params.append("hotel", filters.hotel);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    
    const response = await axios.get(`${WEB_APP_URL}?${params.toString()}`);
    if (response.data.error) throw new Error(response.data.error);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchHotels = async (): Promise<string[]> => {
  try {
    const response = await axios.get<{ data: FilterDetail[]; error?: string }>(
      `${WEB_APP_URL}?action=getFilterDetails`
    );
    if (response.data.error) throw new Error(response.data.error);
    const hotels = Array.isArray(response.data.data)
      ? [...new Set(response.data.data.map((item) => item.hotel).filter((hotel): hotel is string => !!hotel))]
      : [];
    return hotels;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchHOSSBookings = async (filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  hotel?: string;
  search?: string;
} = {}): Promise<ExtendedBookingDetail[]> => {
  try {
    const params = new URLSearchParams({ action: "getHOSSBookings" });
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.hotel) params.append("hotel", filters.hotel);
    if (filters.search) params.append("search", filters.search);
    
    const response = await axios.get(`${WEB_APP_URL}?${params.toString()}`);
    if (response.data.error) throw new Error(response.data.error);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};