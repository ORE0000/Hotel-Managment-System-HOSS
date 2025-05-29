import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiDollarSign, FiPieChart, FiFilter, FiHelpCircle, FiMenu } from 'react-icons/fi';
import { FaHotel } from 'react-icons/fa';
import { SiHive } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface SidebarMobileProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarMobile: React.FC<SidebarMobileProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar when route changes on mobile (only for cleanup)
  useEffect(() => {
    return () => {
      setIsSidebarOpen(false);
    };
  }, [location.pathname, setIsSidebarOpen]);

  const tabs = [
    { tab: 'dashboard', icon: <FiHome size={24} />, label: 'Dashboard', path: '/' },
    { tab: 'booking', icon: <FiCalendar size={24} />, label: 'New Booking', path: '/booking' },
    { tab: 'calendar', icon: <FiCalendar size={24} />, label: 'Calendar View', path: '/calendar' },
    { tab: 'details', icon: <FiHelpCircle size={24} />, label: 'Booking Details', path: '/details' },
    { tab: 'filter', icon: <FiFilter size={24} />, label: 'Filter Details', path: '/filter' },
    { tab: 'enquiry', icon: <FiHelpCircle size={24} />, label: 'Enquiry', path: '/enquiry' },
    { tab: 'hoss', icon: <SiHive size={24} />, label: 'HOSS', path: '/hoss-bookings' },
    { tab: 'bookingAdvance', icon: <FiCalendar size={24} />, label: 'Booking Advance', path: '/booking-advance' },
    { tab: 'otherHotels', icon: <FaHotel size={24} />, label: 'Other Hotels', path: '/other-hotels' },
    { tab: 'financial', icon: <FiPieChart size={24} />, label: 'Financial Summary', path: '/financial' },
    { tab: 'rates', icon: <FiDollarSign size={24} />, label: 'Rates', path: '/rates' },
    { tab: 'billing', icon: <FiDollarSign size={24} />, label: 'Billing', path: '/billing' },
    { tab: 'roomList', icon: <FaHotel size={24} />, label: 'Room List', path: '/room-list' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false); // Close sidebar after navigation
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div
          key="sidebar-mobile"
          className="sidebar-desktop md:hidden fixed top-0 left-0 h-full w-[280px] bg-[var(--sidebar-bg)] rounded-l-2xl rounded-tr-2xl z-50 overflow-x-hidden scrollbar-thin"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <motion.button
                  className="neumorphic-button bg-[var(--card-bg)] text-[var(--text-primary)] rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-110"
                  onClick={() => setIsSidebarOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close Sidebar"
                >
                  <FiMenu size={20} />
                </motion.button>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--button-bg)] flex items-center justify-center shadow-glow">
                    <SiHive size={24} className="text-[var(--icon-color)]" />
                  </div>
                  <h1 className="text-2xl font-bold text-gradient relative">
                    HOSS
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--button-bg)]" />
                  </h1>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 pl-3 pr-3 scrollbar-thin">
              <div className="space-y-1">
                {tabs.map((item) => (
                  <motion.button
                    key={item.tab}
                    whileHover={{ scale: 1.05, x: 4 }}
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
                    <span
                      className={`font-medium text-sm ml-2 ${
                        ['financial', 'bookingAdvance', 'calendar', 'details'].includes(item.tab)
                          ? 'whitespace-nowrap'
                          : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className="absolute left-0 top-0 w-1 h-full bg-[var(--button-bg)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                    />
                  </motion.button>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 overflow-x-hidden">
              <div className="flex flex-col items-center text-center">
                <motion.button
                  onClick={() => window.open('https://hotelomshivshankar.com/', '_blank')}
                  className="group flex items-center justify-center w-full p-3 rounded-lg text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaHotel size={16} />
                  <span className="font-medium text-sm truncate ml-2">HOTEL OM SHIV SHANKAR</span>
                </motion.button>
                <div className="text-[var(--text-secondary)] text-xs mt-2">
                  Management System v2.0
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {isSidebarOpen && (
        <motion.div
          key="overlay"
          className="md:hidden fixed inset-0 z-40 bg-transparent pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default SidebarMobile;