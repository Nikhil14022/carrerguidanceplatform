import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "@/App.css";
import LandingPage from "@/pages/LandingPage";
import AuthCallback from "@/pages/AuthCallback";
import ClientDashboard from "@/pages/ClientDashboard";
import QuestionnaireView from "@/pages/QuestionnaireView";
import TeamDashboard from "@/pages/TeamDashboard";
import ClientProfile from "@/pages/ClientProfile";
import AdminPanel from "@/pages/AdminPanel";
import { Toaster } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="/questionnaire/:stageId" element={<ProtectedRoute><QuestionnaireView /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute requireRole="team"><TeamDashboard /></ProtectedRoute>} />
      <Route path="/client/:clientId" element={<ProtectedRoute requireRole="team"><ClientProfile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminPanel /></ProtectedRoute>} />
    </Routes>
  );
}

function ProtectedRoute({ children, requireRole }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }
    
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Not authenticated');
        
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [location]);
  
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (requireRole && user?.role !== requireRole && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
