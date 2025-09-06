import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { submitBooking, fetchHotels, submitData } from '../services/ApiService';
import { BookingFormData } from '../types';
import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiCopy,
  FiXCircle,
  FiRefreshCw,
  FiEdit,
} from 'react-icons/fi';
import { IoCalculator } from 'react-icons/io5';
import { FaBed } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Helper function to format date as DD-MM-YYYY
const formatDateToDDMMYYYY = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to parse DD-MM-YYYY to Date
const parseDDMMYYYYToDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const bookingSchema = z
  .object({
    dateBooked: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date Booked must be in DD-MM-YYYY format'),
    guestName: z.string().min(1, 'Guest Name is required'),
    contact: z.string().optional().default(''),
    plan: z.enum(['MAP', 'EP']),
    hotel: z.string().min(1, 'Hotel is required'),
    customHotel: z.string().optional().default(''),
    checkIn: z
      .string()
      .regex(
        /^\d{2}-\d{2}-\d{4}$/,
        'Check-In date must be in DD-MM-YYYY format'
      ),
    checkOut: z
      .string()
      .regex(
        /^\d{2}-\d{2}-\d{4}$/,
        'Check-Out date must be in DD-MM-YYYY format'
      ),
    pax: z.string().optional().default(''),
    db: z.string().optional().default(''),
    tb: z.string().optional().default(''),
    fb: z.string().optional().default(''),
    extra: z.string().optional().default(''),
    kitchen: z.string().optional().default(''),
    dbRate: z.string().optional().default(''),
    tbRate: z.string().optional().default(''),
    fbRate: z.string().optional().default(''),
    extraRate: z.string().optional().default(''),
    kitchenRate: z.string().optional().default(''),
    dbDiscount: z.string().optional().default(''),
    tbDiscount: z.string().optional().default(''),
    fbDiscount: z.string().optional().default(''),
    extraDiscount: z.string().optional().default(''),
    kitchenDiscount: z.string().optional().default(''),
    advance: z.string().optional().default(''),
    paymentMethod: z.enum(['Pending', 'cash', 'Hold', 'Online']),
    status: z.enum(['Confirmed', 'Hold', 'Cancelled', 'cash']),
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        const [checkInDay, checkInMonth, checkInYear] = data.checkIn
          .split('-')
          .map(Number);
        const [checkOutDay, checkOutMonth, checkOutYear] = data.checkOut
          .split('-')
          .map(Number);
        const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
        const checkOutDate = new Date(
          checkOutYear,
          checkOutMonth - 1,
          checkOutDay
        );
        return checkOutDate > checkInDate;
      }
      return true;
    },
    {
      message: 'Check-Out must be after Check-In',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      if (data.hotel === 'Other' && !data.customHotel) {
        return false;
      }
      return true;
    },
    {
      message: "Custom hotel name is required when 'Other' is selected",
      path: ['customHotel'],
    }
  );

type FormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  onBookingSuccess: () => void;
  
}

