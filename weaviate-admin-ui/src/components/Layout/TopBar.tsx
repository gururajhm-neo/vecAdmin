import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../../contexts/AuthContext';
import { useColorMode } from '../../contexts/ColorModeContext';
import { useNavigate } from 'react-router-dom';
import { APP_ORGANIZATION_NAME, APP_TITLE } from '../../utils/constants';
import { getProviderInfo, ProviderInfo } from '../../api/provider';

const PROVIDER_COLORS: Record<string, string> = {
  Weaviate:  '#4CAF50',
  Qdrant:    '#E91E8C',
  ChromaDB:  '#FF6F00',
  FAISS:     '#1877F2',
};

interface TopBarProps {
  onMenuClick: () => void;
  onDesktopMenuClick?: () => void;
  isCollapsed?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onDesktopMenuClick, isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);

  useEffect(() => {
    getProviderInfo()
      .then(setProviderInfo)
      .catch(() => setProviderInfo(null));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const providerColor = PROVIDER_COLORS[providerInfo?.provider ?? ''] ?? '#2196F3';
  const providerLabel = providerInfo?.provider ?? null;
  const providerReady = providerInfo?.ready ?? false;

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop menu toggle */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onDesktopMenuClick}
          sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}
        >
          {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>

        {APP_ORGANIZATION_NAME && (
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 0, mr: 2, fontWeight: 'bold' }}
          >
            {APP_ORGANIZATION_NAME}
          </Typography>
        )}

        <Typography
          variant="subtitle1"
          noWrap
          component="div"
          sx={{ flexGrow: 1, opacity: 0.9 }}
        >
          {APP_TITLE}
        </Typography>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Provider status chip — only shown once provider info is loaded */}
          {providerLabel && (
            <Tooltip title={providerReady ? `${providerLabel} connected` : `${providerLabel} unreachable`}>
              <Chip
                label={providerLabel}
                size="small"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  bgcolor: providerColor,
                  color: '#fff',
                  fontWeight: 700,
                  opacity: providerReady ? 1 : 0.5,
                  border: providerReady ? 'none' : '1px dashed #fff',
                }}
              />
            </Tooltip>
          )}

          {/* Dark / light mode toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleColorMode} size="small">
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* User info */}
          {user && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon />
              <Box>
                <Typography variant="body2">{user.name}</Typography>
                {user.project_id && (
                  <Typography variant="caption" color="text.secondary">
                    Project: {user.project_id}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Logout */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            size="small"
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
