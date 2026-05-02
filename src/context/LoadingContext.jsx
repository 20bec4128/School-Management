import React, { createContext, useState, useContext, useCallback } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFunction) => {
    showLoading();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};
