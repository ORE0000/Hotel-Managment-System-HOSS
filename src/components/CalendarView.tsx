import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useDeferredValue,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHOSSBookings, fetchHotels } from '../services/ApiService';
import { ExtendedBookingDetail } from '../types';
import BookingForm from './BookingForm';
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
  differenceInDays,
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
  booking?: ExtendedBookingDetail;
}

interface TooltipProps {
  isOpen: boolean;
  bookings: ExtendedBookingDetail[];
  date: Date;
  position: { top: number; left: number };
  onClose: () => void;
  onAddBooking: () => void;
  onBookingClick: (booking: ExtendedBookingDetail) => void;
}

const calculateBookingCounts = (
  date: Date,
  bookings: ExtendedBookingDetail[] | undefined
) => {
  const dayBookings = getBookingsForDate(date, bookings || []);
  const counts = {
    Confirmed: 0,
    Cancelled: 0,
    'On Hold': 0,
  };
  dayBookings.forEach((booking) => {
    if (booking.status) {
      counts[booking.status as keyof typeof counts]++;
    }
  });
  return counts;
};

const getBookingsForDate = (
  date: Date,
  bookings: ExtendedBookingDetail[] | undefined
): ExtendedBookingDetail[] => {
  if (!bookings || !Array.isArray(bookings)) {
    return [];
  }
  return bookings.filter((booking) => {
    try {
      let checkIn = parseISO(booking.checkIn);
      let checkOut = parseISO(booking.checkOut);

      if (isNaN(checkIn.getTime())) {
        try {
          checkIn = new Date(
            booking.checkIn.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')
          );
        } catch {
          // Continue to validation
        }
      }
      if (isNaN(checkOut.getTime())) {
        try {
          checkOut = new Date(
            booking.checkOut.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')
          );
        } catch {
          // Continue to validation
        }
      }

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.warn(
          `Invalid dates for booking: ${booking.guestName}, checkIn: ${booking.checkIn}, checkOut: ${booking.checkOut}`
        );
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

const hasBookings = (
  date: Date,
  bookings: ExtendedBookingDetail[] | undefined
): boolean => {
  const dayBookings = getBookingsForDate(date, bookings);
  return dayBookings.length > 0;
};

const getTotalRooms = (
  roomName: { [key: string]: string | number | undefined } | undefined
): number => {
  if (!roomName) return 0;
  return (
    parseInt(roomName.doubleBed?.toString() || '0', 10) +
    parseInt(roomName.tripleBed?.toString() || '0', 10) +
    parseInt(roomName.fourBed?.toString() || '0', 10) +
    parseInt(roomName.extraBed?.toString() || '0', 10) +
    parseInt(roomName.kitchen?.toString() || '0', 10)
  );
};

const getStatusClass = (status: string) =>
  ({
    Confirmed: 'badge-confirmed',
    Hold: 'badge-hold',
    Cancelled: 'badge-cancelled',
  })[status] || 'badge-no-show';

const renderDay = (
  date: Date,
  bookings: ExtendedBookingDetail[] | undefined,
  currentDate: Date,
  isOtherMonth: boolean,
  view: 'month' | 'week' | 'day',
  onClick?: (date: Date, element: HTMLElement) => void,
  onBookingClick?: (booking: ExtendedBookingDetail) => void,
  setIsBookingModalOpen?: (open: boolean) => void
) => {
  const dayBookings = getBookingsForDate(date, bookings);
  const bookingCounts = calculateBookingCounts(date, bookings);
  const hasBooking = hasBookings(date, bookings);

  if (view === 'month') {
    return (
      <motion.div
        key={format(date, 'yyyy-MM-dd')}
        className={`calendar-day p-2 sm:p-3 rounded-lg glass-card ${
          isOtherMonth
            ? 'bg-[var(--card-bg)] text-[var(--text-secondary)] opacity-50'
            : 'bg-[var(--card-bg)] hover:bg-[var(--sidebar-hover)] cursor-pointer'
        } ${dayBookings.length > 0 && dayBookings.some((b) => b.status === 'Confirmed') ? 'badge-confirmed' : ''} ${
          isSameDay(date, currentDate) && !isOtherMonth
            ? 'border-2 border-[var(--icon-bg-blue)]'
            : ''
        }`}
        onClick={() =>
          !isOtherMonth &&
          onClick &&
          onClick(
            date,
            document.getElementById(`day-${format(date, 'yyyy-MM-dd')}`) ||
              document.createElement('div')
          )
        }
        onDoubleClick={() =>
          !isOtherMonth && setIsBookingModalOpen && setIsBookingModalOpen(true)
        }
        id={`day-${format(date, 'yyyy-MM-dd')}`}
        role="button"
        aria-label={`View bookings for ${format(date, 'MMMM d, yyyy')}`}
        whileHover={{
          scale: 1.03,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="calendar-day-content">
          <div className="day-number text-right font-semibold text-sm sm:text-base text-[var(--text-primary)]">
            {date.getDate()}
          </div>
          {!isOtherMonth && dayBookings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 sm:mt-2 justify-end">
              {Object.entries(bookingCounts).map(
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
          {!isOtherMonth && dayBookings.length > 0 && (
            <div className="text-xs text-right mt-1 sm:mt-2 text-[var(--text-secondary)]">
              {bookingCounts.Confirmed > 0 && (
                <div>Confirmed: {bookingCounts.Confirmed}</div>
              )}
              {bookingCounts.Cancelled > 0 && (
                <div>Cancelled: {bookingCounts.Cancelled}</div>
              )}
              {bookingCounts['On Hold'] > 0 && (
                <div>On Hold: {bookingCounts['On Hold']}</div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  } else if (view === 'week') {
    return (
      <motion.div
        key={format(date, 'yyyy-MM-dd')}
        className="calendar-day p-4 rounded-xl neumorphic-card bg-[var(--card-bg)] border border-[var(--border-color)] shadow-glow"
        id={`day-${format(date, 'yyyy-MM-dd')}`}
        role="button"
        aria-label={`View bookings for ${format(date, 'MMMM d, yyyy')}`}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="calendar-day-content relative">
          <div className="day-header mb-4">
            <div className="flex justify-between items-center">
              <div className="day-number text-2xl font-bold text-gradient">
                {format(date, 'd')}
              </div>
              {isSameDay(date, new Date()) && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--icon-bg-blue)] rounded-full shadow-glow"></div>
              )}
            </div>
            <div className="day-name text-sm font-medium text-[var(--text-secondary)] mt-1">
              {format(date, 'EEEE')}
            </div>
          </div>
          {!isOtherMonth && dayBookings.length > 0 ? (
            <div className="space-y-3">
              {dayBookings.map((booking) => {
                const totalRooms = getTotalRooms(booking.roomName);
                return (
                  <motion.div
                    key={`${booking.guestName}-${booking.checkIn}-${booking.checkOut}`}
                    className="p-3 rounded-lg glass-card bg-[var(--card-bg)]/80 border border-[var(--border-color)] hover:bg-[var(--sidebar-hover)] transition-all duration-300 cursor-pointer shadow-sm"
                    onClick={() => onBookingClick && onBookingClick(booking)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="truncate font-semibold text-[var(--text-primary)]">
                        {booking.guestName}
                      </div>
                      <span
                        className={`status-badge ${getStatusClass(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    {totalRooms > 0 && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        {totalRooms} Room{totalRooms > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      Hotel: {booking.hotel}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-[var(--text-secondary)] italic">
              No bookings
            </div>
          )}
        </div>
      </motion.div>
    );
  } else if (view === 'day') {
    return (
      <motion.div
        key={format(date, 'yyyy-MM-dd')}
        className={`calendar-day p-3 rounded-xl glass-card bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg ${
          isOtherMonth
            ? 'opacity-50 text-[var(--text-secondary)]'
            : 'hover:bg-gradient-to-br hover:from-[var(--card-bg)] hover:to-[var(--sidebar-hover)]'
        } ${isSameDay(date, currentDate) && !isOtherMonth ? 'border-2 border-[var(--icon-bg-blue)]' : ''}`}
        id={`day-${format(date, 'yyyy-MM-dd')}`}
        role="button"
        aria-label={`View bookings for ${format(date, 'MMMM d, yyyy')}`}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="calendar-day-content">
          <div className="day-number text-center font-bold text-lg text-[var(--text-primary)] mb-2">
            {format(date, 'd')}
          </div>
          <div className="day-name text-xs text-[var(--text-secondary)] mb-3">
            {format(date, 'EEE')}
          </div>
          {!isOtherMonth && dayBookings.length > 0 && (
            <div className="space-y-2">
              {dayBookings.map((booking) => {
                const totalRooms = getTotalRooms(booking.roomName);
                return (
                  <motion.div
                    key={`${booking.guestName}-${booking.checkIn}-${booking.checkOut}`}
                    className="p-2 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-[var(--text-primary)] hover:bg-white/20 transition-all duration-200 cursor-pointer"
                    onClick={() => onBookingClick && onBookingClick(booking)}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="truncate">{booking.guestName}</div>
                    {totalRooms > 0 && (
                      <div className="text-xs text-[var(--text-secondary)]">
                        {totalRooms} Room{totalRooms > 1 ? 's' : ''}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
          {isSameDay(date, new Date()) && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--icon-bg-blue)] rounded-full"></div>
          )}
        </div>
      </motion.div>
    );
  }
  return null;
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
      <div className="flex justify-between items-start mb-2 sm:mb-2">
        <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
          Bookings for{' '}
          <span className="text-gradient">{format(date, 'MMM d')}</span>
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
            key={`${booking.guestName}-${booking.checkIn}-${booking.checkOut}`}
            className="p-2 sm:p-3 rounded-lg hover:bg-[var(--sidebar-hover)] cursor-pointer glass-card"
            onClick={() => {
              onClose();
              onBookingClick(booking);
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="font-medium truncate text-sm sm:text-base text-[var(--text-primary)]">
              {booking.guestName}
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
              <span className="truncate">{booking.hotel}</span>
              <span
                className={`status-badge ${getStatusClass(booking.status)}`}
              >
                {booking.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-color)]">
        <motion.button
          onClick={() => {
            onClose();
            onAddBooking();
          }}
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

const CalendarView = () => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipBookings, setTooltipBookings] = useState<
    ExtendedBookingDetail[]
  >([]);
  const [tooltipDate, setTooltipDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [selectedBooking, setSelectedBooking] = useState<
    ExtendedBookingDetail | undefined
  >(undefined);
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

  const {
    data: bookings,
    error,
    isLoading,
  } = useQuery<ExtendedBookingDetail[], Error>({
    queryKey: ['hossBookings', format(viewDate, 'yyyy-MM'), view],
    queryFn: () =>
      fetchHOSSBookings({
        startDate: getQueryDateRange().startDate,
        endDate: getQueryDateRange().endDate,
      }),
    retry: 2,
    refetchOnWindowFocus: view !== 'day',
  });

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load bookings: ${error.message}`);
    }
    if (bookings) {
      console.log('Fetched bookings:', bookings);
    }
  }, [error, bookings]);

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
    if (view === 'month') {
      const dayBookings = getBookingsForDate(date, filteredBookings);
      if (dayBookings.length === 0) {
        setIsBookingModalOpen(true);
        return;
      }

      const rect = el.getBoundingClientRect();
      const tooltipWidth =
        window.innerWidth < 640 ? window.innerWidth - 40 : 256;
      const leftPosition = rect.left + rect.width / 2 - tooltipWidth / 2;
      const adjustedLeft = Math.max(
        10,
        Math.min(leftPosition, window.innerWidth - tooltipWidth - 10)
      );

      setTooltipBookings(dayBookings);
      setTooltipDate(date);
      setTooltipPosition({
        top: rect.bottom + window.scrollY + 5,
        left: adjustedLeft,
      });
      setIsTooltipOpen(true);
    }
  };

  const handleBookingClick = (booking: ExtendedBookingDetail) => {
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
        booking.hotel?.toLowerCase().includes(lowerQuery) ||
        booking.status?.toLowerCase().includes(lowerQuery)
    );
  }, [bookings, deferredSearchQuery]);

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const duration =
      selectedBooking.checkIn && selectedBooking.checkOut
        ? differenceInDays(
            parseISO(selectedBooking.checkOut),
            parseISO(selectedBooking.checkIn)
          )
        : 0;

    const roomDetails = selectedBooking.roomName || {};
    const roomRent = selectedBooking.roomRent || {};
    const usedRooms = Object.entries(roomDetails as { [key: string]: string })
      .filter(([_, value]) => value && parseInt(value, 10) > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/Bed$/, ''),
        count: value,
        rate: roomRent[key as keyof typeof roomRent] || 0,
      }));

    const text = `Guest Details for ${selectedBooking.guestName}
==================
Guest Information:
- Name: ${selectedBooking.guestName}
- Contact: ${selectedBooking.contact || 'N/A'}
- Hotel: ${selectedBooking.hotel}

Booking Details:
- Check-In: ${selectedBooking.checkIn}
- Check-Out: ${selectedBooking.checkOut}
- Duration: ${duration} days
- PAX: ${selectedBooking.pax || 'N/A'}
- Status: ${selectedBooking.status}

Room Details:
${usedRooms.map((r) => `${r.name}: ${r.count} (Rate: ₹${parseFloat(r.rate.toString()).toLocaleString()}${Number(selectedBooking.discount?.[r.name.toLowerCase() as keyof typeof selectedBooking.discount] || 0) > 0 ? `, Discount: ₹${(selectedBooking.discount?.[r.name.toLowerCase() as keyof typeof selectedBooking.discount] || 0).toLocaleString()}` : ''})`).join('\n')}

Financial Summary:
- Total Bill: ₹${(selectedBooking.billAmount || 0).toLocaleString()}
- Advance Paid: ₹${(selectedBooking.advance || 0).toLocaleString()}
- Due Amount: ₹${((selectedBooking.billAmount || 0) - (selectedBooking.advance || 0)).toLocaleString()}
- Cash-In: ₹${(selectedBooking.cashIn || 0).toLocaleString()}
- Cash-Out: ₹${(selectedBooking.cashOut || 0).toLocaleString()}
- Payment Mode: ${selectedBooking.modeOfPayment || 'N/A'}
- To Account: ${selectedBooking.toAccount || 'N/A'}
- Scheme: ${selectedBooking.scheme || 'N/A'}
- Date: ${selectedBooking.dateBooked || 'N/A'}

Generated by: Hotel Om Shiv Shankar
on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true })}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard!');
  };

  const printBookingDetails = () => {
    if (!selectedBooking) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Guest Details for ${selectedBooking.guestName}`, 10, 10);
    doc.text('==================', 10, 15);
    doc.text('Guest Information:', 10, 20);
    doc.text(`- Name: ${selectedBooking.guestName}`, 10, 25);
    doc.text(`- Contact: ${selectedBooking.contact || 'N/A'}`, 10, 30);
    doc.text(`- Hotel: ${selectedBooking.hotel}`, 10, 35);
    doc.text('Booking Details:', 10, 40);
    doc.text(`- Check-In: ${selectedBooking.checkIn}`, 10, 45);
    doc.text(`- Check-Out: ${selectedBooking.checkOut}`, 10, 50);
    doc.text(
      `- Duration: ${differenceInDays(parseISO(selectedBooking.checkOut), parseISO(selectedBooking.checkIn))} days`,
      10,
      55
    );
    doc.text(`- PAX: ${selectedBooking.pax || 'N/A'}`, 10, 60);
    doc.text(`- Status: ${selectedBooking.status}`, 10, 65);
    doc.text('Room Details:', 10, 70);
    let y = 75;
    const roomDetails = selectedBooking.roomName || {};
    const roomRent = selectedBooking.roomRent || {};
    Object.entries(roomDetails).forEach(([key, value]) => {
      if (parseInt(value?.toString() || '0', 10) > 0) {
        const roomName =
          key.charAt(0).toUpperCase() + key.slice(1).replace(/Bed$/, '');
        doc.text(
          `- ${roomName}: ${value} (Rate: ₹${parseFloat((roomRent[key as keyof typeof roomRent] || '0').toString()).toLocaleString()})`,
          10,
          y
        );
        y += 5;
      }
    });
    doc.text('Financial Summary:', 10, y);
    y += 5;
    doc.text(
      `- Total Bill: ₹${(selectedBooking.billAmount || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Advance Paid: ₹${(selectedBooking.advance || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Due Amount: ₹${((selectedBooking.billAmount || 0) - (selectedBooking.advance || 0)).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Cash-In: ₹${(selectedBooking.cashIn || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Cash-Out: ₹${(selectedBooking.cashOut || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Payment Mode: ${selectedBooking.modeOfPayment || 'N/A'}`,
      10,
      y
    );
    y += 5;
    doc.text(`- To Account: ${selectedBooking.toAccount || 'N/A'}`, 10, y);
    y += 5;
    doc.text(`- Scheme: ${selectedBooking.scheme || 'N/A'}`, 10, y);
    y += 5;
    doc.text(`- Date: ${selectedBooking.dateBooked || 'N/A'}`, 10, y);
    y += 5;
    doc.text('Generated by: Hotel Om Shiv Shankar', 10, y);
    y += 5;
    doc.text(
      `on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true })}`,
      10,
      y
    );
    doc.save(`Booking_Details_${selectedBooking.guestName}.pdf`);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center font-medium text-[var(--text-secondary)] text-xs sm:text-sm"
          >
            {day}
          </div>
        ))}
        {days.map((date) => {
          const isOtherMonth = !isWithinInterval(date, {
            start: monthStart,
            end: monthEnd,
          });
          return renderDay(
            date,
            filteredBookings,
            new Date(),
            isOtherMonth,
            view,
            handleDayClick,
            undefined,
            setIsBookingModalOpen
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });
    const days = [];
    let currentDate = weekStart;

    while (currentDate <= weekEnd) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 p-4 bg-[var(--card-bg)]/50 rounded-xl shadow-xl border border-[var(--border-color)]">
        {days.map((date) => {
          const isOtherMonth = !isWithinInterval(date, {
            start: startOfMonth(viewDate),
            end: endOfMonth(viewDate),
          });
          return renderDay(
            date,
            filteredBookings,
            new Date(),
            isOtherMonth,
            view,
            undefined,
            handleBookingClick,
            setIsBookingModalOpen
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(viewDate, filteredBookings || []);
    const bookingCounts = calculateBookingCounts(
      viewDate,
      filteredBookings || []
    );
    const hasBooking = hasBookings(viewDate, filteredBookings);

    return (
      <div
        className={`p-4 rounded-lg text-center cursor-pointer transition-colors duration-200 ${
          hasBooking ? 'bg-[rgba(0, 255, 255, 0.2)]' : 'bg-transparent'
        }`}
      >
        <div className="text-lg sm:text-xl font-medium">
          {format(viewDate, 'MMMM d, yyyy')}
        </div>
        {dayBookings.length > 0 && (
          <div className="flex flex-col items-center mt-2 space-y-1">
            {dayBookings.map((booking, index) => {
              const totalRooms = getTotalRooms(booking.roomName);
              return (
                <motion.div
                  key={`${booking.guestName}-${booking.checkIn}-${index}`}
                  className="glass-card p-2 rounded-lg w-full text-left text-xs sm:text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleBookingClick(booking)}
                >
                  <div className="font-medium">{booking.guestName}</div>
                  <div className="text-[var(--text-secondary)]">
                    {booking.checkIn} - {booking.checkOut}
                  </div>
                  <div className="text-[var(--text-secondary)] mt-1">
                    <span
                      className={`badge badge-${(booking.status || '').toLowerCase().replace(' ', '-')}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  {totalRooms > 0 && (
                    <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                      {totalRooms} rooms
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                    Plan: {booking.plan || 'N/A'} | PAX: {booking.pax || 'N/A'}
                  </div>
                </motion.div>
              );
            })}
            {bookingCounts.Confirmed > 0 && (
              <div>Confirmed: {bookingCounts.Confirmed}</div>
            )}
            {bookingCounts.Cancelled > 0 && (
              <div>Cancelled: {bookingCounts.Cancelled}</div>
            )}
            {bookingCounts['On Hold'] > 0 && (
              <div>On Hold: {bookingCounts['On Hold']}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const Calendar = () => {
    if (isLoading) {
      return <SkeletonLoader viewType={view} />;
    }

    return (
      <div>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-6 w-full fade-in">
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
                      onChange={(date: Date | null) => {
                        if (date) {
                          setViewDate(date);
                          setIsDatePickerOpen(false);
                        }
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
              <FiChevronRight
                className="text-[var(--text-primary)]"
                size={18}
              />
            </motion.button>

            <motion.button
              onClick={() => setViewDate(new Date())}
              className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm bg-[var(--input-bg)] text-[var(--text-primary)] rounded-full neumorphic-button hover:bg-[var(--sidebar-hover)] transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Go to today"
            >
              Today
            </motion.button>
          </div>

          <div className="date-picker-tabs glass-card rounded-lg p-1 flex">
            {['month', 'week', 'day'].map((tab) => (
              <motion.button
                key={tab}
                className={`date-picker-tab text-xs sm:text-sm px-3 py-1.5 rounded-md ${
                  view === tab
                    ? 'bg-gradient-primary text-white font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]'
                } transition-all duration-200`}
                onClick={() => setView(tab as 'month' | 'week' | 'day')}
                whileHover={{ scale: 1.05 }}
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
              className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--sidebar-hover)] transition-colors duration-200"
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
                className="input-field w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-3 rounded-lg glass-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--icon-bg-indigo)]"
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
            className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new booking"
          >
            <FiPlus size={16} />
            <span>New Booking</span>
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 sm:mb-8">
          {[
            { status: 'Confirmed', color: 'badge-confirmed' },
            { status: 'Hold', color: 'badge-hold' },
            { status: 'Cancelled', color: 'badge-cancelled' },
            { status: 'High Availability', color: 'availability-high' },
            { status: 'Medium Availability', color: 'availability-medium' },
            { status: 'Low Availability', color: 'availability-low' },
            { status: 'No Availability', color: 'availability-none' },
          ].map((item) => (
            <div
              key={item.status}
              className="flex items-center gap-2 text-sm text-[var(--text-primary)]"
            >
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
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

const BookingModal = ({ isOpen, onClose, booking }: BookingModalProps) => {
  const copyBookingDetails = () => {
    if (!booking) return;
    const duration =
      booking.checkIn && booking.checkOut
        ? differenceInDays(
            parseISO(booking.checkOut),
            parseISO(booking.checkIn)
          )
        : 0;

    const roomDetails = booking.roomName || {};
    const roomRent = booking.roomRent || {};
    const usedRooms = Object.entries(roomDetails as { [key: string]: string })
      .filter(([_, value]) => value && parseInt(value, 10) > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/Bed$/, ''),
        count: value,
        rate: roomRent[key as keyof typeof roomRent] || 0,
      }));

    const text = `Guest Details for ${booking.guestName}
==================
Guest Information:
- Name: ${booking.guestName}
- Contact: ${booking.contact || 'N/A'}
- Hotel: ${booking.hotel}

Booking Details:
- Check-In: ${booking.checkIn}
- Check-Out: ${booking.checkOut}
- Duration: ${duration} days
- PAX: ${booking.pax || 'N/A'}
- Status: ${booking.status}

Room Details:
${usedRooms.map((r) => `${r.name}: ${r.count} (Rate: ₹${parseFloat(r.rate.toString()).toLocaleString()}${Number(booking.discount?.[r.name.toLowerCase() as keyof typeof booking.discount] || 0) > 0 ? `, Discount: ₹${(booking.discount?.[r.name.toLowerCase() as keyof typeof booking.discount] || 0).toLocaleString()}` : ''})`).join('\n')}

Financial Summary:
- Total Bill: ₹${(booking.billAmount || 0).toLocaleString()}
- Advance Paid: ₹${(booking.advance || 0).toLocaleString()}
- Due Amount: ₹${((booking.billAmount || 0) - (booking.advance || 0)).toLocaleString()}
- Cash-In: ₹${(booking.cashIn || 0).toLocaleString()}
- Cash-Out: ₹${(booking.cashOut || 0).toLocaleString()}
- Payment Mode: ${booking.modeOfPayment || 'N/A'}
- To Account: ${booking.toAccount || 'N/A'}
- Scheme: ${booking.scheme || 'N/A'}
- Date: ${booking.dateBooked || 'N/A'}

Generated by: Hotel Om Shiv Shankar
on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true })}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard!');
  };

  const printBookingDetails = () => {
    if (!booking) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Guest Details for ${booking.guestName}`, 10, 10);
    doc.text('==================', 10, 15);
    doc.text('Guest Information:', 10, 20);
    doc.text(`- Name: ${booking.guestName}`, 10, 25);
    doc.text(`- Contact: ${booking.contact || 'N/A'}`, 10, 30);
    doc.text(`- Hotel: ${booking.hotel}`, 10, 35);
    doc.text('Booking Details:', 10, 40);
    doc.text(`- Check-In: ${booking.checkIn}`, 10, 45);
    doc.text(`- Check-Out: ${booking.checkOut}`, 10, 50);
    doc.text(
      `- Duration: ${differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn))} days`,
      10,
      55
    );
    doc.text(`- PAX: ${booking.pax || 'N/A'}`, 10, 60);
    doc.text(`- Status: ${booking.status}`, 10, 65);
    doc.text('Room Details:', 10, 70);
    let y = 75;
    const roomDetails = booking.roomName || {};
    const roomRent = booking.roomRent || {};
    Object.entries(roomDetails).forEach(([key, value]) => {
      if (parseInt(value?.toString() || '0', 10) > 0) {
        const roomName =
          key.charAt(0).toUpperCase() + key.slice(1).replace(/Bed$/, '');
        doc.text(
          `- ${roomName}: ${value} (Rate: ₹${parseFloat((roomRent[key as keyof typeof roomRent] || '0').toString()).toLocaleString()})`,
          10,
          y
        );
        y += 5;
      }
    });
    doc.text('Financial Summary:', 10, y);
    y += 5;
    doc.text(
      `- Total Bill: ₹${(booking.billAmount || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Advance Paid: ₹${(booking.advance || 0).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(
      `- Due Amount: ₹${((booking.billAmount || 0) - (booking.advance || 0)).toLocaleString()}`,
      10,
      y
    );
    y += 5;
    doc.text(`- Cash-In: ₹${(booking.cashIn || 0).toLocaleString()}`, 10, y);
    y += 5;
    doc.text(`- Cash-Out: ₹${(booking.cashOut || 0).toLocaleString()}`, 10, y);
    y += 5;
    doc.text(`- Payment Mode: ${booking.modeOfPayment || 'N/A'}`, 10, y);
    y += 5;
    doc.text(`- To Account: ${booking.toAccount || 'N/A'}`, 10, y);
    y += 5;
    doc.text(`- Scheme: ${booking.scheme || 'N/A'}`, 10, y);
    y += 5;
    doc.text(`- Date: ${booking.dateBooked || 'N/A'}`, 10, y);
    y += 5;
    doc.text('Generated by: Hotel Om Shiv Shankar', 10, y);
    y += 5;
    doc.text(
      `on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true })}`,
      10,
      y
    );
    doc.save(`Booking_Details_${booking.guestName}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="sidebar-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="modal rounded-2xl z-50 w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg p-6"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                {booking ? 'Booking Details' : 'New Booking'}
              </h3>
              <motion.button
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                whileHover={{ scale: 1.2 }}
                onClick={onClose}
              >
                <FiX size={24} />
              </motion.button>
            </div>
            {booking ? (
              <div className="space-y-4">
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Name:</strong> {booking.guestName}
                    </p>
                    <p>
                      <strong>Contact:</strong> {booking.contact || 'N/A'}
                    </p>
                    <p>
                      <strong>Hotel:</strong> {booking.hotel}
                    </p>
                    <p>
                      <strong>PAX:</strong> {booking.pax || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Plan:</strong> {booking.plan}
                    </p>
                    <p>
                      <strong>Check-In:</strong> {booking.checkIn}
                    </p>
                    <p>
                      <strong>Check-Out:</strong> {booking.checkOut}
                    </p>
                    <p>
                      <strong>Duration:</strong>{' '}
                      {differenceInDays(
                        parseISO(booking.checkOut),
                        parseISO(booking.checkIn)
                      )}{' '}
                      days
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span
                        className={`badge badge-${booking.status?.toLowerCase() || 'no-show'}`}
                      >
                        {booking.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Room Details
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Number(booking.roomName?.doubleBed || 0) > 0 && (
                      <div>
                        <p>
                          <strong>Double Bed:</strong>{' '}
                          {booking.roomName.doubleBed} (Rate: ₹
                          {parseFloat(
                            (booking.roomRent?.doubleBed || '0').toString()
                          ).toLocaleString()}
                          {Number(booking.discount?.doubleBed || 0) > 0
                            ? `, Discount: ₹${(booking.discount.doubleBed || 0).toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(booking.roomName?.tripleBed || 0) > 0 && (
                      <div>
                        <p>
                          <strong>Triple Bed:</strong>{' '}
                          {booking.roomName.tripleBed} (Rate: ₹
                          {parseFloat(
                            (booking.roomRent?.tripleBed || '0').toString()
                          ).toLocaleString()}
                          {Number(booking.discount?.tripleBed || 0) > 0
                            ? `, Discount: ₹${(booking.discount.tripleBed || 0).toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(booking.roomName?.fourBed || 0) > 0 && (
                      <div>
                        <p>
                          <strong>Four Bed:</strong> {booking.roomName.fourBed}{' '}
                          (Rate: ₹
                          {parseFloat(
                            (booking.roomRent?.fourBed || '0').toString()
                          ).toLocaleString()}
                          {Number(booking.discount?.fourBed || 0) > 0
                            ? `, Discount: ₹${(booking.discount.fourBed || 0).toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(booking.roomName?.extraBed || 0) > 0 && (
                      <div>
                        <p>
                          <strong>Extra Bed:</strong>{' '}
                          {booking.roomName.extraBed} (Rate: ₹
                          {parseFloat(
                            (booking.roomRent?.extraBed || '0').toString()
                          ).toLocaleString()}
                          {Number(booking.discount?.extraBed || 0) > 0
                            ? `, Discount: ₹${(booking.discount.extraBed || 0).toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(booking.roomName?.kitchen || 0) > 0 && (
                      <div>
                        <p>
                          <strong>Kitchen:</strong> {booking.roomName.kitchen}{' '}
                          (Rate: ₹
                          {parseFloat(
                            (booking.roomRent?.kitchen || '0').toString()
                          ).toLocaleString()}
                          {Number(booking.discount?.kitchen || 0) > 0
                            ? `, Discount: ₹${(booking.discount.kitchen || 0).toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <p>
                      <strong>Total Bill:</strong>{' '}
                      <span className="text-blue-400 font-semibold">
                        ₹{booking.billAmount?.toLocaleString() || '0'}
                      </span>
                    </p>
                    <p>
                      <strong>Advance Paid:</strong>{' '}
                      <span className="text-emerald-400 font-semibold">
                        ₹{booking.advance?.toLocaleString() || '0'}
                      </span>
                    </p>
                    <p>
                      <strong>Due Amount:</strong>{' '}
                      <span className="text-rose-400 font-semibold">
                        ₹
                        {(
                          booking.due ||
                          (booking.billAmount || 0) - (booking.advance || 0)
                        ).toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <strong>Cash-In:</strong>{' '}
                      <span className="text-teal-400">
                        ₹{booking.cashIn?.toLocaleString() || '0'}
                      </span>
                    </p>
                    <p>
                      <strong>Cash-Out:</strong>{' '}
                      <span className="text-orange-400">
                        ₹{booking.cashOut?.toLocaleString() || '0'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Mode:</strong> {booking.modeOfPayment}
                    </p>
                    <p>
                      <strong>To Account:</strong> {booking.toAccount || 'N/A'}
                    </p>
                    <p>
                      <strong>Date:</strong> {booking.dateBooked || 'N/A'}
                    </p>
                    <p>
                      <strong>Scheme:</strong> {booking.scheme || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <motion.button
                    onClick={copyBookingDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Copy booking details"
                  >
                    <FiCopy size={16} /> Copy Details
                  </motion.button>
                  <motion.button
                    onClick={printBookingDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Download booking PDF"
                  >
                    <FiDownload size={16} /> Download PDF
                  </motion.button>
                </div>
              </div>
            ) : (
              <BookingForm onBookingSuccess={() => { onClose(); }} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SkeletonLoader = ({
  viewType,
}: {
  viewType: 'month' | 'week' | 'day';
}) => {
  return (
    <div className="animate-pulse space-y-4">
      {viewType === 'month' && (
        <>
          <div className="h-10 rounded-lg w-3/4 mx-auto bg-[var(--card-bg)]"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-6 rounded w-full bg-[var(--card-bg)]"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg w-full bg-[var(--card-bg)]"
              ></div>
            ))}
          </div>
        </>
      )}
      {viewType === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 p-4 bg-[var(--card-bg)]/50 rounded-xl border border-[var(--border-color)]">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl w-full bg-[var(--card-bg)]"
            ></div>
          ))}
        </div>
      )}
      {viewType === 'day' && (
        <div className="h-64 rounded-lg w-full bg-[var(--card-bg)]"></div>
      )}
    </div>
  );
};

export default CalendarView;
