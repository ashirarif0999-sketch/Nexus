import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CircleDollarSign, Building2, LogIn, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';
import Aurora from '../../components/ui/Aurora';

// Custom Login Button Component
const LoginButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  disabled = false
}) => {
  const baseClasses = 'login-button inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'login-button-primary bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    outline: 'login-button-outline border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500'
  };

  const sizeClasses = fullWidth ? 'login-button-full w-full py-3 px-4 text-sm' : 'login-button-normal py-2.5 px-4 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses)}
    >
      {isLoading && (
        <svg className="login-button-spinner animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {!isLoading && leftIcon && <span className="login-button-icon mr-2">{leftIcon}</span>}
      <span className="login-button-text">{children}</span>
      {!isLoading && rightIcon && <span className="login-button-icon ml-2">{rightIcon}</span>}
    </button>
  );
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string; role: UserRole } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Mock 2FA check - in a real app, this would be determined by user settings
      const requires2FA = role === 'investor' && email === 'michael@vcinnovate.com';

      if (requires2FA) {
        // Store login credentials and show 2FA screen
        setPendingLogin({ email, password, role });
        setShow2FA(true);
        setIsLoading(false);
      } else {
        // Normal login flow
        await login(email, password, role);
        navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
      }
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!pendingLogin || otpCode.length !== 6) return;

    try {
      await login(pendingLogin.email, pendingLogin.password, pendingLogin.role);
      navigate(pendingLogin.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setError((err as Error).message);
      setShow2FA(false);
      setPendingLogin(null);
      setOtpCode('');
    }
  };

  const handleBackToLogin = () => {
    setShow2FA(false);
    setPendingLogin(null);
    setOtpCode('');
    setError(null);
  };

  // For demo purposes, pre-filled credentials
  const fillDemoCredentials = (userRole: UserRole) => {
    if (userRole === 'entrepreneur') {
      setEmail('sarah@techwave.io');
      setPassword('password123');
    } else {
      setEmail('michael@vcinnovate.com');
      setPassword('password123');
    }
    setRole(userRole);
  };

  return (
    <div className="login-page-container min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <Aurora
        colorStops={["#5c5c5c","#a4c4f7","#bdacff"]}
        blend={1}
        amplitude={1.0}
        speed={1}
      />
      <div className="login-page-header sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="login-logo w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="login-title mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Business Nexus
        </h2>
        <p className="login-subtitle mt-2 text-center text-sm text-gray-600">
          Connect with investors and entrepreneurs
        </p>
      </div>

      <div className="login-form-container mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="login-card bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {show2FA ? (
            <>
              {/* 2FA Screen */}
              <div className="login-2fa-screen text-center mb-6">
                <div className="flex justify-center">
                  <div className="login-2fa-icon w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="login-2fa-title mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Two-Factor Authentication
                </h2>
                <p className="login-2fa-subtitle mt-2 text-center text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="login-form space-y-6">
                <Input
                  label="6-digit code"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  fullWidth
                />

                <LoginButton
                  fullWidth
                  onClick={handle2FASubmit}
                  disabled={otpCode.length !== 6}
                  leftIcon={<Shield size={18} />}
                >
                  Verify Code
                </LoginButton>

                <LoginButton
                  variant="outline"
                  fullWidth
                  onClick={handleBackToLogin}
                  leftIcon={<ArrowLeft size={18} />}
                >
                  Back to Login
                </LoginButton>
              </div>
            </>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="login-form space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="login-role-label block text-sm font-medium text-gray-700 mb-1">
                    I am a
                  </label>
                  <div className="login-role-buttons grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`login-role-entrepreneur py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
                        role === 'entrepreneur'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setRole('entrepreneur')}
                    >
                      <Building2 size={18} className="mr-2" />
                      Entrepreneur
                    </button>

                    <button
                      type="button"
                      className={`login-role-investor py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
                        role === 'investor'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setRole('investor')}
                    >
                      <CircleDollarSign size={18} className="mr-2" />
                      Investor
                    </button>
                  </div>
                </div>

                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  startAdornment={<User size={18} />}
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />

                <div className="login-remember-forgot flex items-center justify-between">
                  <div className="login-remember-me flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="login-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="login-remember-label ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="login-forgot-password text-sm">
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Forgot your password?
                    </a>
                  </div>
                </div>

                <LoginButton
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  leftIcon={<LogIn size={18} />}
                >
                  Sign in
                </LoginButton>
              </form>

              <div className="login-demo-section mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                  </div>
                </div>

                <div className="login-demo-buttons mt-4 grid grid-cols-2 gap-3">
                  <LoginButton
                    variant="outline"
                    onClick={() => fillDemoCredentials('entrepreneur')}
                    leftIcon={<Building2 size={16} />}
                  >
                    Entrepreneur Demo
                  </LoginButton>

                  <LoginButton
                    variant="outline"
                    onClick={() => fillDemoCredentials('investor')}
                    leftIcon={<CircleDollarSign size={16} />}
                  >
                    Investor Demo
                  </LoginButton>
                </div>
              </div>

              <div className="login-signup-link mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <div className="login-signup-text mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};