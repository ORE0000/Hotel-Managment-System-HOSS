// src/components/BookingAdvance.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiUser, FiCreditCard, FiCheck } from "react-icons/fi";

const BookingAdvance: React.FC = () => {
  const [formData, setFormData] = useState({
    bookingId: "",
    guestName: "",
    advanceAmount: "",
    paymentMethod: "cash",
    notes: "",
  });

  const [recentAdvances, setRecentAdvances] = useState([
    {
      id: "ADV-2023-001",
      bookingId: "BK-2023-045",
      guestName: "Rahul Sharma",
      amount: "₹5,000",
      date: "2023-05-08",
      paymentMethod: "UPI",
    },
    {
      id: "ADV-2023-002",
      bookingId: "BK-2023-052",
      guestName: "Priya Patel",
      amount: "₹2,500",
      date: "2023-05-07",
      paymentMethod: "Cash",
    },
    {
      id: "ADV-2023-003",
      bookingId: "BK-2023-056",
      guestName: "Amit Kumar",
      amount: "₹7,500",
      date: "2023-05-06",
      paymentMethod: "Card",
    },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send this data to your backend
    // For demo purposes, we'll just add it to our list
    const newAdvance = {
      id: `ADV-2023-${Math.floor(Math.random() * 1000)}`,
      bookingId: formData.bookingId,
      guestName: formData.guestName,
      amount: `₹${parseFloat(formData.advanceAmount).toLocaleString('en-IN')}`,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: formData.paymentMethod.charAt(0).toUpperCase() + formData.paymentMethod.slice(1),
    };

    setRecentAdvances([newAdvance, ...recentAdvances]);
    
    // Reset form
    setFormData({
      bookingId: "",
      guestName: "",
      advanceAmount: "",
      paymentMethod: "cash",
      notes: "",
    });

    // You could show a success notification here
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Booking Advance</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[var(--card-bg)] shadow-lg rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Record New Advance</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="bookingId" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Booking ID
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)]">
                      <FiCalendar />
                    </span>
                    <input
                      type="text"
                      id="bookingId"
                      name="bookingId"
                      value={formData.bookingId}
                      onChange={handleInputChange}
                      placeholder="e.g. BK-2023-045"
                      className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Guest Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)]">
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      id="guestName"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      placeholder="Guest full name"
                      className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="advanceAmount" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Advance Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)]">
                      <FiCreditCard />
                    </span>
                    <input
                      type="number"
                      id="advanceAmount"
                      name="advanceAmount"
                      value={formData.advanceAmount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information"
                    rows={3}
                    className="block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow transition-all duration-300 flex items-center justify-center"
                  >
                    <FiCheck className="mr-2" /> Record Advance
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
        
        {/* Recent Advances Table */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[var(--card-bg)] shadow-lg rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Recent Advances</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[var(--table-header-bg)] text-[var(--text-secondary)]">
                    <th className="px-4 py-3 text-left text-sm font-medium rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Booking</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Guest</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium rounded-tr-lg">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {recentAdvances.map((advance, index) => (
                    <tr key={advance.id} className="text-[var(--text-primary)] hover:bg-[var(--table-hover-bg)]">
                      <td className="px-4 py-3 text-sm">{advance.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{advance.bookingId}</td>
                      <td className="px-4 py-3 text-sm">{advance.guestName}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--success)]">{advance.amount}</td>
                      <td className="px-4 py-3 text-sm">{advance.date}</td>
                      <td className="px-4 py-3 text-sm">{advance.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingAdvance;