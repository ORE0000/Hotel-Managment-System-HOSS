import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import ReactCountryFlag from 'react-country-flag';
import '../App.css';
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiPhone,
  FiShield,
  FiKey,
  FiUserCheck,
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleOption {
  role: string;
  icon: React.ReactNode;
  label: string;
  hoverColor: string;
}

interface CountryOption {
  code: string;
  name: string;
  countryCode: string;
}

interface User {
  email: string;
  name: string;
  role: string;
}

const roleOptions: RoleOption[] = [
  { role: 'admin', icon: <FaCrown />, label: 'Admin', hoverColor: 'var(--icon-bg-indigo)' },
  { role: 'sub-admin', icon: <FiShield />, label: 'Sub-Admin', hoverColor: 'var(--icon-bg-blue)' },
  { role: 'employee', icon: <FiUserCheck />, label: 'Employee', hoverColor: 'var(--icon-bg-teal)' },
];

const countryOptions: CountryOption[] = [
  { code: '+1', name: 'United States', countryCode: 'US' },
  { code: '+44', name: 'United Kingdom', countryCode: 'GB' },
  { code: '+91', name: 'India', countryCode: 'IN' },
  { code: '+61', name: 'Australia', countryCode: 'AU' },
  { code: '+49', name: 'Germany', countryCode: 'DE' },
];

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<string>('loginPage');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [enable2FA, setEnable2FA] = useState<boolean>(false);
  const [registerName, setRegisterName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('employee');
  const [enable2FARegister, setEnable2FARegister] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [otpInputs, setOtpInputs] = useState<string[]>(Array(6).fill(''));
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [otpSentTo, setOtpSentTo] = useState<string>('');
  const [successTitle, setSuccessTitle] = useState<string>('Success!');
  const [successMessage, setSuccessMessage] = useState<string>('Your account has been created successfully');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const createParticles = () => {
      const particleCount = 60;
      const newParticles: JSX.Element[] = [];
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 5 + 3;
        const duration = Math.random() * 12 + 8;
        newParticles.push(
          <motion.div
            key={i}
            className="particle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [0, -1200],
              rotate: [0, 1080],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      }
      setParticles(newParticles);
    };
    createParticles();
  }, []);

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string): boolean => password.length >= 8;
  const validatePhone = (phone: string): boolean => /^[0-9]{10,15}$/.test(phone);

  const handleTabClick = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setActivePage(`${tab}Page`);
  };

  const handlePageSwitch = (page: string) => {
    setActivePage(page);
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading('login');
    setErrors({});

    const newErrors: { [key: string]: string } = {};
    if (!validateEmail(loginEmail)) newErrors.loginEmail = 'Please enter a valid email address';
    if (!validatePassword(loginPassword)) newErrors.loginPassword = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(null);
      return;
    }

    // Default admin credentials for development
    if (loginEmail === 'admin@example.com' && loginPassword === 'Admin123!') {
      setTimeout(() => {
        setUser({ email: loginEmail, name: 'Ashutosh Pant', role: 'admin' });
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ email: loginEmail, name: 'Ashutosh Pant', role: 'admin' }));
        navigate('/');
        setIsLoading(null);
      }, 1500);
      return;
    }

    setTimeout(() => {
      if (enable2FA) {
        setActivePage('otpPage');
        setOtpSentTo(loginEmail);
      } else {
        setActivePage('successPage');
        setSuccessTitle('Login Successful!');
        setSuccessMessage('You are now being redirected to your dashboard');
      }
      setIsLoading(null);
    }, 1500);
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log('Google Login Success:', credentialResponse);
    setTimeout(() => {
      setUser({ email: 'google@example.com', name: 'Google User', role: 'employee' });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({ email: 'google@example.com', name: 'Google User', role: 'employee' }));
      navigate('/dashboard');
    }, 1500);
  };

  const handleGoogleError = () => {
    setErrors({ google: 'Google login failed. Please try again.' });
  };

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading('register');
    setErrors({});

    const newErrors: { [key: string]: string } = {};
    if (registerName.trim() === '') newErrors.registerName = 'Please enter your name';
    if (!validateEmail(registerEmail)) newErrors.registerEmail = 'Please enter a valid email address';
    if (!validatePassword(registerPassword)) newErrors.registerPassword = 'Password must be at least 8 characters';
    if (registerPassword !== registerConfirmPassword) newErrors.registerConfirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(null);
      return;
    }

    setTimeout(() => {
      setUser({ email: registerEmail, name: registerName, role: selectedRole });
      localStorage.setItem('user', JSON.stringify({ email: registerEmail, name: registerName, role: selectedRole }));
      if (enable2FARegister) {
        setActivePage('otpPage');
        setOtpSentTo(registerEmail);
      } else {
        setActivePage('successPage');
        setSuccessTitle('Registration Successful!');
        setSuccessMessage(`Welcome ${registerName}! Your ${selectedRole} account has been created`);
      }
      setIsLoading(null);
    }, 1500);
  };

  const handlePhoneLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading('phoneLogin');
    setErrors({});

    if (!validatePhone(phoneNumber)) {
      setErrors({ phoneNumber: 'Please enter a valid phone number' });
      setIsLoading(null);
      return;
    }

    setTimeout(() => {
      setActivePage('otpPage');
      setOtpSentTo(`phone (${countryCode}${phoneNumber})`);
      setIsLoading(null);
    }, 1500);
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading('otp');

    setTimeout(() => {
      setActivePage('successPage');
      setSuccessTitle('Verification Successful!');
      setSuccessMessage('Your account has been verified and you are now logged in');
      localStorage.setItem('isAuthenticated', 'true');
      setIsLoading(null);
    }, 1500);
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading('forgot');
    setErrors({});

    if (!validateEmail(forgotEmail)) {
      setErrors({ forgotEmail: 'Please enter a valid email address' });
      setIsLoading(null);
      return;
    }

    setTimeout(() => {
      setActivePage('successPage');
      setSuccessTitle('Reset Link Sent!');
      setSuccessMessage("We've sent a password reset link to your email address");
      setIsLoading(null);
    }, 1500);
  };

  const handleOtpInputChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtpInputs = [...otpInputs];
      newOtpInputs[index] = value;
      setOtpInputs(newOtpInputs);
      if (value && index < 5) {
        const nextInput = document.querySelector(`.otp-input:nth-child(${index + 2})`) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  const handleResendOtp = () => {
    alert('New verification code has been sent!');
  };

  const handleCountryCodeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value);
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div className={isDarkMode ? 'dark' : ''}>
        <style>
          {`
            .tab-container {
              position: relative;
              background: var(--tab-bg);
              border-bottom: none;
              padding: 0.5rem;
              backdrop-filter: blur(8px);
              border-radius: 12px;
              margin-bottom: 1rem;
            }
            .tab {
              background: transparent;
              border-radius: 10px;
              transition: all 0.2s ease;
              z-index: 1;
              padding: 0.8rem;
              font-size: 0.95rem;
            }
            .tab.active {
              background: var(--tab-active-bg);
              color: white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              transform: translateY(-2px);
            }
            .tab:hover {
              background: rgba(0, 0, 0, 0.1);
              transform: translateY(-1px);
            }
            [data-theme="light"] .tab:hover {
              background: rgba(0, 0, 0, 0.05);
            }
            .social-btn, .phone-btn {
              background: var(--card-bg);
              border: 1px solid var(--border-color);
              padding: 0.7rem 1.4rem;
              border-radius: 50px;
              width: 140px;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              font-size: 0.85rem;
            }
            .phone-btn:hover {
              background: var(--icon-bg-green);
              border-color: var(--icon-bg-green);
              color: white;
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
            }
            .role-option {
              position: relative;
              overflow: hidden;
              transition: all 0.3s ease;
              border-radius: 10px;
              padding: 0.6rem 1rem;
              font-size: 0.85rem;
              min-width: 100px;
            }
            .role-option:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            }
            .role-option.selected {
              background: var(--card-bg);
              border: 2px solid;
              color: var(--text-primary);
            }
            .role-option .icon, .role-option .label {
              color: var(--text-primary);
            }
            [data-theme="light"] .role-option.selected .icon, 
            [data-theme="light"] .role-option.selected .label {
              color: var(--text-primary);
            }
            .input-container {
              position: relative;
            }
            .input-container .form-label,
            .input-container .input-icon {
              transition: opacity 0.3s ease;
            }
            .input-container.has-value .form-label,
            .input-container.has-value .input-icon {
              opacity: 0;
              pointer-events: none;
            }
            .country-selector {
              background: var(--input-bg);
              color: var(--text-primary);
              border: 1px solid var(--border-color);
              border-radius: 10px;
              transition: all 0.3s ease;
            }
            .country-selector:hover {
              border-color: var(--icon-bg-indigo);
              box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
            }
            .otp-input {
              color: var(--text-primary);
              font-size: 1.1rem;
              padding: 0.5rem;
              caret-color: var(--text-primary);
            }
            .otp-input:focus {
              border-color: var(--icon-bg-indigo);
              box-shadow: 0 0 10px var(--glow-color);
            }
          `}
        </style>
        <div className="particles">{particles}</div>

        <motion.div
          className="theme-toggle fixed top-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] shadow-glow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-[var(--text-primary)] text-base`} />
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <span className="slider" />
          </label>
        </motion.div>

        <motion.div
          className="auth-container mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="glass-card">
            <div className="tab-container flex">
              <motion.div
                className={`tab flex-1 text-center py-3 cursor-pointer text-[var(--text-primary)] font-semibold ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabClick('login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                Login
              </motion.div>
              <motion.div
                className={`tab flex-1 text-center py-3 cursor-pointer text-[var(--text-primary)] font-semibold ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabClick('register')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                Register
              </motion.div>
            </div>

            <div className="form-content p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'loginPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="avatar-preview mx-auto mb-6">
                    <FiUser className="text-[var(--text-primary)] text-4xl" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    Welcome Back!
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    Sign in to access your account
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-6">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme={isDarkMode ? 'filled_black' : 'outline'}
                      shape="pill"
                      width="140"
                    />
                    <motion.button
                      className="social-btn phone-btn flex items-center justify-center"
                      onClick={() => handlePageSwitch('phoneLoginPage')}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiPhone className="mr-2 h-4 w-4" />
                      Phone
                    </motion.button>
                  </div>
                  {errors.google && (
                    <div className="error-message text-center mb-4">{errors.google}</div>
                  )}

                  <div className="divider my-6">
                    <span className="divider-text text-[var(--text-secondary)]">OR</span>
                  </div>

                  <form onSubmit={handleLoginSubmit}>
                    <div className={`form-group mb-6 ${errors.loginEmail ? 'error' : ''}`}>
                      <div className={`input-container ${loginEmail ? 'has-value' : ''}`}>
                        <FiMail className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type="email"
                          className="input-field pl-10 text-sm"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Email Address</label>
                      </div>
                      <div className="error-message">{errors.loginEmail}</div>
                    </div>

                    <div className={`form-group mb-6 ${errors.loginPassword ? 'error' : ''}`}>
                      <div className={`input-container ${loginPassword ? 'has-value' : ''}`}>
                        <FiLock className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          className="input-field pl-10 text-sm"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Password</label>
                        <div
                          className="password-toggle absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[var(--text-secondary)] text-lg"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                        >
                          {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                      </div>
                      <div className="error-message">{errors.loginPassword}</div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                      <div className="custom-checkbox">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                        />
                        <label htmlFor="rememberMe" className="checkbox-indicator" />
                        <span className="text-xs sm:text-sm text-[var(--text-primary)] ml-2">
                          Remember me
                        </span>
                      </div>
                      <motion.span
                        className="toggle-link text-[var(--text-primary)] underline cursor-pointer text-xs sm:text-sm"
                        onClick={() => handlePageSwitch('forgotPage')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Forgot Password?
                      </motion.span>
                    </div>

                    <div className="two-factor-toggle glass-card p-4 sm:p-6 mb-6">
                      <div className="two-factor-label flex items-center">
                        <div className="two-factor-icon mr-3 text-[var(--icon-bg-indigo)]">
                          <FiShield className="text-xl" />
                        </div>
                        <div className="two-factor-text">
                          <h4 className="text-[var(--text-primary)] font-semibold text-sm sm:text-base">
                            Two-Factor Authentication
                          </h4>
                          <p className="text-[var(--text-secondary)] text-xs">
                            Extra security for your account
                          </p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={enable2FA}
                          onChange={() => setEnable2FA(!enable2FA)}
                        />
                        <span className="slider" />
                      </label>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary w-full mb-4"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ display: isLoading === 'login' ? 'none' : 'inline' }}>
                        Login
                      </span>
                      <div
                        className="spinner"
                        style={{ display: isLoading === 'login' ? 'block' : 'none' }}
                      />
                    </motion.button>
                  </form>

                  <div className="toggle-form text-center text-xs sm:text-sm">
                    Don't have an account?{' '}
                    <motion.span
                      className="toggle-link text-[var(--text-primary)] underline cursor-pointer"
                      onClick={() => handleTabClick('register')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Register
                    </motion.span>
                  </div>
                </motion.div>

                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'registerPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="avatar-preview mx-auto mb-6">
                    <FiUser className="text-[var(--text-primary)] text-4xl" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    Create Account
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    Join us with your preferred role
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-6">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme={isDarkMode ? 'filled_black' : 'outline'}
                      shape="pill"
                      width="140"
                    />
                    <motion.button
                      className="social-btn phone-btn flex items-center justify-center"
                      onClick={() => handlePageSwitch('phoneLoginPage')}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiPhone className="mr-2 h-4 w-4" />
                      Phone
                    </motion.button>
                  </div>
                  {errors.google && (
                    <div className="error-message text-center mb-4">{errors.google}</div>
                  )}

                  <div className="divider my-6">
                    <span className="divider-text text-[var(--text-secondary)]">OR</span>
                  </div>

                  <form onSubmit={handleRegisterSubmit}>
                    <div className={`form-group mb-6 ${errors.registerName ? 'error' : ''}`}>
                      <div className={`input-container ${registerName ? 'has-value' : ''}`}>
                        <FiUser className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type="text"
                          className="input-field pl-10 text-sm"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Full Name</label>
                      </div>
                      <div className="error-message">{errors.registerName}</div>
                    </div>

                    <div className={`form-group mb-6 ${errors.registerEmail ? 'error' : ''}`}>
                      <div className={`input-container ${registerEmail ? 'has-value' : ''}`}>
                        <FiMail className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type="email"
                          className="input-field pl-10 text-sm"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Email Address</label>
                      </div>
                      <div className="error-message">{errors.registerEmail}</div>
                    </div>

                    <div className={`form-group mb-6 ${errors.registerPassword ? 'error' : ''}`}>
                      <div className={`input-container ${registerPassword ? 'has-value' : ''}`}>
                        <FiLock className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          className="input-field pl-10 text-sm"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Password</label>
                        <div
                          className="password-toggle absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[var(--text-secondary)] text-lg"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                      </div>
                      <div className="error-message">{errors.registerPassword}</div>
                    </div>

                    <div className={`form-group mb-6 ${errors.registerConfirmPassword ? 'error' : ''}`}>
                      <div className={`input-container ${registerConfirmPassword ? 'has-value' : ''}`}>
                        <FiLock className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          className="input-field pl-10 text-sm"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Confirm Password</label>
                      </div>
                      <div className="error-message">{errors.registerConfirmPassword}</div>
                    </div>

                    <div className="role-selector flex flex-wrap gap-2 sm:gap-3 mb-6">
                      {roleOptions.map((option) => (
                        <motion.div
                          key={option.role}
                          className={`role-option glass-card px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center ${
                            selectedRole === option.role ? 'selected' : ''
                          }`}
                          style={{
                            borderColor: selectedRole === option.role ? option.hoverColor : 'var(--border-color)',
                          }}
                          onClick={() => setSelectedRole(option.role)}
                          whileHover={{
                            y: -4,
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                            borderColor: option.hoverColor,
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="icon mr-2 text-lg">{option.icon}</span>
                          <span className="label">{option.label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="two-factor-toggle glass-card p-4 sm:p-6 mb-6">
                      <div className="two-factor-label flex items-center">
                        <div className="two-factor-icon mr-3 text-[var(--icon-bg-indigo)]">
                          <FiShield className="text-xl" />
                        </div>
                        <div className="two-factor-text">
                          <h4 className="text-[var(--text-primary)] font-semibold text-sm sm:text-base">
                            Enable Two-Factor Authentication
                          </h4>
                          <p className="text-[var(--text-secondary)] text-xs">
                            Recommended for all accounts
                          </p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={enable2FARegister}
                          onChange={() => setEnable2FARegister(!enable2FARegister)}
                        />
                        <span className="slider" />
                      </label>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary w-full mb-4"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ display: isLoading === 'register' ? 'none' : 'inline' }}>
                        Register
                      </span>
                      <div
                        className="spinner"
                        style={{ display: isLoading === 'register' ? 'block' : 'none' }}
                      />
                    </motion.button>
                  </form>

                  <div className="toggle-form text-center text-xs sm:text-sm">
                    Already have an account?{' '}
                    <motion.span
                      className="toggle-link text-[var(--text-primary)] underline cursor-pointer"
                      onClick={() => handleTabClick('login')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                    </motion.span>
                  </div>
                </motion.div>

                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'phoneLoginPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="avatar-preview mx-auto mb-6">
                    <FiPhone className="text-[var(--text-primary)] text-4xl" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    Phone Number Login
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    We'll send a verification code to your phone
                  </p>

                  <form onSubmit={handlePhoneLoginSubmit}>
                    <div className={`form-group mb-6 ${errors.phoneNumber ? 'error' : ''}`}>
                      <div className="phone-input-container flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <motion.div
                          className="country-selector flex items-center bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg p-2"
                          whileHover={{ y: -2 }}
                        >
                          <ReactCountryFlag
                            countryCode={
                              countryOptions.find((opt) => opt.code === countryCode)?.countryCode ||
                              'US'
                            }
                            svg
                            style={{ width: '20px', height: '15px', marginRight: '8px' }}
                          />
                          <select
                            value={countryCode}
                            onChange={handleCountryCodeChange}
                            className="bg-transparent border-none text-[var(--text-primary)] text-xs sm:text-sm focus:outline-none w-full"
                          >
                            {countryOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>
                                {opt.name} ({opt.code})
                              </option>
                            ))}
                          </select>
                        </motion.div>
                        <div className={`input-container ${phoneNumber ? 'has-value' : ''}`}>
                          <input
                            type="tel"
                            className="input-field text-sm"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Phone Number</label>
                        </div>
                      </div>
                      <div className="error-message">{errors.phoneNumber}</div>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary w-full mb-4"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ display: isLoading === 'phoneLogin' ? 'none' : 'inline' }}>
                        Send Verification Code
                      </span>
                      <div
                        className="spinner"
                        style={{ display: isLoading === 'phoneLogin' ? 'block' : 'none' }}
                      />
                    </motion.button>
                  </form>

                  <div className="text-center text-xs sm:text-sm">
                    <motion.span
                      className="toggle-link text-[var(--text-primary)] underline cursor-pointer"
                      onClick={() => handleTabClick('login')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Use Email Instead
                    </motion.span>
                  </div>
                </motion.div>

                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'otpPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="avatar-preview mx-auto mb-6">
                    <FiLock className="text-[var(--text-primary)] text-4xl" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    Verify Your Account
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    We've sent a 6-digit code to your{' '}
                    <span className="font-medium">{otpSentTo}</span>
                  </p>

                  <form onSubmit={handleOtpSubmit}>
                    <div className="otp-container flex justify-between gap-2 mb-6">
                      {otpInputs.map((value, index) => (
                        <motion.input
                          key={index}
                          type="text"
                          className="otp-input input-field text-center text-sm"
                          value={value}
                          onChange={(e) => handleOtpInputChange(index, e.target.value)}
                          maxLength={1}
                          pattern="[0-9]"
                          inputMode="numeric"
                          whileHover={{ scale: 1.05 }}
                          whileFocus={{ scale: 1.1 }}
                          style={{ width: '2.5rem', height: '2.5rem' }}
                        />
                      ))}
                    </div>

                    <div
                      className="error-message text-center mb-4"
                      style={{ display: errors.otp ? 'block' : 'none' }}
                    >
                      {errors.otp}
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary w-full mb-4"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ display: isLoading === 'otp' ? 'none' : 'inline' }}>
                        Verify & Continue
                      </span>
                      <div
                        className="spinner"
                        style={{ display: isLoading === 'otp' ? 'block' : 'none' }}
                      />
                    </motion.button>

                    <div className="resend-otp text-center text-xs sm:text-sm">
                      Didn't receive code?{' '}
                      <motion.span
                        className="resend-link text-[var(--text-primary)] underline cursor-pointer"
                        onClick={handleResendOtp}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Resend Code
                      </motion.span>
                    </div>
                  </form>
                </motion.div>

                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'forgotPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="avatar-preview mx-auto mb-6">
                    <FiKey className="text-[var(--text-primary)] text-4xl" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    Forgot Password
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    Enter your email to reset your password
                  </p>

                  <form onSubmit={handleForgotSubmit}>
                    <div className={`form-group mb-6 ${errors.forgotEmail ? 'error' : ''}`}>
                      <div className={`input-container ${forgotEmail ? 'has-value' : ''}`}>
                        <FiMail className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] text-lg" />
                        <input
                          type="email"
                          className="input-field pl-10 text-sm"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label className="form-label">Email</label>
                      </div>
                      <div className="error-message">{errors.forgotEmail}</div>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary w-full mb-4"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ display: isLoading === 'forgot' ? 'none' : 'inline' }}>
                        Send Reset Link
                      </span>
                      <div
                        className="spinner"
                        style={{ display: isLoading === 'forgot' ? 'block' : 'none' }}
                      />
                    </motion.button>

                    <div className="text-center text-xs sm:text-sm">
                      <motion.span
                        className="toggle-link text-[var(--text-primary)] underline cursor-pointer"
                        onClick={() => handleTabClick('login')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Back to Login
                      </motion.span>
                    </div>
                  </form>
                </motion.div>

                <motion.div
                  key={activePage}
                  className={`form-page ${activePage === 'successPage' ? 'active' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <svg
                    className="checkmark mx-auto mb-6"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 52 52"
                  >
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path
                      className="checkmark-check"
                      fill="none"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-[var(--text-primary)] mb-2">
                    {successTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-center text-[var(--text-secondary)] mb-6">
                    {successMessage}
                  </p>

                  <motion.button
                    className="btn-primary w-full mb-4"
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue to Dashboard
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginForm;