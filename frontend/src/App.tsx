import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Overview } from './pages/dashboard/Overview';
import { Optimization } from './pages/dashboard/Optimization';
import { Reporting } from './pages/dashboard/Reporting';
import { CostCalculator } from './pages/dashboard/CostCalculator';
import { Settings } from './pages/Settings';
import { DashboardLayout } from './components/DashboardLayout';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-20 border-2 border-dashed border-border rounded-2xl bg-panel">
    <span className="text-xl font-bold text-ink-muted">{name} View Coming Soon</span>
  </div>
);

const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/calculator" replace /> : <LandingPage />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAdmin();
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-20 border-2 border-dashed border-border rounded-2xl bg-panel">
        <span className="text-xl font-bold text-ink-muted">Admin access required</span>
      </div>
    );
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/overview" element={
              <DashboardLayout><Overview /></DashboardLayout>
            } />
            <Route path="/optimization" element={
              <DashboardLayout><Optimization /></DashboardLayout>
            } />
            <Route path="/infrastructure" element={
              <DashboardLayout><Placeholder name="Infrastructure" /></DashboardLayout>
            } />
            <Route path="/reporting" element={
              <DashboardLayout><Reporting /></DashboardLayout>
            } />
            <Route path="/calculator" element={
              <DashboardLayout><CostCalculator /></DashboardLayout>
            } />
            <Route path="/settings" element={
              <DashboardLayout>
                <AdminRoute><Settings /></AdminRoute>
              </DashboardLayout>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
