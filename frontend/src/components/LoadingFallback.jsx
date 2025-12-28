import React from 'react';

/**
 * Loading fallback component for React.lazy() Suspense
 * Displayed while lazy-loaded components are being fetched
 */
const LoadingFallback = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '4px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <p
                style={{
                    marginTop: '20px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500',
                    letterSpacing: '0.5px',
                }}
            >
                Loading...
            </p>
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
};

export default LoadingFallback;
