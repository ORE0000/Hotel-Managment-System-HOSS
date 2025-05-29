import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut, FiSearch, FiMenu } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

interface User {
  email: string;
  name: string;
  role: string;
}

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] backdrop-filter backdrop-blur-lg rounded-t-2xl">
      <div className="flex items-center justify-between h-16 pl-3 pr-2 sm:pl-5 sm:pr-4 lg:pl-7 lg:pr-6">
        {/* Left side - Hamburger and logo */}
        <div className="flex items-center">
          {/* Hamburger button */}
          <motion.button
            className="p-2 rounded-full bg-gradient-to-br from-[var(--icon-bg-indigo)] to-[var(--icon-bg-purple)] text-white border border-[var(--icon-bg-indigo)]/20 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] focus:outline-none transition-all duration-300"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={26} />
          </motion.button>

          {/* Logo - hidden on mobile */}
          <div className="hidden md:flex items-center ml-4">
            <motion.div
              className="ml-3 flex flex-col"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-[var(--icon-bg-indigo)] to-[var(--icon-bg-purple)] text-transparent bg-clip-text">
                HOSS
              </h1>
              <span className="text-xs text-[var(--text-secondary)] tracking-tight">
                Hotel Om Shiv Shankar
              </span>
            </motion.div>
          </div>
        </div>

        {/* Search bar - desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--icon-bg-indigo)] focus:border-transparent"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right side icons */}
        <div className="flex items-center space-x-4">
          {/* Mobile search button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-md text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] focus:outline-none"
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Settings button */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] focus:outline-none"
            aria-label="Settings"
          >
            <FiSettings size={20} />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 focus:outline-none"
              aria-label="User menu"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--icon-bg-indigo)] to-[var(--icon-bg-purple)] flex items-center justify-center overflow-hidden border-2 border-[var(--icon-bg-indigo)]/30">
                {user.name ? (
                  <span className="text-white font-bold text-base">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <FiUser size={18} className="text-white" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 bg-[var(--modal-bg)] rounded-2xl shadow-[0_4px_30px_rgba(99,102,241,0.2)] overflow-hidden border border-[var(--icon-bg-indigo)]/10 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{user.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] capitalize font-medium">{user.role}</p>
                  </div>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 text-sm font-medium"
                    onClick={() => navigate('/profile')}
                  >
                    <FiUser size={16} />
                    Profile
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 text-sm font-medium"
                    onClick={() => navigate('/settings')}
                  >
                    <FiSettings size={16} />
                    Settings
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-[var(--icon-bg-red)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 text-sm font-medium"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search - appears below */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            className="md:hidden px-4 pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSearch} className="mt-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--icon-bg-indigo)] focus:border-transparent"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;