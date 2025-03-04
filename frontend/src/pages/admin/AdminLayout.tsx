import { Outlet } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { Box, Toolbar, Container } from "@mui/material";
import { useState, useEffect } from "react";

const AdminLayout = () => {
  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
      setSidebarWidth(isCollapsed ? 70 : 240);
    };

    // Initial check
    handleStorageChange();

    // Set up event listener
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${sidebarWidth}px`, // Add margin to account for sidebar
          width: `calc(100% - ${sidebarWidth}px)`, // Set width to remaining space
          transition: "margin-left 0.3s ease, width 0.3s ease",
        }}
      >
        <Header />
        <Toolbar /> {/* Keeps spacing for Header */}
        <Container maxWidth="xl" sx={{ mt: 2, p: 2 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
