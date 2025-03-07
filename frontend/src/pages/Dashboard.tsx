import { useEffect, useState } from "react";
import { Box, Container, Typography, Button, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"; // ✅ Import Sidebar

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole || "");
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar /> {/* ✅ Add Sidebar Here */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />
        <Toolbar /> {/* Spacing */}
        <Container sx={{ mt: 2 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          {role === "admin" ? (
            <>
              <Typography>
                Welcome, Admin User!. You have full access.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate("/admin/settings/users")}
              >
                Manage Users
              </Button>
            </>
          ) : (
            <>
              <Typography>
                Welcome, Caseworker. Limited access granted.
              </Typography>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
