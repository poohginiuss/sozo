import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    email: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          email: userData.email,
          isAuthenticated: true,
          userData: userData.userData,
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email, userData = null) => {
    // Validate email before setting authenticated state
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email provided to signIn');
      return;
    }

    const userState = {
      email: email.toLowerCase().trim(), // Normalize email
      isAuthenticated: true,
      userData: userData, // Store any additional user data from API
    };

    setUser(userState);
    
    // Store user data in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userState));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const signOut = async () => {
    setUser({
      email: null,
      isAuthenticated: false,
    });
    
    // Remove user data from AsyncStorage
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  const updateEmail = async (newEmail) => {
    const updatedUser = {
      ...user,
      email: newEmail,
    };
    
    setUser(updatedUser);
    
    // Update stored user data
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating stored user data:', error);
    }
  };

  const deleteAccount = async () => {
    // Clear all user data
    setUser({
      email: null,
      isAuthenticated: false,
      userData: null,
    });
    
    // Remove all user data from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['user', 'userPreferences', 'savedTracks', 'recentlyPlayed']);
      console.log('All user data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const value = {
    user,
    signIn,
    signOut,
    updateEmail,
    deleteAccount,
    isLoading, // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
