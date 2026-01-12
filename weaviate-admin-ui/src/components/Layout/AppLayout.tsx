import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import TopBar from './TopBar';
import Sidebar, { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from './Sidebar';

const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  const drawerWidth = desktopCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex' }}>
      <TopBar 
        onMenuClick={handleDrawerToggle} 
        onDesktopMenuClick={handleDesktopToggle}
        isCollapsed={desktopCollapsed}
      />
      <Sidebar 
        open={mobileOpen} 
        onClose={handleDrawerToggle}
        collapsed={desktopCollapsed}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            md: `calc(100% - ${drawerWidth}px)` 
          },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;

