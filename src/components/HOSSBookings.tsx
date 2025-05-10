import { useQuery } from "@tanstack/react-query";
import { fetchHOSSBookings } from "../services/ApiService";
import { BookingDetail } from "../types";
import { useState, useMemo, useCallback, useEffect, useDeferredValue } from "react";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "@heroicons/react/24/outline";
import { FiFilter, FiRefreshCw, FiDownload, FiCopy, FiSearch, FiX, FiFileText, FiCode, FiFile } from "react-icons/fi";
import { toast } from "react-toastify";
import Modal from "react-modal";
import jsPDF from "jspdf";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

Modal.setAppElement("#root");

const HOSSBookings: React.FC = () => {
  const [filters, setFilters] = useState<{
    status: string;
    startDate: string;
    endDate: string;
  }>({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const itemsPerPage = 10;

  const { data: hossBookings, error, isLoading, refetch } = useQuery<BookingDetail[]>({
    queryKey: ["hossBookings"],
    queryFn: () => fetchHOSSBookings({}),
    retry: 2,
    onSuccess: () => {
      toast.success("HOSS bookings loaded successfully");
    },
    onError: (err: any) => {
      toast.error(`Failed to load HOSS bookings: ${err.message}`);
    },
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
    setSearchQuery(value); // Update input value immediately
    debouncedSearch(value); // Debounce the search query update
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
      const allIndices = filteredData.map((_, idx) => idx);
      setSelectedRows(new Set(allIndices));
    }
  };

  const copySelectedRows = () => {
    const selectedData = filteredData.filter((_, idx) => selectedRows.has(idx));
    if (selectedData.length === 0) {
      toast.warn("No rows selected to copy");
      return;
    }
    const text = selectedData
      .map(
        (item) =>
          `Guest: ${item.guestName}\nPlan: ${item.plan}\nCheck-In: ${item.checkIn}\nCheck-Out: ${item.checkOut}\nHotel: ${item.hotelName}\nPAX: ${item.pax || "N/A"}\nRooms: ${item.noOfRooms || "N/A"}\nExtra Bed: ${item.extraBed || "N/A"}\nKitchen: ${item.kitchen || "N/A"}\nStatus: ${item.status}\nAdvance: ₹${item.advance || "0"}\nTotal Bill: ₹${item.totalBill || "0"}\n---`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Selected rows copied to clipboard");
  };

  const openModal = (booking: BookingDetail) => {
    setSelectedBooking(booking);
    setModalIsOpen(true);
  };

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const text = `Guest: ${selectedBooking.guestName}\nPlan: ${selectedBooking.plan}\nCheck-In: ${selectedBooking.checkIn}\nCheck-Out: ${selectedBooking.checkOut}\nHotel: ${selectedBooking.hotelName}\nPAX: ${selectedBooking.pax || "N/A"}\nRooms: ${selectedBooking.noOfRooms || "N/A"}\nExtra Bed: ${selectedBooking.extraBed || "N/A"}\nKitchen: ${selectedBooking.kitchen || "N/A"}\nStatus: ${selectedBooking.status}\nAdvance: ₹${selectedBooking.advance || "0"}\nTotal Bill: ₹${selectedBooking.totalBill || "0"}`;
    navigator.clipboard.writeText(text);
    toast.success("Booking details copied to clipboard");
  };

  const printBookingDetails = () => {
    if (!selectedBooking) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("HOSS Booking Details", 10, 10);
    doc.text(`Guest: ${selectedBooking.guestName}`, 10, 20);
    doc.text(`Plan: ${selectedBooking.plan}`, 10, 30);
    doc.text(`Check-In: ${selectedBooking.checkIn}`, 10, 40);
    doc.text(`Check-Out: ${selectedBooking.checkOut}`, 10, 50);
    doc.text(`Hotel: ${selectedBooking.hotelName}`, 10, 60);
    doc.text(`PAX: ${selectedBooking.pax || "N/A"}`, 10, 70);
    doc.text(`Rooms: ${selectedBooking.noOfRooms || "N/A"}`, 10, 80);
    doc.text(`Extra Bed: ${selectedBooking.extraBed || "N/A"}`, 10, 90);
    doc.text(`Kitchen: ${selectedBooking.kitchen || "N/A"}`, 10, 100);
    doc.text(`Status: ${selectedBooking.status}`, 10, 110);
    doc.text(`Advance: ₹${selectedBooking.advance || "0"}`, 10, 120);
    doc.text(`Total Bill: ₹${selectedBooking.totalBill || "0"}`, 10, 130);
    doc.save(`hoss_booking_${selectedBooking.guestName}_${selectedBooking.checkIn}.pdf`);
    toast.success("Booking details downloaded as PDF");
  };

  const downloadCSV = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_, idx) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const headers = [
      "Guest", "Plan", "Check-In", "Check-Out", "Hotel", "PAX", "Rooms", 
      "Extra Bed", "Kitchen", "Status", "Advance", "Total Bill"
    ];
    const rows = data.map((item) => [
      item.guestName, item.plan, item.checkIn, item.checkOut, item.hotelName, 
      item.pax || "N/A", item.noOfRooms || "N/A", item.extraBed || "N/A", 
      item.kitchen || "N/A", item.status, item.advance || "0", item.totalBill || "0"
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hoss_bookings_${new Date().toISOString()}.csv`;
    link.click();
    toast.success("CSV downloaded successfully");
  };

  const downloadJSON = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_, idx) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hoss_bookings_${new Date().toISOString()}.json`;
    link.click();
    toast.success("JSON downloaded successfully");
  };

  const downloadPDF = () => {
    const data = selectedRows.size > 0 ? filteredData.filter((_, idx) => selectedRows.has(idx)) : filteredData;
    if (data.length === 0) {
      toast.warn("No data available to download");
      return;
    }
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    doc.text("HOSS Bookings Report", 10, y);
    y += 10;
    data.forEach((item, idx) => {
      doc.text(`Booking ${idx + 1}`, 10, y);
      y += 10;
      doc.text(`Guest: ${item.guestName}`, 10, y);
      y += 10;
      doc.text(`Plan: ${item.plan}`, 10, y);
      y += 10;
      doc.text(`Check-In: ${item.checkIn}`, 10, y);
      y += 10;
      doc.text(`Check-Out: ${item.checkOut}`, 10, y);
      y += 10;
      doc.text(`Hotel: ${item.hotelName}`, 10, y);
      y += 10;
      doc.text(`PAX: ${item.pax || "N/A"}`, 10, y);
      y += 10;
      doc.text(`Rooms: ${item.noOfRooms || "N/A"}`, 10, y);
      y += 10;
      doc.text(`Extra Bed: ${item.extraBed || "N/A"}`, 10, y);
      y += 10;
      doc.text(`Kitchen: ${item.kitchen || "N/A"}`, 10, y);
      y += 10;
      doc.text(`Status: ${item.status}`, 10, y);
      y += 10;
      doc.text(`Advance: ₹${item.advance || "0"}`, 10, y);
      y += 10;
      doc.text(`Total Bill: ₹${item.totalBill || "0"}`, 10, y);
      y += 20;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`hoss_bookings_${new Date().toISOString()}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const filteredData = useMemo(() => {
    if (!hossBookings) return [];
    let result = hossBookings;

    if (filters.status) {
      result = result.filter((item) => item.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.startDate) {
      result = result.filter((item) => new Date(item.checkIn) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter((item) => new Date(item.checkOut) <= new Date(filters.endDate));
    }
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.guestName.toLowerCase().includes(lowerQuery) ||
          item.hotelName.toLowerCase().includes(lowerQuery) ||
          item.plan.toLowerCase().includes(lowerQuery) ||
          item.status.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [hossBookings, filters, deferredSearchQuery]);

  const totals = useMemo(
    () => ({
      totalBill: filteredData.reduce((sum, item) => sum + (item.totalBill || 0), 0),
      advance: filteredData.reduce((sum, item) => sum + (parseFloat(item.advance?.toString() || "0") || 0), 0),
      due: filteredData.reduce((sum, item) => sum + ((item.totalBill || 0) - (parseFloat(item.advance?.toString() || "0") || 0)), 0),
    }),
    [filteredData]
  );

  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      ),
    [filteredData, page]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg-primary)] z-20 py-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">
          HOSS Bookings
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
          {[...Array(5)].map((_, idx) => (
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
          Failed to load HOSS bookings: {error.message}
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
                aria-label="Search bookings"
              >
                <FiSearch size={18} />
              </motion.button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by guest, hotel, plan, or status"
                  className="search-input w-full pl-4 pr-10 py-2 rounded-lg text-sm"
                  aria-label="Search bookings"
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

          {/* Desktop Table View */}
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
                    <th className="p-3 min-w-[150px]">Guest</th>
                    <th className="p-3 min-w-[150px]">Hotel</th>
                    <th className="p-3 min-w-[120px]">Plan</th>
                    <th className="p-3 min-w-[120px]">Check-In</th>
                    <th className="p-3 min-w-[120px]">Check-Out</th>
                    <th className="p-3 min-w-[80px]">PAX</th>
                    <th className="p-3 min-w-[80px]">Rooms</th>
                    <th className="p-3 min-w-[100px]">Extra Bed</th>
                    <th className="p-3 min-w-[100px]">Kitchen</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[120px]">Advance</th>
                    <th className="p-3 min-w-[120px]">Total Bill</th>
                    <th className="p-3 min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, idx) => (
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
                        <td className="p-3">{item.hotelName}</td>
                        <td className="p-3">{item.plan}</td>
                        <td className="p-3">{item.checkIn}</td>
                        <td className="p-3">{item.checkOut}</td>
                        <td className="p-3">{item.pax || "N/A"}</td>
                        <td className="p-3">{item.noOfRooms || "N/A"}</td>
                        <td className="p-3">{item.extraBed || "N/A"}</td>
                        <td className="p-3">{item.kitchen || "N/A"}</td>
                        <td className="p-3">
                          <span
                            className={`badge badge-${item.status.toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <motion.span
                            className="font-semibold text-emerald-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.advance?.toLocaleString() || "0"}
                          </motion.span>
                        </td>
                        <td className="p-3">
                          <motion.span
                            className="font-semibold text-blue-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.totalBill?.toLocaleString() || "0"}
                          </motion.span>
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
                      <td colSpan={14} className="p-6 text-center text-[var(--text-secondary)]">
                        No bookings found
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
                    Total Bill: <span className="text-blue-400">₹{totals.totalBill.toLocaleString()}</span>
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => (
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
                          aria-label={`Select booking for ${item.guestName}`}
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
                    <p><span className="font-medium">Hotel:</span> {item.hotelName}</p>
                    <p><span className="font-medium">Plan:</span> {item.plan}</p>
                    <p><span className="font-medium">Check-In:</span> {item.checkIn}</p>
                    <p><span className="font-medium">Check-Out:</span> {item.checkOut}</p>
                    {expandedCard === (page - 1) * itemsPerPage + idx && (
                      <div className="space-y-2">
                        <p><span className="font-medium">PAX:</span> {item.pax || "N/A"}</p>
                        <p><span className="font-medium">Rooms:</span> {item.noOfRooms || "N/A"}</p>
                        <p><span className="font-medium">Extra Bed:</span> {item.extraBed || "N/A"}</p>
                        <p><span className="font-medium">Kitchen:</span> {item.kitchen || "N/A"}</p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <span className={`badge badge-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Advance:</span>{" "}
                          <span className="text-emerald-400">₹{item.advance?.toLocaleString() || "0"}</span>
                        </p>
                        <p>
                          <span className="font-medium">Total Bill:</span>{" "}
                          <span className="text-blue-400">₹{item.totalBill?.toLocaleString() || "0"}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === (page - 1) * itemsPerPage + idx
                          ? null
                          : (page - 1) * itemsPerPage + idx
                      )
                    }
                    className="text-[var(--icon-bg-blue)] hover:text-blue-800 text-sm mt-2 font-medium"
                  >
                    {expandedCard === (page - 1) * itemsPerPage + idx
                      ? "Show Less"
                      : "Show More"}
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-4 sm:p-6 text-center rounded-xl neumorphic-card">
                <p className="text-[var(--text-secondary)]">No bookings found</p>
              </div>
            )}
            {paginatedData.length > 0 && (
              <motion.div
                className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-[var(--text-secondary)] glass-card p-4 rounded-xl neumorphic-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-0">
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Total Bill: <span className="text-blue-400">₹{totals.totalBill.toLocaleString()}</span>
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

          {/* Modal for Booking Details */}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            className="glass-card p-4 sm:p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-auto mt-20 border border-[var(--border-color)] neumorphic-card"
            overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] text-gradient">
                    Booking Details
                  </h3>
                  <motion.button
                    onClick={() => setModalIsOpen(false)}
                    className="p-2 rounded-full hover:bg-[var(--sidebar-hover)] neumorphic-card"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close modal"
                  >
                    <FiX size={20} />
                  </motion.button>
                </div>
                <div className="space-y-3 text-sm">
                  <p><span className="font-medium">Guest:</span> {selectedBooking.guestName}</p>
                  <p><span className="font-medium">Hotel:</span> {selectedBooking.hotelName}</p>
                  <p><span className="font-medium">Plan:</span> {selectedBooking.plan}</p>
                  <p><span className="font-medium">Check-In:</span> {selectedBooking.checkIn}</p>
                  <p><span className="font-medium">Check-Out:</span> {selectedBooking.checkOut}</p>
                  <p><span className="font-medium">PAX:</span> {selectedBooking.pax || "N/A"}</p>
                  <p><span className="font-medium">Rooms:</span> {selectedBooking.noOfRooms || "N/A"}</p>
                  <p><span className="font-medium">Extra Bed:</span> {selectedBooking.extraBed || "N/A"}</p>
                  <p><span className="font-medium">Kitchen:</span> {selectedBooking.kitchen || "N/A"}</p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={`badge badge-${selectedBooking.status.toLowerCase()}`}>
                      {selectedBooking.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Advance:</span>{" "}
                    <span className="text-emerald-400">₹{selectedBooking.advance?.toLocaleString() || "0"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Total Bill:</span>{" "}
                    <span className="text-blue-400">₹{selectedBooking.totalBill?.toLocaleString() || "0"}</span>
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <motion.button
                    onClick={copyBookingDetails}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2 neumorphic-card"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiCopy size={14} /> Copy
                  </motion.button>
                  <motion.button
                    onClick={printBookingDetails}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2 neumorphic-card"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiDownload size={14} /> PDF
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

export default HOSSBookings;