import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  APP_DESCRIPTION,
  APP_ORGANIZATION_NAME,
  APP_TITLE,
  DEMO_CREDENTIALS,
} from '../utils/constants';
import { DOMAINS, DomainKey, getCurrentDomain, setDomain } from '../api/mock/domains';

const IS_MOCK = process.env.REACT_APP_MOCK_MODE === 'true';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>(getCurrentDomain());

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleDomainSelect = (key: DomainKey) => {
    setDomain(key);
    setSelectedDomain(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          {/* Logo/Header */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
            }}
          >
            {APP_ORGANIZATION_NAME}
          </Typography>
          
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{
              color: 'text.secondary',
              mb: 3,
            }}
          >
            {APP_TITLE}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            {APP_DESCRIPTION}
          </Typography>

          {/* ── Mock Mode: Domain Selector ── */}
          {IS_MOCK && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip label="DEMO MODE" size="small" color="warning" sx={{ fontWeight: 700, fontSize: 10 }} />
                <Typography variant="caption" color="text.secondary">
                  Pick a dataset to explore:
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {(Object.values(DOMAINS) as typeof DOMAINS[DomainKey][]).map((d) => (
                  <Paper
                    key={d.key}
                    variant="outlined"
                    onClick={() => handleDomainSelect(d.key)}
                    sx={{
                      p: 1.25,
                      cursor: 'pointer',
                      borderRadius: 2,
                      borderColor: selectedDomain === d.key ? d.color : 'divider',
                      borderWidth: selectedDomain === d.key ? 2 : 1,
                      bgcolor: selectedDomain === d.key ? `${d.color}12` : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: d.color, bgcolor: `${d.color}0a` },
                    }}
                  >
                    <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{d.icon}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, fontSize: 12 }}>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                      {d.tagline}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>

            {/* Test credentials hint */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Test Credentials:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {DEMO_CREDENTIALS[0].email} / {DEMO_CREDENTIALS[0].password}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {DEMO_CREDENTIALS[1].email} / {DEMO_CREDENTIALS[1].password}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

