import { useState, useEffect } from 'react';
import { FiMoon, FiBell, FiLock, FiGlobe } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Simulate API call to update settings
    localStorage.setItem('settings', JSON.stringify({ notifications, language }));
    alert('Settings updated successfully!');
  };

  return (
    <motion.div
      className="main-content p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-gradient mb-6">Settings</h1>
      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Appearance</h2>
          <div className="flex gap-4">
            <button
              className={`neumorphic-button p-4 flex-1 ${theme === 'dark' ? 'bg-[var(--tab-active-bg)] text-white' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <FiMoon size={20} className="mx-auto mb-2" />
              Dark Theme
            </button>
            <button
              className={`neumorphic-button p-4 flex-1 ${theme === 'light' ? 'bg-[var(--tab-active-bg)] text-white' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <FiMoon size={20} className="mx-auto mb-2" />
              Light Theme
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Notifications</h2>
          <label className="custom-checkbox">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            <span className="checkbox-indicator mr-2"></span>
            Enable Email Notifications
          </label>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Language</h2>
          <select
            className="input-field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              className="input-field"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="input-field"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary w-full">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;