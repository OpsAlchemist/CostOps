import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Overview } from './pages/dashboard/Overview';
import { Optimization } from './pages/dashboard/Optimization';
import { Settings } from './pages/Settings';
import { DashboardLayout } from './components/DashboardLayout';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-20 border-2 border-dashed border-border rounded-2xl bg-panel">
    <span className="text-xl font-bold text-ink-muted">{name} View Coming Soon</span>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/overview" element={
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          } />
          
          <Route path="/optimization" element={
            <DashboardLayout>
              <Optimization />
            </DashboardLayout>
          } />

          <Route path="/infrastructure" element={
            <DashboardLayout>
              <Placeholder name="Infrastructure" />
            </DashboardLayout>
          } />

          <Route path="/settings" element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
