// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Check for authentication token or user state
  const isAuthenticated = () => {
    // Check for token in localStorage
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return !!token; // Return true if token exists
  };

  // If not authenticated, redirect to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
