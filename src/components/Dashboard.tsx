import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchEnquiryData,
  fetchHOSSBookings,
  submitData,
} from '../services/ApiService';
import { Enquiry, ExtendedBookingDetail } from '../types';
import {
  FiCalendar,
  FiSearch,
  FiPlus,
  FiUser,
  FiCheckCircle,
  FiLogOut,
  FiDollarSign,
  FiCoffee,
  FiCreditCard,
  FiX,
  FiArrowRight,
  FiEye,
  FiCopy,
} from 'react-icons/fi';
import { FaBed, FaHotel } from 'react-icons/fa';
import { IoSync } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import DashboardCalendar from './DashboardCalendar';
import BookingForm from './BookingForm';
import { toast } from 'react-toastify';
import {
  isToday,
  isYesterday,
  differenceInDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

const Dashboard: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isAllBookingsModalOpen, setIsAllBookingsModalOpen] = useState(false);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] =
    useState(false);
  const [isEnquiryDetailModalOpen, setIsEnquiryDetailModalOpen] =
    useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<ExtendedBookingDetail | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showOtherHotels, setShowOtherHotels] = useState(false);

  const {
    data: enquiries,
    error: enquiriesError,
    isLoading: isEnquiriesLoading,
  } = useQuery<Enquiry[], Error>({
    queryKey: ['enquiries'],
    queryFn: fetchEnquiryData,
    retry: 2,
  });

  const {
    data: hossBookings = [],
    error: bookingsError,
    isLoading: isBookingsLoading,
  } = useQuery<ExtendedBookingDetail[], Error>({
    queryKey: ['hossBookings'],
    queryFn: () => fetchHOSSBookings({}),
    retry: 2,
  });

  useEffect(() => {
    if (enquiriesError) {
      toast.error(`Failed to load enquiries: ${enquiriesError.message}`);
    }
    if (bookingsError) {
      toast.error(`Failed to load bookings: ${bookingsError.message}`);
    }
  }, [enquiriesError, bookingsError]);

  const refreshMutation = useMutation({
    mutationFn: submitData,
    onSuccess: () => {
      toast.success('Data synced successfully with external systems!');
      window.location.reload();
    },
    onError: () => {
      toast.error('Failed to sync data. Please try again.');
    },
  });

  useEffect(() => {
    if (!isBookingsLoading && !isEnquiriesLoading) {
      setIsPageLoaded(true);
    }
  }, [isBookingsLoading, isEnquiriesLoading]);

  const handleBookingSuccess = useCallback(() => {
    if (isPageLoaded) {
      setIsSuccessDialogOpen(true);
      setIsModalOpen(false);
      setTimeout(() => {
        setIsSuccessDialogOpen(false);
      }, 3000);
    }
  }, [isPageLoaded]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSyncData = () => {
    toast.info('Syncing data with external systems...');
    refreshMutation.mutate();
  };

  const openBookingDetails = (booking: ExtendedBookingDetail) => {
    setSelectedBooking(booking);
    setIsBookingDetailModalOpen(true);
    setIsAllBookingsModalOpen(false);
  };

  const openEnquiryDetails = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsEnquiryDetailModalOpen(true);
  };

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const rooms =
      [
        selectedBooking.roomName?.doubleBed &&
        selectedBooking.roomName.doubleBed !== '0'
          ? `Double Bed: ${selectedBooking.roomName.doubleBed}`
          : '',
        selectedBooking.roomName?.tripleBed &&
        selectedBooking.roomName.tripleBed !== '0'
          ? `Triple Bed: ${selectedBooking.roomName.tripleBed}`
          : '',
        selectedBooking.roomName?.fourBed &&
        selectedBooking.roomName.fourBed !== '0'
          ? `Four Bed: ${selectedBooking.roomName.fourBed}`
          : '',
        selectedBooking.roomName?.extraBed &&
        selectedBooking.roomName.extraBed !== '0'
          ? `Extra Bed: ${selectedBooking.roomName.extraBed}`
          : '',
        selectedBooking.roomName?.kitchen &&
        selectedBooking.roomName.kitchen !== '0'
          ? `Kitchen: ${selectedBooking.roomName.kitchen}`
          : '',
      ]
        .filter(Boolean)
        .join('\n') || 'N/A';
    const text = `Guest: ${selectedBooking.guestName || 'N/A'}\nPlan: ${selectedBooking.plan || 'N/A'}\nCheck-In: ${selectedBooking.checkIn || 'N/A'}\nCheck-Out: ${selectedBooking.checkOut || 'N/A'}\nHotel: ${selectedBooking.hotel || 'N/A'}\nPAX: ${selectedBooking.pax || 'N/A'}\nRooms:\n${rooms}\nStatus: ${selectedBooking.status || 'N/A'}\nAdvance: ₹${selectedBooking.advance?.toLocaleString() || '0'}\nBill Amount: ₹${selectedBooking.billAmount?.toLocaleString() || '0'}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard');
  };

  const copyEnquiryDetails = () => {
    if (!selectedEnquiry) return;
    const text = `Guest: ${selectedEnquiry.guestName || 'N/A'}\nHotel: ${selectedEnquiry.hotel || 'N/A'}\nCheck-In: ${selectedEnquiry.checkIn || 'N/A'}\nCheck-Out: ${selectedEnquiry.checkOut || 'N/A'}\nDays: ${selectedEnquiry.day || 'N/A'}\nPAX: ${selectedEnquiry.pax || 'N/A'}\nDouble Bed: ${selectedEnquiry.roomName?.doubleBed || '0'}\nTriple Bed: ${selectedEnquiry.roomName?.tripleBed || '0'}\nFour Bed: ${selectedEnquiry.roomName?.fourBed || '0'}\nExtra Bed: ${selectedEnquiry.roomName?.extraBed || '0'}\nKitchen: ${selectedEnquiry.roomName?.kitchen || '0'}\nBill Amount: ₹${selectedEnquiry.billAmount?.toLocaleString() || '0'}\nStatus: ${selectedEnquiry.status || 'N/A'}`;
    navigator.clipboard.writeText(text);
    toast.success('Enquiry details copied to clipboard');
  };

  const recentEnquiries = useMemo(() => {
    if (!enquiries || !Array.isArray(enquiries)) return [];
    return enquiries
      .filter((enquiry: Enquiry) => isToday(new Date(enquiry.checkIn)))
      .sort(
        (a: Enquiry, b: Enquiry) =>
          new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
      );
  }, [enquiries]);

  const recentBookings = useCallback(() => {
    if (!hossBookings || !Array.isArray(hossBookings)) return [];
    return hossBookings
      .filter((booking: ExtendedBookingDetail) =>
        isToday(new Date(booking.checkIn))
      )
      .sort(
        (a: ExtendedBookingDetail, b: ExtendedBookingDetail) =>
          new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
      )
      .slice(0, 4);
  }, [hossBookings]);

  const allTodayBookings = useMemo(() => {
    if (!hossBookings || !Array.isArray(hossBookings)) return [];
    return hossBookings
      .filter((booking: ExtendedBookingDetail) =>
        isToday(new Date(booking.checkIn))
      )
      .sort(
        (a: ExtendedBookingDetail, b: ExtendedBookingDetail) =>
          new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
      );
  }, [hossBookings]);

  const calculateTrends = useCallback(() => {
    if (!hossBookings || !Array.isArray(hossBookings)) {
      return {
        checkInTrend: 'No data',
        checkOutTrend: 'No data',
        occupancyTrend: 'No data',
        revenueTrend: 'No data',
      };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const todayCheckIns = hossBookings.filter(
      (b: ExtendedBookingDetail) =>
        isToday(new Date(b.checkIn)) && b.status !== 'Cancelled'
    ).length;
    const yesterdayCheckIns = hossBookings.filter(
      (b: ExtendedBookingDetail) =>
        isYesterday(new Date(b.checkIn)) && b.status !== 'Cancelled'
    ).length;
    const checkInDiff = todayCheckIns - yesterdayCheckIns;
    const checkInTrend =
      checkInDiff > 0
        ? `+${checkInDiff} from yesterday`
        : checkInDiff < 0
          ? `${checkInDiff} from yesterday`
          : 'No change from yesterday';

    const todayCheckOuts = hossBookings.filter(
      (b: ExtendedBookingDetail) =>
        isToday(new Date(b.checkOut)) && b.status !== 'Cancelled'
    ).length;
    const yesterdayCheckOuts = hossBookings.filter(
      (b: ExtendedBookingDetail) =>
        isYesterday(new Date(b.checkOut)) && b.status !== 'Cancelled'
    ).length;
    const checkOutDiff = todayCheckOuts - yesterdayCheckOuts;
    const checkOutTrend =
      checkOutDiff > 0
        ? `+${checkOutDiff} from yesterday`
        : checkOutDiff < 0
          ? `${checkOutDiff} from yesterday`
          : 'No change from yesterday';

    const TOTAL_ROOMS = 18;
    const calculateOccupancyForPeriod = (start: Date, end: Date) => {
      let totalOccupiedRooms = 0;
      const days = differenceInDays(end, start) + 1;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dailyBookings = hossBookings.filter(
          (booking: ExtendedBookingDetail) => {
            if (booking.status === 'Cancelled') return false;
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            return checkIn <= d && d <= checkOut;
          }
        );

        let dailyOccupiedRooms = 0;
        dailyBookings.forEach((booking: ExtendedBookingDetail) => {
          const hotels = booking.hotel?.split('/')?.map((h) => h.trim()) || [
            'HOSS',
          ];
          if (hotels.includes('HOSS')) {
            const rooms =
              (parseInt(booking.roomName?.doubleBed?.toString() || '0', 10) ||
                0) +
              (parseInt(booking.roomName?.tripleBed?.toString() || '0', 10) ||
                0) +
              (parseInt(booking.roomName?.fourBed?.toString() || '0', 10) || 0);
            dailyOccupiedRooms +=
              hotels.length === 1 ? rooms : rooms / hotels.length;
          }
        });
        totalOccupiedRooms += dailyOccupiedRooms;
      }

      return (totalOccupiedRooms / (days * TOTAL_ROOMS)) * 100;
    };

    const currentWeekOccupancy = calculateOccupancyForPeriod(weekStart, today);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(weekEnd.getDate() - 7);
    const prevWeekOccupancy = calculateOccupancyForPeriod(
      prevWeekStart,
      prevWeekEnd
    );

    const occupancyDiff = Math.round(currentWeekOccupancy - prevWeekOccupancy);
    const occupancyTrend =
      occupancyDiff > 0
        ? `+${occupancyDiff}% this week`
        : occupancyDiff < 0
          ? `${occupancyDiff}% this week`
          : 'No change this week';

    const todayRevenue = hossBookings
      .filter(
        (b: ExtendedBookingDetail) =>
          isToday(new Date(b.checkIn)) && b.status !== 'Cancelled'
      )
      .reduce(
        (sum, b) => sum + (parseFloat(b.billAmount?.toString() || '0') || 0),
        0
      );
    const yesterdayRevenue = hossBookings
      .filter(
        (b: ExtendedBookingDetail) =>
          isYesterday(new Date(b.checkIn)) && b.status !== 'Cancelled'
      )
      .reduce(
        (sum, b) => sum + (parseFloat(b.billAmount?.toString() || '0') || 0),
        0
      );
    const revenuePercentChange =
      yesterdayRevenue !== 0
        ? Math.round(
            ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          )
        : todayRevenue > 0
          ? 100
          : 0;
    const revenueTrend =
      revenuePercentChange > 0
        ? `+${revenuePercentChange}% today`
        : revenuePercentChange < 0
          ? `${revenuePercentChange}% today`
          : 'No change today';

    return {
      checkInTrend,
      checkOutTrend,
      occupancyTrend,
      revenueTrend,
    };
  }, [hossBookings]);

  const calculateOccupancyRate = useCallback(() => {
    if (!hossBookings || !Array.isArray(hossBookings)) {
      return { hoss: '0%', other: '0%' };
    }

    const TOTAL_HOSS_ROOMS = 18;
    const TOTAL_HOSS_BEDS = 60;

    const today = new Date();

    const activeBookings = hossBookings.filter(
      (booking: ExtendedBookingDetail) => {
        if (booking.status === 'Cancelled') return false;
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return checkIn <= today && today <= checkOut;
      }
    );

    let hossRooms = 0;
    let hossBeds = 0;
    let otherRooms = 0;
    let otherBeds = 0;

    activeBookings.forEach((booking: ExtendedBookingDetail) => {
      const hotels = (booking.hotel || 'HOSS')
        .split('/')
        .map((name) => name.trim().toLowerCase());

      const numHotels = hotels.length;
      const isHossIncluded = hotels.some((name) => name === 'hoss');

      const db =
        parseInt(booking.roomName?.doubleBed?.toString() || '0', 10) || 0;
      const tb =
        parseInt(booking.roomName?.tripleBed?.toString() || '0', 10) || 0;
      const fb =
        parseInt(booking.roomName?.fourBed?.toString() || '0', 10) || 0;
      const extra =
        parseInt(booking.roomName?.extraBed?.toString() || '0', 10) || 0;

      const totalRooms = db + tb + fb;

      const extraToFB = Math.min(3, fb);
      const remainingExtra = Math.max(0, extra - extraToFB);

      const totalBeds = db * 2 + tb * 3 + fb * 4 + extraToFB + remainingExtra;

      if (isHossIncluded) {
        const share = 1 / numHotels;

        hossRooms += totalRooms * share;
        hossBeds += totalBeds * share;

        otherRooms += totalRooms * (1 - share);
        otherBeds += totalBeds * (1 - share);
      } else {
        otherRooms += totalRooms;
        otherBeds += totalBeds;
      }
    });

    hossRooms = Math.min(hossRooms, TOTAL_HOSS_ROOMS);
    hossBeds = Math.min(hossBeds, TOTAL_HOSS_BEDS);

    const hossRate = Math.round((hossRooms / TOTAL_HOSS_ROOMS) * 100);
    const otherRate = Math.round((otherRooms / TOTAL_HOSS_ROOMS) * 100);

    return {
      hoss: `${Math.min(hossRate, 100)}%`,
      other: `${Math.min(otherRate, 100)}%`,
    };
  }, [hossBookings]);

  const SkeletonLoader = ({
    count,
    type,
  }: {
    count: number;
    type: 'card' | 'table' | 'calendar';
  }) => {
    if (type === 'card') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(count)].map((_, idx) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl neumorphic-card animate-pulse"
            >
              <div className="h-6 bg-[var(--sidebar-hover)] rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-[var(--sidebar-hover)] rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-[var(--sidebar-hover)] rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }
    if (type === 'table') {
      return (
        <div className="space-y-4">
          {[...Array(count)].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center p-4 border border-[var(--border-color)] rounded-xl animate-pulse"
            >
              <div className="w-12 h-12 bg-[var(--sidebar-hover)] rounded-full mr-4"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--sidebar-hover)] rounded w-3/4"></div>
                <div className="h-4 bg-[var(--sidebar-hover)] rounded w-1/2"></div>
                <div className="h-4 bg-[var(--sidebar-hover)] rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="min-h-[400px] bg-[var(--card-bg)] rounded-xl animate-pulse">
        <div className="h-full bg-[var(--sidebar-hover)] rounded-xl"></div>
      </div>
    );
  };

  const calendarContent = useMemo(
    () => (
      <DashboardCalendar
        viewMode={viewMode}
        searchQuery={searchQuery}
        filters={{ status: '', startDate: '', endDate: '' }}
        bookings={hossBookings}
        isLoading={isBookingsLoading}
      />
    ),
    [viewMode, searchQuery, hossBookings, isBookingsLoading]
  );

  const trends = calculateTrends();
  const { hoss, other } = calculateOccupancyRate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-6 w-full"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Hotel Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Streamline your hotel operations with real-time insights.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <motion.button
            className="relative p-2 rounded-full bg-[var(--card-bg)] shadow-neumorphic hover:bg-[var(--sidebar-hover)] transition-colors duration-300"
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(!showSearch)}
            style={{
              boxShadow:
                '4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.2)',
            }}
          >
            <FiSearch size={18} className="text-[var(--icon-color)]" />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-[var(--icon-bg-teal)] text-[var(--text-primary)] rounded-xl neumorphic-card font-semibold hover:bg-gradient-to-r hover:from-[var(--icon-bg-teal)] hover:to-[var(--icon-bg-blue)] hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              refreshMutation.isPending
                ? {
                    scale: [1, 1.05, 1],
                    transition: { repeat: Infinity, duration: 0.8 },
                  }
                : {}
            }
            onClick={handleSyncData}
            disabled={refreshMutation.isPending}
          >
            <motion.span>
              <IoSync size={18} />
            </motion.span>
            {refreshMutation.isPending ? 'Syncing...' : 'Sync Data'}
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="relative flex items-center">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--icon-color)] text-lg z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search bookings..."
                className="w-full pl-12 pr-12 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-2xl shadow-neumorphic focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all duration-300"
                style={{
                  boxShadow:
                    'inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.2)',
                  border: 'none',
                }}
              />
              {searchQuery && (
                <motion.button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-[var(--sidebar-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={16} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {isBookingsLoading || isEnquiriesLoading ? (
        <SkeletonLoader count={4} type="card" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Today's Check-ins",
              value:
                hossBookings?.filter(
                  (b) =>
                    isToday(new Date(b.checkIn)) && b.status !== 'Cancelled'
                ).length || 0,
              icon: <FiCheckCircle size={24} />,
              trend: trends.checkInTrend,
              trendColor: trends.checkInTrend.includes('+')
                ? 'text-green-400'
                : trends.checkInTrend.includes('-')
                  ? 'text-red-400'
                  : 'text-gray-400',
              trendIcon: <FiCheckCircle size={12} />,
              bg: 'bg-[var(--icon-bg-indigo)]',
            },
            {
              title: "Today's Check-outs",
              value:
                hossBookings?.filter(
                  (b) =>
                    isToday(new Date(b.checkOut)) && b.status !== 'Cancelled'
                ).length || 0,
              icon: <FiLogOut size={24} />,
              trend: trends.checkOutTrend,
              trendColor: trends.checkOutTrend.includes('+')
                ? 'text-green-400'
                : trends.checkOutTrend.includes('-')
                  ? 'text-red-400'
                  : 'text-gray-400',
              trendIcon: <FiLogOut size={12} />,
              bg: 'bg-[var(--icon-bg-green)]',
            },
            {
              title: 'HOSS Occupancy',
              value: hoss,
              icon: <FaBed size={24} />,
              trend: trends.occupancyTrend,
              trendColor: trends.occupancyTrend.includes('+')
                ? 'text-green-400'
                : trends.occupancyTrend.includes('-')
                  ? 'text-red-400'
                  : 'text-gray-400',
              trendIcon: <FaBed size={12} />,
              bg: 'bg-[var(--icon-bg-blue)]',
              onClick: () => setShowOtherHotels(!showOtherHotels),
            },
            ...(showOtherHotels
              ? [
                  {
                    title: 'Other Hotels Occupancy',
                    value: other,
                    icon: <FaHotel size={24} />,
                    trend: trends.occupancyTrend,
                    trendColor: trends.occupancyTrend.includes('+')
                      ? 'text-green-400'
                      : trends.occupancyTrend.includes('-')
                        ? 'text-red-400'
                        : 'text-gray-400',
                    trendIcon: <FaHotel size={12} />,
                    bg: 'bg-[var(--icon-bg-purple)]',
                  },
                ]
              : []),
            {
              title: "Today's Revenue",
              value: `₹${(
                hossBookings
                  ?.filter(
                    (b) =>
                      isToday(new Date(b.checkIn)) && b.status !== 'Cancelled'
                  )
                  .reduce(
                    (sum, b) =>
                      sum + (parseFloat(b.billAmount?.toString() || '0') || 0),
                    0
                  ) || 0
              ).toLocaleString()}`,
              icon: <FiDollarSign size={24} />,
              trend: trends.revenueTrend,
              trendColor: trends.revenueTrend.includes('+')
                ? 'text-green-400'
                : trends.revenueTrend.includes('-')
                  ? 'text-red-400'
                  : 'text-gray-400',
              trendIcon: <FiDollarSign size={12} />,
              bg: 'bg-[var(--icon-bg-yellow)]',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="glass-card p-5 rounded-2xl neumorphic-card cursor-pointer overflow-hidden relative"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={stat.onClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold mt-1 text-[var(--text-primary)]">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center shadow-lg`}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                className={`mt-3 text-sm ${stat.trendColor} flex items-center relative z-10`}
              >
                {stat.trendIcon}
                <span className="ml-2">{stat.trend}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Calendar */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl neumorphic-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Booking Calendar
            </h2>
            <div className="flex items-center space-x-3">
              <motion.button
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus size={16} /> New Booking
              </motion.button>
            </div>
          </div>
          {calendarContent}
        </div>

        {/* Recent Bookings */}
        <div className="glass-card p-6 rounded-2xl neumorphic-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recent Bookings
            </h2>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-semibold border border-[var(--border-color)] hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAllBookingsModalOpen(true)}
            >
              <span>View All</span>
              <FiArrowRight size={16} />
            </motion.button>
          </div>
          {isBookingsLoading ? (
            <SkeletonLoader count={4} type="table" />
          ) : (
            <div className="space-y-4">
              {recentBookings().length > 0 ? (
                recentBookings().map((booking, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start p-4 border border-[var(--border-color)] rounded-xl neumorphic-card hover:bg-[var(--sidebar-hover)]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-[var(--icon-bg-indigo)] flex items-center justify-center mr-4 mt-1 shadow-inner`}
                    >
                      <FiUser size={20} className="text-[var(--icon-color)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-[var(--text-primary)]">
                          {booking.guestName || 'N/A'}
                        </h4>
                        <span
                          className={`badge badge-${(booking.status || '').toLowerCase().replace(' ', '-')}`}
                        >
                          {booking.status || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {booking.plan || 'N/A'} •{' '}
                        {booking.roomName
                          ? `${
                              parseInt(booking.roomName.doubleBed || '0') +
                              parseInt(booking.roomName.tripleBed || '0') +
                              parseInt(booking.roomName.fourBed || '0')
                            } Rooms`
                          : 'N/A Rooms'}
                      </p>
                      <div className="flex items-center text-xs text-[var(--text-secondary)] mt-2">
                        <FiCalendar size={14} className="mr-2" />
                        <span>
                          {booking.checkIn || 'N/A'} -{' '}
                          {booking.checkOut || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-2">
                        <span className="font-medium">Advance:</span>{' '}
                        <span className="text-emerald-400">
                          ₹{booking.advance?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        <span className="font-medium">Bill Amount:</span>{' '}
                        <span className="text-blue-400">
                          ₹{booking.billAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-center">
                  No bookings for today
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Room Revenue',
            value: `₹${(
              hossBookings
                ?.filter((b) => b.status !== 'Cancelled')
                .reduce(
                  (sum, b) =>
                    sum + (parseFloat(b.billAmount?.toString() || '0') || 0),
                  0
                ) || 0
            ).toLocaleString()}`,
            target: '₹1,80,000',
            progress: '75%',
            icon: <FaBed size={20} />,
            bg: 'bg-[var(--icon-bg-indigo)]',
          },
          {
            title: 'Food & Beverage',
            value: '₹38,700',
            target: '₹85,000',
            progress: '45%',
            icon: <FiCoffee size={20} />,
            bg: 'bg-[var(--icon-bg-green)]',
          },
          {
            title: 'Other Revenue',
            value: '₹12,300',
            target: '₹40,000',
            progress: '30%',
            icon: <FiCreditCard size={20} />,
            bg: 'bg-[var(--icon-bg-yellow)]',
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="p-5 border border-[var(--border-color)] rounded-xl neumorphic-card"
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">
                  {item.title}
                </p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">
                  {item.value}
                </h3>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow-lg`}
              >
                {item.icon}
              </div>
            </div>
            <div className="mt-4 h-3 bg-[var(--background-color)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: item.progress }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-3 text-xs text-[var(--text-secondary)] flex justify-between">
              <span>Target: {item.target}</span>
              <span>{item.progress}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Enquiries */}
      <div className="glass-card p-6 rounded-2xl neumorphic-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Recent Enquiries
          </h2>
          <Link to="/enquiry">
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-semibold border border-[var(--border-color)] hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>View All</span>
              <FiArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
        {isEnquiriesLoading ? (
          <SkeletonLoader count={3} type="table" />
        ) : (
          <div className="overflow-x-auto">
            <table className="modern-table w-full">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Hotel</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Days</th>
                  <th>PAX</th>
                  <th>Double Bed</th>
                  <th>Triple Bed</th>
                  <th>Four Bed</th>
                  <th>Extra Bed</th>
                  <th>Kitchen</th>
                  <th>Bill Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.length > 0 ? (
                  recentEnquiries.map((enquiry, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td data-label="Guest Name">
                        <div className="font-medium">
                          {enquiry.guestName || 'N/A'}
                        </div>
                      </td>
                      <td data-label="Hotel">
                        <div className="text-sm">{enquiry.hotel || 'N/A'}</div>
                      </td>
                      <td data-label="Check-In">
                        <div className="text-sm">
                          {enquiry.checkIn || 'N/A'}
                        </div>
                      </td>
                      <td data-label="Check-Out">
                        <div className="text-sm">
                          {enquiry.checkOut || 'N/A'}
                        </div>
                      </td>
                      <td data-label="Days">
                        <div className="text-sm">{enquiry.day || '0'}</div>
                      </td>
                      <td data-label="PAX">
                        <div className="text-sm">{enquiry.pax || '0'}</div>
                      </td>
                      <td data-label="Double Bed">
                        <div className="text-sm">
                          {enquiry.roomName?.doubleBed || '0'}
                        </div>
                      </td>
                      <td data-label="Triple Bed">
                        <div className="text-sm">
                          {enquiry.roomName?.tripleBed || '0'}
                        </div>
                      </td>
                      <td data-label="Four Bed">
                        <div className="text-sm">
                          {enquiry.roomName?.fourBed || '0'}
                        </div>
                      </td>
                      <td data-label="Extra Bed">
                        <div className="text-sm">
                          {enquiry.roomName?.extraBed || '0'}
                        </div>
                      </td>
                      <td data-label="Kitchen">
                        <div className="text-sm">
                          {enquiry.roomName?.kitchen || '0'}
                        </div>
                      </td>
                      <td data-label="Bill Amount">
                        <div className="text-sm">
                          ₹{enquiry.billAmount?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="flex space-x-3">
                          {enquiry.status === 'Pending' && (
                            <motion.button
                              className="text-indigo-400 hover:text-indigo-600 text-sm font-medium"
                              whileHover={{ scale: 1.1 }}
                            >
                              Follow Up
                            </motion.button>
                          )}
                          <motion.button
                            className="text-green-400 hover:text-green-600 text-sm font-medium"
                            whileHover={{ scale: 1.1 }}
                          >
                            {enquiry.status === 'Converted'
                              ? 'View'
                              : 'Convert'}
                          </motion.button>
                          <motion.button
                            className="text-blue-400 hover:text-blue-600 text-sm font-medium"
                            whileHover={{ scale: 1.1 }}
                            onClick={() => openEnquiryDetails(enquiry)}
                          >
                            View
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="p-6 text-center text-[var(--text-secondary)]"
                    >
                      No enquiries for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      <AnimatePresence>
        {isModalOpen && isPageLoaded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="sidebar-overlay"
              onClick={() => setIsModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="modal rounded-2xl z-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
                <h3 className="text-2xl font-semibold text-gradient">
                  Create New Booking
                </h3>
                <motion.button
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  <FiPlus size={24} className="rotate-45" />
                </motion.button>
              </div>
              <BookingForm onBookingSuccess={handleBookingSuccess} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Dialog */}
      <AnimatePresence>
        {isSuccessDialogOpen && isPageLoaded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="modal rounded-2xl z-50 w-full max-w-md bg-gradient-to-br from-green-500/80 to-green-600/80 neumorphic-card p-6 text-white backdrop-filter backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                boxShadow:
                  '0 8px 32px rgba(0, 128, 0, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: 1 }}
                >
                  <FiCheckCircle size={32} className="text-white" />
                </motion.div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Booking Created Successfully!
              </h3>
              <p className="text-sm text-center mt-2 opacity-90">
                Your booking has been added to the system.
              </p>
              <div className="mt-6 flex justify-center">
                <motion.button
                  className="px-4 py-2 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSuccessDialogOpen(false)}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Bookings Modal */}
      <AnimatePresence>
        {isAllBookingsModalOpen && isPageLoaded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="sidebar-overlay"
              onClick={() => setIsAllBookingsModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="modal rounded-2xl z-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 backdrop-filter backdrop-blur-md"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
                <h3 className="text-2xl font-semibold text-gradient">
                  Today's Bookings
                </h3>
                <motion.button
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setIsAllBookingsModalOpen(false)}
                >
                  <FiX size={24} />
                </motion.button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTodayBookings.length > 0 ? (
                  allTodayBookings.map((booking, index) => (
                    <motion.div
                      key={index}
                      className="glass-card p-4 rounded-xl neumorphic-card bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-gradient-to-br hover:from-[var(--sidebar-hover)] hover:to-transparent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        scale: 1.03,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div className="flex items-start">
                        <div
                          className={`w-12135 h-12 rounded-full bg-[var(--icon-bg-indigo)] flex items-center justify-center mr-4 mt-1 shadow-inner`}
                        >
                          <FiUser
                            size={20}
                            className="text-[var(--icon-color)]"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-[var(--text-primary)]">
                              {booking.guestName || 'N/A'}
                            </h4>
                            <span
                              className={`badge badge-${(booking.status || '').toLowerCase().replace(' ', '-')}`}
                            >
                              {booking.status || 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {booking.plan || 'N/A'} •{' '}
                            {booking.roomName
                              ? `${
                                  parseInt(booking.roomName.doubleBed || '0') +
                                  parseInt(booking.roomName.tripleBed || '0') +
                                  parseInt(booking.roomName.fourBed || '0')
                                } Rooms`
                              : 'N/A Rooms'}
                          </p>
                          <div className="flex items-center text-xs text-[var(--text-secondary)] mt-2">
                            <FiCalendar size={14} className="mr-2" />
                            <span>
                              {booking.checkIn || 'N/A'} -{' '}
                              {booking.checkOut || 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-2">
                            <span className="font-medium">Advance:</span>{' '}
                            <span className="text-emerald-400">
                              ₹{booking.advance?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-1">
                            <span className="font-medium">Bill Amount:</span>{' '}
                            <span className="text-blue-400">
                              ₹{booking.billAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <motion.button
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--text-primary)] rounded-full neumorphic-button font-medium hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openBookingDetails(booking)}
                        >
                          <motion.span
                            animate={{ y: [0, -2, 0] }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatType: 'loop',
                            }}
                          >
                            <FiEye size={14} />
                          </motion.span>
                          View Details
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-[var(--text-secondary)] text-center col-span-2 py-6">
                    No bookings for today
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {isBookingDetailModalOpen && isPageLoaded && selectedBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="sidebar-overlay"
              onClick={() => setIsBookingDetailModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="modal rounded-2xl z-50 w-full max-w-md bg-gradient-to-br from-green-400/80 to-green-500/80 neumorphic-card p-6 backdrop-filter backdrop-blur-md"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                boxShadow:
                  '0 8px 32px rgba(0, 128, 0, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Booking Details
                </h3>
                <motion.button
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setIsBookingDetailModalOpen(false)}
                >
                  <FiX size={24} />
                </motion.button>
              </div>
              <div className="space-y-3 text-sm text-[var(--text-primary)]">
                <p>
                  <span className="font-medium">Guest:</span>{' '}
                  {selectedBooking.guestName || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Hotel:</span>{' '}
                  {selectedBooking.hotel || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Plan:</span>{' '}
                  {selectedBooking.plan || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Check-In:</span>{' '}
                  {selectedBooking.checkIn || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Check-Out:</span>{' '}
                  {selectedBooking.checkOut || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">PAX:</span>{' '}
                  {selectedBooking.pax || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Double Bed:</span>{' '}
                  {selectedBooking.roomName?.doubleBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Triple Bed:</span>{' '}
                  {selectedBooking.roomName?.tripleBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Four Bed:</span>{' '}
                  {selectedBooking.roomName?.fourBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Extra Bed:</span>{' '}
                  {selectedBooking.roomName?.extraBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Kitchen:</span>{' '}
                  {selectedBooking.roomName?.kitchen || '0'}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`badge badge-${(selectedBooking.status || '').toLowerCase().replace(' ', '-')}`}
                  >
                    {selectedBooking.status || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Advance:</span>{' '}
                  <span className="text-emerald-400">
                    ₹{selectedBooking.advance?.toLocaleString() || '0'}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Bill Amount:</span>{' '}
                  <span className="text-blue-400">
                    ₹{selectedBooking.billAmount?.toLocaleString() || '0'}
                  </span>
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-medium hover:shadow-[0_0_15px_var(--glow-color)] transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyBookingDetails}
                >
                  <FiCopy size={14} /> Copy
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-medium hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsBookingDetailModalOpen(false)}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enquiry Details Modal */}
      <AnimatePresence>
        {isEnquiryDetailModalOpen && isPageLoaded && selectedEnquiry && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="sidebar-overlay"
              onClick={() => setIsEnquiryDetailModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="modal rounded-2xl z-50 w-full max-w-md bg-gradient-to-br from-blue-400/80 to-blue-500/80 neumorphic-card p-6 backdrop-filter backdrop-blur-md"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                boxShadow:
                  '0 8px 20px rgba(0, 0, 128, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Enquiry Details
                </h3>
                <motion.button
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setIsEnquiryDetailModalOpen(false)}
                >
                  <FiX size={24} />
                </motion.button>
              </div>
              <div className="space-y-3 text-sm text-[var(--text-primary)]">
                <p>
                  <span className="font-medium">Guest:</span>{' '}
                  {selectedEnquiry.guestName || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Hotel:</span>{' '}
                  {selectedEnquiry.hotel || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Check-In:</span>{' '}
                  {selectedEnquiry.checkIn || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Check-Out:</span>{' '}
                  {selectedEnquiry.checkOut || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Days:</span>{' '}
                  {selectedEnquiry.day || '0'}
                </p>
                <p>
                  <span className="font-medium">PAX:</span>{' '}
                  {selectedEnquiry.pax || '0'}
                </p>
                <p>
                  <span className="font-medium">Double Bed:</span>{' '}
                  {selectedEnquiry.roomName?.doubleBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Triple Bed:</span>{' '}
                  {selectedEnquiry.roomName?.tripleBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Four Bed:</span>{' '}
                  {selectedEnquiry.roomName?.fourBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Extra Bed:</span>{' '}
                  {selectedEnquiry.roomName?.extraBed || '0'}
                </p>
                <p>
                  <span className="font-medium">Kitchen:</span>{' '}
                  {selectedEnquiry.roomName?.kitchen || '0'}
                </p>
                <p>
                  <span className="font-medium">Bill Amount:</span>{' '}
                  <span className="text-blue-400">
                    ₹{selectedEnquiry.billAmount?.toLocaleString() || '0'}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`badge badge-${(selectedEnquiry.status || '').toLowerCase().replace(' ', '-')}`}
                  >
                    {selectedEnquiry.status || 'N/A'}
                  </span>
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-medium hover:shadow-[0_0_15px_var(--glow-color)] transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyEnquiryDetails}
                >
                  <FiCopy size={14} /> Copy
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--text-primary)] rounded-xl neumorphic-button font-medium hover:shadow-[0_0_15px_var(--glow-color)] transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEnquiryDetailModalOpen(false)}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default Dashboard;
