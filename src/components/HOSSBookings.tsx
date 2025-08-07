import { useQuery } from '@tanstack/react-query';
import { fetchHOSSBookings } from '../services/ApiService';
import { ExtendedBookingDetail } from '../types'; // Import from index.ts
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
} from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { debounce } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoot } from 'react-dom/client';
import HOSSPreview from './PdfPreview/HOSSPreview';
import HOSSSummaryPreview from './PdfPreview/HOSSSummaryPreview';
import './BillingSystem/Billing.css';
import './PdfPreview/Summary.css';

Modal.setAppElement('#root');

const HOSSBookings: React.FC = () => {
  const [filters, setFilters] = useState<{
    status: string;
    startDate: string;
    endDate: string;
    hotel: string;
  }>({
    status: '',
    startDate: '',
    endDate: '',
    hotel: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<ExtendedBookingDetail | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSummaryDropdown, setShowSummaryDropdown] = useState(false);
  const itemsPerPage = 10;
  const itemsPerPagePDF = 4;

  const {
    data: hossBookings,
    error,
    isLoading,
    isSuccess,
    isError,
    refetch,
  } = useQuery<ExtendedBookingDetail[], Error>({
    queryKey: ['hossBookings'],
    queryFn: () => fetchHOSSBookings({}),
    retry: 2,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('HOSS bookings loaded successfully');
    } else if (isError && error) {
      toast.error(`Failed to load HOSS bookings: ${error.message}`);
    }
  }, [isSuccess, isError, error]);

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
      status: '',
      startDate: '',
      endDate: '',
      hotel: '',
    });
    setPage(1);
    setSearchQuery('');
    setSelectedRows(new Set());
    toast.success('Filters reset successfully');
  };

  const debouncedSearch = useCallback(
    debounce(
      (value: string) => {
        setSearchQuery(value);
        setPage(1);
      },
      200,
      { trailing: true }
    ),
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
      const allIndices = filteredData.map(
        (_: ExtendedBookingDetail, idx: number) => idx
      );
      setSelectedRows(new Set(allIndices));
    }
  };

  const copySelectedRows = () => {
    const selectedData = filteredData.filter(
      (_: ExtendedBookingDetail, idx: number) => selectedRows.has(idx)
    );
    if (selectedData.length === 0) {
      toast.warn('No rows selected to copy');
      return;
    }
    const text = selectedData
      .map(
        (item: ExtendedBookingDetail) =>
          `Guest: ${item.guestName}\nContact: ${item.contact}\nHotel: ${item.hotel}\nPlan: ${item.plan}\nCheck-In: ${item.checkIn}\nCheck-Out: ${item.checkOut}\nDays: ${item.day}\nPAX: ${item.pax || 'N/A'}\nRooms: Double Bed=${item.roomName.doubleBed || 0}, Triple Bed=${item.roomName.tripleBed || 0}, Four Bed=${item.roomName.fourBed || 0}, Extra Bed=${item.roomName.extraBed || 0}, Kitchen=${item.roomName.kitchen || 0}\nRoom Rates: Double Bed=₹${item.roomRent.doubleBed}, Triple Bed=₹${item.roomRent.tripleBed}, Four Bed=₹${item.roomRent.fourBed}, Extra Bed=₹${item.roomRent.extraBed}, Kitchen=₹${item.roomRent.kitchen}\nDiscount: Double Bed=₹${item.discount.doubleBed}, Triple Bed=₹${item.discount.tripleBed}, Four Bed=₹${item.discount.fourBed}, Extra Bed=₹${item.discount.extraBed}, Kitchen=₹${item.discount.kitchen}\nStatus: ${item.status}\nAdvance: ₹${item.advance || 0}\nBill Amount: ₹${item.billAmount || 0}\nDue: ₹${item.due || 0}\nCash-In: ₹${item.cashIn || 0}\nCash-Out: ₹${item.cashOut || 0}\nMode of Payment: ${item.modeOfPayment}\nDate: ${item.dateBooked}\nTo Account: ${item.toAccount}\nScheme: ${item.scheme}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Selected rows copied to clipboard');
  };

  const openModal = (booking: ExtendedBookingDetail) => {
    setSelectedBooking(booking);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedBooking(null);
  };

  const copyBookingDetails = () => {
    if (!selectedBooking) return;
    const text = `Guest: ${selectedBooking.guestName}\nContact: ${selectedBooking.contact}\nHotel: ${selectedBooking.hotel}\nPlan: ${selectedBooking.plan}\nCheck-In: ${selectedBooking.checkIn}\nCheck-Out: ${selectedBooking.checkOut}\nDays: ${selectedBooking.day}\nPAX: ${selectedBooking.pax || 'N/A'}\nRooms: Double Bed=${selectedBooking.roomName.doubleBed || 0}, Triple Bed=${selectedBooking.roomName.tripleBed || 0}, Four Bed=${selectedBooking.roomName.fourBed || 0}, Extra Bed=${selectedBooking.roomName.extraBed || 0}, Kitchen=${selectedBooking.roomName.kitchen || 0}\nRoom Rates: Double Bed=₹${selectedBooking.roomRent.doubleBed}, Triple Bed=₹${selectedBooking.roomRent.tripleBed}, Four Bed=₹${selectedBooking.roomRent.fourBed}, Extra Bed=₹${selectedBooking.roomRent.extraBed}, Kitchen=₹${selectedBooking.roomRent.kitchen}\nDiscount: Double Bed=₹${selectedBooking.discount.doubleBed}, Triple Bed=₹${selectedBooking.discount.tripleBed}, Four Bed=₹${selectedBooking.discount.fourBed}, Extra Bed=₹${selectedBooking.discount.extraBed}, Kitchen=₹${selectedBooking.discount.kitchen}\nStatus: ${selectedBooking.status}\nAdvance: ₹${selectedBooking.advance || 0}\nBill Amount: ₹${selectedBooking.billAmount || 0}\nDue: ₹${selectedBooking.due || 0}\nCash-In: ₹${selectedBooking.cashIn || 0}\nCash-Out: ₹${selectedBooking.cashOut || 0}\nMode of Payment: ${selectedBooking.modeOfPayment}\nDate: ${selectedBooking.dateBooked}\nTo Account: ${selectedBooking.toAccount}\nScheme: ${selectedBooking.scheme}`;
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard');
  };

  const printBookingDetails = async () => {
    if (!selectedBooking) return;
    const element = document.getElementById('pdf-single-preview');
    if (!element) {
      toast.error('Booking preview element not found');
      return;
    }

    try {
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '756px';
      element.style.height = 'auto';
      element.style.zIndex = '9999';

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const naturalHeight = element.scrollHeight;
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 756,
        height: naturalHeight,
        windowWidth: 756,
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty');
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = imgWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      const aspectRatio = canvas.width / canvas.height;
      let scaledWidth = contentWidth;
      let scaledHeight = scaledWidth / aspectRatio;

      if (scaledHeight > contentHeight) {
        scaledHeight = contentHeight;
        scaledWidth = scaledHeight * aspectRatio;
      }

      const xOffset = (imgWidth - scaledWidth) / 2;
      const yOffset = (pageHeight - scaledHeight) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        xOffset,
        yOffset,
        scaledWidth,
        scaledHeight
      );

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(150, 150, 150);
      pdf.rect(margin, margin, contentWidth, contentHeight);

      pdf.save(
        `hoss_booking_${selectedBooking.guestName}_${selectedBooking.checkIn}.pdf`
      );
      toast.success('Booking details downloaded as PDF');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      element.style.display = 'none';
      element.style.visibility = '';
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.height = '';
      element.style.zIndex = '';
    }
  };

  const printSummaryDetails = async () => {
    if (!selectedBooking) return;
    const element = document.getElementById('pdf-single-summary-preview');
    if (!element) {
      toast.error('Summary preview element not found');
      return;
    }

    try {
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '1122px';
      element.style.zIndex = '9999';

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const naturalHeight = element.scrollHeight;
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1122,
        height: naturalHeight,
        windowWidth: 1122,
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty');
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297;
      const pageHeight = 210;
      const margin = 5;
      const contentWidth = imgWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      const aspectRatio = canvas.width / canvas.height;
      let scaledWidth = contentWidth;
      let scaledHeight = scaledWidth / aspectRatio;

      if (scaledHeight > contentHeight) {
        scaledHeight = contentHeight;
        scaledWidth = scaledHeight * aspectRatio;
      }

      const xOffset = (imgWidth - scaledWidth) / 2;
      const yOffset = (pageHeight - scaledHeight) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        xOffset,
        yOffset,
        scaledWidth,
        scaledHeight
      );

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(150, 150, 150);
      pdf.rect(margin, margin, contentWidth, contentHeight);

      pdf.save(
        `summary_${selectedBooking.guestName}_${selectedBooking.checkIn}.pdf`
      );
      toast.success('Summary downloaded as PDF');
    } catch (error) {
      console.error('Summary PDF generation error:', error);
      toast.error('Failed to generate summary PDF');
    } finally {
      element.style.display = 'none';
      element.style.visibility = '';
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.height = '';
      element.style.zIndex = '';
    }
  };

  const downloadCSV = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const headers = [
      'Guest',
      'Contact',
      'Hotel',
      'Plan',
      'Check-In',
      'Check-Out',
      'Days',
      'PAX',
      'Rooms Double Bed',
      'Rooms Triple Bed',
      'Rooms Four Bed',
      'Rooms Extra Bed',
      'Rooms Kitchen',
      'Rate Double Bed',
      'Rate Triple Bed',
      'Rate Four Bed',
      'Rate Extra Bed',
      'Rate Kitchen',
      'Discount Double Bed',
      'Discount Triple Bed',
      'Discount Four Bed',
      'Discount Extra Bed',
      'Discount Kitchen',
      'Status',
      'Advance',
      'Bill Amount',
      'Due',
      'Cash-In',
      ' Cash-Out',
      'Mode of Payment',
      'Date',
      'To Account',
      'Scheme',
    ];
    const rows = data.map((item: ExtendedBookingDetail) => [
      item.guestName,
      item.contact,
      item.hotel,
      item.plan,
      item.checkIn,
      item.checkOut,
      item.day,
      item.pax || 'N/A',
      item.roomName.doubleBed || 0,
      item.roomName.tripleBed || 0,
      item.roomName.fourBed || 0,
      item.roomName.extraBed || 0,
      item.roomName.kitchen || 0,
      item.roomRent.doubleBed,
      item.roomRent.tripleBed,
      item.roomRent.fourBed,
      item.roomRent.extraBed,
      item.roomRent.kitchen,
      item.discount.doubleBed,
      item.discount.tripleBed,
      item.discount.fourBed,
      item.discount.extraBed,
      item.discount.kitchen,
      item.status,
      item.advance || 0,
      item.billAmount || 0,
      item.due || 0,
      item.cashIn || 0,
      item.cashOut || 0,
      item.modeOfPayment,
      item.dateBooked,
      item.toAccount,
      item.scheme,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hoss_bookings_${new Date().toISOString()}.csv`;
    link.click();
    toast.success('CSV downloaded successfully');
  };

  const downloadJSON = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
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
    link.download = `hoss_bookings_${new Date().toISOString()}.json`;
    link.click();
    toast.success('JSON downloaded successfully');
  };

  const downloadPDF = async () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Get the indices of selected rows or all indices if none are selected
      const indices =
        selectedRows.size > 0
          ? Array.from(selectedRows)
          : filteredData.map((_, idx) => idx);

      for (let i = 0; i < indices.length; i++) {
        const originalIndex = indices[i]; // Index in filteredData
        const element = document.getElementById(
          `hoss-preview-${originalIndex}`
        );
        if (!element) {
          console.warn(`Element hoss-preview-${originalIndex} not found`);
          continue;
        }

        const container = document.querySelector('.pdf-preview-container');
        if (container) {
          container.setAttribute(
            'style',
            'display: block; position: fixed; top: 0; left: 0; z-index: 9999; width: 756px;'
          );
        }
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '756px';
        element.style.height = 'auto';
        element.style.zIndex = '9999';

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const naturalHeight = element.scrollHeight;
        const canvas = await html2canvas(element, {
          scale: 1,
          useCORS: true,
          logging: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 756,
          height: naturalHeight,
          windowWidth: 756,
        });

        if (canvas.width === 0 || canvas.height === 0) {
          console.warn(`Canvas for booking ${originalIndex} is empty`);
          continue;
        }

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 210;
        const pageHeight = 297;
        const margin = 5;
        const contentWidth = imgWidth - 2 * margin;
        const contentHeight = pageHeight - 2 * margin;

        const aspectRatio = canvas.width / canvas.height;
        let scaledWidth = contentWidth;
        let scaledHeight = scaledWidth / aspectRatio;

        if (scaledHeight > contentHeight) {
          scaledHeight = contentHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }

        const xOffset = (imgWidth - scaledWidth) / 2;
        const yOffset = (pageHeight - scaledHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          'JPEG',
          xOffset,
          yOffset,
          scaledWidth,
          scaledHeight
        );

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(150, 150, 150);
        pdf.rect(margin, margin, contentWidth, contentHeight);

        if (container) {
          container.setAttribute(
            'style',
            'display: none; position: fixed; top: 0; left: 0;'
          );
        }
        element.style.display = '';
        element.style.visibility = '';
        element.style.position = '';
        element.style.top = '';
        element.style.left = '';
        element.style.width = '';
        element.style.height = '';
        element.style.zIndex = '';
      }

      pdf.save(`hoss_bookings_${new Date().toISOString()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Multiple bookings PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const downloadSummaryCSV = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const headers = [
      'Guest Name',
      'Hotel',
      'PAX',
      'Double Bed Count',
      'Triple Bed Count',
      'Four Bed Count',
      'Extra Bed Count',
      'Kitchen Count',
      'Check-In',
      'Check-Out',
      'Plan',
      'Bill Amount',
      'Advance',
      'Cash-In',
      'Due',
      'Status',
    ];
    const rows = data.map((item: ExtendedBookingDetail) => [
      item.guestName,
      item.hotel,
      item.pax || 'N/A',
      item.roomName.doubleBed || 0,
      item.roomName.tripleBed || 0,
      item.roomName.fourBed || 0,
      item.roomName.extraBed || 0,
      item.roomName.kitchen || 0,
      item.checkIn,
      item.checkOut,
      item.plan || 'N/A',
      item.billAmount || 0,
      item.advance || 0,
      item.cashIn || 0,
      item.due || 0,
      item.status,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hoss_summary_${new Date().toISOString()}.csv`;
    link.click();
    toast.success('Summary CSV downloaded successfully');
  };

  const downloadSummaryJSON = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const summaryData = data.map((item: ExtendedBookingDetail) => ({
      guestName: item.guestName,
      hotel: item.hotel,
      pax: item.pax || 'N/A',
      doubleBedCount: item.roomName.doubleBed || 0,
      tripleBedCount: item.roomName.tripleBed || 0,
      fourBedCount: item.roomName.fourBed || 0,
      extraBedCount: item.roomName.extraBed || 0,
      kitchenCount: item.roomName.kitchen || 0,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      plan: item.plan || 'N/A',
      billAmount: item.billAmount || 0,
      advance: item.advance || 0,
      cashIn: item.cashIn || 0,
      due: item.due || 0,
      status: item.status,
    }));
    const jsonContent = JSON.stringify(summaryData, null, 2);
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hoss_summary_${new Date().toISOString()}.json`;
    link.click();
    toast.success('Summary JSON downloaded successfully');
  };

  const downloadSummaryPDF = async () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: ExtendedBookingDetail, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const totalPages = Math.ceil(data.length / itemsPerPagePDF);

      for (let page = 0; page < totalPages; page++) {
        const start = page * itemsPerPagePDF;
        const end = Math.min(start + itemsPerPagePDF, data.length);
        const pageData = data.slice(start, end);

        const element = document.createElement('div');
        element.id = `pdf-summary-preview-page-${page}`;
        element.className = 'summary-preview';
        element.style.width = '1122px';
        element.style.minHeight = '794px';
        element.style.boxSizing = 'border-box';
        element.style.backgroundColor = '#ffffff';

        const container = document.querySelector('.summary-preview-container');
        if (!container) {
          throw new Error('Summary preview container not found');
        }

        container.appendChild(element);
        container.setAttribute(
          'style',
          'display: block; position: fixed; top: 0; left: 0; z-index: 9999; width: 1122px;'
        );

        const root = createRoot(element);
        root.render(<HOSSSummaryPreview bookingData={pageData} />);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const naturalHeight = element.scrollHeight;
        const canvas = await html2canvas(element, {
          scale: 1,
          useCORS: true,
          logging: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1122,
          height: naturalHeight,
          windowWidth: 1122,
        });

        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error('Canvas is empty');
        }

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 297;
        const pageHeight = 210;
        const margin = 5;
        const contentWidth = imgWidth - 2 * margin;
        const contentHeight = pageHeight - 2 * margin;

        const aspectRatio = canvas.width / canvas.height;
        let scaledWidth = contentWidth;
        let scaledHeight = scaledWidth / aspectRatio;

        if (scaledHeight > contentHeight) {
          scaledHeight = contentHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }

        const xOffset = (imgWidth - scaledWidth) / 2;
        const yOffset = (pageHeight - scaledHeight) / 2;

        if (page > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          'JPEG',
          xOffset,
          yOffset,
          scaledWidth,
          scaledHeight
        );

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(150, 150, 150);
        pdf.rect(margin, margin, contentWidth, contentHeight);

        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${page + 1} of ${totalPages}`,
          imgWidth - 20,
          pageHeight - 10,
          { align: 'right' }
        );

        root.unmount();
        container.removeChild(element);
        container.setAttribute(
          'style',
          'display: none; position: fixed; top: 0; left: 0;'
        );
      }

      pdf.save(`hoss_summary_${new Date().toISOString()}.pdf`);
      toast.success('Summary PDF downloaded successfully');
    } catch (error) {
      console.error('Summary PDF generation error:', error);
      toast.error('Failed to generate summary PDF');
    }
  };

  const handleEdit = (booking: ExtendedBookingDetail) => {
    toast.info(`Edit functionality for ${booking.guestName} to be implemented`);
  };

  const handleBillGenerate = (booking: ExtendedBookingDetail) => {
    toast.info(`Bill generation for ${booking.guestName} to be implemented`);
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const filteredData = useMemo(() => {
    if (!hossBookings || !Array.isArray(hossBookings)) return [];
    let result: ExtendedBookingDetail[] = hossBookings;

    if (filters.status) {
      result = result.filter(
        (item: ExtendedBookingDetail) =>
          item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    if (filters.startDate) {
      result = result.filter(
        (item: ExtendedBookingDetail) =>
          new Date(item.checkIn) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      result = result.filter(
        (item: ExtendedBookingDetail) =>
          new Date(item.checkOut) <= new Date(filters.endDate)
      );
    }
    if (filters.hotel) {
      result = result.filter((item: ExtendedBookingDetail) =>
        item.hotel.toLowerCase().includes(filters.hotel.toLowerCase())
      );
    }
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter(
        (item: ExtendedBookingDetail) =>
          item.guestName.toLowerCase().includes(lowerQuery) ||
          item.hotel.toLowerCase().includes(lowerQuery) ||
          item.plan.toLowerCase().includes(lowerQuery) ||
          item.status.toLowerCase().includes(lowerQuery) ||
          item.contact.toLowerCase().includes(lowerQuery) ||
          item.modeOfPayment.toLowerCase().includes(lowerQuery) ||
          item.toAccount.toLowerCase().includes(lowerQuery) ||
          item.scheme.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [hossBookings, filters, deferredSearchQuery]);

  const totals = useMemo(
    () => ({
      billAmount: filteredData.reduce(
        (sum: number, item: ExtendedBookingDetail) =>
          sum + (item.billAmount || 0),
        0
      ),
      advance: filteredData.reduce(
        (sum: number, item: ExtendedBookingDetail) => sum + (item.advance || 0),
        0
      ),
      due: filteredData.reduce(
        (sum: number, item: ExtendedBookingDetail) => sum + (item.due || 0),
        0
      ),
      cashIn: filteredData.reduce(
        (sum: number, item: ExtendedBookingDetail) => sum + (item.cashIn || 0),
        0
      ),
      cashOut: filteredData.reduce(
        (sum: number, item: ExtendedBookingDetail) => sum + (item.cashOut || 0),
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
    <div className="space-y-8 p-6 w-full">
      <div
        className="pdf-preview-container"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
      >
        {filteredData.map((booking, index) => (
          <div
            key={index}
            id={`hoss-preview-${index}`}
            className="pdf-preview"
            style={{ display: 'none' }}
          >
            <HOSSPreview bookingData={booking} index={index} />
          </div>
        ))}
      </div>
      <div
        className="summary-preview-container"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
      ></div>
      <div
        id="pdf-single-preview"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
      >
        {selectedBooking && <HOSSPreview bookingData={selectedBooking} />}
      </div>
      <div
        id="pdf-single-summary-preview"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
      >
        {selectedBooking && (
          <div className="summary-single-content">
            <HOSSSummaryPreview bookingData={[selectedBooking]} />
          </div>
        )}
      </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
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
                </select>
              </div>
              <div>
                <label
                  htmlFor="hotel"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
                  Hotel
                </label>
                <input
                  type="text"
                  id="hotel"
                  name="hotel"
                  value={filters.hotel}
                  onChange={handleFilterChange}
                  className="input-field w-full rounded-lg text-sm"
                  disabled={isLoading}
                  placeholder="Enter hotel name"
                  aria-label="Filter by Hotel"
                />
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
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
                <label
                  htmlFor="endDate"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 sm:mb-2"
                >
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
          Failed to load HOSS bookings: {error.message}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <motion.button className="btn-secondary fixed top-0 left-0">
                {selectedBooking && (
                  <HOSSPreview bookingData={selectedBooking} />
                )}
              </motion.button>
            </div>

            <div
              id="pdf-single-summary-preview"
              style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
            >
              {selectedBooking && (
                <div className="summary-single-content">
                  <HOSSSummaryPreview bookingData={[selectedBooking]} />
                </div>
              )}
            </div>
          </div>
        </>
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
                  placeholder="Search by guest, contact, hotel, or status"
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
              <div className="relative">
                <motion.button
                  onClick={() => setShowSummaryDropdown(!showSummaryDropdown)}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiDownload size={14} /> Generate Summary
                </motion.button>
                {showSummaryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-[var(--card-bg)] rounded-lg shadow-lg z-10 border border-[var(--border-color)]"
                  >
                    <button
                      onClick={downloadSummaryCSV}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] rounded-t-lg flex items-center gap-2 text-sm"
                    >
                      <FiFileText size={14} /> CSV
                    </button>
                    <button
                      onClick={downloadSummaryJSON}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] flex items-center gap-2 text-sm"
                    >
                      <FiCode size={14} /> JSON
                    </button>
                    <button
                      onClick={downloadSummaryPDF}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] rounded-b-lg flex items-center gap-2 text-sm"
                    >
                      <FiFile size={14} /> PDF
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block glass-card p-6 sm:p-8 rounded-xl mb-8 neumorphic-card max-w-[2200px] mx-auto shadow-glow overflow-x-auto">
            <div className="max-h-[650px] overflow-y-auto scrollbar-thin">
              <table className="modern-table w-full text-left text-sm min-w-[2400px]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="p-4">
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
                    <th className="p-4 min-w-[150px]">Guest Name</th>
                    <th className="p-4 min-w-[120px]">Contact</th>
                    <th className="p-4 min-w-[150px]">Hotel</th>
                    <th className="p-4 min-w-[120px]">Plan</th>
                    <th className="p-4 min-w-[120px]">Check-In</th>
                    <th className="p-4 min-w-[120px]">Check-Out</th>
                    <th className="p-4 min-w-[80px]">Days</th>
                    <th className="p-4 min-w-[80px]">PAX</th>
                    <th className="p-4 min-w-[100px]">Double Bed Count</th>
                    <th className="p-4 min-w-[100px]">Triple Bed Count</th>
                    <th className="p-4 min-w-[100px]">Four Bed Count</th>
                    <th className="p-4 min-w-[100px]">Extra Bed Count</th>
                    <th className="p-4 min-w-[100px]">Kitchen Count</th>
                    <th className="p-4 min-w-[120px]">Double Bed Rate</th>
                    <th className="p-4 min-w-[120px]">Triple Bed Rate</th>
                    <th className="p-4 min-w-[120px]">Four Bed Rate</th>
                    <th className="p-4 min-w-[120px]">Extra Bed Rate</th>
                    <th className="p-4 min-w-[120px]">Kitchen Rate</th>
                    <th className="p-4 min-w-[120px]">Bill Amount</th>
                    <th className="p-4 min-w-[120px]">Advance</th>
                    <th className="p-4 min-w-[120px]">Due</th>
                    <th className="p-4 min-w-[120px]">Status</th>
                    <th className="p-4 min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map(
                      (item: ExtendedBookingDetail, idx: number) => (
                        <motion.tr
                          key={item.guestName + item.checkIn}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`${
                            selectedRows.has((page - 1) * itemsPerPage + idx)
                              ? 'bg-[var(--sidebar-hover)]'
                              : ''
                          }`}
                        >
                          <td className="p-4">
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
                          <td className="p-4 font-medium">{item.guestName}</td>
                          <td className="p-4">{item.contact}</td>
                          <td className="p-4">{item.hotel}</td>
                          <td className="p-4">{item.plan}</td>
                          <td className="p-4">{item.checkIn}</td>
                          <td className="p-4">{item.checkOut}</td>
                          <td className="p-4">{item.day}</td>
                          <td className="p-4">{item.pax || 'N/A'}</td>
                          <td className="p-4">
                            {item.roomName.doubleBed || 0}
                          </td>
                          <td className="p-4">
                            {item.roomName.tripleBed || 0}
                          </td>
                          <td className="p-4">{item.roomName.fourBed || 0}</td>
                          <td className="p-4">{item.roomName.extraBed || 0}</td>
                          <td className="p-4">{item.roomName.kitchen || 0}</td>
                          <td className="p-4">
                            ₹{item.roomRent.doubleBed.toLocaleString()}
                          </td>
                          <td className="p-4">
                            ₹{item.roomRent.tripleBed.toLocaleString()}
                          </td>
                          <td className="p-4">
                            ₹{item.roomRent.fourBed.toLocaleString()}
                          </td>
                          <td className="p-4">
                            ₹{item.roomRent.extraBed.toLocaleString()}
                          </td>
                          <td className="p-4">
                            ₹{item.roomRent.kitchen.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <motion.span
                              className="font-semibold text-blue-400"
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              ₹{item.billAmount?.toLocaleString() || '0'}
                            </motion.span>
                          </td>
                          <td className="p-4">
                            <motion.span
                              className="font-semibold text-emerald-400"
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              ₹{item.advance?.toLocaleString() || '0'}
                            </motion.span>
                          </td>
                          <td className="p-4">
                            <motion.span
                              className="font-semibold text-rose-400"
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              ₹{(item.due || 0).toLocaleString()}
                            </motion.span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`badge badge-${item.status.toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2 items-center">
                            <motion.button
                              onClick={() => openModal(item)}
                              className="btn-primary flex items-center gap-1 px-3 py-1 text-xs rounded-lg shadow-glow"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label={`View details for ${item.guestName}`}
                            >
                              <EyeIcon className="w-4 h-4" /> View
                            </motion.button>
                            <motion.button
                              onClick={() => handleEdit(item)}
                              className="btn-secondary flex items-center gap-1 px-3 py-1 text-xs rounded-lg shadow-glow"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label={`Edit details for ${item.guestName}`}
                            >
                              <PencilIcon className="w-4 h-4" /> Edit
                            </motion.button>
                            <motion.button
                              onClick={() => handleBillGenerate(item)}
                              className="btn-primary flex items-center gap-1 px-3 py-1 text-xs rounded-lg shadow-glow"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label={`Generate bill for ${item.guestName}`}
                            >
                              <DocumentTextIcon className="w-4 h-4" /> Bill
                            </motion.button>
                          </td>
                        </motion.tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={24}
                        className="p-6 text-center text-[var(--text-secondary)]"
                      >
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
                    Total Bill:{' '}
                    <span className="text-blue-400">
                      ₹{totals.billAmount.toLocaleString()}
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
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-In:{' '}
                    <span className="text-teal-400">
                      ₹{totals.cashIn.toLocaleString()}
                    </span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-Out:{' '}
                    <span className="text-orange-400">
                      ₹{totals.cashOut.toLocaleString()}
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

          <div className="md:hidden space-y-4">
            {paginatedData.length > 0 ? (
              paginatedData.map((item: ExtendedBookingDetail, idx: number) => (
                <motion.div
                  key={item.guestName + item.checkIn}
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
                          aria-label={`Select booking for ${item.guestName}`}
                        />
                        <span className="checkbox-indicator"></span>
                      </label>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {item.guestName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => openModal(item)}
                        className="text-[var(--icon-bg-blue)] hover:text-blue-800"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`View details for ${item.guestName}`}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleEdit(item)}
                        className="text-[var(--icon-bg-purple)] hover:text-purple-800"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Edit details for ${item.guestName}`}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleBillGenerate(item)}
                        className="text-[var(--icon-bg-teal)] hover:text-teal-800"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Generate bill for ${item.guestName}`}
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] space-y-2">
                    <p>
                      <span className="font-medium">Contact:</span>{' '}
                      {item.contact}
                    </p>
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
                    <p>
                      <span className="font-medium">Days:</span> {item.day}
                    </p>
                    <p>
                      <span className="font-medium">PAX:</span>{' '}
                      {item.pax || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`badge badge-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </p>
                    <motion.div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        toggleCardExpansion((page - 1) * itemsPerPage + idx)
                      }
                    >
                      <span className="font-medium text-[var(--icon-bg-blue)]">
                        More Details
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
                          className="space-y-2 mt-2"
                        >
                          <p>
                            <span className="font-medium">Rooms:</span> Double
                            Bed={item.roomName.doubleBed || 0}, Triple Bed=
                            {item.roomName.tripleBed || 0}, Four Bed=
                            {item.roomName.fourBed || 0}, Extra Bed=
                            {item.roomName.extraBed || 0}, Kitchen=
                            {item.roomName.kitchen || 0}
                          </p>
                          <p>
                            <span className="font-medium">Room Rates:</span>{' '}
                            Double Bed=₹
                            {item.roomRent.doubleBed.toLocaleString()}, Triple
                            Bed=₹{item.roomRent.tripleBed.toLocaleString()},
                            Four Bed=₹{item.roomRent.fourBed.toLocaleString()},
                            Extra Bed=₹{item.roomRent.extraBed.toLocaleString()}
                            , Kitchen=₹{item.roomRent.kitchen.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Discount:</span>{' '}
                            Double Bed=₹
                            {item.discount.doubleBed.toLocaleString()}, Triple
                            Bed=₹{item.discount.tripleBed.toLocaleString()},
                            Four Bed=₹{item.discount.fourBed.toLocaleString()},
                            Extra Bed=₹{item.discount.extraBed.toLocaleString()}
                            , Kitchen=₹{item.discount.kitchen.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Bill Amount:</span> ₹
                            {item.billAmount?.toLocaleString() || '0'}
                          </p>
                          <p>
                            <span className="font-medium">Advance:</span> ₹
                            {item.advance?.toLocaleString() || '0'}
                          </p>
                          <p>
                            <span className="font-medium">Due:</span> ₹
                            {(item.due || 0).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Cash-In:</span> ₹
                            {item.cashIn?.toLocaleString() || '0'}
                          </p>
                          <p>
                            <span className="font-medium">Cash-Out:</span> ₹
                            {item.cashOut?.toLocaleString() || '0'}
                          </p>
                          <p>
                            <span className="font-medium">
                              Mode of Payment:
                            </span>{' '}
                            {item.modeOfPayment}
                          </p>
                          <p>
                            <span className="font-medium">Date:</span>{' '}
                            {item.dateBooked}
                          </p>
                          <p>
                            <span className="font-medium">To Account:</span>{' '}
                            {item.toAccount}
                          </p>
                          <p>
                            <span className="font-medium">Scheme:</span>{' '}
                            {item.scheme}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-4 rounded-xl text-center text-[var(--text)]">
                No bookings found
              </div>
            )}
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
                    Total Bill:{' '}
                    <span className="text-blue-400">
                      ₹{totals.billAmount.toLocaleString()}
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
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-In:{' '}
                    <span className="text-teal-400">
                      ₹{totals.cashIn.toLocaleString()}
                    </span>
                  </motion.span>
                  <motion.span
                    className="font-semibold"
                    whileHover={{ scale: 1.02 }}
                  >
                    Cash-Out:{' '}
                    <span className="text-orange-400">
                      ₹{totals.cashOut.toLocaleString()}
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

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={{
              overlay: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
              },
              content: {
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '800px',
                padding: '24px',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
              },
            }}
            contentLabel="Booking Details"
          >
            {selectedBooking && (
              <div className="relative">
                <motion.button
                  onClick={closeModal}
                  className="absolute top-0 right-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close modal"
                >
                  <FiX size={24} />
                </motion.button>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                  Booking Details
                </h2>
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <p>
                    <span className="font-medium">Guest:</span>{' '}
                    {selectedBooking.guestName}
                  </p>
                  <p>
                    <span className="font-medium">Contact:</span>{' '}
                    {selectedBooking.contact}
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
                    <span className="font-medium">Days:</span>{' '}
                    {selectedBooking.day}
                  </p>
                  <p>
                    <span className="font-medium">PAX:</span>{' '}
                    {selectedBooking.pax || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Rooms:</span> Double Bed=
                    {selectedBooking.roomName.doubleBed || 0}, Triple Bed=
                    {selectedBooking.roomName.tripleBed || 0}, Four Bed=
                    {selectedBooking.roomName.fourBed || 0}, Extra Bed=
                    {selectedBooking.roomName.extraBed || 0}, Kitchen=
                    {selectedBooking.roomName.kitchen || 0}
                  </p>
                  <p>
                    <span className="font-medium">Room Rates:</span> Double
                    Bed=₹
                    {selectedBooking.roomRent.doubleBed.toLocaleString()},
                    Triple Bed=₹
                    {selectedBooking.roomRent.tripleBed.toLocaleString()}, Four
                    Bed=₹{selectedBooking.roomRent.fourBed.toLocaleString()},
                    Extra Bed=₹
                    {selectedBooking.roomRent.extraBed.toLocaleString()},
                    Kitchen=₹
                    {selectedBooking.roomRent.kitchen.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Discount:</span> Double Bed=₹
                    {selectedBooking.discount.doubleBed.toLocaleString()},
                    Triple Bed=₹
                    {selectedBooking.discount.tripleBed.toLocaleString()}, Four
                    Bed=₹{selectedBooking.discount.fourBed.toLocaleString()},
                    Extra Bed=₹
                    {selectedBooking.discount.extraBed.toLocaleString()},
                    Kitchen=₹
                    {selectedBooking.discount.kitchen.toLocaleString()}
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
                    <span className="font-medium">Advance:</span> ₹
                    {selectedBooking.advance?.toLocaleString() || '0'}
                  </p>
                  <p>
                    <span className="font-medium">Bill Amount:</span> ₹
                    {selectedBooking.billAmount?.toLocaleString() || '0'}
                  </p>
                  <p>
                    <span className="font-medium">Due:</span> ₹
                    {(selectedBooking.due || 0).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Cash-In:</span> ₹
                    {selectedBooking.cashIn?.toLocaleString() || '0'}
                  </p>
                  <p>
                    <span className="font-medium">Cash-Out:</span> ₹
                    {selectedBooking.cashOut?.toLocaleString() || '0'}
                  </p>
                  <p>
                    <span className="font-medium">Mode of Payment:</span>{' '}
                    {selectedBooking.modeOfPayment}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {selectedBooking.dateBooked}
                  </p>
                  <p>
                    <span className="font-medium">To Account:</span>{' '}
                    {selectedBooking.toAccount}
                  </p>
                  <p>
                    <span className="font-medium">Scheme:</span>{' '}
                    {selectedBooking.scheme}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <motion.button
                    onClick={copyBookingDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiCopy size={16} /> Copy Details
                  </motion.button>
                  <motion.button
                    onClick={printBookingDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiDownload size={16} /> Download PDF
                  </motion.button>
                  <motion.button
                    onClick={printSummaryDetails}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiDownload size={16} /> Download Summary
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