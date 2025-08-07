import React, { useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHOSSBookings, fetchEnquiryData } from '../services/ApiService';
import { ExtendedBookingDetail, Enquiry } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { format, parseISO, getMonth, getYear, subYears, addMonths } from 'date-fns';
import { toast } from 'react-toastify';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPercent, FiToggleLeft, FiToggleRight, FiDownload, FiSearch, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { debounce } from 'lodash';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const FinancialDashboard: React.FC = () => {
  const [dataSource, setDataSource] = useState<'HOSS' | 'AllHotels'>('HOSS');
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [hotelFilter, setHotelFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Fetch HOSS Bookings (Hotel Om Shiv Shankar)
  const { data: hossBookings, error: hossError, isLoading: hossLoading } = useQuery<ExtendedBookingDetail[], Error>({
    queryKey: ['hossBookings'],
    queryFn: () => fetchHOSSBookings({}),
    retry: 2,
  });

  // Fetch Enquiries (All Hotels)
  const { data: enquiries, error: enquiryError, isLoading: enquiryLoading } = useQuery<Enquiry[], Error>({
    queryKey: ['enquiries'],
    queryFn: fetchEnquiryData,
    retry: 2,
  });

  // Debounced hotel filter handler
  const debouncedHotelFilter = useMemo(
    () => debounce((value: string) => setHotelFilter(value), 100),
    []
  );

  // Handle multiple hotel selection
  const handleHotelSelection = (hotel: string) => {
    setSelectedHotels((prev) =>
      prev.includes(hotel)
        ? prev.filter((h) => h !== hotel)
        : [...prev, hotel]
    );
  };

  // Calculate financial metrics
  const calculateFinancialMetrics = (
    data: (ExtendedBookingDetail | Enquiry)[] | undefined,
    isHOSS: boolean,
    selectedHotels: string[]
  ) => {
    if (!data || !Array.isArray(data)) {
      return {
        totalRevenue: 0,
        totalAdvance: 0,
        totalDue: 0,
        totalExpenses: 0,
        profitLoss: 0,
        profitMargin: 0,
        monthlyTrends: [],
        cashFlow: { inflows: [], outflows: [] },
        expenseBreakdown: { staff: 0, utilities: 0, maintenance: 0, others: 0 },
        hotelRevenueBreakdown: new Map<string, number>(),
        yoyComparison: { currentYear: 0, previousYear: 0, growth: 0 },
        forecast: [],
        kpis: { avgBookingValue: 0, enquiryConversionRate: 0, cancellationRate: 0 },
        recommendations: [],
      };
    }

    // Filter data for HOSS or selected hotels
    const filteredData = isHOSS
      ? data.filter((item: any) => item.hotel === 'HOSS')
      : selectedHotels.length > 0
        ? data.filter((item: any) => selectedHotels.includes(item.hotel))
        : data;

    // Calculate total revenue, advance, due
    const totalRevenue = filteredData
      .filter((item: any) => item.status !== 'Cancelled')
      .reduce((sum, item: any) => sum + (item.billAmount || 0), 0);

    const totalAdvance = filteredData
      .filter((item: any) => item.status !== 'Cancelled')
      .reduce((sum, item: any) => sum + (item.advance || 0), 0);

    const totalDue = filteredData
      .filter((item: any) => item.status !== 'Cancelled')
      .reduce((sum, item: any) => sum + (item.due || 0), 0);

    // Estimated expenses
    const expenseBreakdown = {
      staff: totalRevenue * 0.15,
      utilities: totalRevenue * 0.07,
      maintenance: totalRevenue * 0.05,
      others: totalRevenue * 0.03,
    };
    const totalExpenses = Object.values(expenseBreakdown).reduce((sum, val) => sum + val, 0);
    const profitLoss = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;

    // Monthly revenue trends
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const monthData = filteredData.filter((item: any) => {
        const date = parseISO(item.checkIn);
        return getMonth(date) === i && item.status !== 'Cancelled';
      });
      return monthData.reduce((sum, item: any) => sum + (item.billAmount || 0), 0);
    });

    // Cash flow analysis
    const cashFlow = {
      inflows: Array.from({ length: 12 }, (_, i) => {
        const monthData = filteredData.filter((item: any) => {
          const date = parseISO(item.checkIn);
          return getMonth(date) === i && item.status !== 'Cancelled';
        });
        return monthData.reduce((sum, item: any) => sum + ((item.advance || 0) + (item.cashIn || 0)), 0);
      }),
      outflows: Array.from({ length: 12 }, (_, i) => {
        const monthData = filteredData.filter((item: any) => {
          const date = parseISO(item.checkIn);
          return getMonth(date) === i && item.status !== 'Cancelled';
        });
        return monthData.reduce((sum, item: any) => sum + ((item.cashOut || 0) + (monthlyTrends[i] * 0.3)), 0);
      }),
    };

    // Hotel revenue breakdown (for AllHotels)
    const hotelRevenueBreakdown = new Map<string, number>();
    if (!isHOSS && selectedHotels.length === 0) {
      data
        .filter((item: any) => item.status !== 'Cancelled')
        .forEach((item: any) => {
          const hotel = item.hotel || 'Unknown';
          const currentRevenue = hotelRevenueBreakdown.get(hotel) || 0;
          hotelRevenueBreakdown.set(hotel, currentRevenue + (item.billAmount || 0));
        });
    }

    // Year-over-Year comparison
    const currentYear = getYear(new Date());
    const currentYearRevenue = filteredData
      .filter((item: any) => getYear(parseISO(item.checkIn)) === currentYear && item.status !== 'Cancelled')
      .reduce((sum, item: any) => sum + (item.billAmount || 0), 0);
    const previousYearRevenue = filteredData
      .filter((item: any) => getYear(parseISO(item.checkIn)) === currentYear - 1 && item.status !== 'Cancelled')
      .reduce((sum, item: any) => sum + (item.billAmount || 0), 0);
    const yoyGrowth = previousYearRevenue > 0 ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100 : 0;

    // 3-month revenue forecast
    const lastSixMonthsRevenue = monthlyTrends.slice(-6).filter(val => val > 0);
    const avgMonthlyRevenue = lastSixMonthsRevenue.length > 0
      ? lastSixMonthsRevenue.reduce((sum, val) => sum + val, 0) / lastSixMonthsRevenue.length
      : 0;
    const forecast = Array.from({ length: 3 }, (_, i) => ({
      month: format(addMonths(new Date(), i + 1), 'MMM yyyy'),
      projectedRevenue: avgMonthlyRevenue * (1 + (yoyGrowth / 100) * (i + 1) / 12),
    }));

    // KPIs
    const totalBookings = filteredData.filter((item: any) => item.status !== 'Cancelled').length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const cancelledItems = filteredData.filter((item: any) => item.status === 'Cancelled').length;
    const cancellationRate = (totalBookings + cancelledItems) > 0 ? (cancelledItems / (totalBookings + cancelledItems)) * 100 : 0;
    const enquiryConversionRate = isHOSS || !enquiries || !hossBookings || selectedHotels.length > 0
      ? 0
      : (hossBookings.filter((b: ExtendedBookingDetail) => b.status === 'Confirmed').length / enquiries.length) * 100;

    // Actionable recommendations
    const recommendations = [];
    if (cancellationRate > 10) {
      recommendations.push('High cancellation rate detected. Consider flexible cancellation policies or incentives for confirmed bookings.');
    }
    if (profitMargin < 20) {
      recommendations.push('Low profit margin. Review expense categories, especially staff and utilities, for cost-saving opportunities.');
    }
    if (enquiryConversionRate < 30 && !isHOSS && selectedHotels.length === 0) {
      recommendations.push('Low enquiry conversion rate. Enhance marketing efforts or streamline booking processes.');
    }
    if (totalDue > totalAdvance * 2) {
      recommendations.push('High outstanding dues. Implement stricter payment terms or follow-up procedures.');
    }
    if (selectedHotels.length > 0) {
      recommendations.push(`Optimize operations for ${selectedHotels.join(', ')} by focusing on high-performing room types.`);
    }

    return {
      totalRevenue,
      totalAdvance,
      totalDue,
      totalExpenses,
      profitLoss,
      profitMargin,
      monthlyTrends,
      cashFlow,
      expenseBreakdown,
      hotelRevenueBreakdown,
      yoyComparison: { currentYear: currentYearRevenue, previousYear: previousYearRevenue, growth: yoyGrowth },
      forecast,
      kpis: { avgBookingValue, enquiryConversionRate, cancellationRate },
      recommendations,
    };
  };

  const metrics = useMemo(
    () => calculateFinancialMetrics(dataSource === 'HOSS' ? hossBookings : enquiries, dataSource === 'HOSS', selectedHotels),
    [hossBookings, enquiries, dataSource, selectedHotels]
  );

  // Filtered and sorted hotel revenue breakdown
  const filteredHotelRevenue = useMemo(() => {
    const hotelData = Array.from(metrics.hotelRevenueBreakdown.entries());
    return hotelData
      .filter(([hotel]) => hotel.toLowerCase().includes(hotelFilter.toLowerCase()))
      .sort((a, b) => sortOrder === 'asc' ? a[1] - b[1] : b[1] - a[1]);
  }, [metrics.hotelRevenueBreakdown, hotelFilter, sortOrder]);

  // Chart data for monthly revenue trends
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: `Revenue (₹) - ${dataSource === 'HOSS' ? 'Hotel Om Shiv Shankar' : selectedHotels.length > 0 ? selectedHotels.join(', ') : 'All Hotels'}`,
        data: metrics.monthlyTrends,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for revenue by room type
  const roomTypeChartData = {
    labels: ['Double Bed', 'Triple Bed', 'Four Bed', 'Extra Bed', 'Kitchen'],
    datasets: [
      {
        data: (dataSource === 'HOSS' ? hossBookings : enquiries)?.filter((item: any) => dataSource === 'HOSS' || selectedHotels.length === 0 || selectedHotels.includes(item.hotel))
          .map((item: any) => [
            (parseInt(item.roomName.doubleBed) || 0) * (item.roomRent.doubleBed || 0),
            (parseInt(item.roomName.tripleBed) || 0) * (item.roomRent.tripleBed || 0),
            (parseInt(item.roomName.fourBed) || 0) * (item.roomRent.fourBed || 0),
            (parseInt(item.roomName.extraBed) || 0) * (item.roomRent.extraBed || 0),
            (parseInt(item.roomName.kitchen) || 0) * (item.roomRent.kitchen || 0),
          ])
          .reduce((acc, curr) => acc.map((val, i) => val + curr[i]), [0, 0, 0, 0, 0]) || [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for expense breakdown
  const expenseChartData = {
    labels: ['Staff', 'Utilities', 'Maintenance', 'Others'],
    datasets: [
      {
        data: [
          metrics.expenseBreakdown.staff,
          metrics.expenseBreakdown.utilities,
          metrics.expenseBreakdown.maintenance,
          metrics.expenseBreakdown.others,
        ],
        backgroundColor: [
          'rgba(255, 159, 64, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for cash flow
  const cashFlowChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Cash Inflows (₹)',
        data: metrics.cashFlow.inflows,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cash Outflows (₹)',
        data: metrics.cashFlow.outflows,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Export PDF report
  const exportPDF = async () => {
    if (!dashboardRef.current) {
      toast.error('Dashboard element not found');
      return;
    }

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Financial_Dashboard_${dataSource}_${selectedHotels.length > 0 ? selectedHotels.join('_') : 'All'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Financial report exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  if (hossLoading || enquiryLoading) {
    return (
      <div className="p-6 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hossError || enquiryError) {
    toast.error(`Failed to load data: ${(hossError || enquiryError)?.message}`);
    return (
      <div className="p-6 w-full">
        <div className="p-4 bg-red-100 text-red-600 rounded-lg">
          Failed to load financial data: {(hossError || enquiryError)?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full fade-in" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-[var(--bg-primary)] z-10 py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient">
          Financial Dashboard - {dataSource === 'HOSS' ? 'Hotel Om Shiv Shankar' : selectedHotels.length > 0 ? selectedHotels.join(', ') : 'All Hotels'}
        </h2>
        <div className="flex gap-4">
          <motion.button
            onClick={() => setDataSource(dataSource === 'HOSS' ? 'AllHotels' : 'HOSS')}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {dataSource === 'HOSS' ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
            {dataSource === 'HOSS' ? 'Switch to AllHotels' : 'Switch to HOSS'}
          </motion.button>
          <motion.button
            onClick={exportPDF}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiDownload size={20} />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Total Revenue',
            value: metrics.totalRevenue,
            icon: <FiDollarSign className="text-3xl text-blue-500" />,
            color: 'from-blue-500 to-indigo-600',
          },
          {
            title: 'Profit/Loss',
            value: metrics.profitLoss,
            icon: metrics.profitLoss >= 0 ? (
              <FiTrendingUp className="text-3xl text-green-500" />
            ) : (
              <FiTrendingDown className="text-3xl text-red-500" />
            ),
            color: metrics.profitLoss >= 0 ? 'from-green-500 to-teal-600' : 'from-red-500 to-pink-600',
          },
          {
            title: 'Total Advance',
            value: metrics.totalAdvance,
            icon: <FiDollarSign className="text-3xl text-teal-500" />,
            color: 'from-teal-500 to-cyan-600',
          },
          {
            title: 'Total Due',
            value: metrics.totalDue,
            icon: <FiDollarSign className="text-3xl text-yellow-500" />,
            color: 'from-yellow-500 to-amber-600',
          },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            className="glass-card rounded-xl border border-[var(--border-color)] shadow-xl overflow-hidden"
            whileHover={{ scale: 1.03 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`bg-gradient-to-r ${stat.color} h-2 w-full`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{stat.title}</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                    ₹{stat.value.toLocaleString()}
                  </p>
                </div>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Average Booking Value',
            value: metrics.kpis.avgBookingValue.toFixed(2),
            unit: '₹',
          },
          {
            title: 'Profit Margin',
            value: metrics.profitMargin.toFixed(2),
            unit: '%',
          },
          {
            title: 'Enquiry Conversion Rate',
            value: metrics.kpis.enquiryConversionRate.toFixed(2),
            unit: '%',
            hide: dataSource === 'HOSS' || selectedHotels.length > 0,
          },
          {
            title: 'Cancellation Rate',
            value: metrics.kpis.cancellationRate.toFixed(2),
            unit: '%',
          },
        ].filter(kpi => !kpi.hide).map((kpi) => (
          <motion.div
            key={kpi.title}
            className="glass-card rounded-xl p-4 border border-[var(--border-color)]"
            whileHover={{ scale: 1.03 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-medium text-[var(--text-secondary)]">{kpi.title}</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {kpi.value} {kpi.unit}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Hotel Revenue Breakdown (AllHotels only) */}
      {dataSource === 'AllHotels' && (
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)] mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Revenue by Hotel
            </h3>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Filter hotels..."
                  value={hotelFilter}
                  onChange={(e) => debouncedHotelFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <motion.button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                Sort {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </motion.button>
              {selectedHotels.length > 0 && (
                <motion.button
                  onClick={() => setSelectedHotels([])}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg shadow-glow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiX size={16} />
                  Clear Selection
                </motion.button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-[var(--text-secondary)]">
              <thead>
                <tr className="bg-[var(--card-bg)]">
                  <th className="px-4 py-2 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={selectedHotels.length > 0 && selectedHotels.length === filteredHotelRevenue.length}
                      onChange={() => {
                        if (selectedHotels.length === filteredHotelRevenue.length) {
                          setSelectedHotels([]);
                        } else {
                          setSelectedHotels(filteredHotelRevenue.map(([hotel]) => hotel));
                        }
                      }}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Hotel</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue (₹)</th>
                  <th className="px-4 py-2 text-right font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotelRevenue.map(([hotel, revenue]) => (
                  <motion.tr
                    key={hotel}
                    className={`border-t border-[var(--border-color)] hover:bg-[var(--card-bg-hover)] ${selectedHotels.includes(hotel) ? 'bg-blue-100' : ''}`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedHotels.includes(hotel)}
                        onChange={() => handleHotelSelection(hotel)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-2">{hotel}</td>
                    <td className="px-4 py-2 text-right">₹{revenue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      {metrics.totalRevenue > 0 ? ((revenue / metrics.totalRevenue) * 100).toFixed(2) : 0}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Trend */}
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Monthly Revenue Trend
          </h3>
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (context) => `₹${context.parsed.y.toLocaleString()}`,
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `₹${value.toLocaleString()}`,
                  },
                },
              },
            }}
          />
        </motion.div>

        {/* Revenue by Room Type */}
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Revenue by Room Type
          </h3>
          <div className="w-full max-w-[300px] mx-auto">
            <Pie
              data={roomTypeChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `₹${context.parsed.toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Expense Breakdown
          </h3>
          <div className="w-full max-w-[300px] mx-auto">
            <Pie
              data={expenseChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `₹${context.parsed.toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Cash Flow Analysis */}
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Cash Flow Analysis
          </h3>
          <Line
            data={cashFlowChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (context) => `₹${context.parsed.y.toLocaleString()}`,
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `₹${value.toLocaleString()}`,
                  },
                },
              },
            }}
          />
        </motion.div>
      </div>

      {/* Revenue Forecast */}
      <motion.div
        className="glass-card rounded-xl p-6 border border-[var(--border-color)] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          3-Month Revenue Forecast
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.forecast.map((item) => (
            <div key={item.month}>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{item.month}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                ₹{item.projectedRevenue.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* YoY Comparison */}
      <motion.div
        className="glass-card rounded-xl p-6 border border-[var(--border-color)] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Year-over-Year Revenue Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Current Year</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              ₹{metrics.yoyComparison.currentYear.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Previous Year</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              ₹{metrics.yoyComparison.previousYear.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">YoY Growth</p>
            <p className={`text-xl font-bold ${metrics.yoyComparison.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.yoyComparison.growth.toFixed(2)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actionable Recommendations */}
      {metrics.recommendations.length > 0 && (
        <motion.div
          className="glass-card rounded-xl p-6 border border-[var(--border-color)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Actionable Recommendations
          </h3>
          <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-2">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialDashboard;