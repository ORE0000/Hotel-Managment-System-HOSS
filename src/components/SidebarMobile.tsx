import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiHome, FiCalendar, FiDollarSign, FiPieChart, FiFilter, FiHelpCircle } from 'react-icons/fi';
import { FaHotel } from 'react-icons/fa';
import { SiHive } from 'react-icons/si';
import ThemeToggle from './ThemeToggle';

interface SidebarMobileProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarMobile: React.FC<SidebarMobileProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { tab: 'dashboard', icon: <FiHome size={18} />, label: 'Dashboard', path: '/' },
    { tab: 'booking', icon: <FiCalendar size={18} />, label: 'New Booking', path: '/booking' },
    { tab: 'calendar', icon: <FiCalendar size={18} />, label: 'Calendar View', path: '/calendar' },
    { tab: 'details', icon: <FiHelpCircle size={18} />, label: 'Booking Details', path: '/details' },
    { tab: 'filter', icon: <FiFilter size={18} />, label: 'Filter Details', path: '/filter' },
    { tab: 'enquiry', icon: <FiHelpCircle size={18} />, label: 'Enquiry', path: '/enquiry' },
    { tab: 'hoss', icon: <SiHive size={18} />, label: 'HOSS', path: '/hoss-bookings' },
    { tab: 'bookingAdvance', icon: <FiCalendar size={18} />, label: 'Booking Advance', path: '/booking-advance' },
    { tab: 'otherHotels', icon: <FaHotel size={18} />, label: 'Other Hotels', path: '/other-hotels' },
    { tab: 'financial', icon: <FiPieChart size={18} />, label: 'Financial Summary', path: '/financial' },
    { tab: 'rates', icon: <FiDollarSign size={18} />, label: 'Rates', path: '/rates' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {isSidebarOpen && (
        <>
          <div
            className={`sidebar-overlay md:hidden fixed inset-0 bg-black z-40 ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
            style={{ WebkitOverflowScrolling: 'touch' }}
          />
          <div
            className={`sidebar-mobile md:hidden fixed top-0 left-0 h-full w-[var(--sidebar-mobile-width)] bg-[var(--card-bg)] z-50 ${isSidebarOpen ? 'open' : ''}`}
            style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                    <SiHive size={20} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gradient relative">
                    HOSS
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--button-bg)]" />
                  </h1>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="neumorphic-button bg-[var(--card-bg)] text-[var(--text-primary)] rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-110"
                  aria-label="Close Sidebar"
                >
                  <FiX size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-thin">
                <div className="space-y-1">
                  {tabs.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => handleNavigation(item.path)}
                        className={`sidebar-mobile-nav-item group relative flex items-center w-full py-2 px-3 rounded-lg text-[var(--text-primary)] transition-colors duration-200 ${
                          isActive ? 'active bg-[var(--sidebar-hover)]' : ''
                        }`}
                        aria-label={item.label}
                      >
                        <span className="sidebar-mobile-nav-icon flex-shrink-0 flex items-center justify-center mr-2">
                          {item.icon}
                        </span>
                        <span className="font-medium text-sm truncate">{item.label}</span>
                        <span className="absolute left-0 top-0 w-1 h-full bg-[var(--button-bg)] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      </button>
                    );
                  })}
                </div>
              </nav>
              <div className="border-t border-[var(--border-color)] p-4 overflow-x-hidden">
                <div className="mb-4">
                  <ThemeToggle />
                </div>
                <div className="flex flex-col items-center text-center">
                  <button
                    onClick={() => handleNavigation('/about')}
                    className="group flex items-center justify-center w-full p-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-colors duration-200"
                  >
                    <FaHotel className="mr-2" size={14} />
                    <span className="font-medium text-xs truncate">HOTEL OM SHIV SHANKAR</span>
                  </button>
                  <div className="text-[var(--text-secondary)] text-xs mt-2">
                    Management System v2.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SidebarMobile;