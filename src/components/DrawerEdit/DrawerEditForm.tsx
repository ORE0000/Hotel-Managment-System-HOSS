import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { FiSave, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

// Match validation logic from BookingForm.tsx
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
  status: z
    .enum([
      "cash",
      "Cancelled",
      "HOLD",
      "Confirm"
    ])
    .optional(),
  scheme: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DrawerEditFormProps {
  data: any;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const DrawerEditForm: React.FC<DrawerEditFormProps> = ({
  data,
  onSave,
  onCancel,
  isSaving,
}) => {
  // ✅ Convert all numeric values to strings safely
  const normalizeToString = (value: any) =>
    value !== undefined && value !== null ? String(value) : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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

  const onSubmit = async (formData: FormData) => {
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }
    await onSave(formData);
  };

  const renderInput = (
    key: keyof FormData,
    label: string,
    type: "text" | "number" | "select" = "text",
    options?: string[]
  ) => (
    <div key={key}>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
        {label}
      </label>
      {type === "select" ? (
        <select
          {...register(key)}
          className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--icon-bg-blue)] focus:border-transparent transition"
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
          className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--icon-bg-blue)] focus:border-transparent transition"
          placeholder={label}
        />
      )}
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[key]?.message?.toString()}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("guestName", "Guest Name")}
        {renderInput("plan", "Plan")}
        {renderInput("hotelName", "Hotel")}
        {renderInput("checkIn", "Check-In")}
        {renderInput("checkOut", "Check-Out")}
        {renderInput("pax", "PAX", "number")}
        {renderInput("db", "Double Bed", "number")}
        {renderInput("tb", "Triple Bed", "number")}
        {renderInput("fb", "Four Bed", "number")}
        {renderInput("extraBed", "Extra Bed", "number")}
        {renderInput("kitchen", "Kitchen", "number")}
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
        {renderInput("billAmount", "Bill Amount", "number")}
        {renderInput("advance", "Advance", "number")}
        {renderInput("due", "Due", "number")}
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
        "Confirm"
        ])}
        {renderInput("scheme", "Scheme")}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <motion.button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSaving}
        >
          <FiX className="inline mr-1" /> Cancel
        </motion.button>

        <motion.button
          type="submit"
          disabled={isSaving || !isDirty}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <FiSave /> Save Changes
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default DrawerEditForm;
