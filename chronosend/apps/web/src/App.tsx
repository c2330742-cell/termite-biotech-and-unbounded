import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ThemeProvider } from './contexts/theme-context';
import { WebSocketProvider } from './contexts/websocket-context';
import { AppLayout } from './components/layout/app-layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { ComposePage } from './pages/compose';
import { OnboardingPage } from './pages/onboarding';
import { QueuePage } from './pages/queue';
import { HistoryPage } from './pages/history';
import { SettingsPage } from './pages/settings';
import { AdminPage } from './pages/admin';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Spinner() {
  return <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
}

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasCredentials } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasCredentials === null) return <Spinner />;
  if (!hasCredentials) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
}

function AppGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasCredentials } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasCredentials === null) return <Spinner />;
  if (!hasCredentials) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, hasCredentials } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasCredentials === null) return <Spinner />;
  if (!hasCredentials) return <Navigate to="/onboarding" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />
      <Route element={<AppGuard><AppLayout /></AppGuard>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <AppRoutes />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
