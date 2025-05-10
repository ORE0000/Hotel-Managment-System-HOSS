import { useQuery, queryOptions } from '@tanstack/react-query'; 
import { fetchEnquiryData, fetchHotels } from "../services/ApiService";
import { Enquiry } from "../types";
import { useState, useMemo, useCallback, useEffect, useDeferredValue } from "react";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "@heroicons/react/24/outline";
import { FiFilter, FiRefreshCw, FiDownload, FiCopy, FiSearch, FiX, FiFileText, FiCode, FiFile } from "react-icons/fi";
import { toast } from "react-toastify";
import Modal from "react-modal";
import jsPDF from "jspdf";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

Modal.setAppElement("#root");

const EnquiryPage: React.FC = () => {
  const [filters, setFilters] = useState<{
    status: string;
    startDate: string;
    endDate: string;
    hotel: string;
  }>({
    status: "",
    startDate: "",
    endDate: "",
    hotel: "",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const itemsPerPage = 10;

  const {
    data: enquiries,
    error,
    isLoading,
    isSuccess,
    isError,
    refetch,
  } = useQuery<Enquiry[], Error>({
    queryKey: ["enquiries"],
    queryFn: fetchEnquiryData,
    retry: 2,
  });
  
  // Handle toast side-effects
  useEffect(() => {
    if (isSuccess) {
      toast.success("Enquiries loaded successfully");
    } else if (isError && error) {
      toast.error(`Failed to load enquiries: ${error.message}`);
    }
  }, [isSuccess, isError, error]);

  const { data: hotels } = useQuery<string[]>({
    queryKey: ["hotels"],
    queryFn: fetchHotels,
    retry: 2,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      startDate: "",
      endDate: "",
      hotel: "",
    });
    setPage(1);
    setSearchQuery("");
    setSelectedRows(new Set());
    toast.success("Filters reset successfully");
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      setPage(1);
    }, 200, { leading: true, trailing: true }),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const toggleRowSelection = (index: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index);
    } else {
      newSelectedRows.add(index);
    }
    setSelectedRows(newSelectedRows);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = filteredData.map((_: Enquiry, idx: number) => idx);
      setSelectedRows(new Set(allIndices));
    }
  };

  const copySelectedRows = () => {
    const selectedData = filteredData.filter((_: Enquiry, idx: number) => selectedRows.has(idx));
    if (selectedData.length === 0) {
      toast.warn("No rows selected to copy");
      return;
    }
    const text = selectedData
      .map(
        (item: Enquiry) =>
          `Guest: ${item.guestName}\nContact: ${item.contact}\nHotel: ${item.hotel}\nCheck-In: ${item.checkIn}\nCheck-Out: ${item.checkOut}\nDays: ${item.day}\nPAX: ${item.pax}\nRooms: Double Bed=${item.roomName.doubleBed}, Triple Bed=${item.roomName.tripleBed}, Four Bed=${item.roomName.fourBed}, Extra Bed=${item.roomName.extraBed}, Kitchen=${item.roomName.kitchen}\nRoom Rates: Double Bed=₹${item.roomRent.doubleBed}, Triple Bed=₹${item.roomRent.tripleBed}, Four Bed=₹${item.roomRent.fourBed}, Extra Bed=₹${item.roomRent.extraBed}, Kitchen=₹${item.roomRent.kitchen}\nDiscount: Double Bed=₹${item.discount.doubleBed}, Triple Bed=₹${item.discount.tripleBed}, Four Bed=₹${item.discount.fourBed}, Extra Bed=₹${item.discount.extraBed}, Kitchen=₹${item.discount.kitchen}\nStatus: ${item.status}\nAdvance: ₹${item.advance}\nTotal Bill: ₹${item.billAmount}\nDue: ₹${item.due}\n---`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Selected rows copied to clipboard");
  };

  const openModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEnquiry(null);
  };

  const copyEnquiryDetails = () => {
    if (!selectedEnquiry) return;
    const text = `Guest: ${selectedEnquiry.guestName}\nContact: ${selectedEnquiry.contact}\nHotel: ${selectedEnquiry.hotel}\nCheck-In: ${selectedEnquiry.checkIn}\nCheck-Out: ${selectedEnquiry.checkOut}\nDays: ${selectedEnquiry.day}\nPAX: ${selectedEnquiry.pax}\nRooms: Double Bed=${selectedEnquiry.roomName.doubleBed}, Triple Bed=${selectedEnquiry.roomName.tripleBed}, Four Bed=${selectedEnquiry.roomName.fourBed}, Extra Bed=${selectedEnquiry.roomName.extraBed}, Kitchen=${selectedEnquiry.roomName.kitchen}\nRoom Rates: Double Bed=₹${selectedEnquiry.roomRent.doubleBed}, Triple Bed=₹${selectedEnquiry.roomRent.tripleBed}, Four Bed=₹${selectedEnquiry.roomRent.fourBed}, Extra Bed=₹${selectedEnquiry.roomRent.extraBed}, Kitchen=₹${selectedEnquiry.roomRent.kitchen}\nDiscount: Double Bed=₹${selectedEnquiry.discount.doubleBed}, Triple Bed=₹${selectedEnquiry.discount.tripleBed}, Four Bed=₹${selectedEnquiry.discount.fourBed}, Extra Bed=₹${selectedEnquiry.discount.extraBed}, Kitchen=₹${selectedEnquiry.discount.kitchen}\nBill Amount: ₹${selectedEnquiry.billAmount}\nAdvance: ₹${selectedEnquiry.advance}\nDue: ₹${selectedEnquiry.due}\nCash-In: ₹${selectedEnquiry.cashIn}\nMode of Payment: ${selectedEnquiry.modeOfPayment}\nCash-Out: ₹${selectedEnquiry.cashOut}\nDate: ${selectedEnquiry.date}\nTo Account: ${selectedEnquiry.toAccount}\nScheme: ${selectedEnquiry.scheme}\nStatus: ${selectedEnquiry.status}`;
    navigator.clipboard.writeText(text);
    toast.success("Enquiry details copied to clipboard");
  };

  const printEnquiryDetails = () => {
    if (!selectedEnquiry) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Enquiry Details", 10, 10);
    doc.text(`Guest: ${selectedEnquiry.guestName}`, 10, 20);
    doc.text(`Contact: ${selectedEnquiry.contact}`, 10, 30);
    doc.text(`Hotel: ${selectedEnquiry.hotel}`, 10, 40);
    doc.text(`Check-In: ${selectedEnquiry.checkIn}`, 10, 50);
    doc.text(`Check-Out: ${selectedEnquiry.checkOut}`, 10, 60);
    doc.text(`Days: ${selectedEnquiry.day}`, 10, 70);
    doc.text(`PAX: ${selectedEnquiry.pax}`, 10, 80);
    doc.text(`Rooms: Double Bed=${selectedEnquiry.roomName.doubleBed}, Triple Bed=${selectedEnquiry.roomName.tripleBed}, Four Bed=${selectedEnquiry.roomName.fourBed}, Extra Bed=${selectedEnquiry.roomName.extraBed}, Kitchen=${selectedEnquiry.roomName.kitchen}`, 10, 90);
    doc.text(`Room Rates: Double Bed=₹${selectedEnquiry.roomRent.doubleBed}, Triple Bed=₹${selectedEnquiry.roomRent.tripleBed}, Four Bed=₹${selectedEnquiry.roomRent.fourBed}, Extra Bed=₹${selectedEnquiry.roomRent.extraBed}, Kitchen=₹${selectedEnquiry.roomRent.kitchen}`, 10, 100);
    doc.text(`Discount: Double Bed=₹${selectedEnquiry.discount.doubleBed}, Triple Bed=₹${selectedEnquiry.discount.tripleBed}, Four Bed=₹${selectedEnquiry.discount.fourBed}, Extra Bed=₹${selectedEnquiry.discount.extraBed}, Kitchen=₹${selectedEnquiry.discount.kitchen}`, 10, 110);
    doc.text(`Bill Amount: ₹${selectedEnquiry.billAmount}`, 10, 120);
    doc.text(`Advance: ₹${selectedEnquiry.advance}`, 10, 130);
    doc.text(`Due: ₹${selectedEnquiry.due}`, 10, 140);
    doc.text(`Cash-In: ₹${selectedEnquiry.cashIn}`, 10, 150);
    doc.text(`Mode of Payment: ${selectedEnquiry.modeOfPayment}`, 10, 160);
    doc.text(`Cash-Out: ₹${selectedEnquiry.cashOut}`, 10, 170);
    doc.text(`Date: ${selectedEnquiry.date}`, 10, 180);
    doc.text(`To Account: ${selectedEnquiry.toAccount}`, 10, 190);
    doc.text(`Scheme: ${selectedEnquiry.scheme}`, 10, 200);
    doc.text(`Status: ${selectedEnquiry.status}`, 10, 210);
    doc.save(`enquiry_${selectedEnquiry.guestName}_${selectedEnquiry.checkIn}.pdf`);
    toast.success("Enquiry details downloaded as PDF");
  };

  const downloadCSV = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_: Enquiry, idx: number) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const headers = [
      "Guest", "Contact", "Hotel", "Check-In", "Check-Out", "Days", "PAX",
      "Rooms Double Bed", "Rooms Triple Bed", "Rooms Four Bed", "Rooms Extra Bed", "Rooms Kitchen",
      "Rate Double Bed", "Rate Triple Bed", "Rate Four Bed", "Rate Extra Bed", "Rate Kitchen",
      "Discount Double Bed", "Discount Triple Bed", "Discount Four Bed", "Discount Extra Bed", "Discount Kitchen",
      "Bill Amount", "Advance", "Due", "Cash-In", "Mode of Payment", "Cash-Out",
      "Date", "To Account", "Scheme", "Status"
    ];
    const rows = data.map((item: Enquiry) => [
      item.guestName, item.contact, item.hotel, item.checkIn, item.checkOut, item.day, item.pax,
      item.roomName.doubleBed, item.roomName.tripleBed, item.roomName.fourBed, item.roomName.extraBed, item.roomName.kitchen,
      item.roomRent.doubleBed, item.roomRent.tripleBed, item.roomRent.fourBed, item.roomRent.extraBed, item.roomRent.kitchen,
      item.discount.doubleBed, item.discount.tripleBed, item.discount.fourBed, item.discount.extraBed, item.discount.kitchen,
      item.billAmount, item.advance, item.due, item.cashIn, item.modeOfPayment, item.cashOut,
      item.date, item.toAccount, item.scheme, item.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enquiries_${new Date().toISOString()}.csv`;
    link.click();
    toast.success("CSV downloaded successfully");
  };

  const downloadJSON = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_: Enquiry, idx: number) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enquiries_${new Date().toISOString()}.json`;
    link.click();
    toast.success("JSON downloaded successfully");
  };

  const downloadPDF = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_: Enquiry, idx: number) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    doc.text("Enquiries Report", 10, y);
    y += 10;
    data.forEach((item: Enquiry, idx: number) => {
      doc.text(`Enquiry ${idx + 1}`, 10, y);
      y += 10;
      doc.text(`Guest: ${item.guestName}`, 10, y);
      y += 10;
      doc.text(`Contact: ${item.contact}`, 10, y);
      y += 10;
      doc.text(`Hotel: ${item.hotel}`, 10, y);
      y += 10;
      doc.text(`Check-In: ${item.checkIn}`, 10, y);
      y += 10;
      doc.text(`Check-Out: ${item.checkOut}`, 10, y);
      y += 10;
      doc.text(`Days: ${item.day}`, 10, y);
      y += 10;
      doc.text(`PAX: ${item.pax}`, 10, y);
      y += 10;
      doc.text(`Rooms: Double Bed=${item.roomName.doubleBed}, Triple Bed=${item.roomName.tripleBed}, Four Bed=${item.roomName.fourBed}, Extra Bed=${item.roomName.extraBed}, Kitchen=${item.roomName.kitchen}`, 10, y);
      y += 10;
      doc.text(`Room Rates: Double Bed=₹${item.roomRent.doubleBed}, Triple Bed=₹${item.roomRent.tripleBed}, Four Bed=₹${item.roomRent.fourBed}, Extra Bed=₹${item.roomRent.extraBed}, Kitchen=₹${item.roomRent.kitchen}`, 10, y);
      y += 10;
      doc.text(`Discount: Double Bed=₹${item.discount.doubleBed}, Triple Bed=₹${item.discount.tripleBed}, Four Bed=₹${item.discount.fourBed}, Extra Bed=₹${item.discount.extraBed}, Kitchen=₹${item.discount.kitchen}`, 10, y);
      y += 10;
      doc.text(`Bill Amount: ₹${item.billAmount}`, 10, y);
      y += 10;
      doc.text(`Advance: ₹${item.advance}`, 10, y);
      y += 10;
      doc.text(`Due: ₹${item.due}`, 10, y);
      y += 10;
      doc.text(`Cash-In: ₹${item.cashIn}`, 10, y);
      y += 10;
      doc.text(`Mode of Payment: ${item.modeOfPayment}`, 10, y);
      y += 10;
      doc.text(`Cash-Out: ₹${item.cashOut}`, 10, y);
      y += 10;
      doc.text(`Date: ${item.date}`, 10, y);
      y += 10;
      doc.text(`To Account: ${item.toAccount}`, 10, y);
      y += 10;
      doc.text(`Scheme: ${item.scheme}`, 10, y);
      y += 10;
      doc.text(`Status: ${item.status}`, 10, y);
      y += 20;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`enquiries_${new Date().toISOString()}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const filteredData = useMemo(() => {
    if (!enquiries || !Array.isArray(enquiries)) return [];
    let result: Enquiry[] = enquiries;

    if (filters.status) {
      result = result.filter((item: Enquiry) => item.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.startDate) {
      result = result.filter((item: Enquiry) => new Date(item.checkIn) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter((item: Enquiry) => new Date(item.checkOut) <= new Date(filters.endDate));
    }
    if (filters.hotel) {
      result = result.filter((item: Enquiry) => item.hotel.toLowerCase().includes(filters.hotel.toLowerCase()));
    }
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter((item: Enquiry) =>
        item.guestName.toLowerCase().includes(lowerQuery) ||
        item.contact.toLowerCase().includes(lowerQuery) ||
        item.hotel.toLowerCase().includes(lowerQuery) ||
        item.status.toLowerCase().includes(lowerQuery) ||
        item.modeOfPayment.toLowerCase().includes(lowerQuery) ||
        item.toAccount.toLowerCase().includes(lowerQuery) ||
        item.scheme.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [enquiries, filters, deferredSearchQuery]);

  const totals = useMemo(
    () => ({
      billAmount: filteredData.reduce((sum: number, item: Enquiry) => sum + (item.billAmount || 0), 0),
      advance: filteredData.reduce((sum: number, item: Enquiry) => sum + (item.advance || 0), 0),
      due: filteredData.reduce((sum: number, item: Enquiry) => sum + (item.due || 0), 0),
      cashIn: filteredData.reduce((sum: number, item: Enquiry) => sum + (item.cashIn || 0), 0),
      cashOut: filteredData.reduce((sum: number, item: Enquiry) => sum + (item.cashOut || 0), 0),
    }),
    [filteredData]
  );

  const paginatedData = useMemo(
    () => filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredData, page]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg-primary)] z-20 py-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">
          Guest Enquiries
        </h2>
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2 text-sm"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiFilter />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </motion.button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-3 sm:p-4 mb-4 sm:mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  aria-label="Filter by Status"
                >
                  <option value="">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Hold">Hold</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label htmlFor="hotel" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">
                  Hotel
                </label>
                <select
                  id="hotel"
                  name="hotel"
                  value={filters.hotel}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  aria-label="Filter by Hotel"
                >
                  <option value="">All Hotels</option>
                  {hotels?.map((hotel: string) => (
                    <option key={hotel} value={hotel}>{hotel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  aria-label="Filter by Start Date"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  min={filters.startDate}
                  aria-label="Filter by End Date"
                />
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                onClick={handleResetFilters}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiRefreshCw size={14} /> Reset
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="glass-card p-4 sm:p-6 rounded-xl">
          {[...Array(5)].map((_: undefined, idx: number) => (
            <div key={idx} className="animate-pulse flex space-x-4 mb-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-[var(--sidebar-hover)] rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--sidebar-hover)] rounded"></div>
                  <div className="h-4 bg-[var(--sidebar-hover)] rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card p-4 sm:p-6 mb-4 rounded-xl bg-red-100 text-red-600">
          Failed to load enquiries: {error.message}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <motion.button
                className="btn-secondary p-2 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Search enquiries"
              >
                <FiSearch size={18} />
              </motion.button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by guest, contact, hotel, or status"
                  className="search-input w-full pl-4 pr-10 py-2 rounded-lg text-sm"
                  aria-label="Search enquiries"
                />
                {searchQuery && (
                  <motion.button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Clear search"
                  >
                    <FiX size={18} />
                  </motion.button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <motion.button
                onClick={copySelectedRows}
                disabled={selectedRows.size === 0}
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiCopy size={14} /> Copy
              </motion.button>
              <div className="relative">
                <motion.button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiDownload size={14} /> Export
                </motion.button>
                {showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-[var(--card-bg)] rounded-lg shadow-lg z-10 border border-[var(--border-color)]"
                  >
                    <button
                      onClick={downloadCSV}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] rounded-t-lg flex items-center gap-2 text-sm"
                    >
                      <FiFileText size={14} /> CSV
                    </button>
                    <button
                      onClick={downloadJSON}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] flex items-center gap-2 text-sm"
                    >
                      <FiCode size={14} /> JSON
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] rounded-b-lg flex items-center gap-2 text-sm"
                    >
                      <FiFile size={14} /> PDF
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block glass-card p-4 sm:p-6 rounded-xl mb-6 neumorphic-card">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="modern-table w-full text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="p-3">
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Select all rows"
                        />
                        <span className="checkbox-indicator"></span>
                      </label>
                    </th>
                    <th className="p-3 min-w-[150px]">Guest Name</th>
                    <th className="p-3 min-w-[120px]">Contact</th>
                    <th className="p-3 min-w-[150px]">Hotel</th>
                    <th className="p-3 min-w-[120px]">Check-In</th>
                    <th className="p-3 min-w-[120px]">Check-Out</th>
                    <th className="p-3 min-w-[80px]">Days</th>
                    <th className="p-3 min-w-[80px]">PAX</th>
                    <th className="p-3 min-w-[100px]">Double Bed Count</th>
                    <th className="p-3 min-w-[100px]">Triple Bed Count</th>
                    <th className="p-3 min-w-[100px]">Four Bed Count</th>
                    <th className="p-3 min-w-[100px]">Extra Bed Count</th>
                    <th className="p-3 min-w-[100px]">Kitchen Count</th>
                    <th className="p-3 min-w-[120px]">Double Bed Rate</th>
                    <th className="p-3 min-w-[120px]">Triple Bed Rate</th>
                    <th className="p-3 min-w-[120px]">Four Bed Rate</th>
                    <th className="p-3 min-w-[120px]">Extra Bed Rate</th>
                    <th className="p-3 min-w-[120px]">Kitchen Rate</th>
                    <th className="p-3 min-w-[120px]">Bill Amount</th>
                    <th className="p-3 min-w-[120px]">Advance</th>
                    <th className="p-3 min-w-[120px]">Due</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item: Enquiry, idx: number) => (
                      <motion.tr
                        key={item.guestName + item.checkIn}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`${
                          selectedRows.has((page - 1) * itemsPerPage + idx) ? "bg-[var(--sidebar-hover)]" : ""
                        }`}
                      >
                        <td className="p-3">
                          <label className="custom-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedRows.has((page - 1) * itemsPerPage + idx)}
                              onChange={() => toggleRowSelection((page - 1) * itemsPerPage + idx)}
                              aria-label={`Select row ${idx + 1}`}
                            />
                            <span className="checkbox-indicator"></span>
                          </label>
                        </td>
                        <td className="p-3 font-medium">{item.guestName}</td>
                        <td className="p-3">{item.contact}</td>
                        <td className="p-3">{item.hotel}</td>
                        <td className="p-3">{item.checkIn}</td>
                        <td className="p-3">{item.checkOut}</td>
                        <td className="p-3">{item.day}</td>
                        <td className="p-3">{item.pax}</td>
                        <td className="p-3">{item.roomName.doubleBed}</td>
                        <td className="p-3">{item.roomName.tripleBed}</td>
                        <td className="p-3">{item.roomName.fourBed}</td>
                        <td className="p-3">{item.roomName.extraBed}</td>
                        <td className="p-3">{item.roomName.kitchen}</td>
                        <td className="p-3">₹{item.roomRent.doubleBed.toLocaleString()}</td>
                        <td className="p-3">₹{item.roomRent.tripleBed.toLocaleString()}</td>
                        <td className="p-3">₹{item.roomRent.fourBed.toLocaleString()}</td>
                        <td className="p-3">₹{item.roomRent.extraBed.toLocaleString()}</td>
                        <td className="p-3">₹{item.roomRent.kitchen.toLocaleString()}</td>
                        <td className="p-3">
                          <motion.span
                            className="font-semibold text-blue-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.billAmount.toLocaleString()}
                          </motion.span>
                        </td>
                        <td className="p-3">
                          <motion.span
                            className="font-semibold text-emerald-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.advance.toLocaleString()}
                          </motion.span>
                        </td>
                        <td className="p-3">
                          <motion.span
                            className="font-semibold text-rose-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.due.toLocaleString()}
                          </motion.span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`badge badge-${item.status.toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <motion.button
                            onClick={() => openModal(item)}
                            className="text-[var(--icon-bg-blue)] hover:text-blue-800"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`View details for ${item.guestName}`}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={23} className="p-6 text-center text-[var(--text-secondary)]">
                        No enquiries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {paginatedData.length > 0 && (
              <motion.div
                className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-[var(--text-secondary)] glass-card p-4 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-0">
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Total Bill: <span className="text-blue-400">₹{totals.billAmount.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Advance: <span className="text-emerald-400">₹{totals.advance.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Due: <span className="text-rose-400">₹{totals.due.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-In: <span className="text-teal-400">₹{totals.cashIn.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-Out: <span className="text-orange-400">₹{totals.cashOut.toLocaleString()}</span>
                  </motion.span>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full bg-[var(--card-bg)] disabled:opacity-50 neumorphic-card"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </motion.button>
                  <span className="font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-full bg-[var(--card-bg)] disabled:opacity-50 neumorphic-card"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Next page"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="md:hidden space-y-4">
            {paginatedData.length > 0 ? (
              paginatedData.map((item: Enquiry, idx: number) => (
                <motion.div
                  key={item.guestName + item.checkIn}
                  className={`glass-card p-4 rounded-xl neumorphic-card ${
                    selectedRows.has((page - 1) * itemsPerPage + idx) ? "border-2 border-[var(--icon-bg-blue)]" : ""
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRows.has((page - 1) * itemsPerPage + idx)}
                          onChange={() => toggleRowSelection((page - 1) * itemsPerPage + idx)}
                          aria-label={`Select enquiry for ${item.guestName}`}
                        />
                        <span className="checkbox-indicator"></span>
                      </label>
                      <h3 className="font-semibold text-[var(--text-primary)]">{item.guestName}</h3>
                    </div>
                    <motion.button
                      onClick={() => openModal(item)}
                      className="text-[var(--icon-bg-blue)] hover:text-blue-800"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`View details for ${item.guestName}`}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] space-y-2">
                    <p><span className="font-medium">Contact:</span> {item.contact}</p>
                    <p><span className="font-medium">Hotel:</span> {item.hotel}</p>
                    <p><span className="font-medium">Check-In:</span> {item.checkIn}</p>
                    <p><span className="font-medium">Check-Out:</span> {item.checkOut}</p>
                    <p><span className="font-medium">Days:</span> {item.day}</p>
                    <p><span className="font-medium">PAX:</span> {item.pax}</p>
                    <p><span className="font-medium">Status:</span> <span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span></p>
                    <motion.div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleCardExpansion((page - 1) * itemsPerPage + idx)}
                    >
                      <span className="font-medium text-[var(--icon-bg-blue)]">More Details</span>
                      <motion.span
                        animate={{ rotate: expandedCard === (page - 1) * itemsPerPage + idx ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </motion.span>
                    </motion.div>
                    <AnimatePresence>
                      {expandedCard === (page - 1) * itemsPerPage + idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2 mt-2"
                        >
                          <p><span className="font-medium">Rooms:</span> Double Bed={item.roomName.doubleBed}, Triple Bed={item.roomName.tripleBed}, Four Bed={item.roomName.fourBed}, Extra Bed={item.roomName.extraBed}, Kitchen={item.roomName.kitchen}</p>
                          <p><span className="font-medium">Room Rates:</span> Double Bed=₹{item.roomRent.doubleBed.toLocaleString()}, Triple Bed=₹{item.roomRent.tripleBed.toLocaleString()}, Four Bed=₹{item.roomRent.fourBed.toLocaleString()}, Extra Bed=₹{item.roomRent.extraBed.toLocaleString()}, Kitchen=₹{item.roomRent.kitchen.toLocaleString()}</p>
                          <p><span className="font-medium">Discount:</span> Double Bed=₹{item.discount.doubleBed.toLocaleString()}, Triple Bed=₹{item.discount.tripleBed.toLocaleString()}, Four Bed=₹{item.discount.fourBed.toLocaleString()}, Extra Bed=₹{item.discount.extraBed.toLocaleString()}, Kitchen=₹{item.discount.kitchen.toLocaleString()}</p>
                          <p><span className="font-medium">Bill Amount:</span> ₹{item.billAmount.toLocaleString()}</p>
                          <p><span className="font-medium">Advance:</span> ₹{item.advance.toLocaleString()}</p>
                          <p><span className="font-medium">Due:</span> ₹{item.due.toLocaleString()}</p>
                          <p><span className="font-medium">Cash-In:</span> ₹{item.cashIn.toLocaleString()}</p>
                          <p><span className="font-medium">Mode of Payment:</span> {item.modeOfPayment}</p>
                          <p><span className="font-medium">Cash-Out:</span> ₹{item.cashOut.toLocaleString()}</p>
                          <p><span className="font-medium">Date:</span> {item.date}</p>
                          <p><span className="font-medium">To Account:</span> {item.toAccount}</p>
                          <p><span className="font-medium">Scheme:</span> {item.scheme}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-4 rounded-xl text-center text-[var(--text-secondary)]">
                No enquiries found
              </div>
            )}
            {paginatedData.length > 0 && (
              <motion.div
                className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-[var(--text-secondary)] glass-card p-4 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col gap-3 mb-4 sm:mb-0">
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Total Bill: <span className="text-blue-400">₹{totals.billAmount.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Advance: <span className="text-emerald-400">₹{totals.advance.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Due: <span className="text-rose-400">₹{totals.due.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-In: <span className="text-teal-400">₹{totals.cashIn.toLocaleString()}</span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-Out: <span className="text-orange-400">₹{totals.cashOut.toLocaleString()}</span>
                  </motion.span>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full bg-[var(--card-bg)] disabled:opacity-50 neumorphic-card"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </motion.button>
                  <span className="font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-full bg-[var(--card-bg)] disabled:opacity-50 neumorphic-card"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Next page"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="modal-content max-w-2xl mx-auto my-8 p-6 bg-[var(--card-bg)] rounded-xl neumorphic-card"
            overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            {selectedEnquiry && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Enquiry Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <p><span className="font-medium">Guest:</span> {selectedEnquiry.guestName}</p>
                  <p><span className="font-medium">Contact:</span> {selectedEnquiry.contact}</p>
                  <p><span className="font-medium">Hotel:</span> {selectedEnquiry.hotel}</p>
                  <p><span className="font-medium">Check-In:</span> {selectedEnquiry.checkIn}</p>
                  <p><span className="font-medium">Check-Out:</span> {selectedEnquiry.checkOut}</p>
                  <p><span className="font-medium">Days:</span> {selectedEnquiry.day}</p>
                  <p><span className="font-medium">PAX:</span> {selectedEnquiry.pax}</p>
                  <p><span className="font-medium">Status:</span> <span className={`badge badge-${selectedEnquiry.status.toLowerCase()}`}>{selectedEnquiry.status}</span></p>
                  <p><span className="font-medium">Rooms:</span> Double Bed={selectedEnquiry.roomName.doubleBed}, Triple Bed={selectedEnquiry.roomName.tripleBed}, Four Bed={selectedEnquiry.roomName.fourBed}, Extra Bed={selectedEnquiry.roomName.extraBed}, Kitchen={selectedEnquiry.roomName.kitchen}</p>
                  <p><span className="font-medium">Room Rates:</span> Double Bed=₹{selectedEnquiry.roomRent.doubleBed.toLocaleString()}, Triple Bed=₹{selectedEnquiry.roomRent.tripleBed.toLocaleString()}, Four Bed=₹{selectedEnquiry.roomRent.fourBed.toLocaleString()}, Extra Bed=₹{selectedEnquiry.roomRent.extraBed.toLocaleString()}, Kitchen=₹{selectedEnquiry.roomRent.kitchen.toLocaleString()}</p>
                  <p><span className="font-medium">Discount:</span> Double Bed=₹{selectedEnquiry.discount.doubleBed.toLocaleString()}, Triple Bed=₹{selectedEnquiry.discount.tripleBed.toLocaleString()}, Four Bed=₹{selectedEnquiry.discount.fourBed.toLocaleString()}, Extra Bed=₹{selectedEnquiry.discount.extraBed.toLocaleString()}, Kitchen=₹{selectedEnquiry.discount.kitchen.toLocaleString()}</p>
                  <p><span className="font-medium">Bill Amount:</span> ₹{selectedEnquiry.billAmount.toLocaleString()}</p>
                  <p><span className="font-medium">Advance:</span> ₹{selectedEnquiry.advance.toLocaleString()}</p>
                  <p><span className="font-medium">Due:</span> ₹{selectedEnquiry.due.toLocaleString()}</p>
                  <p><span className="font-medium">Cash-In:</span> ₹{selectedEnquiry.cashIn.toLocaleString()}</p>
                  <p><span className="font-medium">Mode of Payment:</span> {selectedEnquiry.modeOfPayment}</p>
                  <p><span className="font-medium">Cash-Out:</span> ₹{selectedEnquiry.cashOut.toLocaleString()}</p>
                  <p><span className="font-medium">Date:</span> {selectedEnquiry.date}</p>
                  <p><span className="font-medium">To Account:</span> {selectedEnquiry.toAccount}</p>
                  <p><span className="font-medium">Scheme:</span> {selectedEnquiry.scheme}</p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <motion.button
                    onClick={copyEnquiryDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiCopy size={16} /> Copy
                  </motion.button>
                  <motion.button
                    onClick={printEnquiryDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiDownload size={16} /> Download PDF
                  </motion.button>
                  <motion.button
                    onClick={closeModal}
                    className="btn-secondary px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default EnquiryPage;