import { useState } from 'react';
import { Link } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import axios from "axios";
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MuiDrawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckIcon from '@mui/icons-material/Check';
import PeopleIcon from '@mui/icons-material/People';
import UploadIcon from '@mui/icons-material/Upload';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;
const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const menuItems = [
  { text: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { text: 'Approve Items', path: '/admin/approve', icon: <CheckIcon /> },
  { text: 'Give to Student', path: '/admin/give', icon: <PeopleIcon /> },
  { text: 'Upload Item', path: '/admin/upload', icon: <UploadIcon /> },
  { text: 'Edit Items', path: '/admin/edit', icon: <CheckIcon /> },
];

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const API_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL || import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3115";

  const handleDrawerToggle = () => setOpen(!open);
  const handleLogout = () => {
    localStorage.removeItem("adminAuthToken");
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <MuiDrawer variant="temporary" open={open} onClose={handleDrawerToggle} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>
        <Toolbar><IconButton onClick={handleDrawerToggle}><ChevronLeftIcon /></IconButton></Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} component={Link} to={item.path} onClick={handleDrawerToggle}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><ExitToAppIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </MuiDrawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