const BookingForm: React.FC<BookingFormProps> = ({ onBookingSuccess }) => {
  const [useCustomHotel, setUseCustomHotel] = useState(false);
  const [calculated, setCalculated] = useState({
    days: '0',
    bill: '0.00',
    due: '0.00',
  });
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
    defaultValues: {
      dateBooked: formatDateToDDMMYYYY(new Date()),
      guestName: '',
      contact: '',
      plan: 'MAP',
      hotel: '',
      checkIn: '',
      checkOut: '',
      pax: '',
      db: '',
      tb: '',
      fb: '',
      extra: '',
      kitchen: '',
      dbRate: '',
      tbRate: '',
      fbRate: '',
      extraRate: '',
      kitchenRate: '',
      dbDiscount: '',
      tbDiscount: '',
      fbDiscount: '',
      extraDiscount: '',
      kitchenDiscount: '',
      advance: '',
      paymentMethod: 'Pending',
      status: 'Confirmed',
    },
  });

  // Debug form state
  useEffect(() => {
    console.log('Is form valid?', isValid);
    console.log('Form errors:', errors);
  }, [isValid, errors]);

  const { data: hotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: fetchHotels,
  });

  const mutation = useMutation({
    mutationFn: submitBooking,
    onSuccess: (data) => {
      console.log('Mutation success:', data);
      if (data.success) {
        toast.success(
          'Booking submitted successfully! Data synced with Excel.'
        );
        reset();
        setUseCustomHotel(false);
        setCalculated({ days: '0', bill: '0.00', due: '0.00' });
        onBookingSuccess(); // Call the prop to notify parent component
      } else {
        toast.error(data.error || 'Failed to submit booking.');
      }
    },
    onError: (error) => {
      console.log('Mutation error:', error);
      toast.error('Failed to submit booking. Please try again.');
    },
  });

  const refreshMutation = useMutation({
    mutationFn: submitData,
    onSuccess: (data) => {
      console.log('Refresh success:', data);
      toast.success('Data refreshed successfully!');
    },
    onError: (error) => {
      console.log('Refresh error:', error);
      toast.error('Failed to refresh data. Please try again.');
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const calculateDays = useCallback((data: FormData): string => {
    if (data.checkIn && data.checkOut) {
      const [checkInDay, checkInMonth, checkInYear] = data.checkIn
        .split('-')
        .map(Number);
      const [checkOutDay, checkOutMonth, checkOutYear] = data.checkOut
        .split('-')
        .map(Number);
      const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
      const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
      const days =
        checkOut > checkIn
          ? Math.ceil(
              (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;
      return days.toString();
    }
    return '0';
  }, []);

  const calculateBill = useCallback(
    (data: FormData): string => {
      const days = parseInt(calculateDays(data));
      const total =
        days *
        (parseFloat(data.db || '0') *
          parseFloat(data.dbRate || '0') *
          (1 - parseFloat(data.dbDiscount || '0') / 100) +
          parseFloat(data.tb || '0') *
            parseFloat(data.tbRate || '0') *
            (1 - parseFloat(data.tbDiscount || '0') / 100) +
          parseFloat(data.fb || '0') *
            parseFloat(data.fbRate || '0') *
            (1 - parseFloat(data.fbDiscount || '0') / 100) +
          parseFloat(data.extra || '0') *
            parseFloat(data.extraRate || '0') *
            (1 - parseFloat(data.extraDiscount || '0') / 100) +
          parseFloat(data.kitchen || '0') *
            parseFloat(data.kitchenRate || '0') *
            (1 - parseFloat(data.kitchenDiscount || '0') / 100));
      return isNaN(total) ? '0.00' : total.toFixed(2);
    },
    [calculateDays]
  );

  const dueAmount = useCallback(
    (data: FormData): string => {
      const bill = parseFloat(calculateBill(data));
      const advance = parseFloat(data.advance || '0');
      return (bill - advance).toFixed(2);
    },
    [calculateBill]
  );

  const handleCalculate = () => {
    const data = getValues();
    if (!data.checkIn || !data.checkOut) {
      toast.error('Please provide Check-In and Check-Out dates.');
      return;
    }
    const hasRoom = data.db || data.tb || data.fb || data.extra || data.kitchen;
    const hasRate =
      (data.db && data.dbRate) ||
      (data.tb && data.tbRate) ||
      (data.fb && data.fbRate) ||
      (data.extra && data.extraRate) ||
      (data.kitchen && data.kitchenRate);
    if (!hasRoom || !hasRate) {
      toast.error('Please specify at least one room quantity and its rate.');
      return;
    }

    setCalculated({
      days: calculateDays(data),
      bill: calculateBill(data),
      due: dueAmount(data),
    });
    toast.info('Amounts calculated successfully!');
  };

  const handleCopyDetails = () => {
    const data = getValues();
    if (!data.guestName || !data.checkIn || !data.checkOut || !data.hotel) {
      toast.error('Please fill in Guest Name, Check-In, Check-Out, and Hotel.');
      return;
    }
    if (data.hotel === 'Other' && !data.customHotel) {
      toast.error('Please provide a Custom Hotel Name.');
      return;
    }

    const hotelName = data.hotel === 'Other' ? data.customHotel : data.hotel;
    const details = `
Guest Name: ${data.guestName}
Contact: ${data.contact || 'N/A'}
Hotel: ${hotelName || 'N/A'}
Check-In: ${data.checkIn}
Check-Out: ${data.checkOut}
Plan: ${data.plan}
PAX: ${data.pax || 'N/A'}
Status: ${data.status}
Total Bill: ₹${calculated.bill}
Due Amount: ₹${calculated.due}
    `.trim();
    navigator.clipboard
      .writeText(details)
      .then(() => {
        toast.success('Guest details copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy details.');
      });
  };

  const handleClearForm = () => {
    setShowClearDialog(true);
  };

  const confirmClearForm = () => {
    reset({
      dateBooked: formatDateToDDMMYYYY(new Date()),
      guestName: '',
      contact: '',
      plan: 'MAP',
      hotel: '',
      customHotel: '',
      checkIn: '',
      checkOut: '',
      pax: '',
      db: '',
      tb: '',
      fb: '',
      extra: '',
      kitchen: '',
      dbRate: '',
      tbRate: '',
      fbRate: '',
      extraRate: '',
      kitchenRate: '',
      dbDiscount: '',
      tbDiscount: '',
      fbDiscount: '',
      extraDiscount: '',
      kitchenDiscount: '',
      advance: '',
      paymentMethod: 'Pending',
      status: 'Confirmed',
    });
    setUseCustomHotel(false);
    setCalculated({ days: '0', bill: '0.00', due: '0.00' });
    setShowClearDialog(false);
    toast.info('Form cleared successfully!');
  };

  const onSubmit = async (data: FormData) => {
    const isFormValid = await trigger();
    if (!isFormValid) {
      console.log('Validation errors:', errors);
      toast.error('Please fix all validation errors before submitting.');
      return;
    }
    setFormDataToSubmit(data);
    setShowSubmitDialog(true);
  };

  const confirmSubmit = ()=> {
    if (!formDataToSubmit) return;

    // Convert DD-MM-YYYY to YYYY-MM-DD for backend compatibility
    const convertToBackendDateFormat = (date: string): string => {
      const [day, month, year] = date.split('-').map(Number);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const data = formDataToSubmit;
    const hotelName = data.hotel === 'Other' ? data.customHotel! : data.hotel;
    const bookingData: BookingFormData = {
      dateBooked: convertToBackendDateFormat(data.dateBooked),
      guestName: data.guestName,
      contact: data.contact || '',
      plan: data.plan,
      hotelName: hotelName,
      checkIn: convertToBackendDateFormat(data.checkIn),
      checkOut: convertToBackendDateFormat(data.checkOut),
      pax: data.pax || '',
      status: data.status,
      totalBill: parseFloat(calculated.bill),
      guests: parseInt(data.pax || '0'),
      db: data.db || '',
      tb: data.tb || '',
      fb: data.fb || '',
      extraBed: data.extra || '',
      kitchen: data.kitchen || '',
      dbRate: data.dbRate || '',
      tbRate: data.tbRate || '',
      fbRate: data.fbRate || '',
      extraRate: data.extraRate || '',
      kitchenRate: data.kitchenRate || '',
      dbDiscount: data.dbDiscount || '',
      tbDiscount: data.tbDiscount || '',
      fbDiscount: data.fbDiscount || '',
      extraDiscount: data.extraDiscount || '',
      kitchenDiscount: data.kitchenDiscount || '',
      advance: data.advance || '',
      cashIn: data.advance || '',
      paymentMethod: data.paymentMethod,
      action: 'submitBooking',
    };

    mutation.mutate(bookingData);
    setShowSubmitDialog(false);
    setFormDataToSubmit(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-6 w-full"
    >
      {/* Clear Confirmation Dialog */}
      <AnimatePresence>
        {showClearDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                animation: 'dialogPulse',
              }}
              className="booking-form-dialog"
            >
              <div className={`booking-form-dialog-content ${isValid ? "valid" : "invalid"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <FiXCircle className="text-red-500" size={24} />
                  <h3 className="text-lg font-semibold">Clear Form?</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  Are you sure you want to clear all the fields? This action
                  cannot be undone.
                </p>
                <div className="booking-form-dialog-buttons">
                  <motion.button
                    onClick={() => setShowClearDialog(false)}
                    className="booking-form-dialog-button-cancel"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmClearForm}
                    className="booking-form-dialog-button-confirm clear"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Dialog */}
      <AnimatePresence>
        {showSubmitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                animation: 'dialogPulse',
              }}
              className="booking-form-dialog"
            >
              <div className="booking-form-dialog-content">
                <div className="flex items-center gap-3 mb-4">
                  <FiCheckCircle className="text-green-500" size={24} />
                  <h3 className="text-lg font-semibold">Submit Booking?</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  Are you sure you want to submit this booking? Please review
                  all details before proceeding.
                </p>
                <div className="booking-form-dialog-buttons">
                  <motion.button
                    onClick={() => setShowSubmitDialog(false)}
                    className="booking-form-dialog-button-cancel"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmSubmit}
                    className="booking-form-dialog-button-confirm submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Submit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-20 py-3 px-4 mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
          <FiEdit size={28} className="text-indigo-500" />
          Add Booking Details
        </h2>
        <div className="mt-2 h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Seamlessly create and sync bookings with Excel
        </p>
      </motion.header>

      <AnimatePresence>
        {mutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-100 text-red-600 rounded-xl mb-6 neumorphic-card"
          >
            Failed to submit booking. Please try again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-100 text-red-600 rounded-xl mb-6 neumorphic-card"
        >
          <p>Please fix the following errors:</p>
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error?.message}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass-card p-6 md:p-8 rounded-2xl neumorphic-card border border-[var(--border-color)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Guest Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
              <div className="p-2 rounded-lg bg-[var(--icon-bg-indigo)] text-white">
                <FiUser size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Guest Information
              </h3>
            </div>

            {[
              {
                label: 'Date Booked (DD-MM-YYYY)',
                name: 'dateBooked',
                type: 'datePicker',
                required: true,
                icon: <FiCalendar />,
              },
              {
                label: 'Guest Name',
                name: 'guestName',
                type: 'text',
                required: true,
                icon: <FiUser />,
              },
              {
                label: 'Contact',
                name: 'contact',
                type: 'text',
                icon: <FiUser />,
              },
              {
                label: 'Plan',
                name: 'plan',
                type: 'select',
                options: ['MAP', 'EP'],
                icon: <FiCheckCircle />,
              },
              {
                label: 'Hotel',
                name: 'hotel',
                type: 'select',
                options: hotelsLoading
                  ? ['Loading...']
                  : [...(hotels || []), 'Other'],
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                  console.log('Selected hotel:', e.target.value);
                  setUseCustomHotel(e.target.value === 'Other');
                  setValue('hotel', e.target.value, { shouldValidate: true });
                  if (e.target.value !== 'Other') {
                    setValue('customHotel', '', { shouldValidate: true });
                  }
                },
                icon: <FaBed />,
              },
              ...(useCustomHotel
                ? [
                    {
                      label: 'Custom Hotel Name',
                      name: 'customHotel',
                      type: 'text',
                      required: true,
                      icon: <FaBed />,
                    },
                  ]
                : []),
              {
                label: 'Check-In (DD-MM-YYYY)',
                name: 'checkIn',
                type: 'datePicker',
                required: true,
                icon: <FiCalendar />,
              },
              {
                label: 'Check-Out (DD-MM-YYYY)',
                name: 'checkOut',
                type: 'datePicker',
                required: true,
                icon: <FiCalendar />,
              },
              {
                label: 'PAX (Guests)',
                name: 'pax',
                type: 'number',
                min: '0',
                icon: <FiUser />,
              },
              {
                label: 'Status',
                name: 'status',
                type: 'select',
                options: ['Confirmed', 'Hold', 'Cancelled', 'cash'],
                icon: <FiCheckCircle />,
              },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="space-y-1"
              >
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  {field.label}{' '}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                    {field.icon}
                  </div>
                  {field.type === 'select' ? (
                    <select
                      id={field.name}
                      {...register(field.name as keyof FormData)}
                      className="input-field rounded-lg neumorphic-input w-full"
                      aria-label={field.label}
                      onChange={(e) => {
                        setValue(field.name as keyof FormData, e.target.value, {
                          shouldValidate: true,
                        });
                        if (field.onChange) field.onChange(e);
                      }}
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'datePicker' ? (
                    <DatePicker
                      id={field.name}
                      selected={parseDDMMYYYYToDate(
                        getValues(field.name as keyof FormData)
                      )}
                      onChange={(date: Date | null) => {
                        setValue(
                          field.name as keyof FormData,
                          formatDateToDDMMYYYY(date),
                          { shouldValidate: true }
                        );
                      }}
                      dateFormat="dd-MM-yyyy"
                      className="input-field rounded-lg neumorphic-input w-full"
                      placeholderText="DD-MM-YYYY"
                      required={field.required}
                      aria-label={field.label}
                    />
                  ) : (
                    <input
                      id={field.name}
                      type={field.type}
                      {...register(field.name as keyof FormData)}
                      className="input-field rounded-lg neumorphic-input w-full"
                      min={field.min}
                      required={field.required}
                      aria-label={field.label}
                    />
                  )}
                </div>

                <AnimatePresence>
                  {errors[field.name as keyof typeof errors] && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-red-500 text-xs"
                    >
                      {
                        errors[field.name as keyof typeof errors]
                          ?.message as string
                      }
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Room & Billing Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
              <div className="p-2 rounded-lg bg-[var(--icon-bg-green)] text-white">
                <FaBed size={20} />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Room & Billing Details
              </h3>
            </div>

            {/* Room Quantities */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Room Quantities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Quantity of Double Bed (DB)',
                    name: 'db',
                    type: 'number',
                    min: '0',
                    icon: <FaBed />,
                  },
                  {
                    label: 'Quantity of Triple Bed (TB)',
                    name: 'tb',
                    type: 'number',
                    min: '0',
                    icon: <FaBed />,
                  },
                  {
                    label: 'Quantity of Four Bed (FB)',
                    name: 'fb',
                    type: 'number',
                    min: '0',
                    icon: <FaBed />,
                  },
                  {
                    label: 'Quantity of Extra Bed',
                    name: 'extra',
                    type: 'number',
                    min: '0',
                    icon: <FaBed />,
                  },
                  {
                    label: 'Quantity of Kitchen',
                    name: 'kitchen',
                    type: 'number',
                    min: '0',
                    icon: <FaBed />,
                  },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="space-y-1"
                  >
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                        {field.icon}
                      </div>
                      <input
                        id={field.name}
                        type={field.type}
                        {...register(field.name as keyof FormData)}
                        className="input-field rounded-lg neumorphic-input w-full"
                        min={field.min}
                        aria-label={field.label}
                      />
                    </div>
                    <AnimatePresence>
                      {errors[field.name as keyof typeof errors] && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-500 text-xs"
                        >
                          {
                            errors[field.name as keyof typeof errors]
                              ?.message as string
                          }
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Room Rates */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Room Rates (₹)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Double Bed Rate (₹)',
                    name: 'dbRate',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Triple Bed Rate (₹)',
                    name: 'tbRate',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Four Bed Rate (₹)',
                    name: 'fbRate',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Extra Bed Rate (₹)',
                    name: 'extraRate',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Kitchen Rate (₹)',
                    name: 'kitchenRate',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="space-y-1"
                  >
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                        {field.icon}
                      </div>
                      <input
                        id={field.name}
                        type={field.type}
                        {...register(field.name as keyof FormData)}
                        className="input-field rounded-lg neumorphic-input w-full"
                        step={field.step}
                        min={field.min}
                        aria-label={field.label}
                      />
                    </div>
                    <AnimatePresence>
                      {errors[field.name as keyof typeof errors] && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-500 text-xs"
                        >
                          {
                            errors[field.name as keyof typeof errors]
                              ?.message as string
                          }
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Discounts */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Discounts (%)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Double Bed Discount (%)',
                    name: 'dbDiscount',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Triple Bed Discount (%)',
                    name: 'tbDiscount',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Four Bed Discount (%)',
                    name: 'fbDiscount',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Extra Bed Discount (%)',
                    name: 'extraDiscount',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Kitchen Discount (%)',
                    name: 'kitchenDiscount',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="space-y-1"
                  >
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                        {field.icon}
                      </div>
                      <input
                        id={field.name}
                        type={field.type}
                        {...register(field.name as keyof FormData)}
                        className="input-field rounded-lg neumorphic-input w-full"
                        step={field.step}
                        min={field.min}
                        aria-label={field.label}
                      />
                    </div>
                    <AnimatePresence>
                      {errors[field.name as keyof typeof errors] && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-500 text-xs"
                        >
                          {
                            errors[field.name as keyof typeof errors]
                              ?.message as string
                          }
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                Payment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Advance (₹)',
                    name: 'advance',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    icon: <FiCreditCard />,
                  },
                  {
                    label: 'Payment Method',
                    name: 'paymentMethod',
                    type: 'select',
                    options: ['Pending', 'cash', 'Hold', 'Online'],
                    icon: <FiCreditCard />,
                  },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="space-y-1"
                  >
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                        {field.icon}
                      </div>
                      {field.type === 'select' ? (
                        <select
                          id={field.name}
                          {...register(field.name as keyof FormData)}
                          className="input-field rounded-lg neumorphic-input w-full"
                          aria-label={field.label}
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={field.name}
                          type={field.type}
                          {...register(field.name as keyof FormData)}
                          className="input-field rounded-lg neumorphic-input w-full"
                          step={field.step}
                          min={field.min}
                          aria-label={field.label}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {errors[field.name as keyof typeof errors] && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-500 text-xs"
                        >
                          {
                            errors[field.name as keyof typeof errors]
                              ?.message as string
                          }
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Calculate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <motion.button
            type="button"
            onClick={handleCalculate}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--icon-bg-indigo)] text-[var(--text-primary)] rounded-xl neumorphic-card font-semibold hover:bg-gradient-to-r hover:from-[var(--icon-bg-indigo)] hover:to-[var(--icon-bg-purple)] hover:shadow-[0_0_10px_var(--glow-color)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <IoCalculator size={20} />
            </motion.span>
            Calculate Amount
          </motion.button>
        </motion.div>

        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-[var(--card-bg)] rounded-xl neumorphic-card border border-[var(--glow-color)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--icon-bg-purple)] text-white">
              <FiCheckCircle size={20} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Booking Summary
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Days',
                value: calculated.days,
                icon: <FiCalendar />,
                color: 'bg-[var(--icon-bg-indigo)]',
              },
              {
                label: 'Total Bill',
                value: `₹${calculated.bill}`,
                icon: <FiCreditCard />,
                color: 'bg-[var(--icon-bg-green)]',
              },
              {
                label: 'Due Amount',
                value: `₹${calculated.due}`,
                icon: <FiCreditCard />,
                color: 'bg-[var(--icon-bg-yellow)]',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-4 rounded-xl neumorphic-card hover:bg-[var(--sidebar-hover)] border border-[var(--border-color)]"
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {item.label}
                    </p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {item.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Details Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Room Details
              </h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">DB:</span>{' '}
                  {getValues('db') || '0'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">TB:</span>{' '}
                  {getValues('tb') || '0'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">FB:</span>{' '}
                  {getValues('fb') || '0'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Payment Details
              </h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Advance:</span> ₹
                  {getValues('advance') || '0'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Due:</span> ₹{calculated.due}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Method:</span>{' '}
                  {getValues('paymentMethod')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Stay Details
              </h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Check-In:</span>{' '}
                  {getValues('checkIn') || '-'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Check-Out:</span>{' '}
                  {getValues('checkOut') || '-'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Days:</span> {calculated.days}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit, Copy, Clear, and Refresh Buttons */}
        <div className="mt-8 booking-form-buttons flex flex-col sm:flex-row justify-end gap-4">
          <motion.button
            type="button"
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--icon-bg-teal)] text-[var(--text-primary)] rounded-xl neumorphic-card font-semibold hover:bg-gradient-to-r hover:from-[var(--icon-bg-teal)] hover:to-[var(--icon-bg-blue)] hover:shadow-[0_0_10px_var(--glow-color)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: 360 }}
            transition={{ rotate: { duration: 0.5 } }}
          >
            <motion.span
              animate={{ rotate: refreshMutation.isPending ? 360 : 0 }}
              transition={{
                repeat: refreshMutation.isPending ? Infinity : 0,
                duration: 1,
              }}
            >
              <FiRefreshCw size={20} />
            </motion.span>
            Refresh
          </motion.button>

          <motion.button
            type="button"
            onClick={handleCopyDetails}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--icon-bg-blue)] text-[var(--text-primary)] rounded-xl neumorphic-card font-semibold hover:bg-gradient-to-r hover:from-[var(--icon-bg-blue)] hover:to-[var(--icon-bg-indigo)] hover:shadow-[0_0_10px_var(--glow-color)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiCopy size={20} />
            Copy Details
          </motion.button>

          <motion.button
            type="button"
            onClick={handleClearForm}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-[var(--text-primary)] rounded-xl neumorphic-card font-semibold hover:bg-gradient-to-r hover:from-red-500 hover:to-red-700 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiXCircle size={20} />
            Clear Form
          </motion.button>

          <motion.button
            type="submit"
            disabled={mutation.isPending}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl neumorphic-card font-semibold transition-all duration-300 ${
              mutation.isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[var(--icon-bg-green)] text-[var(--text-primary)] hover:bg-gradient-to-r hover:from-[var(--icon-bg-green)] hover:to-[var(--icon-bg-teal)] hover:shadow-[0_0_10px_var(--glow-color)]'
            }`}
            whileHover={{ scale: mutation.isPending ? 1 : 1.05 }}
            whileTap={{ scale: mutation.isPending ? 1 : 0.95 }}
          >
            <FiCheckCircle size={20} />
            {mutation.isPending ? 'Submitting...' : 'Submit Booking'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default BookingForm;