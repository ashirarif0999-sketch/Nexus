import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, AuthContextType, Entrepreneur, Investor } from '../types';
import { users } from '../data/users';
import toast from 'react-hot-toast';
import { userProfilesDB } from '../utils/userProfilesDB';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const RESET_TOKEN_KEY = 'business_nexus_reset_token';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock login function - memoized to prevent re-renders
  // Note: password parameter is unused in mock implementation (demo mode accepts any password)
  const login = useCallback(async (email: string, _password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching email and role
      let foundUser = users.find(u => u.email === email && u.role === role);
      
      // If no matching user, create a new one for demo purposes
      if (!foundUser) {
        const name = email.split('@')[0].replace('.', ' ').split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        
        if (role === 'entrepreneur') {
          const newEntrepreneur: Entrepreneur = {
            id: `e${Date.now()}`,
            name,
            email,
            role: 'entrepreneur',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: '',
            isOnline: true,
            createdAt: new Date().toISOString(),
            startupName: 'My Startup',
            pitchSummary: 'A promising startup looking for investment',
            fundingNeeded: '$500,000',
            industry: 'Technology',
            location: 'San Francisco, CA',
            foundedYear: 2024,
            teamSize: 5
          };
          foundUser = newEntrepreneur;
          users.push(newEntrepreneur);
        } else {
          const newInvestor: Investor = {
            id: `i${Date.now()}`,
            name,
            email,
            role: 'investor',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: '',
            isOnline: true,
            createdAt: new Date().toISOString(),
            investmentInterests: ['Technology', 'FinTech', 'HealthTech'],
            investmentStage: ['Seed', 'Series A'],
            portfolioCompanies: [],
            totalInvestments: 0,
            minimumInvestment: '$50,000',
            maximumInvestment: '$500,000'
          };
          foundUser = newInvestor;
          users.push(newInvestor);
        }
      }
      
       // Load profile data from IndexedDB
       const profile = await userProfilesDB.getProfile(foundUser.id);
       if (profile) {
         foundUser = { ...foundUser, ...profile };
       } else {
         // Initialize profile in IndexedDB if it doesn't exist
         await userProfilesDB.saveProfile({
           id: foundUser.id,
           avatarUrl: foundUser.avatarUrl,
           name: foundUser.name,
           bio: foundUser.bio || '',
           location: 'San Francisco, CA',
           lastUpdated: Date.now()
         });
       }

       setUser(foundUser);
       localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
       toast.success('Successfully logged in!');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock register function - memoized
  // Note: password parameter is unused in mock implementation (demo mode accepts any password)
  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: Entrepreneur | Investor = role === 'entrepreneur' 
        ? {
            id: `${role[0]}${users.length + 1}`,
            name,
            email,
            role: 'entrepreneur',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: '',
            isOnline: true,
            createdAt: new Date().toISOString(),
            startupName: 'My Startup',
            pitchSummary: 'A promising startup',
            fundingNeeded: '$500,000',
            industry: 'Technology',
            location: 'San Francisco, CA',
            foundedYear: 2024,
            teamSize: 1
          }
        : {
            id: `${role[0]}${users.length + 1}`,
            name,
            email,
            role: 'investor',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: '',
            isOnline: true,
            createdAt: new Date().toISOString(),
            investmentInterests: ['Technology'],
            investmentStage: ['Seed'],
            portfolioCompanies: [],
            totalInvestments: 0,
            minimumInvestment: '$50,000',
            maximumInvestment: '$500,000'
          };
      
       // Add user to mock data
       users.push(newUser as Entrepreneur | Investor);

       // Initialize profile in IndexedDB
       await userProfilesDB.saveProfile({
         id: newUser.id,
         avatarUrl: newUser.avatarUrl,
         name: newUser.name,
         bio: '',
         location: 'San Francisco, CA',
         lastUpdated: Date.now()
       });

       setUser(newUser);
       localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
       toast.success('Account created successfully!');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock forgot password function - memoized
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('No account found with this email');
      }
      
      // Generate reset token (in a real app, this would be a secure token)
      const resetToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(RESET_TOKEN_KEY, resetToken);
      
      // In a real app, this would send an email
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  }, []);

  // Mock reset password function - memoized
  // Note: newPassword parameter is unused in mock implementation (demo only)
  const resetPassword = useCallback(async (token: string, _newPassword: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify token
      const storedToken = localStorage.getItem(RESET_TOKEN_KEY);
      if (token !== storedToken) {
        throw new Error('Invalid or expired reset token');
      }
      
      // In a real app, this would update the user's password in the database
      localStorage.removeItem(RESET_TOKEN_KEY);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  }, []);

  // Logout function - memoized
  const logout = useCallback((): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  }, []);

  // Update user profile - memoized
  const updateProfile = useCallback(async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user in mock data
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const updatedUser = { ...users[userIndex], ...updates };
      (users as unknown as User[])[userIndex] = updatedUser;

      // Save profile data to IndexedDB
      await userProfilesDB.updateProfile(userId, {
        avatarUrl: updatedUser.avatarUrl,
        name: updatedUser.name,
        bio: updatedUser.bio,
      });

      // Update current user if it's the same user
      if (user?.id === userId) {
        setUser(updatedUser as User);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  }, [user]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  }), [user, login, register, logout, forgotPassword, resetPassword, updateProfile, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};