import React, { useState , useRef, useEffect } from 'react';
import { Calculator, FileText, Plus, Users, Coffee, Hotel, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // ← You already have this, just confirming
import BillingForm from './BillingForm';
import RestaurantForm from './RestaurantForm';
import HotelPaymentForm from './HotelPaymentForm';
import TravelAgentForm from './TravelAgentForm';
import BillPreview from './BillPreview';
import ExportActions from './ExportActions';
import { BillData, FormType } from 'src/types';
import { calculateBillAmount, calculateDue } from '../../lib/calculationUtils';
import './Billing.css';



const initialBillData: BillData = {
  guestName: '',
  address: '',
  idNumber: '',
  contact: '',
  hotel: 'Hotel Om Shiv Shankar',
  checkIn: '',
  checkOut: '',
  days: 1,
  pax: 1,
  doubleBedRoom: 0,
  tripleBedRoom: 0,
  fourBedRoom: 0,
  extraBedRoom: 0,
  kitchenRoom: 0,
  roomNumber: '',
  doubleBedRate: 2000,
  tripleBedRate: 2400,
  fourBedRate: 3200,
  extraBedRate: 800,
  kitchenRate: 1500,
  billAmount: 0,
  advance: 0,
  due: 0,
  status: 'Pending',
  cashIn: 0,
  modeOfPayment: 'Cash',
  cashOut: 0,
  date: new Date().toISOString().split('T')[0],
  toAccount: '',
  scheme: '',
  formType: 'customer',
  ratePerGuest: 500
};

const BillingSystem: React.FC = () => {
  const [bills, setBills] = useState<BillData[]>([initialBillData]);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [activeFormType, setActiveFormType] = useState<FormType>('customer');
    const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state) return;

    const state = location.state as any;

    // Case 1: Single pre-filled bill
    if (state.billData) {
      const incoming = state.billData;

      const newBill: BillData = {
        ...initialBillData,
        ...incoming,
        formType: incoming.formType || 'customer',
        date: incoming.date || new Date().toISOString().split('T')[0],
      };

      // Recalculate amounts
      newBill.billAmount = calculateBillAmount(newBill);
      newBill.due = calculateDue(newBill);

      setBills([newBill]);
      setCurrentBillIndex(0);
      setShowPreview(false);
      setActiveFormType(newBill.formType as FormType);

      toast.success('Bill pre-filled from booking! Review and generate.');
    }

    // Case 2: Bulk bills (array)
    if (state.bills && Array.isArray(state.bills)) {
      const mapped: BillData[] = state.bills.map((item: any) => {
        const bill: BillData = {
          ...initialBillData,
          ...item,
          formType: item.formType || 'customer',
          date: item.date || new Date().toISOString().split('T')[0],
        };
        bill.billAmount = calculateBillAmount(bill);
        bill.due = calculateDue(bill);
        return bill;
      });

      setBills(mapped);
      setCurrentBillIndex(0);
      setShowPreview(false);
      setActiveFormType(mapped[0]?.formType || 'customer');

      toast.success(`${mapped.length} bills pre-filled! Ready to generate.`);
    }

    // Clear state to prevent re-trigger on refresh
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updateBills = [...bills];
    const currentBill = { ...updateBills[currentBillIndex], formType: activeFormType };
    
    const numericFields: (keyof BillData)[] = [
      'days', 'pax', 'doubleBedRoom', 'tripleBedRoom', 'fourBedRoom',
      'extraBedRoom', 'kitchenRoom', 'doubleBedRate', 'tripleBedRate',
      'fourBedRate', 'extraBedRate', 'kitchenRate', 'advance', 'cashIn',
      'cashOut', 'ratePerGuest'
    ];

    if (numericFields.includes(name as keyof BillData)) {
      (currentBill as any)[name] = value === '' ? 0 : Number(value);
    } else {
      (currentBill as any)[name] = value;
    }

    // Update days when check-in/check-out changes
    if (name === 'checkIn' || name === 'checkOut') {
      if (currentBill.checkIn && currentBill.checkOut) {
        const checkInDate = new Date(currentBill.checkIn);
        const checkOutDate = new Date(currentBill.checkOut);
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          currentBill.days = diffDays;
        }
      }
    }

    // Recalculate amounts
    currentBill.billAmount = calculateBillAmount(currentBill);
    currentBill.due = calculateDue(currentBill);
    
    updateBills[currentBillIndex] = currentBill;
    setBills(updateBills);
  };

  const handleGenerateBill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const updateBills = [...bills];
    const currentBill = { ...updateBills[currentBillIndex], formType: activeFormType };
    
    currentBill.billAmount = calculateBillAmount(currentBill);
    currentBill.due = calculateDue(currentBill);
    
    updateBills[currentBillIndex] = currentBill;
    setBills(updateBills);
    
    setShowPreview(true);
  };

  const handleNewBill = () => {
    const newBill = { 
      ...initialBillData, 
      formType: activeFormType,
      date: new Date().toISOString().split('T')[0]
    };
    // Calculate initial amounts for new bill
    newBill.billAmount = calculateBillAmount(newBill);
    newBill.due = calculateDue(newBill);
    
    setBills([...bills, newBill]);
    setCurrentBillIndex(bills.length);
    setShowPreview(false);
  };

  const handleBillSelect = (index: number) => {
    setCurrentBillIndex(index);
    setShowPreview(true);
    setActiveFormType(bills[index].formType || 'customer');
  };

  const renderForm = () => {
    switch (activeFormType) {
      case 'restaurant':
        return (
          <RestaurantForm
            billData={bills[currentBillIndex]}
            handleInputChange={handleInputChange}
            handleGenerateBill={handleGenerateBill}
          />
        );
      case 'hotel':
        return (
          <HotelPaymentForm
            billData={bills[currentBillIndex]}
            handleInputChange={handleInputChange}
            handleGenerateBill={handleGenerateBill}
          />
        );
      case 'travel':
        return (
          <TravelAgentForm
            billData={bills[currentBillIndex]}
            handleInputChange={handleInputChange}
            handleGenerateBill={handleGenerateBill}
          />
        );
      default:
        return (
          <BillingForm
            billData={bills[currentBillIndex]}
            handleInputChange={handleInputChange}
            handleGenerateBill={handleGenerateBill}
          />
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 glass-card p-6 rounded-2xl neumorphic-card"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2 flex items-center justify-center gap-2">
          <Hotel size={32} className="text-[var(--icon-bg-indigo)]" />
          HOTEL OM SHIV SHANKAR
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-[var(--icon-bg-indigo)] to-[var(--icon-bg-purple)] mx-auto mt-4 rounded-full"></div>
      </motion.header>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-4 mb-8 flex-wrap"
        >
          {[
            { type: 'customer', label: 'Customer Billing', icon: <Users size={20} />, color: 'indigo' },
            { type: 'restaurant', label: 'Restaurant Billing', icon: <Coffee size={20} />, color: 'green' },
            { type: 'hotel', label: 'Hotel Payments', icon: <Hotel size={20} />, color: 'purple' },
            { type: 'travel', label: 'Travel Agent', icon: <Plane size={20} />, color: 'teal' },
          ].map((form, index) => (
            <motion.button
              key={form.type}
              onClick={() => setActiveFormType(form.type as FormType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl neumorphic-card font-semibold transition-all duration-300 ${
                activeFormType === form.type
                  ? `bg-[var(--icon-bg-${form.color})] text-white active-button`
                  : `bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-text)] hover:shadow-[0_0_10px_var(--glow-color)]`
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: index * 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {form.icon}
              {form.label}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence>
          {bills.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6 flex gap-2 overflow-x-auto pb-2"
            >
              {bills.map((bill, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleBillSelect(index)}
                  className={`px-4 py-2 rounded-xl neumorphic-card text-sm font-medium transition-all duration-300 ${
                    currentBillIndex === index
                      ? 'bg-[var(--icon-bg-indigo)] text-white active-button'
                      : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-text)]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Bill #{index + 1} - {bill.guestName || 'New Bill'}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card glass-card p-6 rounded-2xl neumorphic-card"
        >
          {!showPreview ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="text-[var(--icon-bg-indigo)]" size={24} />
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {activeFormType === 'customer' && 'Customer Billing'}
                  {activeFormType === 'restaurant' && 'Restaurant Billing'}
                  {activeFormType === 'hotel' && 'Hotel Payment'}
                  {activeFormType === 'travel' && 'Travel Agent Billing'}
                </h2>
              </div>
              {renderForm()}
            </>
          ) : (
            <div className="bill-preview space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-[var(--icon-bg-purple)]" size={24} />
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Bill Preview</h2>
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setShowPreview(false)}
                    className="edit-button flex items-center gap-2 px-6 py-3 rounded-xl neumorphic-card font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit Bill
                  </motion.button>
                  <motion.button
                    onClick={handleNewBill}
                    className="new-button flex items-center gap-2 px-6 py-3 rounded-xl neumorphic-card font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={18} />
                    New Bill
                  </motion.button>
                </div>
              </div>
              
              {/* Hidden container for all bill previews */}
              <div className="pdf-preview-container">
                {bills.map((bill, index) => (
                  <div key={index} id={`bill-preview-${index}`} className="pdf-preview">
                    <BillPreview billData={bill} index={index} />
                  </div>
                ))}
              </div>
              
              {/* Visible current bill preview */}
              <BillPreview billData={bills[currentBillIndex]} />
              <ExportActions billData={bills[currentBillIndex]} allBills={bills} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BillingSystem;