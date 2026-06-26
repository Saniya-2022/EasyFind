import { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Box, Paper, Snackbar, Alert } from "@mui/material";

function ChangePassword() {
  const [formData, setFormData] = useState({ oldPassword: "", newPassword: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminAuthToken");
      const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/change-password`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      setSnackbar({ open: true, message: response.data.message, severity: "success" });
      setFormData({ oldPassword: "", newPassword: "" });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || "Error changing password", severity: "error" });
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 400, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Change Password</Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="Old Password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
          />

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Update Password
          </Button>
        </form>
      </Paper>

      {/* Snackbar for Notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChangePassword;
