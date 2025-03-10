import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Toolbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import SessionHistory from "./SessionHistory";

// Define the interfaces for our data
interface Client {
  _id: string;
  type: "Child" | "FosterFamily";
  organization: string;
  personalInfo: {
    name: string;
    age?: number;
    contactInfo?: {
      address?: string;
      phone?: string;
      email?: string;
    };
    emergencyContacts?: Array<{
      name: string;
      relationship: string;
      phone: string;
    }>;
  };
  caseDetails: {
    caseStatus: "Active" | "Pending" | "Closed";
    startDate?: Date;
    assignedCaseWorker?: string;
    notes?: Array<{
      content: string;
      createdBy?: string;
      createdAt?: Date;
    }>;
  };
  additionalDetails?: {
    childSpecific?: {
      schoolInfo?: string;
      specialNeeds?: string[];
    };
    fosterFamilySpecific?: {
      licensingStatus?: string;
      maxCapacity?: number;
    };
  };
}

// TabPanel component for tab content
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState<number>(0);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(`${API_URL}/api/clients/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }

      const data = await response.json();
      setClient(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching client details:", error);
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackClick = () => {
    navigate("/clients");
  };

  const handleEditClient = () => {
    navigate(`/clients/${id}/edit`);
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const renderDetailField = (
    label: string,
    value: string | number | undefined,
    fallback: string = "Not Available",
  ) => (
    <>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
        {label}
      </Typography>
      <Typography variant="body1">
        {value ? String(value) : fallback}
      </Typography>
    </>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">Client not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Back Button and Page Title */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackClick}
              sx={{ mb: 2 }}
            >
              Back to Clients
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditClient}
            >
              Edit Client
            </Button>
          </Box>

          {/* Client Basic Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {client.personalInfo.name}
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* First Column - Basic Information */}
              <Grid item xs={12} md={4}>
                {renderDetailField("Client Type", client.type)}

                {renderDetailField(
                  "Age",
                  client.personalInfo.age,
                  "Not Specified",
                )}
                {renderDetailField(
                  "Case Status",
                  client.caseDetails.caseStatus,
                )}

                {renderDetailField(
                  "Assigned Case Worker",
                  client.caseDetails.assignedCaseWorker,
                  "Not Assigned",
                )}

                {client.caseDetails.startDate && (
                  <>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Case Start Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(
                        client.caseDetails.startDate,
                      ).toLocaleDateString()}
                    </Typography>
                  </>
                )}
              </Grid>

              {/* Second Column - Contact Information */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Contact Information
                </Typography>

                {renderDetailField(
                  "Phone",
                  client.personalInfo.contactInfo?.phone,
                )}

                {renderDetailField(
                  "Email",
                  client.personalInfo.contactInfo?.email,
                )}

                {client.personalInfo.contactInfo?.address && (
                  <>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {client.personalInfo.contactInfo.address}
                    </Typography>
                  </>
                )}

                {client.personalInfo.emergencyContacts &&
                client.personalInfo.emergencyContacts.length > 0 ? (
                  <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      Emergency Contacts
                    </Typography>
                    {client.personalInfo.emergencyContacts.map(
                      (contact, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="subtitle1">
                            {contact.name} ({contact.relationship})
                          </Typography>
                          <Typography variant="body2">
                            {contact.phone}
                          </Typography>
                        </Box>
                      ),
                    )}
                  </>
                ) : (
                  renderDetailField("Emergency Contacts", undefined)
                )}
              </Grid>

              {/* Third Column - Type-Specific Details */}
              <Grid item xs={12} md={4}>
                {client.type === "Child" && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Child-Specific Information
                    </Typography>
                    {renderDetailField(
                      "School Information",
                      client.additionalDetails?.childSpecific?.schoolInfo,
                    )}

                    {client.additionalDetails?.childSpecific?.specialNeeds ? (
                      <>
                        <Typography
                          variant="subtitle1"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Special Needs
                        </Typography>
                        <Typography variant="body1">
                          {client.additionalDetails.childSpecific.specialNeeds
                            .length > 0
                            ? client.additionalDetails.childSpecific.specialNeeds.join(
                                ", ",
                              )
                            : "None"}
                        </Typography>
                      </>
                    ) : (
                      renderDetailField("Special Needs", undefined)
                    )}
                  </>
                )}

                {client.type === "FosterFamily" && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Foster Family Information
                    </Typography>
                    {renderDetailField(
                      "Licensing Status",
                      client.additionalDetails?.fosterFamilySpecific
                        ?.licensingStatus,
                    )}

                    {renderDetailField(
                      "Maximum Capacity",
                      client.additionalDetails?.fosterFamilySpecific
                        ?.maxCapacity,
                      "Not Specified",
                    )}
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs Section */}
          <Paper sx={{ width: "100%" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Case Board" />
              <Tab label="Sessions" />
              <Tab label="Forms" />
              <Tab label="Documents" />
            </Tabs>

            {/* Case Board Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Case Board (Coming Soon)
              </Typography>
              <Typography>
                This feature will be implemented in a future update.
              </Typography>
            </TabPanel>

            {/* Sessions Tab */}
            <TabPanel value={tabValue} index={1}>
              <SessionHistory
                clientId={id}
                clientName={client.personalInfo.name}
                onSessionClick={handleViewSession}
              />
            </TabPanel>

            {/* Forms Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Forms (Coming Soon)
              </Typography>
              <Typography>
                This feature will be implemented in a future update.
              </Typography>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Documents (Coming Soon)
              </Typography>
              <Typography>
                This feature will be implemented in a future update.
              </Typography>
            </TabPanel>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default ClientDetail;
