import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHOSSBookings, fetchHotels } from '../services/ApiService';
import { BookingDetail } from '../types';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
  isWithinInterval,
  subDays,
  parseISO,
  startOfDay,
} from 'date-fns';
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiX,
  FiSearch,
  FiCopy,
  FiDownload,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';

Modal.setAppElement('#root');

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: BookingDetail;
}

interface TooltipProps {
  isOpen: boolean;
  bookings: BookingDetail[];
  date: Date;
  position: { top: number; left: number };
  onClose: () => void;
  onAddBooking: () => void;
  onBookingClick: (booking: BookingDetail) => void;
}

const CalendarView: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipBookings, setTooltipBookings] = useState<BookingDetail[]>([]);
  const [tooltipDate, setTooltipDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'day') {
      setSearchQuery('');
    }
  }, [view]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getQueryDateRange = () => {
    const startDate = startOfMonth(viewDate);
    const endDate = endOfMonth(viewDate);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const { data: bookings, error, isLoading } = useQuery<BookingDetail[]>({
    queryKey: ['hossBookings', format(viewDate, 'yyyy-MM'), view],
    queryFn: () =>
      fetchHOSSBookings({
        startDate: getQueryDateRange().startDate,
        endDate: getQueryDateRange().endDate,
      }),
    retry: 2,
    refetchOnWindowFocus: view !== 'day',
    onError: (err: any) => {
      toast.error(`Failed to load bookings: ${err.message}`);
    },
    onSuccess: (data) => {
      console.log('Fetched bookings:', data);
    },
  });

  const hotelCapacity: {
    [key: string]: { totalRooms: number; roomTypes: { [key: string]: number } };
  } = {
    HOSS: {
      totalRooms: 50,
      roomTypes: { Standard: 30, Deluxe: 15, Suite: 4, Presidential: 1 },
    },
    'Grand Hotel': {
      totalRooms: 50,
      roomTypes: { Standard: 30, Deluxe: 15, Suite: 4, Presidential: 1 },
    },
    'Seaside Resort': {
      totalRooms: 80,
      roomTypes: { Standard: 40, Deluxe: 30, Suite: 8, Presidential: 2 },
    },
    'Mountain Lodge': {
      totalRooms: 30,
      roomTypes: { Standard: 20, Deluxe: 8, Suite: 2 },
    },
    'Urban Suites': {
      totalRooms: 40,
      roomTypes: { Standard: 25, Deluxe: 10, Suite: 4, Presidential: 1 },
    },
  };

  const getStatusClass = (status: string) =>
    ({
      Confirmed: 'badge-confirmed',
      Hold: 'badge-hold',
      Cancelled: 'badge-cancelled bg-red-500 text-white',
    })[status] || 'badge-no-show';

  const getStatusTextClass = (status: string) =>
    ({
      Confirmed: 'badge-confirmed',
      Hold: 'badge-hold',
      Cancelled: 'badge-cancelled bg-red-500 text-white',
    })[status] || 'badge-no-show';

  const getAvailabilityClass = (percentage: number) => {
    if (percentage > 70) return 'availability-high';
    if (percentage > 40) return 'availability-medium';
    if (percentage > 0) return 'availability-low';
    return 'availability-none';
  };

  const getBookingsForDate = (date: Date, bookings: BookingDetail[]) => {
    return (bookings || []).filter((booking) => {
      try {
        let checkIn = parseISO(booking.checkIn);
        let checkOut = parseISO(booking.checkOut);

        if (isNaN(checkIn.getTime())) {
          try {
            checkIn = new Date(booking.checkIn.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
          } catch {
            // Continue to validation
          }
        }
        if (isNaN(checkOut.getTime())) {
          try {
            checkOut = new Date(booking.checkOut.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
          } catch {
            // Continue to validation
          }
        }

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          console.warn(`Invalid dates for booking: ${booking.guestName}, checkIn: ${booking.checkIn}, checkOut: ${booking.checkOut}`);
          return false;
        }

        const isBookingIncluded =
          isSameDay(date, checkIn) ||
          isWithinInterval(date, { start: checkIn, end: subDays(checkOut, 1) });
        return isBookingIncluded;
      } catch (error) {
        console.error(`Error processing booking: ${booking.guestName}`, error);
        return false;
      }
    });
  };

  const calculateAvailability = (date: Date, bookings: BookingDetail[]) => {
    const dayBookings = getBookingsForDate(date, bookings || []).filter(
      (booking) => booking.status !== 'Cancelled'
    );
    const totalBooked = dayBookings.reduce(
      (sum, booking) => sum + (parseInt(booking.noOfRooms?.toString() || '0') || 0),
      0
    );
    let totalCapacity = 0;
    for (const hotel in hotelCapacity) {
      totalCapacity += hotelCapacity[hotel].totalRooms || 0;
    }
    const available = Math.max(0, totalCapacity - totalBooked);
    const percentage = totalCapacity > 0 ? Math.round((available / totalCapacity) * 100) : 0;
    return { available, booked: totalBooked, total: totalCapacity, percentage };
  };

  const navigatePeriod = (direction: number) => {
    const newDate = new Date(viewDate);
    if (view === 'month') {
      setViewDate(addMonths(newDate, direction));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
      setViewDate(newDate);
    } else {
      newDate.setDate(newDate.getDate() + direction);
      setViewDate(newDate);
    }
  };

  const handleDayClick = (date: Date, el: HTMLElement) => {
    const dayBookings = getBookingsForDate(date, filteredBookings || []);
    if (dayBookings.length === 0) {
      setIsBookingModalOpen(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    const tooltipWidth = window.innerWidth < 640 ? window.innerWidth - 40 : 256;
    const leftPosition = rect.left + rect.width / 2 - tooltipWidth / 2;
    const adjustedLeft = Math.max(10, Math.min(leftPosition, window.innerWidth - tooltipWidth - 10));

    setTooltipBookings(dayBookings);
    setTooltipDate(date);
    setTooltipPosition({
      top: rect.bottom + window.scrollY + 5,
      left: adjustedLeft,
    });
    setIsTooltipOpen(true);
  };

  const handleBookingClick = (booking: BookingDetail) => {
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
    setIsTooltipOpen(false);
  };

  const currentPeriod = () => {
    if (view === 'month') {
      return format(viewDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(viewDate, { weekStartsOn: 0 });
      const end = endOfWeek(viewDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(viewDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!deferredSearchQuery) return bookings;

    const lowerQuery = deferredSearchQuery.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.guestName?.toLowerCase().includes(lowerQuery) ||
        booking.hotelName?.toLowerCase().includes(lowerQuery) ||
        booking.status?.toLowerCase().includes(lowerQuery)
    );
  }, [bookings, deferredSearchQuery]);

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const text = `Guest: ${selectedBooking.guestName}\nPlan: ${selectedBooking.plan}\nCheck-In: ${selectedBooking.checkIn}\nCheck-Out: ${selectedBooking.checkOut}\nHotel: ${selectedBooking.hotelName}\nPAX: ${selectedBooking.pax || 'N/A'}\nRooms: ${selectedBooking.noOfRooms || 'N/A'}\nExtra Bed: ${selectedBooking.extraBed || 'N/A'}\nKitchen: ${selectedBooking.kitchen || 'N/A'}\nStatus: ${selectedBooking.status}\nTotal Bill: ₹${selectedBooking.totalBill || 'N/A'}\nAdvance: ₹${selectedBooking.advance || '0'}\nDue: ₹${(selectedBooking.totalBill - (selectedBooking.advance || 0)) || '0'}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard');
  };

  const printBookingDetails = () => {
    if (!selectedBooking) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Booking Details', 10, 10);
    doc.text(`Guest: ${selectedBooking.guestName}`, 10, 20);
    doc.text(`Plan: ${selectedBooking.plan}`, 10, 30);
    doc.text(`Check-In: ${selectedBooking.checkIn}`, 10, 40);
    doc.text(`Check-Out: ${selectedBooking.checkOut}`, 10, 50);
    doc.text(`Hotel: ${selectedBooking.hotelName}`, 10, 60);
    doc.text(`PAX: ${selectedBooking.pax || 'N/A'}`, 10, 70);
    doc.text(`Rooms: ${selectedBooking.noOfRooms || 'N/A'}`, 10, 80);
    doc.text(`Extra Bed: ${selectedBooking.extraBed || 'N/A'}`, 10, 90);
    doc.text(`Kitchen: ${selectedBooking.kitchen || 'N/A'}`, 10, 100);
    doc.text(`Status: ${selectedBooking.status}`, 10, 110);
    doc.text(`Total Bill: ₹${selectedBooking.totalBill || 'N/A'}`, 10, 120);
    doc.text(`Advance: ₹${selectedBooking.advance || '0'}`, 10, 130);
    doc.text(`Due: ₹${(selectedBooking.totalBill - (selectedBooking.advance || 0)) || '0'}`, 10, 140);
    doc.save(`booking_${selectedBooking.guestName}_${selectedBooking.checkIn}.pdf`);
    toast.success('Booking details downloaded as PDF');
  };

  const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="font-medium text-base text-[var(--text-primary)]">{value}</p>
    </div>
  );

  const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, booking }) => {
    if (!isOpen) return null;

    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className="modal p-4 sm:p-6 rounded-xl w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto mx-auto mt-12 sm:mt-20"
        overlayClassName="modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gradient">Booking Details</h3>
            <motion.button
              onClick={onClose}
              className="modal-close-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close modal"
            >
              <FiX size={18} />
            </motion.button>
          </div>
          {booking ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <DetailItem label="Guest" value={booking.guestName} />
                  <DetailItem label="Plan" value={booking.plan} />
                  <DetailItem label="Check-In" value={booking.checkIn} />
                  <DetailItem label="Check-Out" value={booking.checkOut} />
                  <DetailItem label="Hotel" value={booking.hotelName} />
                </div>
                <div className="space-y-2">
                  <DetailItem label="PAX" value={booking.pax || 'N/A'} />
                  <DetailItem label="Rooms" value={booking.noOfRooms || 'N/A'} />
                  <DetailItem label="Extra Bed" value={booking.extraBed || 'N/A'} />
                  <DetailItem label="Kitchen" value={booking.kitchen || 'N/A'} />
                  <DetailItem label="Advance" value={booking.advance || '0'} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-[var(--card-bg)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">Status</p>
                  <span className={`badge badge-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="p-2 sm:p-3 bg-[var(--card-bg)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">Total Bill</p>
                  <p className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                    ₹{booking.totalBill || 'N/A'}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-[var(--card-bg)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">Due</p>
                  <p className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                    ₹{(booking.totalBill - (booking.advance || 0)) || '0'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 flex-wrap">
                <motion.button
                  onClick={copyBookingDetails}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Copy booking details"
                >
                  <FiCopy size={14} /> Copy
                </motion.button>
                <motion.button
                  onClick={printBookingDetails}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Download booking details as PDF"
                >
                  <FiDownload size={14} /> Download
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Close modal"
                >
                  Close
                </motion.button>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-center text-sm sm:text-base">
              No booking selected
            </p>
          )}
        </motion.div>
      </Modal>
    );
  };

  const BookingTooltip: React.FC<TooltipProps> = ({
    isOpen,
    bookings,
    date,
    position,
    onClose,
    onAddBooking,
    onBookingClick,
  }) => {
    if (!isOpen) return null;

    return (
      <motion.div
        className="absolute z-50 w-[90vw] sm:w-72 p-3 sm:p-4 glass-card rounded-lg shadow-lg border border-[var(--border-color)]"
        style={{ top: position.top, left: position.left }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
            Bookings for <span className="text-gradient">{format(date, 'MMM d')}</span>
          </h4>
          <motion.button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close tooltip"
          >
            <FiX size={16} />
          </motion.button>
        </div>
        <div className="space-y-2 sm:space-y-3 max-h-56 sm:max-h-64 overflow-y-auto scrollbar-thin">
          {bookings.map((booking) => (
            <motion.div
              key={booking.guestName + booking.checkIn}
              className="p-2 sm:p-3 rounded-lg hover:bg-[var(--sidebar-hover)] cursor-pointer glass-card"
              onClick={() => onBookingClick(booking)}
              whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              <div className="font-medium truncate text-sm sm:text-base text-[var(--text-primary)]">
                {booking.guestName}
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span className="truncate">{booking.hotelName}</span>
                <span className={`status-badge ${getStatusTextClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-color)]">
          <motion.button
            onClick={onAddBooking}
            className="w-full text-center btn-primary text-xs sm:text-sm flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new booking"
          >
            <FiPlus className="inline" /> Add Booking
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const SkeletonLoader = ({ viewType }: { viewType: 'month' | 'week' | 'day' }) => {
    if (viewType === 'month') {
      return (
        <div className="calendar-skeleton p-4 sm:p-6 rounded-xl animate-pulse">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="h-6 bg-[var(--sidebar-hover)] rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[...Array(35)].map((_, idx) => (
              <div key={idx} className="h-24 sm:h-32 bg-[var(--sidebar-hover)] rounded-lg"></div>
            ))}
          </div>
        </div>
      );
    }
    if (viewType === 'week') {
      return (
        <div className="calendar-skeleton p-4 sm:p-6 rounded-xl animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="h-64 sm:h-80 bg-[var(--sidebar-hover)] rounded-lg"></div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="calendar-skeleton p-4 sm:p-6 rounded-xl animate-pulse">
        <div className="h-12 bg-[var(--sidebar-hover)] rounded mb-4"></div>
        <div className="h-24 bg-[var(--sidebar-hover)] rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-32 bg-[var(--sidebar-hover)] rounded"></div>
          ))}
        </div>
      </div>
    );
  };

  const Calendar: React.FC = () => {
    const renderMonthView = () => {
      const currentDate = new Date();
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = startOfMonth(viewDate);
      const daysInMonth = endOfMonth(viewDate).getDate();
      const startingDay = getDay(firstDay);
      const prevMonthDays = endOfMonth(subMonths(viewDate, 1)).getDate();

      const days: JSX.Element[] = [];

      for (let i = 0; i < startingDay; i++) {
        const day = prevMonthDays - startingDay + i + 1;
        const date = new Date(year, month - 1, day);
        days.push(<Day key={`prev-${day}`} date={date} isOtherMonth={true} currentDate={currentDate} />);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        days.push(
          <Day
            key={i}
            date={date}
            isOtherMonth={false}
            onClick={handleDayClick}
            currentDate={currentDate}
          />
        );
      }

      const totalCells = startingDay + daysInMonth;
      const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i);
        days.push(<Day key={`next-${i}`} date={date} isOtherMonth={true} currentDate={currentDate} />);
      }

      return (
        <div id="month-view">
          <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-medium text-[var(--text-primary)] py-1 sm:py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-grid grid grid-cols-7 gap-1 sm:gap-2">{days}</div>
        </div>
      );
    };

    const Day: React.FC<{
      date: Date;
      isOtherMonth: boolean;
      currentDate: Date;
      onClick?: (date: Date, el: HTMLElement) => void;
    }> = ({ date, isOtherMonth, currentDate, onClick }) => {
      const dayBookings = getBookingsForDate(date, filteredBookings || []);
      const availability = calculateAvailability(date, filteredBookings || []);
      const availabilityClass = getAvailabilityClass(availability.percentage);

      const statusCounts = {
        Confirmed: 0,
        Hold: 0,
        Cancelled: 0,
      };

      dayBookings.forEach((booking) => {
        statusCounts[booking.status as keyof typeof statusCounts]++;
      });

      return (
        <motion.div
          className={`calendar-day p-2 sm:p-3 rounded-lg glass-card ${
            isOtherMonth
              ? 'bg-[var(--card-bg)] text-[var(--text-secondary)] opacity-50'
              : 'bg-[var(--card-bg)] hover:bg-[var(--sidebar-hover)] cursor-pointer'
          } ${availabilityClass} ${
            isSameDay(date, currentDate) && !isOtherMonth ? 'border-2 border-[var(--icon-bg-blue)]' : ''
          }`}
          onClick={() => !isOtherMonth && onClick && onClick(date, document.getElementById(`day-${format(date, 'yyyy-MM-dd')}`) || document.createElement('div'))}
          onDoubleClick={() => !isOtherMonth && setIsBookingModalOpen(true)}
          id={`day-${format(date, 'yyyy-MM-dd')}`}
          role="button"
          aria-label={`View bookings for ${format(date, 'MMMM d, yyyy')}`}
          whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="calendar-day-content">
            <div className="day-number text-right font-semibold text-sm sm:text-base text-[var(--text-primary)]">
              {date.getDate()}
            </div>
            {!isOtherMonth && dayBookings.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 sm:mt-2 justify-end">
                {Object.entries(statusCounts).map(
                  ([status, count]) =>
                    count > 0 && (
                      <motion.div
                        key={status}
                        className={`booking-indicator w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${getStatusClass(
                          status
                        )}`}
                        title={`${count} ${status} booking(s)`}
                        whileHover={{ scale: 1.2 }}
                      ></motion.div>
                    )
                )}
              </div>
            )}
            {!isOtherMonth && (
              <div className="text-xs text-right mt-1 sm:mt-2 text-[var(--text-secondary)]">
                {availability.available} avail
              </div>
            )}
          </div>
        </motion.div>
      );
    };

    const renderWeekView = () => {
      const start = startOfWeek(viewDate, { weekStartsOn: 0 });
      const days: JSX.Element[] = [];
      const currentDate = new Date();

      for (let i = 0; i < 7; i++) {
        const day = addDays(start, i);
        const dayBookings = getBookingsForDate(day, filteredBookings || []);
        const availability = calculateAvailability(day, filteredBookings || []);
        const percentage = Math.max(0, Math.min(100, availability.percentage));
        const availabilityColor =
          percentage > 70
            ? 'bg-[var(--icon-bg-green)]'
            : percentage > 40
            ? 'bg-[var(--icon-bg-yellow)]'
            : percentage > 0
            ? 'bg-[var(--icon-bg-blue)]'
            : 'bg-[var(--icon-bg-purple)]';

        days.push(
          <motion.div
            key={i}
            className="flex-1 min-w-[120px] sm:min-w-[160px] glass-card rounded-lg p-3 sm:p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-base sm:text-lg font-semibold ${
                  isSameDay(day, currentDate)
                    ? 'bg-gradient-primary text-white rounded-full w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center mx-auto'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
            <div className="mb-2 sm:mb-3">
              <div className ="flex items-center justify-between text-xs sm:text-sm text-[var(--text-secondary)]">
                <span>Availability</span>
                <span>{availability.total} total</span>
              </div>
              <div className="w-full bg-[var(--input-bg)] rounded-full h-1.5 sm:h-2 mt-1 sm:mt-2">
                <motion.div
                  className={`${availabilityColor} h-1.5 sm:h-2 rounded-full`}
                  style={{ width: `${percentage}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>{availability.available} avail</span>
                <span>{availability.booked} booked</span>
              </div>
            </div>
            <div
              className="space-y-2 sm:space-y-3"
              draggable={true}
              onDragStart={(e) => e.dataTransfer.setData('date', day.toISOString())}
            >
              {dayBookings.length === 0 ? (
                <motion.div
                  className="p-2 sm:p-3 text-center text-xs sm:text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--icon-bg-blue)] glass-card rounded-lg"
                  onClick={() => handleDayClick(day, document.getElementById(`week-day-${i}`) || document.createElement('div'))}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Add booking"
                  id={`week-day-${i}`}
                >
                  Click to add booking
                </motion.div>
              ) : (
                dayBookings.map((booking) => (
                  <motion.div
                    key={booking.guestName + booking.checkIn}
                    className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm glass-card ${getStatusTextClass(
                      booking.status
                    )}`}
                    onClick={() => handleBookingClick(booking)}
                    draggable={true}
                    onDragStart={(e) => e.dataTransfer.setData('booking', JSON.stringify(booking))}
                    whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    <div className="font-semibold truncate text-[var(--text-primary)]">
                      {booking.guestName}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {booking.hotelName}
                    </div>
                    <div
                      className={`status-badge ${getStatusTextClass(booking.status)} mt-1 sm:mt-2 text-xs`}
                    >
                      {booking.status}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        );
      }

      return (
        <div id="week-view">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">{days}</div>
        </div>
      );
    };

    const renderDayView = () => {
      const normalizedViewDate = startOfDay(viewDate);
      const dayBookings = getBookingsForDate(normalizedViewDate, filteredBookings || []);
      const availability = calculateAvailability(normalizedViewDate, filteredBookings || []);
      const percentage = Math.max(0, Math.min(100, availability.percentage));
      const availabilityColor =
        percentage > 70
          ? 'bg-[var(--icon-bg-green)]'
          : percentage > 40
          ? 'bg-[var(--icon-bg-yellow)]'
          : percentage > 0
          ? 'bg-[var(--icon-bg-blue)]'
          : 'bg-[var(--icon-bg-purple)]';

      const bookingsByHotel: { [key: string]: BookingDetail[] } = {};
      dayBookings.forEach((booking) => {
        if (!bookingsByHotel[booking.hotelName]) {
          bookingsByHotel[booking.hotelName] = [];
        }
        bookingsByHotel[booking.hotelName].push(booking);
      });

      return (
        <div id="day-view" className="glass-card rounded-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gradient">
              {format(normalizedViewDate, 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>
          <div className="mb-4 sm:mb-6 glass-card p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                Room Availability
              </h4>
              <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Total Rooms: {availability.total}
              </span>
            </div>
            <div className="w-full bg-[var(--input-bg)] rounded-full h-2 sm:h-3 mt-2 sm:mt-3">
              <motion.div
                className={`${availabilityColor} h-2 sm:h-3 rounded-full`}
                style={{ width: `${percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1 sm:mt-2">
              <span>Available: {availability.available}</span>
              <span>Booked: {availability.booked}</span>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {dayBookings.length === 0 ? (
              <motion.div
                className="text-center py-8 sm:py-12 text-[var(--text-secondary)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 text-[var(--icon-color)]">
                  <FiCalendar />
                </div>
                <div className="text-base sm:text-lg mb-4 sm:mb-6">No bookings for this day</div>
                <motion.button
                  className="btn-primary text-sm sm:text-base"
                  onClick={() => handleDayClick(normalizedViewDate, document.getElementById('day-view') || document.createElement('div'))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Add new booking"
                >
                  Add Booking
                </motion.button>
              </motion.div>
            ) : (
              Object.entries(bookingsByHotel).map(([hotel, hotelBookings]) => (
                <div key={hotel} className="mb-6 sm:mb-8">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                      {hotel}
                    </h4>
                    <div className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      {hotelCapacity[hotel]?.totalRooms -
                        hotelBookings
                          .filter((b) => b.status !== 'Cancelled')
                          .reduce((sum, b) => sum + parseInt(b.noOfRooms?.toString() || '0'), 0)}{' '}
                      of {hotelCapacity[hotel]?.totalRooms} rooms available
                    </div>
                  </div>
                  {hotelBookings.map((booking) => (
                    <motion.div
                      key={booking.guestName + booking.checkIn}
                      className="p-3 sm:p-4 rounded-lg glass-card hover:shadow-md transition mb-3 sm:mb-4"
                      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' }}
                    >
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                          {booking.guestName}
                        </div>
                        <div
                          className={`status-badge ${getStatusTextClass(booking.status)} text-xs sm:text-sm`}
                        >
                          {booking.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                        {booking.noOfRooms && (
                          <div>
                            <span className="text-[var(--text-secondary)]">Rooms:</span>{' '}
                            {booking.noOfRooms}
                          </div>
                        )}
                        {booking.pax && (
                          <div>
                            <span className="text-[var(--text-secondary)]">Guests:</span> {booking.pax}
                          </div>
                        )}
                        <div>
                          <span className="text-[var(--text-secondary)]">Check-in:</span>{' '}
                          {booking.checkIn}
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">Check-out:</span>{' '}
                          {booking.checkOut}
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">Total:</span> ₹
                          {booking.totalBill}
                        </div>
                        {booking.advance && (
                          <div>
                            <span className="text-[var(--text-secondary)]">Advance:</span> ₹
                            {booking.advance}
                          </div>
                        )}
                        {booking.kitchen && (
                          <div className="col-span-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-color)]">
                            <span className="text-[var(--text-secondary)]">Kitchen:</span>{' '}
                            {booking.kitchen}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2 sm:space-x-3 mt-3 sm:mt-4">
                        <motion.button
                          className="btn-primary text-xs sm:text-sm"
                          onClick={() => handleBookingClick(booking)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="View booking details"
                        >
                          <FiPlus className="inline mr-1" /> View
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      );
    };

    return (
      <div>
        {isLoading ? <SkeletonLoader viewType={view} /> : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 fade-in max-w-[100vw] sm:max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <FiCalendar className="text-[var(--icon-bg-indigo)]" size={24} />
        Booking Calendar
      </h2>

      {error && (
        <motion.div
          className="glass-card p-3 sm:p-4 bg-[var(--availability-low)] text-[var(--text-primary)] rounded-lg mb-4 sm:mb-6"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Failed to load bookings: {error.message}
        </motion.div>
      )}

      <div className="glass-card p-4 sm:p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.button
              onClick={() => navigatePeriod(-1)}
              className="p-2 sm:p-3 rounded-full neumorphic-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Navigate to previous period"
            >
              <FiChevronLeft className="text-[var(--text-primary)]" size={18} />
            </motion.button>

            <div className="relative" ref={datePickerRef}>
              <motion.button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] hover:text-[var(--icon-bg-indigo)] transition-colors"
                whileHover={{ scale: 1.05 }}
                aria-label={`Select date: ${currentPeriod()}`}
              >
                {currentPeriod()}
              </motion.button>

              <AnimatePresence>
                {isDatePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 mt-2 sm:mt-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg p-2 sm:p-3"
                  >
                    <DatePicker
                      selected={viewDate}
                      onChange={(date: Date) => {
                        setViewDate(date);
                        setIsDatePickerOpen(false);
                      }}
                      inline
                      calendarClassName="bg-[var(--card-bg)] text-[var(--text-primary)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={() => navigatePeriod(1)}
              className="p-2 sm:p-3 rounded-full neumorphic-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Navigate to next period"
            >
              <FiChevronRight className="text-[var(--text-primary)]" size={18} />
            </motion.button>

            <motion.button
              onClick={() => setViewDate(new Date())}
              className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm bg-[var(--input-bg)] text-[var(--text-primary)] rounded-full neumorphic-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Go to today"
            >
              Today
            </motion.button>
          </div>

          <div className="date-picker-tabs glass-card rounded-lg p-1">
            {['month', 'week', 'day'].map((tab) => (
              <motion.button
                key={tab}
                className={`date-picker-tab text-xs sm:text-sm ${
                  view === tab ? 'active bg-gradient-primary text-white' : 'text-[var(--text-primary)]'
                }`}
                onClick={() => setView(tab as 'month' | 'week' | 'day')}
                whileHover={{ scale: 1.05, backgroundColor: 'var(--sidebar-hover)' }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Switch to ${tab} view`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 flex-1 max-w-[100%] sm:max-w-md">
            <motion.button
              className="p-2 rounded-lg bg-[var(--card-bg)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Search bookings"
            >
              <FiSearch className="w-4 sm:w-5 h-4 sm:h-5 text-[var(--text-secondary)]" />
            </motion.button>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by guest, hotel, or status..."
                value={searchQuery}
                onChange={handleSearch}
                className="input-field w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-3 rounded-lg glass-card text-xs sm:text-sm"
                aria-label="Search bookings"
              />
              {searchQuery && (
                <motion.button
                  onClick={clearSearch}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Clear search"
                >
                  <FiX size={16} />
                </motion.button>
              )}
            </div>
          </div>
          <motion.button
            onClick={() => setIsBookingModalOpen(true)}
            className="btn-primary flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new booking"
          >
            <FiPlus size={16} />
            <span className="hidden sm:inline">New Booking</span>
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-6 mb-4 sm:mb-6">
          {[
            { status: 'Confirmed', color: 'badge-confirmed' },
            { status: 'Hold', color: 'badge-hold' },
            { status: 'Cancelled', color: 'badge-cancelled bg-red-500' },
            { status: 'High Availability', color: 'availability-high' },
            { status: 'Medium Availability', color: 'availability-medium' },
            { status: 'Low Availability', color: 'availability-low' },
            { status: 'No Availability', color: 'availability-none' },
          ].map((item) => (
            <div
              key={item.status}
              className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-primary)]"
            >
              <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${item.color}`}></div>
              <span>{item.status}</span>
            </div>
          ))}
        </div>

        <Calendar />
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedBooking(undefined);
        }}
        booking={selectedBooking}
      />

      <BookingTooltip
        isOpen={isTooltipOpen}
        bookings={tooltipBookings}
        date={tooltipDate || new Date()}
        position={tooltipPosition}
        onClose={() => setIsTooltipOpen(false)}
        onAddBooking={() => setIsBookingModalOpen(true)}
        onBookingClick={handleBookingClick}
      />
    </div>
  );
};

export default CalendarView;