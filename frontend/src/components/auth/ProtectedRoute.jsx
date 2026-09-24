import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="skeleton h-8 w-48 mx-auto mb-4 rounded-sm" />
        <div className="skeleton h-4 w-64 mx-auto rounded-sm" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve requested location to redirect back after successful sign-in
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
