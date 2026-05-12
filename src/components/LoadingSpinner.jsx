import React from 'react';
import '../css/loading-spinner.css';

const LoadingSpinner = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="box"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
