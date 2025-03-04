import { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Home,
  People,
  Event,
  Chat,
  AccountBalance,
  BarChart,
  Settings,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const [openSettings, setOpenSettings] = useState(false);
  const [role, setRole] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole || "");
  }, []);

  const handleSettingsClick = () => {
    if (collapsed) {
      setCollapsed(false);
    } else {
      setOpenSettings(!openSettings);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (collapsed) setOpenSettings(false);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 70 : 240,
        flexShrink: 0,
        position: "fixed",
        height: "100vh",
        transition: "width 0.3s ease",
        "& .MuiDrawer-paper": {
          width: collapsed ? 70 : 240,
          boxSizing: "border-box",
          top: "64px",
          transition: "width 0.3s ease",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: collapsed ? "center" : "space-between",
          px: 1,
        }}
      >
        <IconButton onClick={toggleSidebar}>
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>

      <List>
        {[
          { text: "Overview", icon: <Home />, path: "/dashboard" },
          { text: "Clients", icon: <People />, path: "/clients" },
          { text: "Sessions", icon: <Event />, path: "/sessions" },
          { text: "AI Chat", icon: <Chat />, path: "/ai-chat" },
          { text: "Calendar", icon: <Event />, path: "/calendar" },
          { text: "Funds", icon: <AccountBalance />, path: "/funds" },
          { text: "Reports", icon: <BarChart />, path: "/reports" },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={() => setCollapsed(false)}
              sx={{
                "&.active": {
                  backgroundColor: "#e3f2fd", // Light blue for active state
                  color: "#1976d2", // Dark blue text color
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path ? "#1976d2" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}

        {/* Settings Menu */}
        <ListItem disablePadding onClick={handleSettingsClick}>
          <ListItemButton
            sx={{
              "&.active": {
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname.includes("/settings")
                  ? "#1976d2"
                  : "inherit",
              }}
            >
              <Settings />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Settings" />}
            {!collapsed && (openSettings ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {/* Only expand settings when sidebar is NOT collapsed */}
        <Collapse in={openSettings && !collapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Admin-only items */}
            {role === "admin" && (
              <>
                {[
                  { text: "Organization", path: "/settings/organization" },
                  { text: "User Management", path: "/settings/users" },
                  { text: "Forms", path: "/settings/forms" },
                  { text: "AI Training", path: "/settings/ai-training" },
                  { text: "Case Boards", path: "/settings/case-boards" },
                ].map((item) => (
                  <ListItem
                    key={item.text}
                    disablePadding
                    sx={{ pl: 3, minHeight: 24 }}
                  >
                    <ListItemButton
                      component={NavLink}
                      to={item.path}
                      sx={{
                        minHeight: 24,
                        py: 0.3,
                        "&.active": {
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                        },
                      }}
                    >
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: "0.75rem" }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}

            {/* Items visible for all users */}
            {[
              { text: "Funds", path: "/settings/funds" },
              { text: "User Profile", path: "/settings/profile" },
              { text: "Calendar", path: "/settings/calendar" },
              { text: "Security", path: "/settings/security" },
            ].map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ pl: 3, minHeight: 24 }}
              >
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    minHeight: 24,
                    py: 0.3,
                    "&.active": {
                      backgroundColor: "#e3f2fd",
                      color: "#1976d2",
                    },
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;
