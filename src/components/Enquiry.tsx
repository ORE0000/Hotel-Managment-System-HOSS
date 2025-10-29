import { useQuery } from '@tanstack/react-query';
import { fetchEnquiryData, fetchHotels } from '../services/ApiService';
import { Enquiry } from '../types';
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
import EnquiryPreview from './PdfPreview/EnquiryPreview';
import EnquirySummaryPreview from './PdfPreview/EnquirySummaryPreview';
import { createRoot } from 'react-dom/client';
import './BillingSystem/Billing.css';
import './PdfPreview/Summary.css';
import DrawerEdit from './DrawerEdit/DrawerEdit';

Modal.setAppElement('#root');

const EnquiryPage: React.FC = () => {
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
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSummaryDropdown, setShowSummaryDropdown] = useState(false);
  const itemsPerPage = 10;
  const itemsPerPagePDF = 4;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<any>(null);

  // ──────────────────────────────────────────────────────────────────────
  // <<< ADD THESE LOGS >>>
  useEffect(() => {
    console.log('%c[Drawer] drawerOpen =', 'color: cyan', drawerOpen);
    console.log(
      '%c[Drawer] selectedBookingId =',
      'color: yellow',
      selectedBookingId
    );
  }, [drawerOpen, selectedBookingId]);
  // ──────────────────────────────────────────────────────────────────────

  const {
    data: enquiries,
    error,
    isLoading,
    isSuccess,
    isError,
    refetch,
  } = useQuery<Enquiry[], Error>({
    queryKey: ['enquiries'],
    queryFn: fetchEnquiryData,
    retry: 2,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Enquiries loaded successfully');
    } else if (isError && error) {
      toast.error(`Failed to load enquiries: ${error.message}`);
    }
  }, [isSuccess, isError, error]);

  const {
    data: hotels,
    error: hotelsError,
    isError: isHotelsError,
  } = useQuery<string[]>({
    queryKey: ['hotels'],
    queryFn: fetchHotels,
    retry: 2,
  });

  useEffect(() => {
    if (isHotelsError && hotelsError) {
      toast.error(`Failed to load hotels: ${hotelsError.message}`);
    }
  }, [isHotelsError, hotelsError]);

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
      const allIndices = filteredData.map((_: Enquiry, idx: number) => idx);
      setSelectedRows(new Set(allIndices));
    }
  };

  const copySelectedRows = () => {
    const selectedData = filteredData.filter((_: Enquiry, idx: number) =>
      selectedRows.has(idx)
    );
    if (selectedData.length === 0) {
      toast.warn('No rows selected to copy');
      return;
    }
    const text = selectedData
      .map(
        (item: Enquiry) => `
Enquiry Details for ${item.guestName}
==================
Guest Information:
- Name: ${item.guestName}
- Contact: ${item.contact || 'N/A'}
- Hotel: ${item.hotel}

Booking Details:
- Check-In: ${item.checkIn}
- Check-Out: ${item.checkOut}
- Duration: ${item.day} days
- PAX: ${item.pax}
- Status: ${item.status}

Room Details:
${Number(item.roomName.doubleBed) > 0 ? `- Double Bed: ${item.roomName.doubleBed} (Rate: ₹${item.roomRent.doubleBed.toLocaleString()}, Discount: ₹${Number(item.discount.doubleBed) > 0 ? item.discount.doubleBed.toLocaleString() : ''})` : ''}
${Number(item.roomName.tripleBed) > 0 ? `- Triple Bed: ${item.roomName.tripleBed} (Rate: ₹${item.roomRent.tripleBed.toLocaleString()}, Discount: ₹${Number(item.discount.tripleBed) > 0 ? item.discount.tripleBed.toLocaleString() : ''})` : ''}
${Number(item.roomName.fourBed) > 0 ? `- Four Bed: ${item.roomName.fourBed} (Rate: ₹${item.roomRent.fourBed.toLocaleString()}, Discount: ₹${Number(item.discount.fourBed) > 0 ? item.discount.fourBed.toLocaleString() : ''})` : ''}
${Number(item.roomName.extraBed) > 0 ? `- Extra Bed: ${item.roomName.extraBed} (Rate: ₹${item.roomRent.extraBed.toLocaleString()}, Discount: ₹${Number(item.discount.extraBed) > 0 ? item.discount.extraBed.toLocaleString() : ''})` : ''}
${Number(item.roomName.kitchen) > 0 ? `- Kitchen: ${item.roomName.kitchen} (Rate: ₹${item.roomRent.kitchen.toLocaleString()}, Discount: ₹${Number(item.discount.kitchen) > 0 ? item.discount.kitchen.toLocaleString() : ''})` : ''}

Financial Summary:
- Total Bill: ₹${item.billAmount.toLocaleString()}
- Advance Paid: ₹${item.advance.toLocaleString()}
- Due Amount: ₹${item.due.toLocaleString()}
- Cash-In: ₹${item.cashIn.toLocaleString()}
- Cash-Out: ₹${item.cashOut.toLocaleString()}
- Payment Mode: ${item.modeOfPayment}
- To Account: ${item.toAccount || 'N/A'}
- Scheme: ${item.scheme || 'N/A'}
- Date: ${item.date || ''}

Generated by: ${item.hotel}
on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Selected rows copied to clipboard');
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
    const text = `
Enquiry Details for ${selectedEnquiry.guestName}
==================
Guest Information:
- Name: ${selectedEnquiry.guestName}
- Contact: ${selectedEnquiry.contact || 'N/A'}
- Hotel: ${selectedEnquiry.hotel}

Booking Details:
- Check-In: ${selectedEnquiry.checkIn}
- Check-Out: ${selectedEnquiry.checkOut}
- Duration: ${selectedEnquiry.day} days
- PAX: ${selectedEnquiry.pax}
- Status: ${selectedEnquiry.status}

Room Details:
${Number(selectedEnquiry.roomName.doubleBed) > 0 ? `- Double Bed: ${selectedEnquiry.roomName.doubleBed} (Rate: ₹${selectedEnquiry.roomRent.doubleBed.toLocaleString()}, Discount: ₹${Number(selectedEnquiry.discount.doubleBed) > 0 ? selectedEnquiry.discount.doubleBed.toLocaleString() : ''})` : ''}
${Number(selectedEnquiry.roomName.tripleBed) > 0 ? `- Triple Bed: ${selectedEnquiry.roomName.tripleBed} (Rate: ₹${selectedEnquiry.roomRent.tripleBed.toLocaleString()}, Discount: ₹${Number(selectedEnquiry.discount.tripleBed) > 0 ? selectedEnquiry.discount.tripleBed.toLocaleString() : ''})` : ''}
${Number(selectedEnquiry.roomName.fourBed) > 0 ? `- Four Bed: ${selectedEnquiry.roomName.fourBed} (Rate: ₹${selectedEnquiry.roomRent.fourBed.toLocaleString()}, Discount: ₹${Number(selectedEnquiry.discount.fourBed) > 0 ? selectedEnquiry.discount.fourBed.toLocaleString() : ''})` : ''}
${Number(selectedEnquiry.roomName.extraBed) > 0 ? `- Extra Bed: ${selectedEnquiry.roomName.extraBed} (Rate: ₹${selectedEnquiry.roomRent.extraBed.toLocaleString()}, Discount: ₹${Number(selectedEnquiry.discount.extraBed) > 0 ? selectedEnquiry.discount.extraBed.toLocaleString() : ''})` : ''}
${Number(selectedEnquiry.roomName.kitchen) > 0 ? `- Kitchen: ${selectedEnquiry.roomName.kitchen} (Rate: ₹${selectedEnquiry.roomRent.kitchen.toLocaleString()}, Discount: ₹${Number(selectedEnquiry.discount.kitchen) > 0 ? selectedEnquiry.discount.kitchen.toLocaleString() : ''})` : ''}

Financial Summary:
- Total Bill: ₹${selectedEnquiry.billAmount.toLocaleString()}
- Advance Paid: ₹${selectedEnquiry.advance.toLocaleString()}
- Due Amount: ₹${selectedEnquiry.due.toLocaleString()}
- Cash-In: ₹${selectedEnquiry.cashIn.toLocaleString()}
- Cash-Out: ₹${selectedEnquiry.cashOut.toLocaleString()}
- Payment Mode: ${selectedEnquiry.modeOfPayment}
- To Account: ${selectedEnquiry.toAccount || 'N/A'}
- Scheme: ${selectedEnquiry.scheme || 'N/A'}
- Date: ${selectedEnquiry.date || ''}

Generated by: ${selectedEnquiry.hotel}
on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
`;
    navigator.clipboard.writeText(text);
    toast.success('Enquiry details copied to clipboard');
  };

  const printEnquiryDetails = async () => {
    if (!selectedEnquiry) return;
    const element = document.getElementById('pdf-single-preview');
    if (!element) {
      toast.error('Enquiry preview element not found');
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
        `enquiry_${selectedEnquiry.guestName}_${selectedEnquiry.checkIn}.pdf`
      );
      toast.success('Enquiry details downloaded as PDF');
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
    if (!selectedEnquiry) return;
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

      console.log('Element dimensions before html2canvas:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
      });

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
        `summary_${selectedEnquiry.guestName}_${selectedEnquiry.checkIn}.pdf`
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
        ? filteredData.filter((_: Enquiry, idx: number) =>
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
      'Bill Amount',
      'Advance',
      'Due',
      'Cash-In',
      'Mode of Payment',
      'Cash-Out',
      'Date',
      'To Account',
      'Scheme',
      'Status',
    ];
    const rows = data.map((item: Enquiry) => [
      item.guestName,
      item.contact,
      item.hotel,
      item.checkIn,
      item.checkOut,
      item.day,
      item.pax,
      item.roomName.doubleBed,
      item.roomName.tripleBed,
      item.roomName.fourBed,
      item.roomName.extraBed,
      item.roomName.kitchen,
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
      item.billAmount,
      item.advance,
      item.due,
      item.cashIn,
      item.modeOfPayment,
      item.cashOut,
      item.date,
      item.toAccount,
      item.scheme,
      item.status,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enquiries_${new Date().toISOString()}.csv`;
    link.click();
    toast.success('CSV downloaded successfully');
  };

  const downloadJSON = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: Enquiry, idx: number) =>
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
    link.download = `enquiries_${new Date().toISOString()}.json`;
    link.click();
    toast.success('JSON downloaded successfully');
  };

  const downloadSummaryCSV = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: Enquiry, idx: number) =>
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
    const rows = data.map((item: Enquiry) => [
      item.guestName,
      item.hotel,
      item.pax,
      item.roomName.doubleBed,
      item.roomName.tripleBed,
      item.roomName.fourBed,
      item.roomName.extraBed,
      item.roomName.kitchen,
      item.checkIn,
      item.checkOut,
      item.plan || 'N/A',
      item.billAmount,
      item.advance,
      item.cashIn,
      item.billAmount - item.advance - item.cashIn,
      item.status,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary_${new Date().toISOString()}.csv`;
    link.click();
    toast.success('Summary CSV downloaded successfully');
  };

  const downloadSummaryJSON = () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: Enquiry, idx: number) =>
            selectedRows.has(idx)
          )
        : filteredData;
    if (data.length === 0) {
      toast.warn('No data available to download');
      return;
    }
    const summaryData = data.map((item: Enquiry) => ({
      guestName: item.guestName,
      hotel: item.hotel,
      pax: item.pax,
      doubleBedCount: item.roomName.doubleBed,
      tripleBedCount: item.roomName.tripleBed,
      fourBedCount: item.roomName.fourBed,
      extraBedCount: item.roomName.extraBed,
      kitchenCount: item.roomName.kitchen,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      plan: item.plan || 'N/A',
      billAmount: item.billAmount,
      advance: item.advance,
      cashIn: item.cashIn,
      due: item.billAmount - item.advance - item.cashIn,
      status: item.status,
    }));
    const jsonContent = JSON.stringify(summaryData, null, 2);
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary_${new Date().toISOString()}.json`;
    link.click();
    toast.success('Summary JSON downloaded successfully');
  };

  const downloadPDF = async () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: Enquiry, idx: number) =>
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

      const indices =
        selectedRows.size > 0
          ? Array.from(selectedRows)
          : filteredData.map((_, idx) => idx);

      for (let i = 0; i < indices.length; i++) {
        const originalIndex = indices[i];
        const element = document.getElementById(
          `enquiry-preview-${originalIndex}`
        );
        if (!element) {
          console.warn(`Element enquiry-preview-${originalIndex} not found`);
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
          console.warn(`Canvas for enquiry ${originalIndex} is empty`);
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

      pdf.save(`enquiries_${new Date().toISOString()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Multiple enquiries PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const downloadSummaryPDF = async () => {
    const data =
      selectedRows.size > 0
        ? filteredData.filter((_: Enquiry, idx: number) =>
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
        root.render(<EnquirySummaryPreview enquiryData={pageData} />);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log('Element dimensions before html2canvas:', {
          width: element.offsetWidth,
          height: element.offsetHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
        });

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

      pdf.save(`summary_${new Date().toISOString()}.pdf`);
      toast.success('Summary PDF downloaded successfully');
    } catch (error) {
      console.error('Summary PDF generation error:', error);
      toast.error('Failed to generate summary PDF');
    }
  };

  const handleEdit = (enquiry: Enquiry) => {
    toast.info(`Edit functionality for ${enquiry.guestName} to be implemented`);
  };

  const handleBillGenerate = (enquiry: Enquiry) => {
    toast.info(`Bill generation for ${enquiry.guestName} to be implemented`);
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const filteredData = useMemo(() => {
    if (!enquiries || !Array.isArray(enquiries)) return [];
    let result: Enquiry[] = enquiries;

    if (filters.status) {
      result = result.filter(
        (item: Enquiry) =>
          item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    if (filters.startDate) {
      result = result.filter(
        (item: Enquiry) => new Date(item.checkIn) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      result = result.filter(
        (item: Enquiry) => new Date(item.checkOut) <= new Date(filters.endDate)
      );
    }
    if (filters.hotel) {
      result = result.filter((item: Enquiry) =>
        item.hotel.toLowerCase().includes(filters.hotel.toLowerCase())
      );
    }
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      result = result.filter(
        (item: Enquiry) =>
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
      billAmount: filteredData.reduce(
        (sum: number, item: Enquiry) => sum + (item.billAmount || 0),
        0
      ),
      advance: filteredData.reduce(
        (sum: number, item: Enquiry) => sum + (item.advance || 0),
        0
      ),
      due: filteredData.reduce(
        (sum: number, item: Enquiry) => sum + (item.due || 0),
        0
      ),
      cashIn: filteredData.reduce(
        (sum: number, item: Enquiry) => sum + (item.cashIn || 0),
        0
      ),
      cashOut: filteredData.reduce(
        (sum: number, item: Enquiry) => sum + (item.cashOut || 0),
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
        {filteredData.map((enquiry, index) => (
          <div
            key={index}
            id={`enquiry-preview-${index}`}
            className="pdf-preview"
            style={{ display: 'none' }}
          >
            <EnquiryPreview enquiryData={enquiry} index={index} />
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
        {selectedEnquiry && <EnquiryPreview enquiryData={selectedEnquiry} />}
      </div>
      <div
        id="pdf-single-summary-preview"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0 }}
      >
        {selectedEnquiry && (
          <div className="summary-single-content">
            <EnquirySummaryPreview enquiryData={[selectedEnquiry]} />
          </div>
        )}
      </div>

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
                    <option key={hotel} value={hotel}>
                      {hotel}
                    </option>
                  ))}
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
                    paginatedData.map((item: Enquiry, idx: number) => (
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
                        <td className="p-4">{item.checkIn}</td>
                        <td className="p-4">{item.checkOut}</td>
                        <td className="p-4">{item.day}</td>
                        <td className="p-4">{item.pax}</td>
                        <td className="p-4">{item.roomName.doubleBed}</td>
                        <td className="p-4">{item.roomName.tripleBed}</td>
                        <td className="p-4">{item.roomName.fourBed}</td>
                        <td className="p-4">{item.roomName.extraBed}</td>
                        <td className="p-4">{item.roomName.kitchen}</td>
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
                            ₹{item.billAmount.toLocaleString()}
                          </motion.span>
                        </td>
                        <td className="p-4">
                          <motion.span
                            className="font-semibold text-emerald-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.advance.toLocaleString()}
                          </motion.span>
                        </td>
                        <td className="p-4">
                          <motion.span
                            className="font-semibold text-rose-400"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ₹{item.due.toLocaleString()}
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
                            aria-label="View enquiry"
                          >
                            <EyeIcon className="w-5 h-5 text-[var(--icon-bg-blue)]" />{' '}
                            View
                          </motion.button>
                          {/* ──────────────────────────────────────
                          <motion.button
                            onClick={() => {
                              const cleanHotel = item.hotel
                                .split('/')[0]
                                .trim();
                              console.log(
                                '%c[Edit Click] Opening drawer',
                                'color: purple',
                                { item, cleanHotel }
                              );

                              setSelectedBookingId({
                                guestName: item.guestName,
                                hotelName: cleanHotel,
                                checkIn: item.checkIn,
                                sheetName: 'ENQRY',
                              });
                              setDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--card-bg)] transition"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Edit ${item.guestName}`}
                          >
                            <PencilIcon className="w-4 h-4" /> Edit
                            
                          </motion.button>
                           */}
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
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={23}
                        className="p-6 text-center text-[var(--text-secondary)]"
                      >
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
              paginatedData.map((item: Enquiry, idx: number) => (
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
                          aria-label={`Select enquiry for ${item.guestName}`}
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
                        aria-label="View enquiry"
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
                      <span className="font-medium">PAX:</span> {item.pax}
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
                            Bed={item.roomName.doubleBed}, Triple Bed=
                            {item.roomName.tripleBed}, Four Bed=
                            {item.roomName.fourBed}, Extra Bed=
                            {item.roomName.extraBed}, Kitchen=
                            {item.roomName.kitchen}
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
                            {item.billAmount.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Advance:</span> ₹
                            {item.advance.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Due:</span> ₹
                            {item.due.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Cash-In:</span> ₹
                            {item.cashIn.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">
                              Mode of Payment:
                            </span>{' '}
                            {item.modeOfPayment}
                          </p>
                          <p>
                            <span className="font-medium">Cash-Out:</span> ₹
                            {item.cashOut.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Date:</span>{' '}
                            {item.date}
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
        </>
      )}
      {/* ────────────────────────────────────── */}
      {/* DRAWER EDIT – MUST BE HERE (GLOBAL) */}
      {drawerOpen && selectedBookingId && (
        <DrawerEdit
          isOpen={drawerOpen}
          onClose={() => {
            console.log('%c[Drawer] Closed', 'color: red');
            setDrawerOpen(false);
          }}
          bookingIdentifier={selectedBookingId}
          onUpdateSuccess={() => {
            refetch();
            toast.success('Booking updated!');
          }}
        />
      )}
      {/* ────────────────────────────────────── */}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          },
        }}
        contentLabel="Enquiry Details Modal"
      >
        <div className="relative">
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
          {selectedEnquiry && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] text-center">
                Guest Enquiry Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Name:</strong> {selectedEnquiry.guestName}
                    </p>
                    <p>
                      <strong>Contact:</strong>{' '}
                      {selectedEnquiry.contact || 'N/A'}
                    </p>
                    <p>
                      <strong>Hotel:</strong> {selectedEnquiry.hotel}
                    </p>
                    <p>
                      <strong>PAX:</strong> {selectedEnquiry.pax}
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Check-In:</strong> {selectedEnquiry.checkIn}
                    </p>
                    <p>
                      <strong>Check-Out:</strong> {selectedEnquiry.checkOut}
                    </p>
                    <p>
                      <strong>Duration:</strong> {selectedEnquiry.day} days
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span
                        className={`badge badge-${selectedEnquiry.status.toLowerCase()}`}
                      >
                        {selectedEnquiry.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm col-span-1 md:col-span-2">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Room Details
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Number(selectedEnquiry.roomName.doubleBed) > 0 && (
                      <div>
                        <p>
                          <strong>Double Bed:</strong>{' '}
                          {selectedEnquiry.roomName.doubleBed} (Rate: ₹
                          {selectedEnquiry.roomRent.doubleBed.toLocaleString()}
                          {Number(selectedEnquiry.discount.doubleBed) > 0
                            ? `, Discount: ₹${selectedEnquiry.discount.doubleBed.toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(selectedEnquiry.roomName.tripleBed) > 0 && (
                      <div>
                        <p>
                          <strong>Triple Bed:</strong>{' '}
                          {selectedEnquiry.roomName.tripleBed} (Rate: ₹
                          {selectedEnquiry.roomRent.tripleBed.toLocaleString()}
                          {Number(selectedEnquiry.discount.tripleBed) > 0
                            ? `, Discount: ₹${selectedEnquiry.discount.tripleBed.toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(selectedEnquiry.roomName.fourBed) > 0 && (
                      <div>
                        <p>
                          <strong>Four Bed:</strong>{' '}
                          {selectedEnquiry.roomName.fourBed} (Rate: ₹
                          {selectedEnquiry.roomRent.fourBed.toLocaleString()}
                          {Number(selectedEnquiry.discount.fourBed) > 0
                            ? `, Discount: ₹${selectedEnquiry.discount.fourBed.toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(selectedEnquiry.roomName.extraBed) > 0 && (
                      <div>
                        <p>
                          <strong>Extra Bed:</strong>{' '}
                          {selectedEnquiry.roomName.extraBed} (Rate: ₹
                          {selectedEnquiry.roomRent.extraBed.toLocaleString()}
                          {Number(selectedEnquiry.discount.extraBed) > 0
                            ? `, Discount: ₹${selectedEnquiry.discount.extraBed.toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                    {Number(selectedEnquiry.roomName.kitchen) > 0 && (
                      <div>
                        <p>
                          <strong>Kitchen:</strong>{' '}
                          {selectedEnquiry.roomName.kitchen} (Rate: ₹
                          {selectedEnquiry.roomRent.kitchen.toLocaleString()}
                          {Number(selectedEnquiry.discount.kitchen) > 0
                            ? `, Discount: ₹${selectedEnquiry.discount.kitchen.toLocaleString()}`
                            : ''}
                          )
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm col-span-1 md:col-span-2">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <p>
                      <strong>Total Bill:</strong>{' '}
                      <span className="text-blue-400 font-semibold">
                        ₹{selectedEnquiry.billAmount.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <strong>Advance Paid:</strong>{' '}
                      <span className="text-emerald-400 font-semibold">
                        ₹{selectedEnquiry.advance.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <strong>Due Amount:</strong>{' '}
                      <span className="text-rose-400 font-semibold">
                        ₹{selectedEnquiry.due.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <strong>Cash-In:</strong>{' '}
                      <span className="text-teal-400">
                        ₹{selectedEnquiry.cashIn.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <strong>Cash-Out:</strong>{' '}
                      <span className="text-orange-400">
                        ₹{selectedEnquiry.cashOut.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>Mode:</strong> {selectedEnquiry.modeOfPayment}
                    </p>
                    <p>
                      <strong>To Account:</strong>{' '}
                      {selectedEnquiry.toAccount || 'N/A'}
                    </p>
                    <p>
                      <strong>Date:</strong> {selectedEnquiry.date || 'N/A'}
                    </p>
                    <p>
                      <strong>Scheme:</strong> {selectedEnquiry.scheme || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <motion.button
                  onClick={copyEnquiryDetails}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Copy enquiry details"
                >
                  <FiCopy size={16} /> Copy Details
                </motion.button>

                <motion.button
                  onClick={printEnquiryDetails}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Download enquiry PDF"
                >
                  <FiDownload size={16} /> Download PDF
                </motion.button>

                <motion.button
                  onClick={printSummaryDetails}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Download summary PDF"
                >
                  <FiDownload size={16} /> Summary PDF
                </motion.button>

                {/* ✏️ Edit Button — Added beside the other 3 */}
                <motion.button
                  onClick={() => {
                    const cleanHotel =
                      selectedEnquiry?.hotel?.split('/')[0]?.trim() || '';
                    setSelectedBookingId({
                      guestName: selectedEnquiry?.guestName || '',
                      hotelName: cleanHotel,
                      checkIn: selectedEnquiry?.checkIn || '',
                      sheetName: 'ENQRY',
                    });
                    setDrawerOpen(true);
                    closeModal(); // ✅ close modal when drawer opens
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium shadow-glow text-white 
                        bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 
                        transition-all duration-200 active:scale-95"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="Edit enquiry"
                >
                  <PencilIcon className="w-4 h-4" /> Edit Booking
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EnquiryPage;
