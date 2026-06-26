import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Paper
} from "@mui/material";
import { Upload, Checklist, Group, VerifiedUser, Flag } from "@mui/icons-material";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for status counts
  const [status, setStatus] = useState({ claimed: 0, verified: 0 });

  useEffect(() => {
    const fetchItemStatus = async () => {
      try {
        const token = localStorage.getItem("adminAuthToken");
        const response = await axios.get(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
            withCredentials: true,
          }
        );
  
        const items = response.data;
        const claimedCount = items.filter(item => item.status === "claimed").length;
        const verifiedCount = items.filter(item => item.status === "verified").length;
        setStatus({ claimed: claimedCount, verified: verifiedCount });
  
      } catch (error) {
        console.error("Error fetching item status", error);
      }
    };
  
    fetchItemStatus();
  }, []);
  

  const navItems = [
    {
      title: "Approve Items",
      icon: <Checklist fontSize={isMobile ? "medium" : "large"} />,
      path: "/admin/approve",
      color: "#4caf50"
    },
    {
      title: "Give To Student",
      icon: <Group fontSize={isMobile ? "medium" : "large"} />,
      path: "/admin/give",
      color: "#ff9800"
    },
    {
      title: "Upload New Item",
      icon: <Upload fontSize={isMobile ? "medium" : "large"} />,
      path: "/admin/upload",
      color: "#3f51b5"
    },
   
    
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}
    >
      {/* Header */}
      <Box textAlign="center" mb={isMobile ? 2 : 4}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Lost &amp; Found Management
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Welcome to the admin dashboard. Manage items and track progress.
        </Typography>
      </Box>

      {/* Navigation Cards */}
      <motion.div variants={itemVariants}>
        <Grid container spacing={isMobile ? 2 : 3}>
          {navItems.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card
                sx={{
                  background: item.color,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    opacity: 0.9,
                    transform: isMobile ? "none" : "translateY(-5px)"
                  },
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  height: isMobile ? "80px" : "120px",
                  display: "flex",
                  alignItems: "center"
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ width: "100%", p: isMobile ? "12px !important" : "16px !important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {item.icon}
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Status Section - Displayed Below the Page */}
      <Box mt={4}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 2,
                background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                textAlign: "center"
              }}
            >
              <Flag sx={{ fontSize: isMobile ? 40 : 50, mb: 1, color: "#fb8c00" }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {status.claimed}
              </Typography>
              <Typography variant="subtitle1">Claimed Items</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 2,
                background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
                textAlign: "center"
              }}
            >
              <VerifiedUser sx={{ fontSize: isMobile ? 40 : 50, mb: 1, color: "#43a047" }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {status.verified}
              </Typography>
              <Typography variant="subtitle1">Verified Items</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}

export default Dashboard;
