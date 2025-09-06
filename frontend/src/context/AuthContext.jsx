import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { safeLocalStorage } from '../utils/performance';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'user' or 'partner'
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = safeLocalStorage.getItem('token');
    const savedUser = safeLocalStorage.getItem('user');
    const savedUserType = safeLocalStorage.getItem('userType');

    if (token && savedUser && savedUserType) {
      setUser(savedUser);
      setUserType(savedUserType);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  // Login user
  const loginUser = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.loginUser(credentials);
      const { user: userData, token } = response.data;

      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('user', userData);
      safeLocalStorage.setItem('userType', 'user');

      setUser(userData);
      setUserType('user');
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register user
  const registerUser = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.registerUser(userData);
      
      const { user: newUser, token } = response.data;

      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('user', newUser);
      safeLocalStorage.setItem('userType', 'user');

      setUser(newUser);
      setUserType('user');
      setIsAuthenticated(true);

      // Check if this is first time registration for a user (not partner)
      const hasSeenOnboarding = safeLocalStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        safeLocalStorage.setItem('hasSeenOnboarding', 'true');
        setShowOnboarding(true);
      }

      toast.success('Registration successful!');
      return { success: true, user: newUser, isFirstTime: !hasSeenOnboarding };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Login partner
  const loginPartner = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.loginPartner(credentials);
      const { partner: partnerData, token } = response.data;

      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('user', partnerData);
      safeLocalStorage.setItem('userType', 'partner');

      setUser(partnerData);
      setUserType('partner');
      setIsAuthenticated(true);

      toast.success('Partner login successful!');
      return { success: true, user: partnerData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register partner
  const registerPartner = async (partnerData) => {
    try {
      setIsLoading(true);
      // Ensure brandName is provided for partner registration
      if (!partnerData.brandName) {
        toast.error('Brand name is required for partner registration');
        return { success: false, message: 'Brand name is required' };
      }
      
      const response = await authAPI.registerPartner(partnerData);
      const { partner: newPartner, token } = response.data;

      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('user', newPartner);
      safeLocalStorage.setItem('userType', 'partner');

      setUser(newPartner);
      setUserType('partner');
      setIsAuthenticated(true);

      toast.success('Partner registration successful!');
      return { success: true, user: newPartner };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call appropriate logout endpoint
      if (userType === 'partner') {
        await authAPI.logoutPartner();
      } else {
        await authAPI.logoutUser();
      }
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and storage
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('userType');

      setUser(null);
      setUserType(null);
      setIsAuthenticated(false);
      setIsLoading(false);

      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    userType,
    isLoading,
    isAuthenticated,
    showOnboarding,
    setShowOnboarding,
    loginUser,
    registerUser,
    loginPartner,
    registerPartner,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};