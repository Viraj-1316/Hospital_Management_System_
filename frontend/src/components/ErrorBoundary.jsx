import React from 'react';

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);

        this.setState({ errorInfo });

        // In production, you could send this to an error reporting service
        // Example: logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
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
                        padding: '20px',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '40px',
                            maxWidth: '500px',
                            textAlign: 'center',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        {/* Error Icon */}
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                background: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        <h1
                            style={{
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#1f2937',
                                margin: '0 0 12px',
                            }}
                        >
                            Oops! Something went wrong
                        </h1>

                        <p
                            style={{
                                fontSize: '16px',
                                color: '#6b7280',
                                margin: '0 0 24px',
                                lineHeight: '1.5',
                            }}
                        >
                            We're sorry, but something unexpected happened.
                            Please try refreshing the page or go back to the home page.
                        </p>

                        {/* Error details (development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '24px',
                                    textAlign: 'left',
                                }}
                            >
                                <summary
                                    style={{
                                        cursor: 'pointer',
                                        color: '#dc2626',
                                        fontWeight: '500',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Error Details (Dev Only)
                                </summary>
                                <pre
                                    style={{
                                        fontSize: '12px',
                                        color: '#7f1d1d',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        margin: 0,
                                    }}
                                >
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center',
                            }}
                        >
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'white',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                Refresh Page
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#667eea',
                                    background: 'white',
                                    border: '2px solid #667eea',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#f5f3ff';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'white';
                                }}
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>

                    {/* Branding */}
                    <p
                        style={{
                            marginTop: '24px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                        }}
                    >
                        OneCare Hospital Management System
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
