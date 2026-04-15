import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  CircleDollarSign, 
  Building2, 
  LogIn, 
  AlertCircle, 
  Shield, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  ChevronUp,
  ChevronDown,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { UserRole } from '../../types';
// @ts-ignore
import DarkVeil from '../../component/DarkVeil';
import TextType from '../../components/ui/TextType';
import { Counter } from '../../components/ui/Counter';
import { is2FAEnabledForEmail, getAll2FAEnabledEmails } from '../../utils/2faStorage';
import { users } from '../../data/users';
import { ROUTES } from '../../config/routes';
import { savedAccountsDB, SavedAccount } from '../../utils/savedAccountsDB';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

export const AuthenticationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Saved accounts state
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAccountsDropdown, setShowAccountsDropdown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Load saved accounts on mount
  useEffect(() => {
    loadSavedAccounts();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const loadSavedAccounts = async () => {
    try {
      const accounts = await savedAccountsDB.getAllAccounts();
      // Sort by last login, most recent first
      const sorted = accounts.sort((a, b) => b.lastLogin - a.lastLogin);
      setSavedAccounts(sorted);
    } catch (error) {
      console.error('Error loading saved accounts:', error);
    }
  };
  
  const handleSaveAccount = async (email: string, userRole: UserRole) => {
    try {
      // Check if account already exists
      const existing = await savedAccountsDB.getAccountByEmail(email, userRole);
      if (existing) {
        // Update last login time
        await savedAccountsDB.updateAccountLogin(existing.id);
      } else {
        // Save new account
        await savedAccountsDB.saveAccount({
          email,
          role: userRole,
          name: email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`
        });
      }
      await loadSavedAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };
  
  const handleRemoveAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await savedAccountsDB.deleteAccount(id);
      await loadSavedAccounts();
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };
  
  const handleSelectSavedAccount = async (account: SavedAccount, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isNavigating) return;

    setIsNavigating(true);
    setError(null);
    setShowAccountsDropdown(false);

    try {
      await savedAccountsDB.updateAccountLogin(account.id);

      const requires2FA = is2FAEnabledForEmail(account.email);

      if (requires2FA) {
        setPendingLogin({ email: account.email, password: 'password123', role: account.role });
        setShow2FA(true);
        setIsLoading(true);
        setIsNavigating(false);
      } else {
        await login(account.email, 'password123', account.role);
        setIsNavigating(false);
        
        const dashboardRoute = account.role === 'entrepreneur'
          ? ROUTES.DASHBOARD.ENTREPRENEUR
          : ROUTES.DASHBOARD.INVESTOR;
        navigate(dashboardRoute);
      }
    } catch (error) {
      setError((error as Error).message || 'Login failed. Please try again.');
      setIsNavigating(false);
    }
  };
  
  // Group accounts by role
  const entrepreneurAccounts = savedAccounts.filter(acc => acc.role === 'entrepreneur');
  const investorAccounts = savedAccounts.filter(acc => acc.role === 'investor');
  
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    const token = searchParams.get('token');
    if (token) return 'reset-password';
    return 'login';
  });
  const isInitialMount = React.useRef(true);
  
  // Common state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpandBtnHidden, setIsExpandBtnHidden] = useState(false);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string; role: UserRole } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Register state
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Reset password state
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Logo rotation state
  const [logoRotation, setLogoRotation] = useState(0);
  
  const { login, register, forgotPassword: contextForgotPassword, resetPassword: contextResetPassword } = useAuth();
  
  const handleLogoHover = () => {
    setLogoRotation(prev => prev + 720);
  };
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Show native warning when leaving page during reset-password
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentView === 'reset-password') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentView]);
  
  // Handle initial view from URL on first load - always reset to login on reload
  useEffect(() => {
    const path = window.location.pathname;
    
    // Always reset to login when reloading on sensitive forms (forgot-password, reset-password)
    // This ensures users don't stay on sensitive forms after page refresh
    if (path === '/forgot-password' || path === '/reset-password') {
      window.history.replaceState({}, '', '/login');
      setCurrentView('login');
    } else if (path === '/register') {
      setCurrentView('register');
    } else if (path === '/login') {
      setCurrentView('login');
    }
    // Default is 'login' for any other path
  }, []);
  
  // Sync view with URL when navigating within the app (skip on initial load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path === '/login') {
      setCurrentView('login');
    } else if (path === '/register') {
      setCurrentView('register');
    } else if (path === '/forgot-password') {
      setCurrentView('forgot-password');
    } else if (path === '/reset-password') {
      if (params.get('token')) {
        setCurrentView('reset-password');
      } else {
        // No token, redirect to login
        window.history.replaceState({}, '', '/login');
        setCurrentView('login');
      }
    }
  }, [searchParams]);
  
  const switchView = (view: AuthView) => {
    setCurrentView(view);
    setError(null);
    // Clear form states
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setForgotEmail('');
    setIsSubmitted(false);
    setResetPassword('');
    setResetConfirmPassword('');
    // Update URL to reflect current view
    if (view === 'login') {
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } else if (view === 'register') {
      navigate(ROUTES.AUTH.REGISTER, { replace: true });
    } else if (view === 'forgot-password') {
      navigate(ROUTES.AUTH.FORGOT_PASSWORD, { replace: true });
    } else if (view === 'reset-password') {
      // Keep existing token in URL if present
      const token = searchParams.get('token');
      if (token) {
        navigate(`${ROUTES.AUTH.RESET_PASSWORD}?token=${token}`, { replace: true });
      } else {
        navigate(ROUTES.AUTH.RESET_PASSWORD, { replace: true });
      }
    }
  };
  
  // Demo accounts
  const DEMO_ENTREPRENEUR_EMAIL = 'sarah@techwave.io';
  const DEMO_INVESTOR_EMAIL = 'michael@vcinnovate.com';
  
  // Login handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Check if email exists in users data with a different role (for non-demo accounts)
      const normalizedEmail = email.toLowerCase().trim();
      const isDemoAccount = normalizedEmail === DEMO_ENTREPRENEUR_EMAIL || normalizedEmail === DEMO_INVESTOR_EMAIL;
      
      if (!isDemoAccount) {
        // Find user with this email in the system
        const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
        
        if (existingUser) {
          // User exists but with different role
          if (existingUser.role !== role) {
            setError(`The account with this email does not exist in ${role} mode. Please select the correct role.`);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Check if 2FA is enabled for this email in localStorage
      const requires2FA = is2FAEnabledForEmail(email);
      console.log('AuthPage Login - Email:', email, 'Requires 2FA:', requires2FA);
      console.log('All 2FA emails:', getAll2FAEnabledEmails());
      
      if (requires2FA) {
        setPendingLogin({ email, password, role });
        setShow2FA(true);
        setIsLoading(false);
      } else {
        await login(email, password, role);
        // Save account on successful login
        await handleSaveAccount(email, role);
        navigate(role === 'entrepreneur' ? ROUTES.DASHBOARD.ENTREPRENEUR : ROUTES.DASHBOARD.INVESTOR);
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
      // Save account on successful 2FA login
      await handleSaveAccount(pendingLogin.email, pendingLogin.role);
      navigate(pendingLogin.role === 'entrepreneur' ? ROUTES.DASHBOARD.ENTREPRENEUR : ROUTES.DASHBOARD.INVESTOR);
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
  
  // Register handlers
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password, role);
      // Save account on successful registration
      await handleSaveAccount(email, role);
      navigate(role === 'entrepreneur' ? ROUTES.DASHBOARD.ENTREPRENEUR : ROUTES.DASHBOARD.INVESTOR);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };
  
  // Forgot password handlers
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await contextForgotPassword(forgotEmail);
    } catch (error) {
      // Continue anyway for demo
    } finally {
      setIsLoading(false);
    }
    
    navigate(`${ROUTES.AUTH.RESET_PASSWORD}?token=demo-token-123`);
  };
  
  // Reset password handlers
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = searchParams.get('token');
    if (!token) return;
    
    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await contextResetPassword(token, resetPassword);
      navigate(ROUTES.AUTH.LOGIN);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if token is valid for reset password
  const token = searchParams.get('token');
  const isInvalidToken = currentView === 'reset-password' && !token;
  
  // Show dark background for all auth views
  const showDarkBackground = true;
  
  // Render based on current view
  const renderContent = () => {
    if (isInvalidToken) {
      return (
        <div className="reset-password-page page-fullscreen min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Invalid reset link
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <Button
                className="mt-4"
                onClick={() => switchView('forgot-password')}
              >
                Request new reset link
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    switch (currentView) {
      case 'login':
        return renderLoginForm();
      case 'register':
        return renderRegisterForm();
      case 'forgot-password':
        return renderForgotPasswordForm();
      case 'reset-password':
        return renderResetPasswordForm();
      default:
        return renderLoginForm();
    }
  };
  
  const renderLoginForm = () => (
    <>
      {show2FA ? (
        <>
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
            
            <Button
              fullWidth
              onClick={handle2FASubmit}
              disabled={otpCode.length !== 6}
              leftIcon={<Shield size={18} />}
            >
              Verify Code
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={handleBackToLogin}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back to Login
            </Button>
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
          
          <form className="login-form space-y-6" onSubmit={handleLoginSubmit}>
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn focus:outline-none pointer-events-auto text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
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
                <button
                  type="button"
                  onClick={() => switchView('forgot-password')}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={18} />}
            >
              Sign in
            </Button>
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
              <Button
                variant="outline"
                onClick={() => fillDemoCredentials('entrepreneur')}
                leftIcon={<Building2 size={16} />}
              >
                Entrepreneur Demo
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fillDemoCredentials('investor')}
                leftIcon={<CircleDollarSign size={16} />}
              >
                Investor Demo
              </Button>
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
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={() => switchView('register')}
                  className="font-medium text-primary-400 hover:text-primary-300"
                >
                  Sign up
                </button>
              </p>
            </div>
            
            {/* Chevron Toggle for Saved Accounts - Always visible below Sign up link */}
            <div className="saved-accounts-section mt-3" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowAccountsDropdown(!showAccountsDropdown)}
                className="saved-accounts-toggle w-full flex items-center justify-center text-sm text-gray-500 hover:text-[black] transition-colors py-2 border border-gray-400 hover:border-[black] rounded-md hover:border-gray-600"
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Saved Accounts</span>
                    {showAccountsDropdown ? (
                      <ChevronUp size={18} className="ml-1" />
                    ) : (
                      <ChevronDown size={18} className="ml-1" />
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Saved Accounts Modal */}
      {showAccountsDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="showaccountdropdown absolute inset-0 bg-black/50 z-40"
            onClick={() => setShowAccountsDropdown(false)}
          />

          {/* Dropdown */}
          <div
            className="saved-accounts-dropdown-menu bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto animate-pop-in"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '90%',
              maxWidth: '400px',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            {error ? (
              <div className="px-4 py-6 text-center">
                <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
                <p className="text-sm text-red-400 font-medium">{error}</p>
                <p className="text-xs text-gray-400 mt-2">Please try again or use the login form</p>
              </div>
            ) : isNavigating ? (
              <div className="px-4 py-6 text-center text-white">
                <svg className="animate-spin mx-auto mb-4 h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium">Signing in...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait while we log you in</p>
              </div>
            ) : savedAccounts.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <UserCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved accounts yet</p>
                <p className="text-xs text-gray-600 mt-1">Sign in to save your account for faster access</p>
              </div>
            ) : (
              <>
                {/* Entrepreneur Accounts Section */}
                {entrepreneurAccounts.length > 0 && (
                  <div className="saved-accounts-section">
                    <div className="saved-accounts-section-header px-4 py-2 bg-gray-700/50 text-xs text-gray-400 uppercase tracking-wider flex items-center">
                      <Building2 size={12} className="mr-2" />
                      Entrepreneur Accounts
                    </div>
                    {entrepreneurAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`account-item flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-700/50 last:border-b-0 ${isNavigating ? 'pointer-events-none opacity-50' : 'hover:bg-gray-[white] cursor-pointer'}`}
                        onMouseDown={(e) => {
                          if (!isNavigating) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectSavedAccount(account, e as unknown as React.MouseEvent);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={account.email}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 text-white text-sm">
                              {account.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-[#0D0E12] font-medium">{account.name || account.email.split('@')[0]}</div>
                            <div className="text-xs text-gray-400">{account.email}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(account.id, e)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove account"
                          disabled={isNavigating}
                        >
                          <i className="bx bx-x" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Investor Accounts Section */}
                {investorAccounts.length > 0 && (
                  <div className="saved-accounts-section">
                    <div className="saved-accounts-section-header px-4 py-2 bg-gray-700/50 text-xs text-gray-400 uppercase tracking-wider flex items-center">
                      <CircleDollarSign size={12} className="mr-2" />
                      Investor Accounts
                    </div>
                    {investorAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`account-item flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-700/50 last:border-b-0 ${isNavigating ? 'pointer-events-none opacity-50' : 'hover:bg-[white] cursor-pointer'}`}
                        onMouseDown={(e) => {
                          if (!isNavigating) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectSavedAccount(account, e as unknown as React.MouseEvent);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={account.email}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 text-white text-sm">
                              {account.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-[#0D0E12] font-medium">{account.name || account.email.split('@')[0]}</div>
                            <div className="text-xs text-gray-400">{account.email}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(account.id, e)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove account"
                          disabled={isNavigating}
                        >
                          <i className="bx bx-x" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
  
  const renderRegisterForm = () => (
    <>
      {error && (
        <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
          <AlertCircle size={18} className="mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <form className="register-form space-y-6" onSubmit={handleRegisterSubmit}>
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
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          startAdornment={<Lock size={18} />}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn focus:outline-none pointer-events-auto text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        
        <PasswordStrengthMeter password={password} />
        
        <Input
          label="Confirm password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          startAdornment={<Lock size={18} />}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle-btn focus:outline-none pointer-events-auto text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
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
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          Create account
        </Button>
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
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => switchView('login')}
              className="font-medium text-primary-400 hover:text-primary-300"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </>
  );
  
  const renderForgotPasswordForm = () => {
    if (isSubmitted) {
      return (
        <div className="forgot-password-page page-fullscreen  bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-primary-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've sent password reset instructions to {forgotEmail}
              </p>
            </div>
            
            <div className="mt-8  shadow sm:rounded-lg ">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsSubmitted(false)}
                >
                  Try again
                </Button>
                
                {/* Demo: Navigate to Reset Password Page */}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`${ROUTES.AUTH.RESET_PASSWORD}?token=demo-token-123`)}
                >
                  Demo: Go to Reset Password
                </Button>
                
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => switchView('login')}
                  leftIcon={<ArrowLeft size={18} />}
                >
                  Back to login
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="forgot-password-page page-fullscreen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-primary-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          
          <div className="mt-8 sm:rounded-lg">
            <form className="space-y-6" onSubmit={handleForgotPasswordSubmit}>
              <Input
                label="Email address"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                fullWidth
                startAdornment={<Mail size={18} />}
              />
              
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Send reset instructions
              </Button>
              
              <Button
                variant="ghost"
                fullWidth
                onClick={() => switchView('login')}
                leftIcon={<ArrowLeft size={18} />}
              >
                Back to login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  };
  
  const renderResetPasswordForm = () => (
    <div className="reset-password-page page-fullscreen min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <div className="mt-8 sm:rounded-lg ">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleResetPasswordSubmit}>
            <Input
              label="New password"
              type={showResetPassword ? 'text' : 'password'}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="password-toggle-btn focus:outline-none pointer-events-auto text-gray-500 hover:text-gray-700"
                >
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            
            <Input
              label="Confirm new password"
              type={showResetConfirmPassword ? 'text' : 'password'}
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  className="password-toggle-btn focus:outline-none pointer-events-auto text-gray-500 hover:text-gray-700"
                >
                  {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              error={resetPassword !== resetConfirmPassword && resetConfirmPassword ? 'Passwords do not match' : undefined}
            />
            
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={resetPassword !== resetConfirmPassword}
            >
              Reset password
            </Button>
            
            <Button
              variant="ghost"
              fullWidth
              onClick={() => switchView('login')}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back to login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
  
  // For login and register, show dark background with DarkVeil
  if (showDarkBackground) {
    return (
      <>
        <div className="auth-page-background fixed inset-0 -z-10" style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>
          <DarkVeil speed={0.3} hueShift={20} noiseIntensity={0.02} warpAmount={0.5} />
        </div>
        
        {/* Top left logo */}
        <a href="/" className="fixed top-4 left-4 z-50">
          <img 
            src="/images/logo.avif" 
            alt="Business Nexus" className="vector-brand-logo h-12 w-auto"
            style={{ transform: `rotate(${logoRotation}deg)` }} onMouseEnter={handleLogoHover}/>
        </a>
        
        <button
          onClick={() => {
            setIsExpandBtnHidden(true);
            setIsMobilePanelOpen(true);
          }}
          className="mobile-expand-btn lg:hidden absolute left-1/2 -translate-x-1/2 mt-2 p-2 bg-primary-600 rounded-full text-white transition-transform hover:bg-primary-700"
          style={{ display: isExpandBtnHidden ? 'none' : 'block' }}
        >
          <i className={`bx ${isMobilePanelOpen ? 'bx-chevron-down' : 'bx-chevron-up'} text-2xl`}></i>
        </button>
        
        <div className={`${currentView === 'login' ? 'login-page-container' : 'register-page-container'} min-h-screen flex flex-col lg:flex-row justify-center relative overflow-hidden`}>
          {/* Left Side - Welcome Section */}
          
          <div className={`${currentView === 'login' ? 'login-welcome-section' : 'register-welcome-section'} hidden lg:flex lg:w-1/2 flex-col justify-center items-center pr-8 relative`}>
           
            <div className={`${currentView === 'login' ? 'login-welcome-content' : 'register-welcome-content'} text-center relative z-10`}>
              <img 
                src="/images/logo-nexus-inverted.avif" 
                alt="Business Nexus" 
                className={`${currentView === 'login' ? 'login-welcome-logo' : 'register-welcome-logo'} w-[10rem] h-auto mx-auto`}
                style={{ transform: `rotate(${logoRotation}deg)` }}
                onMouseEnter={handleLogoHover}
              />
              <h1 className={`${currentView === 'login' ? 'login-welcome-title' : 'register-welcome-title'} text-4xl font-bold text-white mb-4`}>
                {currentView === 'login' ? 'Welcome to Business Nexus' : 'Join Business Nexus'}
              </h1>
              <p className={`${currentView === 'login' ? 'login-welcome-subtitle' : 'register-welcome-subtitle'} text-xl text-gray-300 mb-8`}>
                <TextType 
                  text={currentView === 'login' ? [
                   "Connect. Collaborate. Close Deals.",
"Your network, your capital.",
"Your portfolio, all in one place."
                  ] : [
                    "Simple tools. Serious deals.",
"Discover startups worth backing.",
"Your portfolio, all in one place."
                  ]}
                  typingSpeed={40}
                  pauseDuration={2500}
                  className="text-type-effect"
                  textColors={['#ffcf3f', '#ffffff', 'linear-gradient(200deg, #efa7a6, #cdcbff)']}
                />
              </p>
              
              
               {/* Trust Signals with Animated Counters */}
               <div className="auth-trust-signals flex justify-center gap-8 mt-8">
                 <div className="trust-item flex flex-col items-center">
                   <Counter end={500} suffix="+" className="text-3xl font-bold text-white" duration={2000} delay={2700} />
                   <span className="text-sm text-gray-400">Startups</span>
                 </div>
                 <div className="trust-item flex flex-col items-center">
                   <Counter end={2000} suffix="+" className="text-3xl font-bold text-white" duration={2500} delay={2700} />
                   <span className="text-sm text-gray-400">Investors</span>
                 </div>
                 <div className="trust-item flex flex-col items-center">
                   <Counter end={2.4} prefix="$" suffix="B" className="text-3xl font-bold text-white" duration={3000} delay={2700} />
                   <span className="text-sm text-gray-400">Facilitated</span>
                 </div>
               </div>
            </div>
          </div>
          
          {/* Right Side - Auth Form */}
          <div className={`${currentView === 'login' ? 'login-form-section' : 'register-form-section'} w-full lg:w-1/2 flex flex-col justify-center`}>
          
            <div className={`${currentView === 'login' ? 'login-page-header' : 'register-page-header'} sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all duration-500 ease-out`}>
              <div className="flex justify-center lg:hidden">
                <img 
                  src="/images/logo-nexus-inverted.avif" 
                  alt="Business Nexus" 
                  className={`${currentView === 'login' ? 'login-logo-mobile' : 'register-logo-mobile'} w-[10rem] h-auto`}
                  style={{ transform: `rotate(${logoRotation}deg)` }}
                onMouseEnter={handleLogoHover}
                />
              </div>
              <div className="flex justify-center">
                
              </div>
              <h2 className={`${currentView === 'login' ? 'login-title' : 'register-title'} mt-6 text-center text-3xl font-extrabold text-[#f7f7f7]`}>
                {currentView === 'login' ? 'Sign in to Business Nexus' : 'Create your account'}
              </h2>
              <p className={`${currentView === 'login' ? 'login-subtitle' : 'register-subtitle'} mt-2 text-center text-sm text-[#f7f7f7]`}>
                {currentView === 'login' ? '' : ''}
              </p>
              <p className={`${currentView === 'login' ? 'login-welcome-subtitle' : 'register-welcome-subtitle'} mt-2 text-center text-sm text-gray-400 lg:hidden block`}>
                <TextType 
                  text={currentView === 'login' ? [
                    "Connect. Collaborate. Close.",
                    "Your network, your capital.",
                    "Your portfolio, all in one place."
                  ] : [
                    "Simple tools. Serious deals.",
                    "Discover startups worth backing.",
                    "Your portfolio, all in one place."
                  ]}
                  typingSpeed={40}
                  pauseDuration={2900}
                  className="text-type-effect"
                  textColors={['#ffcf3f', '#ffffff', 'linear-gradient(200deg, #efa7a6, #cdcbff)']}
                />
              </p>
            </div>
            
            <div className={`${currentView === 'login' ? 'login-form-container' : 'register-form-container'} mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-20 transition-all duration-500 ease-out ${isMobile ? (isMobilePanelOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0') : ''}`}>

              <div className={`${currentView === 'login' ? 'login-card' : 'register-card'} bg-gray-900/90 backdrop-blur-sm py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700/50`}>
                {/* Chevron down button - inside form at top when form is open on mobile */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpandBtnHidden(false);
                    setIsMobilePanelOpen(false);
                  }}
                  className="mobile-collapse-btn"
                  style={{ opacity: isMobile && isMobilePanelOpen ? 1 : 0, pointerEvents: isMobile && isMobilePanelOpen ? 'auto' : 'none' }}
                >
                  <i className="bx bx-chevron-down text-2xl"></i>
                </button>
                
                {currentView === 'login' ? renderLoginForm() : currentView === 'register' ? renderRegisterForm() : currentView === 'forgot-password' ? renderForgotPasswordForm() : renderResetPasswordForm()}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // For forgot-password and reset-password, also use dark background
  return (
    <>
      <div className="auth-page-background fixed inset-0 -z-10" style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>
        <DarkVeil speed={0.3} hueShift={20} noiseIntensity={0.02} warpAmount={0.5} />
      </div>
      
      {/* Top left logo */}
      <a href="/" className="fixed top-4 left-4 z-50">
        <img 
          src="/images/logo.avif" 
          alt="Business Nexus" 
          className="vector-brand-logo h-12 w-auto"
          style={{ transform: `rotate(${logoRotation}deg)` }}
          onMouseEnter={handleLogoHover}
        />
      </a>
      
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img 
              src="/images/logo-nexus-inverted.avif" 
              alt="Business Nexus" 
              className="vector-brand-logo w-[10rem] h-auto"
              style={{ transform: `rotate(${logoRotation}deg)` }}
              onMouseEnter={handleLogoHover}
            />
          </div>
          
          {renderContent()}
        </div>
      </div>
    </>
  );
};