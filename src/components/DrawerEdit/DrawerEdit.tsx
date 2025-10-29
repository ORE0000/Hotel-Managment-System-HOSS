// DrawerEdit.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit3, FiX, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import { getBookingDrawer, updateBooking } from "../../services/ApiService";
import DrawerEditForm from "./DrawerEditForm";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  // Ref to call form's close handler
  const formRef = useRef<{
    handleHeaderClose: () => void;
  }>(null);

  const fetchBooking = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getBookingDrawer(bookingIdentifier);
      if (response.error) throw new Error(response.error);
      setBookingData(response.data);
    } catch (err: any) {
      const msg = err.message || "Failed to load booking";
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
    }
  }, [isOpen, fetchBooking]);

  const handleSave = async (formData: any) => {
    setLoading(true);
    try {
      const payload = { ...bookingIdentifier, ...formData };
      const response = await updateBooking(payload);
      if (response.error) throw new Error(response.error);
      const updated = { ...bookingData, ...formData };
      setBookingData(updated);
      onUpdateSuccess?.(updated);
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["hossBookings"] });
      toast.success("Booking updated successfully!");
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderClose = () => {
    if (isEditMode && formRef.current) {
      formRef.current.handleHeaderClose();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* No backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent any accidental close
          >
            <motion.div
              className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl shadow-2xl 
              border border-[var(--border-color)] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[var(--border-color)] px-6 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FiEdit3 className="w-5 h-5 text-white" />
                  </div>
                  Edit Booking
                </h2>
                <button
                  onClick={handleHeaderClose}
                  className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-all duration-200"
                >
                  <FiX className="w-6 h-6 text-[var(--text-secondary)]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                {loading && (
                  <div className="text-center text-[var(--text-secondary)] py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="font-medium">Loading booking details...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 flex items-center gap-3">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!loading && !error && bookingData && !isEditMode && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="text-center max-w-2xl">
                      <div className="mb-4 mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center">
                        <FiAlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-lg text-[var(--text-primary)] leading-relaxed">
                        You're about to edit the booking for{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {bookingData.guestName}
                        </span>{" "}
                        at{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {bookingData.hotel}
                        </span>
                        .
                      </p>
                    </div>

                    <motion.button
                      onClick={() => setIsEditMode(true)}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 
                      text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 
                      flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiEdit3 className="w-5 h-5" />
                      Edit Booking
                    </motion.button>
                  </div>
                )}

                {isEditMode && (
                  <DrawerEditForm
                    ref={formRef}
                    data={bookingData}
                    onSave={handleSave}
                    onCancel={() => setIsEditMode(false)}
                    isSaving={loading}
                    onRequestClose={onClose}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerEdit;