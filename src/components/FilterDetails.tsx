import { useQuery } from '@tanstack/react-query';
import { fetchFilterDetails, fetchHotels } from '../services/ApiService';
import { FilterDetail } from '../types';
import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiCopy,
  FiSearch,
  FiX,
  FiFileText,
  FiCode,
  FiFile,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import jsPDF from 'jspdf';
import { debounce } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';

Modal.setAppElement('#root');

const FilterDetailsPage: React.FC = () => {
  const [filters, setFilters] = useState<{
    hotel: string;
    status: string;
    startDate: string;
    endDate: string;
  }>({
    hotel: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<FilterDetail | null>(
    null
  );
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const itemsPerPage = 10;

  const {
    data: filterDetails,
    error,
    isLoading,
  } = useQuery<FilterDetail[] | undefined>({
    queryKey: ['filterDetails'],
    queryFn: () => fetchFilterDetails({}),
    retry: 2,
    onSuccess: () => {
      toast.success('Filter data loaded successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to load filter data: ${err.message}`);
    },
  });

  const { data: hotels, isLoading: hotelsLoading } = useQuery<string[]>({
    queryKey: ['hotels'],
    queryFn: fetchHotels,
    onError: (err: Error) => {
      toast.error(`Failed to load hotels: ${err.message}`);
    },
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      hotel: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
    setSearchQuery('');
    setSelectedRows(new Set());
    toast.success('Filters reset successfully');
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
    setSearchQuery('');
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
      const allIndices = filteredData.map((_: FilterDetail, idx: number) => idx);
      setSelectedRows(new Set(allIndices));
    }
  };

  const copySelectedRows = () => {
    const selectedData = filteredData.filter((_: FilterDetail, idx: number) => selectedRows.has(idx));
    if (selectedData.length === 0) {
      toast.warn('No rows selected to copy');
      return;
    }
    const text = selectedData
      .map(
        (item: FilterDetail) =>
          `Guest: ${item.name}\nPlan: ${item.plan}\nCheck-In: ${item.checkIn}\nCheck-Out: ${item.checkOut}\nHotel: ${item.hotel}\nDays: ${item.day}\nPAX: ${item.pax}\nDB: ${item.db}\nTB: ${item.tb}\nFB: ${item.fb}\nExtra: ${item.extra}\nStatus: ${item.status}\nTotal Bill: ₹${item.totalBill || 'N/A'}\nAdvance: ₹${item.advance || '0'}\nDue: ₹${item.due || '0'}\n---`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Selected rows copied to clipboard');
  };

  const openModal = (booking: FilterDetail) => {
    setSelectedBooking(booking);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedBooking(null);
  };

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const text = `Guest: ${selectedBooking.name}\nPlan: ${selectedBooking.plan}\nCheck-In: ${selectedBooking.checkIn}\nCheck-Out: ${selectedBooking.checkOut}\nHotel: ${selectedBooking.hotel}\nDays: ${selectedBooking.day}\nPAX: ${selectedBooking.pax}\nDB: ${selectedBooking.db}\nTB: ${selectedBooking.tb}\nFB: ${selectedBooking.fb}\nExtra: ${selectedBooking.extra}\nStatus: ${selectedBooking.status}\nTotal Bill: ₹${selectedBooking.totalBill || 'N/A'}\nAdvance: ₹${selectedBooking.advance || '0'}\nDue: ₹${selectedBooking.due || '0'}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard');
  };

  const printBookingDetails = () => {
    if (!selectedBooking) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Booking Details', 10, 10);
    doc.text(`Guest: ${selectedBooking.name}`, 10, 20);
    doc.text(`Plan: ${selectedBooking.plan}`, 10, 30);
    doc.text(`Check-In: ${selectedBooking.checkIn}`, 10, 40);
    doc.text(`Check-Out: ${selectedBooking.checkOut}`, 10, 50);
    doc.text(`Hotel: ${selectedBooking.hotel}`, 10, 60);
    doc.text(`Days: ${selectedBooking.day}`, 10, 70);
    doc.text(`PAX: ${selectedBooking.pax}`, 10, 80);
    doc.text(`DB: ${selectedBooking.db}`, 10, 90);
    doc.text(`TB: ${selectedBooking.tb}`, 10, 100);
    doc.text(`FB: ${selectedBooking.fb}`, 10, 110);
    doc.text(`Extra: ${selectedBooking.extra}`, 10, 120);
    doc.text(`Status: ${selectedBooking.status}`, 10, 130);
    doc.text(`Total Bill: ₹${selectedBooking.totalBill || 'N/A'}`, 10, 140);
    doc.text(`Advance: ₹${selectedBooking.advance || '0'}`, 10, 150);
    doc.text(`Due: ₹${selectedBooking.due || '0'}`, 10, 160);
    doc.save(`booking_${selectedBooking.name}_${selectedBooking.checkIn}.pdf`);
    toast.success('Booking details downloaded as PDF');
  };

  const downloadCSV = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: FilterDetail, idx: number) => selectedRows.has(idx))
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const headers = [
      'Guest',
      'Plan',
      'Check-In',
      'Check-Out',
      'Hotel',
      'Days',
      'PAX',
      'DB',
      'TB',
      'FB',
      'Extra',
      'Status',
      'Total Bill',
      'Advance',
      'Due',
    ];
    const rows = data.map((item: FilterDetail) => [
      item.name,
      item.plan,
      item.checkIn,
      item.checkOut,
      item.hotel,
      item.day,
      item.pax,
      item.db,
      item.tb,
      item.fb,
      item.extra,
      item.status,
      item.totalBill || 'N/A',
      item.advance || '0',
      item.due || '0',
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString()}.csv`;
    link.click();
    toast.success('CSV downloaded successfully');
  };

  const downloadJSON = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: FilterDetail, idx: number) => selectedRows.has(idx))
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString()}.json`;
    link.click();
    toast.success('JSON downloaded successfully');
  };

  const downloadPDF = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: FilterDetail, idx: number) => selectedRows.has(idx))
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    doc.text('Booking Report', 10, y);
    y += 10;
    data.forEach((item: FilterDetail, idx: number) => {
      doc.text(`Booking ${idx + 1}`, 10, y);
      y += 10;
      doc.text(`Guest: ${item.name}`, 10, y);
      y += 10;
      doc.text(`Plan: ${item.plan}`, 10, y);
      y += 10;
      doc.text(`Check-In: ${item.checkIn}`, 10, y);
      y += 10;
      doc.text(`Check-Out: ${item.checkOut}`, 10, y);
      y += 10;
      doc.text(`Hotel: ${item.hotel}`, 10, y);
      y += 10;
      doc.text(`Days: ${item.day}`, 10, y);
      y += 10;
      doc.text(`PAX: ${item.pax}`, 10, y);
      y += 10;
      doc.text(`DB: ${item.db}`, 10, y);
      y += 10;
      doc.text(`TB: ${item.tb}`, 10, y);
      y += 10;
      doc.text(`FB: ${item.fb}`, 10, y);
      y += 10;
      doc.text(`Extra: ${item.extra}`, 10, y);
      y += 10;
      doc.text(`Status: ${item.status}`, 10, y);
      y += 10;
      doc.text(`Total Bill: ₹${item.totalBill || 'N/A'}`, 10, y);
      y += 10;
      doc.text(`Advance: ₹${item.advance || '0'}`, 10, y);
      y += 10;
      doc.text(`Due: ₹${item.due || '0'}`, 10, y);
      y += 20;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`bookings_${new Date().toISOString()}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const filteredData = useMemo(() => {
    if (!filterDetails || !Array.isArray(filterDetails)) return [];
    let result: FilterDetail[] = filterDetails;

    if (filters.hotel) {
      result = result.filter((item: FilterDetail) =>
        item.hotel.toUpperCase().includes(filters.hotel.toUpperCase())
      );
    }
    if (filters.status) {
      result = result.filter((item: FilterDetail) =>
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    if (filters.startDate) {
      result = result.filter((item: FilterDetail) =>
        new Date(item.checkIn) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      result = result.filter((item: FilterDetail) =>
        new Date(item.checkOut) <= new Date(filters.endDate)
      );
    }
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter((item: FilterDetail) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.hotel.toLowerCase().includes(lowerQuery) ||
        item.plan.toLowerCase().includes(lowerQuery) ||
        item.status.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [filterDetails, filters, deferredSearchQuery]);

  const totals = useMemo(
    () => ({
      totalBill: filteredData.reduce(
        (sum: number, item: FilterDetail) => sum + (item.totalBill || 0),
        0
      ),
      advance: filteredData.reduce(
        (sum: number, item: FilterDetail) => sum + (item.advance || 0),
        0
      ),
      due: filteredData.reduce(
        (sum: number, item: FilterDetail) => sum + (item.due || 0),
        0
      ),
    }),
    [filteredData]
  );

  const paginatedData = useMemo(
    () => filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredData, page]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg-primary)] z-20 py-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient">
          Filter Bookings
        </h2>
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2 text-sm"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiFilter />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label
                  htmlFor="hotel"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
                  Hotel
                </label>
                <select
                  id="hotel"
                  name="hotel"
                  value={filters.hotel}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading || hotelsLoading}
                  aria-label="Filter by Hotel"
                >
                  <option value="">All Hotels</option>
                  {hotels?.map((hotel: string) => (
                    <option key={hotel} value={hotel}>
                      {hotel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
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
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  aria-label="Filter by Start Date"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  aria-label="Filter by End Date"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-4">
              <motion.button
                onClick={handleResetFilters}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiRefreshCw size={14} />
                Reset
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
          Failed to load filter bookings: {error.message}
        </div>
      )}

      {!isLoading && (
        <div className="glass-card p-4 sm:p-6 rounded-xl mb-6 neumorphic-card">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
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
                  placeholder="Search by guest, hotel, plan, or status..."
                  className="search-input w-full pl-4 pr-10 py-2 rounded-lg text-sm"
                  onChange={handleSearch}
                  value={searchQuery}
                  disabled={isLoading}
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
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                onClick={copySelectedRows}
                disabled={selectedRows.size === 0}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiCopy />
                Copy Selected
              </motion.button>
              <div className="relative">
                <motion.button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiDownload />
                  Export
                </motion.button>
                {showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg z-10"
                  >
                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
                    >
                      <FiFileText />
                      CSV
                    </button>
                    <button
                      onClick={downloadJSON}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
                    >
                      <FiCode />
                      JSON
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
                    >
                      <FiFile />
                      PDF
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="modern-table w-full text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="p-3">
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            selectedRows.size === filteredData.length &&
                            filteredData.length > 0
                          }
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
                    <th className="p-3 min-w-[80px]">Days</th>
                    <th className="p-3 min-w-[80px]">PAX</th>
                    <th className="p-3 min-w-[80px]">DB</th>
                    <th className="p-3 min-w-[80px]">TB</th>
                    <th className="p-3 min-w-[80px]">FB</th>
                    <th className="p-3 min-w-[100px]">Extra</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item: FilterDetail, idx: number) => (
                      <motion.tr
                        key={item.name + item.checkIn}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`${
                          selectedRows.has((page - 1) * itemsPerPage + idx)
                            ? 'bg-[var(--sidebar-hover)]'
                            : ''
                        }`}
                      >
                        <td className="p-3">
                          <label className="custom-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(
                                (page - 1) * itemsPerPage + idx
                              )}
                              onChange={() =>
                                toggleRowSelection(
                                  (page - 1) * itemsPerPage + idx
                                )
                              }
                              aria-label={`Select row ${idx + 1}`}
                            />
                            <span className="checkbox-indicator"></span>
                          </label>
                        </td>
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">{item.hotel}</td>
                        <td className="p-3">{item.plan}</td>
                        <td className="p-3">{item.checkIn}</td>
                        <td className="p-3">{item.checkOut}</td>
                        <td className="p-3">{item.day}</td>
                        <td className="p-3">{item.pax}</td>
                        <td className="p-3">{item.db}</td>
                        <td className="p-3">{item.tb}</td>
                        <td className="p-3">{item.fb}</td>
                        <td className="p-3">{item.extra}</td>
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
                            aria-label={`View details for ${item.name}`}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={14}
                        className="p-6 text-center text-[var(--text-secondary)]"
                      >
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {paginatedData.length > 0 ? (
              paginatedData.map((item: FilterDetail, idx: number) => (
                <motion.div
                  key={item.name + item.checkIn}
                  className={`glass-card p-4 rounded-xl neumorphic-card ${
                    selectedRows.has((page - 1) * itemsPerPage + idx)
                      ? 'border-2 border-[var(--icon-bg-blue)]'
                      : ''
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
                          checked={selectedRows.has(
                            (page - 1) * itemsPerPage + idx
                          )}
                          onChange={() =>
                            toggleRowSelection((page - 1) * itemsPerPage + idx)
                          }
                          aria-label={`Select booking for ${item.name}`}
                        />
                        <span className="checkbox-indicator"></span>
                      </label>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {item.name}
                      </h3>
                    </div>
                    <motion.button
                      onClick={() => openModal(item)}
                      className="text-[var(--icon-bg-blue)] hover:text-blue-800"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`View details for ${item.name}`}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] space-y-2">
                    <p>
                      <span className="font-medium">Hotel:</span> {item.hotel}
                    </p>
                    <p>
                      <span className="font-medium">Plan:</span> {item.plan}
                    </p>
                    <p>
                      <span className="font-medium">Check-In:</span>{' '}
                      {item.checkIn}
                    </p>
                    <p>
                      <span className="font-medium">Check-Out:</span>{' '}
                      {item.checkOut}
                    </p>
                    <motion.div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setExpandedCard(
                          expandedCard === (page - 1) * itemsPerPage + idx
                            ? null
                            : (page - 1) * itemsPerPage + idx
                        )
                      }
                    >
                      <span className="font-medium text-[var(--icon-bg-blue)]">
                        {expandedCard === (page - 1) * itemsPerPage + idx
                          ? 'Show Less'
                          : 'Show More'}
                      </span>
                      <motion.span
                        animate={{
                          rotate:
                            expandedCard === (page - 1) * itemsPerPage + idx
                              ? 180
                              : 0,
                        }}
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
                          className="space-y-2"
                        >
                          <p>
                            <span className="font-medium">Days:</span>{' '}
                            {item.day}
                          </p>
                          <p>
                            <span className="font-medium">PAX:</span> {item.pax}
                          </p>
                          <p>
                            <span className="font-medium">DB:</span> {item.db}
                          </p>
                          <p>
                            <span className="font-medium">TB:</span> {item.tb}
                          </p>
                          <p>
                            <span className="font-medium">FB:</span> {item.fb}
                          </p>
                          <p>
                            <span className="font-medium">Extra:</span>{' '}
                            {item.extra}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            <span
                              className={`badge badge-${item.status.toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-4 sm:p-6 text-center rounded-xl neumorphic-card">
                <p className="text-[var(--text-secondary)]">
                  No bookings found
                </p>
              </div>
            )}
          </div>

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
                  Total Bill:{' '}
                  <span className="text-blue-400">
                    ₹{totals.totalBill.toLocaleString()}
                  </span>
                </motion.span>
                <motion.span
                  className="font-semibold"
                  whileHover={{ scale: 1.02 }}
                >
                  Advance:{' '}
                  <span className="text-emerald-400">
                    ₹{totals.advance.toLocaleString()}
                  </span>
                </motion.span>
                <motion.span
                  className="font-semibold"
                  whileHover={{ scale: 1.02 }}
                >
                  Due:{' '}
                  <span className="text-rose-400">
                    ₹{totals.due.toLocaleString()}
                  </span>
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
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
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
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-[var(--sidebar-hover)] neumorphic-card"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </motion.button>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Guest:</span>{' '}
                {selectedBooking.name}
              </p>
              <p>
                <span className="font-medium">Hotel:</span>{' '}
                {selectedBooking.hotel}
              </p>
              <p>
                <span className="font-medium">Plan:</span>{' '}
                {selectedBooking.plan}
              </p>
              <p>
                <span className="font-medium">Check-In:</span>{' '}
                {selectedBooking.checkIn}
              </p>
              <p>
                <span className="font-medium">Check-Out:</span>{' '}
                {selectedBooking.checkOut}
              </p>
              <p>
                <span className="font-medium">Days:</span> {selectedBooking.day}
              </p>
              <p>
                <span className="font-medium">PAX:</span> {selectedBooking.pax}
              </p>
              <p>
                <span className="font-medium">DB:</span> {selectedBooking.db}
              </p>
              <p>
                <span className="font-medium">TB:</span> {selectedBooking.tb}
              </p>
              <p>
                <span className="font-medium">FB:</span> {selectedBooking.fb}
              </p>
              <p>
                <span className="font-medium">Extra:</span>{' '}
                {selectedBooking.extra}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`badge badge-${selectedBooking.status.toLowerCase()}`}
                >
                  {selectedBooking.status}
                </span>
              </p>
              <p>
                <span className="font-medium">Total Bill:</span>{' '}
                <span className="text-blue-400">
                  ₹{selectedBooking.totalBill?.toLocaleString() || 'N/A'}
                </span>
              </p>
              <p>
                <span className="font-medium">Advance:</span>{' '}
                <span className="text-emerald-400">
                  ₹{selectedBooking.advance?.toLocaleString() || '0'}
                </span>
              </p>
              <p>
                <span className="font-medium">Due:</span>{' '}
                <span className="text-rose-400">
                  ₹{selectedBooking.due?.toLocaleString() || '0'}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <motion.button
                onClick={copyBookingDetails}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2 neumorphic-card"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiCopy />
                Copy
              </motion.button>
              <motion.button
                onClick={printBookingDetails}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2 neumorphic-card"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiDownload />
                PDF
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FilterDetailsPage;