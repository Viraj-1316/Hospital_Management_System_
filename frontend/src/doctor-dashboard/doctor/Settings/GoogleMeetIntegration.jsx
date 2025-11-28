import React from "react";
import { FcGoogle } from "react-icons/fc"; 
import { toast } from "react-hot-toast";

const GoogleMeetIntegration = () => {
  
  const handleConnect = () => {
    // Logic to open the Google Sign-in Popup (Matches SS2)
    const url = "https://accounts.google.com/signin/v2/identifier"; // Target URL
    const title = "Google Sign In";
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      url,
      title,
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no,copyhistory=no`
    );

    toast.loading("Connecting to Google...");
  };

  return (
    <div >
      {/* Page Title */}
      <h5 className="mb-4 fw-bold text-dark">Google Meet</h5>

      {/* Main Content Card */}
      <div className="bg-white rounded shadow-sm p-4 border">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          
          {/* Left Text */}
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Please connect with your google account to use google meet service.
          </p>

          {/* Connect Button */}
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium"
            onClick={handleConnect}
            style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
          >
            {/* White circle container for the G icon to make it pop */}
            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                <FcGoogle size={18} />
            </div>
            <span>Connect with google</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default GoogleMeetIntegration;