import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiHelpCircle,
  FiPieChart,
} from 'react-icons/fi';
import { FaHotel } from 'react-icons/fa';
import { SiHive } from 'react-icons/si';

const SidebarDesktop: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      tab: 'dashboard',
      icon: <FiHome size={20} />,
      label: 'Dashboard',
      path: '/',
    },
    {
      tab: 'booking',
      icon: <FiCalendar size={20} />,
      label: 'New Booking',
      path: '/booking',
    },
    {
      tab: 'calendar',
      icon: <FiCalendar size={20} />,
      label: 'Calendar View',
      path: '/calendar',
    },
    {
      tab: 'details',
      icon: <FiHelpCircle size={20} />,
      label: 'Booking Details',
      path: '/details',
    },
    {
      tab: 'filter',
      icon: <FiFilter size={20} />,
      label: 'Filter Details',
      path: '/filter',
    },
    {
      tab: 'enquiry',
      icon: <FiHelpCircle size={20} />,
      label: 'Enquiry',
      path: '/enquiry',
    },
    {
      tab: 'hoss',
      icon: <SiHive size={20} />,
      label: 'HOSS',
      path: '/hoss-bookings',
    },
    {
      tab: 'bookingAdvance',
      icon: <FiCalendar size={20} />,
      label: 'Booking Advance',
      path: '/booking-advance',
    },
    {
      tab: 'otherHotels',
      icon: <FaHotel size={20} />,
      label: 'Other Hotels',
      path: '/other-hotels',
    },
    {
      tab: 'financial',
      icon: <FiPieChart size={20} />,
      label: 'Financial Summary',
      path: '/financial',
    },
    {
      tab: 'rates',
      icon: <FiDollarSign size={20} />,
      label: 'Rates',
      path: '/rates',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="hidden md:block sidebar-desktop overflow-x-hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center p-6 border-b border-[var(--border-color)]">
          <motion.div
            className="flex items-center space-x-3"
            animate={{ y: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--button-bg)] flex items-center justify-center">
              <SiHive size={24} className="text-[var(--icon-color)]" />
            </div>
            <h1 className="text-3xl font-bold text-gradient relative">
              HOSS
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--button-bg)] transform scale-x-0 origin-right transition-transform duration-300 group-hover:scale-x-100 origin-left" />
            </h1>
          </motion.div>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 scrollbar-thin">
          <div className="space-y-2">
            {tabs.map((item) => (
              <motion.button
                key={item.tab}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation(item.path)}
                className={`sidebar-desktop-nav-item group relative flex items-center w-full py-3 px-4 rounded-lg text-[var(--text-primary)] transition-all duration-300 ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                aria-label={item.label}
              >
                <span className="sidebar-desktop-nav-icon flex-shrink-0 flex items-center justify-center mr-3">
                  {item.icon}
                </span>
                <span
                  className={`font-medium text-base truncate ${
                    ['financial', 'bookingAdvance', 'calendar', 'details'].includes(
                      item.tab
                    )
                      ? 'whitespace-nowrap'
                      : ''
                  }`}
                >
                  {item.label}
                </span>
                <span className="tooltip absolute left-full ml-2 px-2 py-1 bg-[var(--card-bg)] text-[var(--text-primary)] text-xs rounded opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-200 pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
                <span className="absolute left-0 top-0 w-1 h-full bg-[var(--button-bg)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </motion.button>
            ))}
          </div>
        </nav>
        <div className="border-t border-[var(--border-color)] p-6 overflow-x-hidden">
          <div className="mb-6">
            <ThemeToggle />
          </div>
          <div className="flex flex-col items-center text-center">
            <button
              onClick={() => navigate('/about')}
              className="group flex items-center justify-center w-full p-4 rounded-xl text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-all duration-300"
            >
              <FaHotel className="mr-3" size={20} />
              <span className="font-medium text-base truncate">HOTEL OM SHIV SHANKAR</span>
            </button>
            <div className="text-[var(--text-secondary)] text-sm mt-4">
              Management System v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarDesktop;