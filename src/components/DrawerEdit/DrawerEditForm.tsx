// DrawerEditForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { FiSave, FiX, FiAlertCircle } from "react-icons/fi";
import { FiUser, FiHome, FiDollarSign, FiBarChart2, FiCreditCard } from "react-icons/fi";
import { toast } from "react-toastify";
import { useState, forwardRef, useImperativeHandle } from "react";

const formSchema = z.object({
  guestName: z.string().optional(),
  contact: z.string().optional(),
  plan: z.string().optional(),
  hotelName: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  pax: z.string().optional(),
  db: z.string().optional(),
  tb: z.string().optional(),
  fb: z.string().optional(),
  extraBed: z.string().optional(),
  kitchen: z.string().optional(),
  dbRate: z.string().optional(),
  tbRate: z.string().optional(),
  fbRate: z.string().optional(),
  extraRate: z.string().optional(),
  kitchenRate: z.string().optional(),
  dbDiscount: z.string().optional(),
  tbDiscount: z.string().optional(),
  fbDiscount: z.string().optional(),
  extraDiscount: z.string().optional(),
  kitchenDiscount: z.string().optional(),
  billAmount: z.string().optional(),
  advance: z.string().optional(),
  due: z.string().optional(),
  paymentMethod: z.string().optional(),
  toAccount: z.string().optional(),
  status: z.enum(["cash", "Cancelled", "HOLD", "Confirm"]).optional(),
  scheme: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DrawerEditFormProps {
  data: any;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  onRequestClose: () => void;
}

const DrawerEditForm = forwardRef<{
  handleHeaderClose: () => void;
}, DrawerEditFormProps>(({ data, onSave, onCancel, isSaving, onRequestClose }, ref) => {
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const normalizeToString = (value: any) =>
    value !== undefined && value !== null ? String(value) : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: normalizeToString(data.guestName),
      contact: normalizeToString(data.contact),
      plan: normalizeToString(data.plan),
      hotelName: normalizeToString(data.hotel),
      checkIn: normalizeToString(data.checkIn),
      checkOut: normalizeToString(data.checkOut),
      pax: normalizeToString(data.pax),
      db: normalizeToString(data.roomName?.doubleBed),
      tb: normalizeToString(data.roomName?.tripleBed),
      fb: normalizeToString(data.roomName?.fourBed),
      extraBed: normalizeToString(data.roomName?.extraBed),
      kitchen: normalizeToString(data.roomName?.kitchen),
      dbRate: normalizeToString(data.roomRent?.doubleBed),
      tbRate: normalizeToString(data.roomRent?.tripleBed),
      fbRate: normalizeToString(data.roomRent?.fourBed),
      extraRate: normalizeToString(data.roomRent?.extraBed),
      kitchenRate: normalizeToString(data.roomRent?.kitchen),
      dbDiscount: normalizeToString(data.discount?.doubleBed),
      tbDiscount: normalizeToString(data.discount?.tripleBed),
      fbDiscount: normalizeToString(data.discount?.fourBed),
      extraDiscount: normalizeToString(data.discount?.extraBed),
      kitchenDiscount: normalizeToString(data.discount?.kitchen),
      billAmount: normalizeToString(data.billAmount),
      advance: normalizeToString(data.advance),
      due: normalizeToString(data.due),
      paymentMethod: normalizeToString(data.modeOfPayment),
      toAccount: normalizeToString(data.toAccount),
      status: (["cash", "Cancelled", "HOLD", "Confirm"].includes(data.status)
        ? (data.status as "cash" | "Cancelled" | "HOLD" | "Confirm")
        : "Confirm") as "cash" | "Cancelled" | "HOLD" | "Confirm",
      scheme: normalizeToString(data.scheme),
    },
  });

  const onSubmit = () => {
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }
    setShowConfirmSave(true);
  };

  const confirmSave = async () => {
    setShowConfirmSave(false);
    const values = getValues();
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "")
    ) as FormData;
    await onSave(cleaned);
  };

  const tryCancel = () => {
    if (isDirty) setShowConfirmDiscard(true);
    else onCancel();
  };

  const confirmDiscard = () => {
    setShowConfirmDiscard(false);
    onCancel();
  };

  useImperativeHandle(ref, () => ({
    handleHeaderClose: () => {
      if (isDirty) {
        setShowConfirmDiscard(true);
      } else {
        onRequestClose();
      }
    },
  }));

  const renderInput = (
    key: keyof FormData,
    label: string,
    type: "text" | "number" | "select" | "date" = "text",
    options?: string[]
  ) => (
    <div key={key} className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      {type === "select" ? (
        <select
          {...register(key)}
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] 
          text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all duration-200 hover:border-blue-400"
        >
          <option value="">Select</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...register(key)}
          type={type}
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] 
          text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all duration-200 hover:border-blue-400"
          placeholder={label}
        />
      )}
      {errors[key] && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 flex items-center gap-1"
        >
          Warning {errors[key]?.message?.toString()}
        </motion.p>
      )}
    </div>
  );

  return (
    <>
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Guest & Booking Information */}
        <Section title="Guest & Booking Information" icon="Person">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("guestName", "Guest Name")}
            {renderInput("contact", "Contact")}
            {renderInput("plan", "Plan")}
            {renderInput("hotelName", "Hotel")}
            {renderInput("checkIn", "Check-In", "date")}
            {renderInput("checkOut", "Check-Out", "date")}
            {renderInput("pax", "PAX", "number")}
          </div>
        </Section>

        {/* Room Configuration */}
        <Section title="Room Configuration" icon="Bed">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {renderInput("db", "Double Bed", "number")}
            {renderInput("tb", "Triple Bed", "number")}
            {renderInput("fb", "Four Bed", "number")}
            {renderInput("extraBed", "Extra Bed", "number")}
            {renderInput("kitchen", "Kitchen", "number")}
          </div>
        </Section>

        {/* Pricing & Discounts */}
        <Section title="Pricing & Discounts" icon="Money">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {renderInput("dbRate", "Double Bed Rate", "number")}
            {renderInput("tbRate", "Triple Bed Rate", "number")}
            {renderInput("fbRate", "Four Bed Rate", "number")}
            {renderInput("extraRate", "Extra Bed Rate", "number")}
            {renderInput("kitchenRate", "Kitchen Rate", "number")}
            {renderInput("dbDiscount", "Double Bed Discount", "number")}
            {renderInput("tbDiscount", "Triple Bed Discount", "number")}
            {renderInput("fbDiscount", "Four Bed Discount", "number")}
            {renderInput("extraDiscount", "Extra Bed Discount", "number")}
            {renderInput("kitchenDiscount", "Kitchen Discount", "number")}
          </div>
        </Section>

        {/* Financial Details */}
        <Section title="Financial Details" icon="Chart">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {renderInput("billAmount", "Bill Amount", "number")}
            {renderInput("advance", "Advance", "number")}
            {renderInput("due", "Due", "number")}
          </div>
        </Section>

        {/* Payment & Status */}
        <Section title="Payment & Status" icon="Credit Card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("paymentMethod", "Payment Method", "select", [
              "Cash",
              "UPI",
              "Bank Transfer",
              "Card",
              "Online",
            ])}
            {renderInput("toAccount", "To Account")}
            {renderInput("status", "Status", "select", [
              "cash",
              "Cancelled",
              "HOLD",
              "Confirm",
            ])}
            {renderInput("scheme", "Scheme")}
          </div>
        </Section>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
          <motion.button
            type="button"
            onClick={tryCancel}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 
            text-gray-700 dark:text-gray-200 font-semibold shadow-md hover:shadow-lg 
            transition-all duration-200 flex items-center gap-2 border border-gray-300 dark:border-gray-600"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSaving}
          >
            <FiX className="w-5 h-5" /> Cancel
          </motion.button>

          <motion.button
            type="submit"
            disabled={isSaving || !isDirty}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 
            text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 
            disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            whileHover={{ scale: isSaving || !isDirty ? 1 : 1.03 }}
            whileTap={{ scale: isSaving || !isDirty ? 1 : 0.98 }}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-5 h-5" /> Save Changes
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Save Confirmation */}
      <AnimatePresence>
        {showConfirmSave && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
            <motion.div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center">
                  <FiAlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Confirm Save</h3>
                <p className="text-[var(--text-secondary)]">Are you sure you want to save these changes?</p>
                <div className="flex gap-3 justify-center pt-2">
                  <motion.button
                    onClick={() => setShowConfirmSave(false)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:shadow-md transition"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >Cancel</motion.button>
                  <motion.button
                    onClick={confirmSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >Yes, Save</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Confirmation */}
      <AnimatePresence>
        {showConfirmDiscard && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
            <motion.div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center">
                  <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Discard Changes?</h3>
                <p className="text-[var(--text-secondary)]">You have unsaved changes. Are you sure you want to leave?</p>
                <div className="flex gap-3 justify-center pt-2">
                  <motion.button
                    onClick={() => setShowConfirmDiscard(false)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:shadow-md transition"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >Stay</motion.button>
                  <motion.button
                    onClick={() => {
                      setShowConfirmDiscard(false);
                      onRequestClose();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium hover:shadow-lg transition"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >Discard</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

DrawerEditForm.displayName = "DrawerEditForm";

const iconMap: Record<string, JSX.Element> = {
  Person: <FiUser className="w-5 h-5 text-blue-500" />,
  Bed: <FiHome className="w-5 h-5 text-blue-500" />,
  Money: <FiDollarSign className="w-5 h-5 text-blue-500" />,
  Chart: <FiBarChart2 className="w-5 h-5 text-blue-500" />,
  "Credit Card": <FiCreditCard className="w-5 h-5 text-blue-500" />,
};

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-800/30 dark:to-blue-900/10 
    rounded-xl p-5 border border-[var(--border-color)]"
  >
    <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-4 flex items-center gap-2 
    border-l-4 border-blue-500 pl-3">
      {iconMap[icon] || <FiUser className="w-5 h-5 text-blue-500" />} {/* Fallback */}
      {title}
    </h3>
    {children}
  </motion.div>
);

export default DrawerEditForm;