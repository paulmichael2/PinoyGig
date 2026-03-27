import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import Loader from './Loader';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();
    const currentRole = currentUser?.role || currentUser?.user?.role;

    if (loading) {
        return (
            <div className="page-loader">
                <Loader size="lg" />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && currentRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
