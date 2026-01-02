import React from "react";
import { FcGoogle } from "react-icons/fc"; 
import { FaQuestionCircle } from "react-icons/fa";
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

  const styles = `
    .blue-header-bar {
      background: linear-gradient(90deg, #2d6cdf, #4b79e6);
      color: #fff;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 10px;
    }
  `;

return (
    <div className="container-fluid mt-3">
      {/* Inject Internal CSS */}
      <style>{styles}</style>

      {/* --- Blue Header --- */}
      <div className="blue-header-bar mb-4">
        <h5 className="mb-0 fw-bold">Google Meet</h5>
        <FaQuestionCircle className="opacity-75" size={14} style={{ cursor: "pointer" }} />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded shadow-sm p-4 border">
        {/* ... keep your existing card content ... */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
           <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
             Please connect with your google account to use google meet service.
           </p>
           <button 
             className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium"
             onClick={handleConnect}
             style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
           >
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