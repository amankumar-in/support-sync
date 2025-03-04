import axios from "axios";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
} from "@mui/material";
// Set baseURL for all requests if your React app is on a different port
axios.defaults.baseURL = "http://localhost:5007";

const adminId = localStorage.getItem("userId");
console.log("🆔 Admin ID from localStorage:", adminId);

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string; // Position (like "HR", "Doctor", etc.)
  systemRole: "admin" | "caseworker"; // System role (must be "admin" or "caseworker")
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  // Define the type separately
  type FormDataType = Omit<User, "_id"> & { password: string };

  // Then use it in useState
  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    systemRole: "caseworker",
    password: "",
  });

  const adminId = localStorage.getItem("userId");

  // ✅ Use useCallback to prevent function recreation
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get<User[]>(`/api/auth/users/${adminId}`);
      console.log("✅ Users fetched:", response.data); // ✅ Debug log
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [adminId]); // Dependency on adminId, not on function itself

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // ✅ Now fetchUsers is stable in dependencies

  const handleAddUser = async () => {
    // Get the admin ID directly inside the function when it's called
    const adminId = localStorage.getItem("userId");
    console.log("🆔 Admin ID from handleAddUser:", adminId);

    if (!adminId) {
      console.error("❌ No admin ID found in localStorage.");
      return;
    }

    try {
      console.log("🔄 Sending request with adminId:", adminId);
      const response = await axios.post(
        "http://localhost:5007/api/auth/add-user",
        {
          ...formData,
          adminId: adminId, // Use the adminId from this function scope
        },
      );
      console.log("✅ User added:", response.data);

      fetchUsers();
      setOpen(false);
    } catch (error) {
      console.error("❌ Error adding user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/auth/delete-user/${userId}`, {
        data: { adminId },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Add New User
      </Button>
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.systemRole}</TableCell>
                <TableCell>
                  {user._id === adminId ? (
                    <Button variant="contained" color="success" disabled>
                      Active User
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            label="First Name"
            fullWidth
            margin="dense"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="dense"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <TextField
            label="Position"
            fullWidth
            margin="dense"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          {/* Dropdown for systemRole */}
          <TextField
            select
            label="Role"
            fullWidth
            margin="dense"
            value={formData.systemRole}
            onChange={(e) =>
              setFormData({
                ...formData,
                systemRole: e.target.value as "admin" | "caseworker",
              })
            }
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="caseworker">Caseworker</MenuItem>
          </TextField>
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="dense"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} color="primary">
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
