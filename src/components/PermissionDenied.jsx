// Permission Denied Component
import { useNavigate } from 'react-router-dom';
import { Lock, Home, ArrowLeft } from 'lucide-react';
import './PermissionDenied.css';

const PermissionDenied = ({ 
    title = "Access Denied",
    message = "You don't have permission to access this resource.",
    showBackButton = true,
    showHomeButton = true 
}) => {
    const navigate = useNavigate();

    return (
        <div className="permission-denied-page">
            <div className="permission-denied-container">
                <div className="permission-denied-icon">
                    <Lock size={64} />
                </div>
                
                <h1>{title}</h1>
                <p className="permission-denied-message">{message}</p>
                
                <div className="permission-denied-details">
                    <p>This feature is restricted based on your account role.</p>
                    <p>If you believe this is an error, please contact your administrator.</p>
                </div>

                <div className="permission-denied-actions">
                    {showBackButton && (
                        <button 
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    )}
                    {showHomeButton && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/')}
                        >
                            <Home size={18} />
                            Go to Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionDenied;
