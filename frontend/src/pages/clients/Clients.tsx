import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Toolbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

interface Client {
  _id: string;
  type: "Child" | "FosterFamily";
  personalInfo: {
    name: string;
    age?: number;
  };
  caseDetails: {
    caseStatus: "Active" | "Pending" | "Closed";
    startDate?: Date;
  };
  additionalDetails?: {
    fosterFamilySpecific?: {
      licensingStatus?: string;
      maxCapacity?: number;
    };
  };
}

const Clients = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [organizationId, setOrganizationId] = useState<string>("");

  const navigate = useNavigate();

  const clientType = tabValue === 0 ? "Child" : "FosterFamily";

  // Add this useEffect at the top of your component
  useEffect(() => {
    // Get organization ID from localStorage when component mounts
    const storedOrgId = localStorage.getItem("organizationId");
    console.log("Organization ID from localStorage:", storedOrgId); // For debugging
    if (storedOrgId) {
      setOrganizationId(storedOrgId);
    } else {
      console.error("No organization ID found in localStorage");
      // You might want to add a fallback or error message here
      setLoading(false); // Stop the loading spinner if there's no org ID
    }
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchClients();
    }
  }, [tabValue, organizationId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log(
        `Fetching clients with type=${clientType} and organizationId=${organizationId}`,
      );

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/clients?type=${clientType}&organizationId=${organizationId}`,
      );

      const data = await response.json();
      console.log("API response data:", data);

      // Check if data is an array
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error("API did not return an array:", data);
        setClients([]); // Set to empty array if response is not an array
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]); // Set to empty array on error
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    navigate("/clients/create");
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    navigate(`/clients/${clientId}/edit`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />
        {/* <Toolbar /> Spacing */}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1">
              Clients
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClient}
            >
              Create New Client
            </Button>
          </Box>

          <Paper sx={{ width: "100%", mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Children" />
              <Tab label="Foster Families" />
            </Tabs>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : clients.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1">
                  No {clientType === "Child" ? "children" : "foster families"}{" "}
                  found.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {clientType === "Child" ? (
                        <>
                          <TableCell>Name</TableCell>
                          <TableCell>Age</TableCell>
                          <TableCell>Case Status</TableCell>
                          <TableCell>Start Date</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>Name</TableCell>
                          <TableCell>License Status</TableCell>
                          <TableCell>Maximum Capacity</TableCell>
                        </>
                      )}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client._id}>
                        {clientType === "Child" ? (
                          <>
                            <TableCell>{client.personalInfo?.name}</TableCell>
                            <TableCell>
                              {client.personalInfo?.age || "N/A"}
                            </TableCell>
                            <TableCell>
                              {client.caseDetails?.caseStatus}
                            </TableCell>
                            <TableCell>
                              {client.caseDetails?.startDate
                                ? new Date(
                                    client.caseDetails.startDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{client.personalInfo?.name}</TableCell>
                            <TableCell>
                              {client.additionalDetails?.fosterFamilySpecific
                                ?.licensingStatus || "N/A"}
                            </TableCell>
                            <TableCell>
                              {client.additionalDetails?.fosterFamilySpecific
                                ?.maxCapacity || "N/A"}
                            </TableCell>
                          </>
                        )}
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewClient(client._id)}
                            sx={{ mr: 1 }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            color="secondary"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditClient(client._id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Clients;
