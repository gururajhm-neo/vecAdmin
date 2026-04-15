import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ColorModeProvider, useColorMode } from './contexts/ColorModeContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schema from './pages/Schema';
import SchemaGraph from './pages/SchemaGraph';
import DataBrowser from './pages/DataBrowser';
import QueryPlayground from './pages/QueryPlayground';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="schema" element={<Schema />} />
        <Route path="schema-graph" element={<SchemaGraph />} />
        <Route path="data" element={<DataBrowser />} />
        <Route path="query" element={<QueryPlayground />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Inner app — reads color mode and builds the MUI theme dynamically */
function ThemedApp() {
  const { mode } = useColorMode();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#6C9CFF' : '#1976d2',
          },
          secondary: {
            main: mode === 'dark' ? '#b39ddb' : '#7c4dff',
          },
          success: { main: '#4caf50' },
          warning: { main: '#ff9800' },
          error: { main: '#f44336' },
          background: {
            default: mode === 'dark' ? '#0d1117' : '#f0f4ff',
            paper: mode === 'dark' ? '#161b22' : '#ffffff',
          },
        },
        typography: {
          fontFamily:
            '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
        shape: { borderRadius: 10 },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow:
                  mode === 'dark'
                    ? '0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)'
                    : '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
              },
            },
          },
          MuiChip: {
            styleOverrides: { root: { borderRadius: 6 } },
          },
          MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none' } },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ColorModeProvider>
      <ThemedApp />
    </ColorModeProvider>
  );
}

export default App;

