import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit3, FiEye, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getBookingDrawer, updateBooking } from '../../services/ApiService';
import DrawerEditForm from './DrawerEditForm';
import { useQueryClient } from '@tanstack/react-query';

interface DrawerEditProps {
  isOpen: boolean;
  onClose: () => void;
  bookingIdentifier: {
    guestName: string;
    hotelName: string;
    checkIn: string;
    sheetName?: string;
  };
  onUpdateSuccess?: (updatedData: any) => void;
}

const DrawerEdit: React.FC<DrawerEditProps> = ({
  isOpen,
  onClose,
  bookingIdentifier,
  onUpdateSuccess,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

const fetchBooking = useCallback(async () => {
  if (!isOpen) return;
  setLoading(true);
  setError(null);
  console.log('%c[DrawerEdit] FETCHING...', 'color: orange', bookingIdentifier); // ← ADD

  try {
    const response = await getBookingDrawer(bookingIdentifier);
    console.log('%c[DrawerEdit] API RESPONSE:', 'color: green', response); // ← ADD

    if (response.error) throw new Error(response.error);
    setBookingData(response.data);
  } catch (err: any) {
    const msg = err.message || 'Failed to load booking';
    console.error('%c[DrawerEdit] ERROR:', 'color: red', err?.message || err); // ← ADD     
    setError(msg);
    toast.error(msg);
  } finally {
    setLoading(false);
  }
}, [isOpen, bookingIdentifier]);

  useEffect(() => {
    if (isOpen) {
      fetchBooking();
      setIsEditMode(false);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, fetchBooking]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Discard them?');
      if (!confirm) return;
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSave = async (formData: any) => {
    setLoading(true);
    try {
      const payload = {
        ...bookingIdentifier,
        ...formData,
      };
      const response = await updateBooking(payload);
      if (response.error) throw new Error(response.error);

      // Optimistic update
      const updated = { ...bookingData, ...formData };
      setBookingData(updated);
      onUpdateSuccess?.(updated);

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['hossBookings'] });

      toast.success('Booking updated successfully');
      setIsEditMode(false);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--card-bg)] shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FiEye className="text-[var(--icon-bg-blue)]" />
                Booking Details
              </h2>
              <div className="flex gap-2">
                {!isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-2 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--card-bg)] transition"
                    title="Edit"
                  >
                    <FiEdit3 className="w-5 h-5 text-[var(--icon-bg-blue)]" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-[var(--hover-bg)] hover:bg-red-500/20 transition"
                >
                  <FiX className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--icon-bg-blue)]"></div>
                  <p className="mt-4 text-[var(--text-secondary)]">Loading booking...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                  <FiAlertCircle className="text-red-500" />
                  <div>
                    <p className="font-medium text-red-400">Error</p>
                    <p className="text-sm text-red-300">{error}</p>
                    <button
                      onClick={fetchBooking}
                      className="mt-2 text-sm underline text-[var(--icon-bg-blue)] hover:text-blue-400"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {bookingData && !loading && (
                <>
                  {/* Read-only View */}
                  {!isEditMode ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard label="Guest Name" value={bookingData.guestName} />
                        <InfoCard label="Hotel" value={bookingData.hotel} />
                        <InfoCard label="Check-In" value={bookingData.checkIn} />
                        <InfoCard label="Check-Out" value={bookingData.checkOut} />
                        <InfoCard label="Duration" value={`${bookingData.day} days`} />
                        <InfoCard label="PAX" value={bookingData.pax} />
                        <InfoCard label="Plan" value={bookingData.plan || '—'} />
                        <InfoCard label="Status" value={<StatusBadge status={bookingData.status} />} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Room Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(bookingData.roomName || {}).map(([key, value]) => (
                            Number(value) > 0 && (
                              <RoomItem
                                key={key}
                                type={key}
                                count={value as number}
                                rate={bookingData.roomRent?.[key]}
                                discount={bookingData.discount?.[key]}
                              />
                            )
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Financial Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <InfoCard label="Total Bill" value={`₹${Number(bookingData.billAmount || 0).toLocaleString()}`} highlight />
                          <InfoCard label="Advance" value={`₹${Number(bookingData.advance || 0).toLocaleString()}`} className="text-emerald-400" />
                          <InfoCard label="Due" value={`₹${Number(bookingData.due || 0).toLocaleString()}`} className="text-rose-400" />
                          <InfoCard label="Cash-In" value={`₹${Number(bookingData.cashIn || 0).toLocaleString()}`} className="text-teal-400" />
                          <InfoCard label="Cash-Out" value={`₹${Number(bookingData.cashOut || 0).toLocaleString()}`} className="text-orange-400" />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Payment Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCard label="Mode" value={bookingData.modeOfPayment || '—'} />
                          <InfoCard label="To Account" value={bookingData.toAccount || '—'} />
                          <InfoCard label="Scheme" value={bookingData.scheme || '—'} />
                          <InfoCard label="Date Booked" value={bookingData.dateBooked || bookingData.date || '—'} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DrawerEditForm
                      data={bookingData}
                      onSave={handleSave}
                      onCancel={() => {
                        setIsEditMode(false);
                        setHasUnsavedChanges(false);
                      }}
                      isSaving={loading}
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper Components
const InfoCard = ({ label, value, highlight, className }: any) => (
  <div className="bg-[var(--hover-bg)] p-3 rounded-lg border border-[var(--border-color)]">
    <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    <p className={`font-semibold text-[var(--text-primary)] ${highlight ? 'text-2xl' : ''} ${className || ''}`}>
      {value}
    </p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}>
    {status}
  </span>
);

const RoomItem = ({ type, count, rate, discount }: any) => (
  <div className="bg-[var(--hover-bg)] p-3 rounded-lg border border-[var(--border-color)] text-sm">
    <p className="font-medium capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</p>
    <p className="text-[var(--text-secondary)]">
      {count} × ₹{Number(rate || 0).toLocaleString()}
      {Number(discount || 0) > 0 && <span className="text-rose-400"> (-₹{Number(discount).toLocaleString()})</span>}
    </p>
  </div>
);

export default DrawerEdit;