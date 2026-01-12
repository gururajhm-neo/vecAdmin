import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onMenuClick: () => void;
  onDesktopMenuClick?: () => void;
  isCollapsed?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onDesktopMenuClick, isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
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

        {/* Desktop menu toggle button */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onDesktopMenuClick}
          sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}
        >
          {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 0, mr: 2, fontWeight: 'bold' }}
        >
          TestNeo
        </Typography>

        <Typography
          variant="subtitle1"
          noWrap
          component="div"
          sx={{ flexGrow: 1, opacity: 0.9 }}
        >
          Weaviate Admin
        </Typography>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Weaviate status indicator */}
          <Chip
            label="Weaviate"
            color="success"
            size="small"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          />

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

          {/* Logout button */}
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

