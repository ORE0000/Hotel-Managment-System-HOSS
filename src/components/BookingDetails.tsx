import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookingDetails } from '../services/ApiService';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCalendar, FiCopy, FiRefreshCw } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookingDetail } from '../types';
import { DayPicker, DateRange as DayPickerDateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const BookingDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(''); // Kept for future use
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DayPickerDateRange | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const start = params.get('startDate');
    const end = params.get('endDate');
    const today = new Date().toISOString().split('T')[0];

    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      setStartDate(start);
      setSelectedRange({ from: new Date(start), to: end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? new Date(end) : undefined });
      if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
        setEndDate(end);
      } else {
        setEndDate('');
      }
    } else {
      setStartDate(today);
      setSelectedRange({ from: new Date(today), to: undefined });
      navigate(`?startDate=${today}`);
    }
  }, [location, navigate]);

  const { data: bookingDetails, error, isLoading, refetch } = useQuery<BookingDetail[], Error>({
    queryKey: ['bookingDetails', startDate],
    queryFn: () => fetchBookingDetails(startDate),
    enabled: shouldFetch && !!startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate),
    retry: 2, // Allow retries for general API failures
  });

  const handleDateChange = (range: DayPickerDateRange | undefined) => {
    const newStart = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
    const newEnd = range?.to ? format(range.to, 'yyyy-MM-dd') : ''; // Store for future use
    setStartDate(newStart);
    setEndDate(newEnd);
    setSelectedRange(range && range.from ? { from: range.from, to: range.to } : undefined);
    setShouldFetch(false);
    const params = new URLSearchParams();
    if (newStart) params.set('startDate', newStart);
    if (newEnd) params.set('endDate', newEnd); // Keep endDate in URL for future use
    navigate(`?${params.toString()}`);
    if (range?.to) setIsOpen(false); // Close on selecting end date
  };

  const handleFetchData = () => {
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      toast.error('Please select a valid start date.');
      return;
    }
    setShouldFetch(true);
    refetch();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Booking details copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard. Please try again.');
      console.error('Clipboard error:', err);
    }
  };

  const formatBookingText = (booking: BookingDetail) => {
    return `🏨 *Booking*\n
👤 *Guest:* ${booking.guestName}\n
📅 *Check-in:* ${booking.checkIn}\n
📅 *Check-out:* ${booking.checkOut}\n
🏨 *Hotel:* ${booking.hotel}\n
🧑‍🤝‍🧑 *PAX:* ${booking.pax ?? 'N/A'}\n
🏠 *Rooms:* ${booking.noOfRooms ?? 'N/A'}\n
🛏️ *Extra Bed:* ${booking.extraBed ?? 'N/A'}\n
🍽️ *Kitchen:* ${booking.kitchen ?? 'N/A'}\n
💰 *Advance:* ${booking.advance ?? 'N/A'}\n
🔄 *Status:* ${booking.status}\n
🥗 *Meal Plan:* ${booking.mealPlan ?? booking.plan ?? 'N/A'}\n
💳 *Total Bill:* ₹${booking.totalBill}`;
  };

  return (
    <div className="p-6 w-full fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sticky top-0 bg-[var(--bg-primary)] z-10 py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
          <FiCalendar className="text-indigo-500" />
          Booking Details for {startDate && format(parseISO(startDate), 'MMMM d, yyyy')}
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow w-full sm:w-[300px] justify-start"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCalendar className="text-indigo-500" />
              {startDate ? (
                format(new Date(startDate), 'MMM dd, yyyy')
              ) : (
                'Select Date'
              )}
            </motion.button>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 mt-2 glass-card rounded-lg shadow-lg p-4 border border-[var(--border-color)]"
              >
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                  defaultMonth={selectedRange?.from}
                  className="text-[var(--text-primary)]"
                  modifiersClassNames={{
                    selected: 'bg-indigo-500 text-white',
                    today: 'border border-indigo-500',
                  }}
                />
              </motion.div>
            )}
          </div>
          <motion.button
            onClick={handleFetchData}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
            Fetch
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 bg-red-100 text-red-600 rounded-lg mb-4">
          {error.message.includes('ENQRY sheet not found')
            ? 'The ENQRY sheet is missing in the Google Sheet. Please check the configuration.'
            : error.message.includes('Valid date parameter')
              ? 'Please enter a valid date in YYYY-MM-DD format.'
              : error.message || 'Failed to fetch booking details.'}
        </div>
      )}

      {!shouldFetch && (
        <div className="glass-card p-6 text-center">
          <p className="text-lg text-[var(--text-primary)]">
            Select a start date and click "Fetch" to view bookings
          </p>
        </div>
      )}

      {isLoading && shouldFetch && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-card p-5 rounded-xl animate-pulse">
              <div className="absolute top-3 right-3 flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((__, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                <div className="flex justify-between">
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between mt-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && shouldFetch && !error && (!bookingDetails || bookingDetails.length === 0) && (
        <div className="glass-card p-6 text-center">
          <p className="text-lg text-[var(--text-primary)]">
            No bookings found for the selected date.
          </p>
        </div>
      )}

      {!isLoading && shouldFetch && bookingDetails && bookingDetails.length > 0 && (
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
                  <span className="font-medium">{item.mealPlan ?? item.plan ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">PAX:</span>
                  <span className="font-medium">{item.pax ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Rooms:</span>
                  <span className="font-medium">{item.noOfRooms ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Extra Bed:</span>
                  <span className="font-medium">{item.extraBed ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Kitchen:</span>
                  <span className="font-medium">{item.kitchen ?? 'N/A'}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Total Bill:</span>
                  <span className="font-bold text-base">₹{item.totalBill}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Advance:</span>
                  <span className="font-medium">{item.advance ?? 'N/A'}</span>
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