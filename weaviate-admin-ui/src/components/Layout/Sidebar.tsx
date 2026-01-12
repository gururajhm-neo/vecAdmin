import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchemaIcon from '@mui/icons-material/AccountTree';
import DataIcon from '@mui/icons-material/Storage';
import QueryIcon from '@mui/icons-material/Code';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 65;

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/schema', label: 'Schema Viewer', icon: <SchemaIcon /> },
  { path: '/data', label: 'Data Browser', icon: <DataIcon /> },
  { path: '/query', label: 'Query Playground', icon: <QueryIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawer = (isCollapsed: boolean) => (
    <Box>
      <Toolbar />
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const button = (
            <ListItemButton
              selected={isActive}
              onClick={() => handleNavigation(item.path)}
              sx={{
                justifyContent: isCollapsed ? 'center' : 'initial',
                px: isCollapsed ? 1 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'primary.main' : 'inherit',
                  minWidth: isCollapsed ? 'auto' : 56,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          return (
            <ListItem key={item.path} disablePadding>
              {isCollapsed ? (
                <Tooltip title={item.label} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer(false)}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawer(collapsed)}
      </Drawer>
    </>
  );
};

export default Sidebar;
export { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH };

