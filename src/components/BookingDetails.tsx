import { useQuery } from "@tanstack/react-query";
import { fetchBookingDetails } from "../services/ApiService";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiCopy, FiRefreshCw } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { BookingDetail } from "../types";

// Use the BookingDetail interface from index.ts
const BookingDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const start = params.get("startDate");
    const end = params.get("endDate");
    const today = new Date().toISOString().split("T")[0];

    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      setStartDate(start);
      if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
        setEndDate(end);
      }
    } else {
      setStartDate(today);
      navigate(`?startDate=${today}`);
    }
  }, [location, navigate]);

  const { data: bookingDetails, error, isLoading, refetch } = useQuery<BookingDetail[]>({
    queryKey: ["bookingDetails", startDate, endDate],
    queryFn: () => fetchBookingDetails(startDate, endDate),
    enabled: shouldFetch && !!startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate),
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "startDate") {
      setStartDate(value);
      setShouldFetch(false);
      const params = new URLSearchParams(location.search);
      params.set("startDate", value);
      if (endDate) params.set("endDate", endDate);
      navigate(`?${params.toString()}`);
    } else if (name === "endDate") {
      setEndDate(value);
      setShouldFetch(false);
      const params = new URLSearchParams(location.search);
      params.set("startDate", startDate);
      params.set("endDate", value);
      navigate(`?${params.toString()}`);
    }
  };

  const handleFetchData = () => {
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      toast.error("Please select a valid start date.");
      return;
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      toast.error("Please select a valid end date.");
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date.");
      return;
    }
    setShouldFetch(true);
    refetch();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Booking details copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard. Please try again.");
      console.error("Clipboard error:", err);
    }
  };

  const formatBookingText = (booking: BookingDetail) => {
    return `🏨 *Booking*\n
👤 *Guest:* ${booking.guestName}\n
📅 *Check-in:* ${booking.checkIn}\n
📅 *Check-out:* ${booking.checkOut}\n
🏨 *Hotel:* ${booking.hotel}\n
🧑‍🤝‍🧑 *PAX:* ${booking.pax ?? "N/A"}\n
🏠 *Rooms:* ${booking.noOfRooms ?? "N/A"}\n
🛏️ *Extra Bed:* ${booking.extraBed ?? "N/A"}\n
🍽️ *Kitchen:* ${booking.kitchen ?? "N/A"}\n
💰 *Advance:* ${booking.advance ?? "N/A"}\n
🔄 *Status:* ${booking.status}\n
🥗 *Meal Plan:* ${booking.mealPlan ?? booking.plan ?? "N/A"}\n
💳 *Total Bill:* ₹${booking.totalBill}`;
  };

  return (
    <div className="p-4 md:p-6 fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sticky top-0 bg-[var(--bg-primary)] z-10 py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
          <FiCalendar className="text-indigo-500" />
          Booking Details for {startDate && format(parseISO(startDate), "MMMM d, yyyy")}
          {endDate && ` to ${format(parseISO(endDate), "MMMM d, yyyy")}`}
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={handleDateChange}
              className="input-field flex-1"
              aria-label="Select Start Date"
            />
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={handleDateChange}
              className="input-field flex-1"
              aria-label="Select End Date"
            />
          </div>
          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <>
                <FiRefreshCw />
                Fetch
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 bg-red-100 text-red-600 rounded-lg mb-4">
          {error.message.includes("ENQRY sheet not found")
            ? "The ENQRY sheet is missing in the Google Sheet. Please check the configuration."
            : error.message.includes("Valid date parameter")
            ? "Please enter a valid date in YYYY-MM-DD format."
            : error.message || "Failed to fetch booking details."}
        </div>
      )}

      {!shouldFetch && (
        <div className="glass-card p-6 text-center">
          <p className="text-lg text-[var(--text-primary)]">
            Select a date range and click "Fetch" to view bookings
          </p>
        </div>
      )}

      {isLoading && shouldFetch && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {!isLoading && shouldFetch && !error && (!bookingDetails || bookingDetails.length === 0) && (
        <div className="glass-card p-6 text-center">
          <p className="text-lg text-[var(--text-primary)]">
            No bookings found for the selected date range.
          </p>
        </div>
      )}

      {!isLoading && bookingDetails && bookingDetails.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookingDetails.map((item: BookingDetail, idx: number) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-xl hover:shadow-lg transition-all duration-300 relative"
            >
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => copyToClipboard(formatBookingText(item))}
                  className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                  title="Copy details"
                  aria-label="Copy Booking Details"
                >
                  <FiCopy />
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(formatBookingText(item))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                  title="Share via WhatsApp"
                  aria-label="Share via WhatsApp"
                >
                  <FaWhatsapp />
                </a>
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                {item.guestName}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Hotel:</span>
                  <span className="font-medium">{item.hotel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Dates:</span>
                  <span className="font-medium">
                    {item.checkIn} → {item.checkOut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status:</span>
                  <span className={`badge badge-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Meal Plan:</span>
                  <span className="font-medium">{item.mealPlan ?? item.plan ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">PAX:</span>
                  <span className="font-medium">{item.pax ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Rooms:</span>
                  <span className="font-medium">{item.noOfRooms ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Extra Bed:</span>
                  <span className="font-medium">{item.extraBed ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Kitchen:</span>
                  <span className="font-medium">{item.kitchen ?? "N/A"}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Total Bill:</span>
                  <span className="font-bold text-base">₹{item.totalBill}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Advance:</span>
                  <span className="font-medium">{item.advance ?? "N/A"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingDetails;