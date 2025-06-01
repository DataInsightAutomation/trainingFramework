import React from 'react';

interface ErrorBannerProps {
  message: string | null;
  retryCount: number;
  onRetry: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, retryCount, onRetry }) => {
  if (!message) return null;
  
  return (
    <div style={{
      backgroundColor: '#fff3cd',
      color: '#856404',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      borderLeft: '5px solid #ffeeba'
    }}>
      <strong>Note:</strong> {message} You can still proceed with training using these options.
      {retryCount < 2 && (
        <button
          onClick={onRetry}
          style={{
            marginLeft: '10px',
            backgroundColor: '#856404',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
