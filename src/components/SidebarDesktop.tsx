import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiHelpCircle,
  FiPieChart,
  FiMenu,
  FiEdit,
} from 'react-icons/fi';
import { FaHotel } from 'react-icons/fa';
import { SiHive } from 'react-icons/si';

interface SidebarDesktopProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarDesktop: React.FC<SidebarDesktopProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      tab: 'dashboard',
      icon: <FiHome size={24} />,
      label: 'Dashboard',
      path: '/',
    },
    {
      tab: 'booking',
      icon: <FiEdit size={24} />,
      label: 'New Booking',
      path: '/booking',
    },
    {
      tab: 'calendar',
      icon: <FiCalendar size={24} />,
      label: 'Calendar View',
      path: '/calendar',
    },
    {
      tab: 'details',
      icon: <FiHelpCircle size={24} />,
      label: 'Booking Details',
      path: '/details',
    },
    {
      tab: 'enquiry',
      icon: <FiHelpCircle size={24} />,
      label: 'Enquiry',
      path: '/enquiry',
    },
    {
      tab: 'hoss',
      icon: <SiHive size={24} />,
      label: 'HOSS',
      path: '/hoss-bookings',
    },
    { tab: 'billing', 
      icon: <FiDollarSign size={24} />, 
      label: 'Billing',
      path: '/billing' },
    {
      tab: 'bookingAdvance',
      icon: <FiCalendar size={24} />,
      label: 'Booking Advance',
      path: '/booking-advance',
    },
    {
      tab: 'otherHotels',
      icon: <FaHotel size={24} />,
      label: 'Other Hotels',
      path: '/other-hotels',
    },
    {
      tab: 'financial',
      icon: <FiPieChart size={24} />,
      label: 'Financial Summary',
      path: '/financial',
    },
    // {
    //   tab: 'filter',
    //   icon: <FiFilter size={24} />,
    //   label: 'Filter Details',
    //   path: '/filter',
    // },
    { 
      tab: 'room-list',
      icon: <FiPieChart size={24} />,
      label: 'Room List', 
      path: '/room-list',
    },
    {
      tab: 'rates',
      icon: <FiDollarSign size={24} />,
      label: 'Rates',
      path: '/rates',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false); // Collapse sidebar on navigation
  };

  const handleMouseEnter = () => {
    setIsSidebarOpen(true);
  };

  const handleMouseLeave = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <motion.div
      className="sidebar-desktop overflow-x-hidden fixed top-0 left-0 h-full bg-[var(--card-bg)] rounded-l-2xl rounded-tr-2xl -mr-px"
      animate={{ width: isSidebarOpen ? 'var(--sidebar-desktop-width)' : 96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <motion.div
            className="flex items-center space-x-2"
            animate={{ opacity: isSidebarOpen ? 1 : 0, x: isSidebarOpen ? 0 : -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--button-bg)] flex items-center justify-center">
              <SiHive size={24} className="text-[var(--icon-color)]" />
            </div>
            {isSidebarOpen && (
              <h1 className="text-2xl font-bold text-gradient relative">
                HOSS
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--button-bg)]" />
              </h1>
            )}
          </motion.div>
          <motion.button
            className="neumorphic-button bg-[var(--card-bg)] text-[var(--text-primary)] rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform duration-200"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <FiMenu size={20} />
          </motion.button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 pl-3 pr-3">
          <div className="space-y-1">
            {tabs.map((item) => (
              <motion.button
                key={item.tab}
                whileHover={{ scale: 1.05, x: isSidebarOpen ? 4 : 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation(item.path)}
                className={`sidebar-desktop-nav-item group relative flex items-center w-full py-3 pl-3 pr-3 rounded-lg text-[var(--text-primary)] transition-all duration-300 ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                aria-label={item.label}
              >
                <span className="sidebar-desktop-nav-icon flex-shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      className={`font-medium text-sm ml-2 ${
                        ['financial', 'bookingAdvance', 'calendar', 'details'].includes(item.tab)
                          ? 'whitespace-nowrap'
                          : ''
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className={`tooltip absolute left-full ml-2 px-2 py-1 bg-[var(--card-bg)] text-[var(--text-primary)] text-xs rounded opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-200 pointer-events-none whitespace-nowrap ${
                  isSidebarOpen ? 'hidden' : ''
                }`}>
                  {item.label}
                </span>
                <span className="absolute left-0 top-0 w-1 h-full bg-[var(--button-bg)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </motion.button>
            ))}
          </div>
        </nav>

        <div className="p-4 overflow-x-hidden">
          <div className="flex flex-col items-center text-center">
            <motion.button
              onClick={() => window.open('https://hotelomshivshankar.com/', '_blank')}
              className="group flex items-center justify-center w-full p-3 rounded-lg text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-all duration-300"
              animate={{ opacity: isSidebarOpen ? 1 : 0, height: isSidebarOpen ? 'auto' : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaHotel size={16} />
              {isSidebarOpen && <span className="font-medium text-sm truncate ml-2">HOTEL OM SHIV SHANKAR</span>}
            </motion.button>
            <motion.div
              className="text-[var(--text-secondary)] text-xs mt-2"
              animate={{ opacity: isSidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Management System v2.0
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarDesktop;