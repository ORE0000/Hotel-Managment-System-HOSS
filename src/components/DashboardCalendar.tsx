import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { BookingDetail } from '../types';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface DashboardCalendarProps {
  viewMode: 'month' | 'week' | 'day';
  searchQuery: string;
  filters: { status: string; startDate: string; endDate: string };
  bookings?: BookingDetail[];
  isLoading: boolean;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ viewMode, searchQuery, filters, bookings = [], isLoading }) => {
  // Map viewMode to FullCalendar view
  const calendarView = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      default:
        return 'dayGridMonth';
    }
  }, [viewMode]);

  // Filter bookings based on searchQuery and filters
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = searchQuery
        ? booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.hotel.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus = filters.status ? booking.status === filters.status : true;
      const matchesDate =
        filters.startDate && filters.endDate
          ? new Date(booking.checkIn) >= new Date(filters.startDate) &&
            new Date(booking.checkOut) <= new Date(filters.endDate)
          : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchQuery, filters]);

  // Transform bookings into FullCalendar events
  const events = useMemo(() => {
    return filteredBookings.map((booking) => ({
      title: `${booking.guestName} (${booking.plan})`,
      start: booking.checkIn,
      end: booking.checkOut,
      backgroundColor:
        booking.status === 'Confirmed'
          ? 'var(--event-confirmed-bg)'
          : booking.status === 'Pending'
          ? 'var(--event-pending-bg)'
          : booking.status === 'Cancelled'
          ? 'var(--event-cancelled-bg)'
          : booking.status === 'Hold'
          ? 'var(--event-hold-bg)'
          : booking.status === 'Waitlist'
          ? 'var(--event-waitlist-bg)'
          : booking.status === 'No Show'
          ? 'var(--event-no-show-bg)'
          : booking.status === 'Checked Out'
          ? 'var(--event-checked-out-bg)'
          : 'var(--event-default-bg)',
      borderColor:
        booking.status === 'Confirmed'
          ? 'var(--event-confirmed-border)'
          : booking.status === 'Pending'
          ? 'var(--event-pending-border)'
          : booking.status === 'Cancelled'
          ? 'var(--event-cancelled-border)'
          : booking.status === 'Hold'
          ? 'var(--event-hold-border)'
          : booking.status === 'Waitlist'
          ? 'var(--event-waitlist-border)'
          : booking.status === 'No Show'
          ? 'var(--event-no-show-border)'
          : booking.status === 'Checked Out'
          ? 'var(--event-checked-out-border)'
          : 'var(--event-default-border)',
      textColor: document.documentElement.dataset.theme === 'light' ? '#0f172a' : '#ffffff',
      extendedProps: { ...booking },
    }));
  }, [filteredBookings]);

  // Handle event click to show booking details
  const handleEventClick = ({ event }: any) => {
    const booking = event.extendedProps;
    toast.info(
      <div className="space-y-1">
        <h4 className="font-semibold text-[var(--text-primary)]">Booking Details</h4>
        <p><strong>Guest:</strong> {booking.guestName}</p>
        <p><strong>Plan:</strong> {booking.plan}</p>
        <p><strong>Rooms:</strong> {booking.noOfRooms || 'N/A'}</p>
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Check-in:</strong> {format(new Date(booking.checkIn), 'PPP')}</p>
        <p><strong>Check-out:</strong> {format(new Date(booking.checkOut), 'PPP')}</p>
        <p><strong>Hotel:</strong> {booking.hotel || 'N/A'}</p>
      </div>,
      { autoClose: 5000, className: 'glass-card neumorphic-card' }
    );
  };

  // Loading skeleton for calendar
  const CalendarSkeleton = () => (
    <motion.div
      className="calendar-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-lg w-3/4 mx-auto"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-6 rounded w-full"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card p-4 rounded-xl neumorphic-card relative overflow-hidden"
    >
      <AnimatePresence>
        {isLoading ? (
          <CalendarSkeleton key="skeleton" />
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView={calendarView}
              events={events}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              eventClick={handleEventClick}
              eventDidMount={(info) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.innerHTML = `
                  <div class="font-semibold">${info.event.title}</div>
                  <div class="text-sm">Status: ${info.event.extendedProps.status}</div>
                  <div class="text-sm">Check-in: ${format(new Date(info.event.start!), 'PPP')}</div>
                  <div class="text-sm">Check-out: ${format(new Date(info.event.end!), 'PPP')}</div>
                `;
                info.el.setAttribute('data-tooltip', '');
                const showTooltip = (e: Event) => {
                  tooltip.classList.add('visible');
                  document.body.appendChild(tooltip);
                  const rect = info.el.getBoundingClientRect();
                  tooltip.style.position = 'absolute';
                  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                  tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                };
                const hideTooltip = () => {
                  tooltip.classList.remove('visible');
                  setTimeout(() => {
                    if (tooltip.parentNode && !tooltip.classList.contains('visible')) {
                      document.body.removeChild(tooltip);
                    }
                  }, 300);
                };
                info.el.addEventListener('mouseenter', showTooltip);
                info.el.addEventListener('mouseleave', hideTooltip);
                info.el.addEventListener('touchstart', (e) => {
                  e.preventDefault();
                  showTooltip(e);
                  setTimeout(hideTooltip, 3000);
                });
                info.el.addEventListener('click', () => {
                  hideTooltip();
                });
              }}
              height="500px"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              dayMaxEvents={3}
              eventDisplay="block"
              eventBorderColor="transparent"
              dayCellClassNames="neumorphic-card"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardCalendar;