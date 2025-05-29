import React, { useEffect } from 'react';
import { ChevronRight, User, Calendar, CreditCard, CheckCircle, Bed, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BillData } from 'src/types';
import './Billing.css';

interface BillingFormProps {
  billData: BillData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleGenerateBill: (e: React.FormEvent<HTMLFormElement>) => void;
}

const BillingForm: React.FC<BillingFormProps> = ({ 
  billData, 
  handleInputChange, 
  handleGenerateBill 
}) => {
  // Calculate days between check-in and check-out
  useEffect(() => {
    if (billData.checkIn && billData.checkOut) {
      const checkInDate = new Date(billData.checkIn);
      const checkOutDate = new Date(billData.checkOut);
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        const event = {
          target: {
            name: 'days',
            value: diffDays.toString()
          }
        } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange(event);
      }
    }
  }, [billData.checkIn, billData.checkOut, handleInputChange]);

  return (
    <motion.form
      onSubmit={handleGenerateBill}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 md:p-8 rounded-2xl neumorphic-card border border-[var(--border-color)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Guest Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2 rounded-lg bg-[var(--icon-bg-indigo)] text-white">
              <User size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Guest Information
            </h3>
          </div>

          {[
            {
              label: 'Guest Name',
              name: 'guestName',
              type: 'text',
              required: true,
              icon: <User size={20} />,
            },
            {
              label: 'Hotel Name',
              name: 'hotel',
              type: 'text',
              icon: <Home size={20} />,
            },
            {
              label: 'Address',
              name: 'address',
              type: 'text',
              icon: <User size={20} />,
            },
            {
              label: 'VOTER ID/ID NUMBER',
              name: 'idNumber',
              type: 'text',
              icon: <CreditCard size={20} />,
            },
            {
              label: 'Contact',
              name: 'contact',
              type: 'text',
              required: true,
              icon: <User size={20} />,
            },
            {
              label: 'Room Number',
              name: 'roomNumber',
              type: 'text',
              required: true,
              icon: <Bed size={20} />,
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
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                  {field.icon}
                </div>
                <input
                  id={field.name}
                  type={field.type}
                  name={field.name}
                  value={billData[field.name as keyof BillData] as string}
                  onChange={handleInputChange}
                  className="input-field rounded-lg neumorphic-input w-full"
                  required={field.required}
                  aria-label={field.label}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stay Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2 rounded-lg bg-[var(--icon-bg-green)] text-white">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Stay Information
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Check-In Date',
                name: 'checkIn',
                type: 'date',
                required: true,
                icon: <Calendar size={20} />,
              },
              {
                label: 'Check-Out Date',
                name: 'checkOut',
                type: 'date',
                required: true,
                icon: <Calendar size={20} />,
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
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[var(--card-bg)] text-[var(--icon-color)]">
                    {field.icon}
                  </div>
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={billData[field.name as keyof BillData] as string}
                    onChange={handleInputChange}
                    className="input-field rounded-lg neumorphic-input w-full"
                    required={field.required}
                    aria-label={field.label}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Days',
                name: 'days',
                type: 'number',
                min: '1',
                icon: <Calendar size={20} />,
              },
              {
                label: 'PAX (Guests)',
                name: 'pax',
                type: 'number',
                min: '1',
                icon: <User size={20} />,
              },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
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
                    name={field.name}
                    min={field.min}
                    value={billData[field.name as keyof BillData] as number}
                    onChange={handleInputChange}
                    className="input-field rounded-lg neumorphic-input w-full"
                    aria-label={field.label}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {[
            {
              label: 'Bill Date',
              name: 'date',
              type: 'date',
              icon: <Calendar size={20} />,
            },
            {
              label: 'Status',
              name: 'status',
              type: 'select',
              options: ['Pending', 'Paid', 'Cancelled'],
              icon: <CheckCircle size={20} />,
            },
            {
              label: 'Mode of Payment',
              name: 'modeOfPayment',
              type: 'select',
              options: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'N/A'],
              icon: <CreditCard size={20} />,
            },
          ].map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 4) }}
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
                    name={field.name}
                    value={billData[field.name as keyof BillData] as string}
                    onChange={handleInputChange}
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
                    name={field.name}
                    value={billData[field.name as keyof BillData] as string}
                    onChange={handleInputChange}
                    className="input-field rounded-lg neumorphic-input w-full"
                    aria-label={field.label}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Room and Rate Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 md:col-span-2"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2 rounded-lg bg-[var(--icon-bg-purple)] text-white">
              <Bed size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Room and Rate Information
            </h3>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              Room Quantities
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: 'Double Bed Rooms',
                  name: 'doubleBedCount',
                  type: 'number',
                  min: '0',
                  icon: <Bed size={20} />,
                },
                {
                  label: 'Triple Bed Rooms',
                  name: 'tripleBedCount',
                  type: 'number',
                  min: '0',
                  icon: <Bed size={20} />,
                },
                {
                  label: 'Four Bed Rooms',
                  name: 'fourBedCount',
                  type: 'number',
                  min: '0',
                  icon: <Bed size={20} />,
                },
                {
                  label: 'Extra Beds',
                  name: 'extraBedCount',
                  type: 'number',
                  min: '0',
                  icon: <Bed size={20} />,
                },
                {
                  label: 'Kitchen',
                  name: 'kitchenCount',
                  type: 'number',
                  min: '0',
                  icon: <Bed size={20} />,
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
                      name={field.name}
                      min={field.min}
                      value={billData[field.name as keyof BillData] as number}
                      onChange={handleInputChange}
                      className="input-field rounded-lg neumorphic-input w-full"
                      aria-label={field.label}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              Room Rates (₹)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: 'Double Bed Rate (₹)',
                  name: 'doubleBedRate',
                  type: 'number',
                  min: '0',
                  icon: <CreditCard size={20} />,
                },
                {
                  label: 'Triple Bed Rate (₹)',
                  name: 'tripleBedRate',
                  type: 'number',
                  min: '0',
                  icon: <CreditCard size={20} />,
                },
                {
                  label: 'Four Bed Rate (₹)',
                  name: 'fourBedRate',
                  type: 'number',
                  min: '0',
                  icon: <CreditCard size={20} />,
                },
                {
                  label: 'Extra Bed Rate (₹)',
                  name: 'extraBedRate',
                  type: 'number',
                  min: '0',
                  icon: <CreditCard size={20} />,
                },
                {
                  label: 'Kitchen Rate (₹)',
                  name: 'kitchenRate',
                  type: 'number',
                  min: '0',
                  icon: <CreditCard size={20} />,
                },
              ].map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 5) }}
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
                      name={field.name}
                      min={field.min}
                      value={billData[field.name as keyof BillData] as number}
                      onChange={handleInputChange}
                      className="input-field rounded-lg neumorphic-input w-full"
                      aria-label={field.label}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 md:col-span-2"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2 rounded-lg bg-[var(--icon-bg-green)] text-white">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Payment Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Advance (₹)',
                name: 'advance',
                type: 'number',
                min: '0',
                icon: <CreditCard size={20} />,
              },
              {
                label: 'Cash-In (₹)',
                name: 'cashIn',
                type: 'number',
                min: '0',
                icon: <CreditCard size={20} />,
              },
              {
                label: 'Cash-Out (₹)',
                name: 'cashOut',
                type: 'number',
                min: '0',
                icon: <CreditCard size={20} />,
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
                    name={field.name}
                    min={field.min}
                    value={billData[field.name as keyof BillData] as number}
                    onChange={handleInputChange}
                    className="input-field rounded-lg neumorphic-input w-full"
                    aria-label={field.label}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: 'To Account',
                name: 'toAccount',
                type: 'text',
                icon: <CreditCard size={20} />,
              },
              {
                label: 'Scheme',
                name: 'scheme',
                type: 'text',
                icon: <CreditCard size={20} />,
              },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 3) }}
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
                    name={field.name}
                    value={billData[field.name as keyof BillData] as string}
                    onChange={handleInputChange}
                    className="input-field rounded-lg neumorphic-input w-full"
                    aria-label={field.label}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex justify-center gap-4"
      >
        <motion.button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-[var(--generate-button-bg)] text-[var(--button-text)] rounded-xl neumorphic-card font-semibold hover:bg-[var(--generate-button-hover-bg)] hover:text-[var(--button-hover-text)] hover:shadow-[0_0_10px_var(--glow-color)] active:bg-[var(--generate-button-active-bg)] transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CheckCircle size={20} />
          Generate Bill
          <ChevronRight size={18} />
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default BillingForm;