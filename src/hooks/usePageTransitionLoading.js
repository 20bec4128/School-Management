import { useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';

/**
 * Hook to show loading spinner on page/section transitions
 * Usage: usePageTransitionLoading(currentPage)
 */
export const usePageTransitionLoading = (currentPage, delay = 100) => {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    showLoading();
    
    // Hide loading after a delay to allow content to load
    const timer = setTimeout(() => {
      hideLoading();
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPage, showLoading, hideLoading, delay]);
};
