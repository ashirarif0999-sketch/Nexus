import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CircleDollarSign, Building2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { UserRole } from '../../types';
import Aurora from '../../components/ui/Aurora';

// Custom Register Button Component
const RegisterButton: React.FC<{
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
  const baseClasses = 'register-button inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'register-button-primary bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    outline: 'register-button-outline border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500'
  };

  const sizeClasses = fullWidth ? 'register-button-full w-full py-3 px-4 text-sm' : 'register-button-normal py-2.5 px-4 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses)}
    >
      {isLoading && (
        <svg className="register-button-spinner animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {!isLoading && leftIcon && <span className="register-button-icon mr-2">{leftIcon}</span>}
      <span className="register-button-text">{children}</span>
      {!isLoading && rightIcon && <span className="register-button-icon ml-2">{rightIcon}</span>}
    </button>
  );
};

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password, role);
      // Redirect based on user role
      navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="register-page-container min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <Aurora
        colorStops={["#5c5c5c","#a4c4f7","#bdacff"]}
        blend={1}
        amplitude={1.0}
        speed={1}
      />
      <div className="register-page-header sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="register-logo w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="register-title mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="register-subtitle mt-2 text-center text-sm text-gray-600">
          Join Business Nexus to connect with partners
        </p>
      </div>

      <div className="register-form-container mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="register-card bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="register-form space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="register-role-label block text-sm font-medium text-gray-700 mb-1">
                I am registering as a
              </label>
              <div className="register-role-buttons grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`register-role-entrepreneur py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
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
                  className={`register-role-investor py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
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
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              startAdornment={<User size={18} />}
            />
            
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              startAdornment={<Mail size={18} />}
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
            />

            <PasswordStrengthMeter password={password} />

            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
            />
            
            <div className="register-terms flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="register-terms-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="register-terms-label ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <RegisterButton
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Create account
            </RegisterButton>
          </form>
          
          <div className="register-signin-link mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            <div className="register-signin-text mt-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};