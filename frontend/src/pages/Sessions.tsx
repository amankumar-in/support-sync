import React, { useState, useEffect, useCallback } from "react";
import SessionsTable from "./SessionsTable";
import RecordingSection from "./RecordingSection";

import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  MeetingRoom,
  Add,
  Mic,
  Save,
  Delete,
  Tag,
  PersonOutline,
  NoteAlt,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";

// Define the base URL for the transcription service
const TRANSCRIPTION_API_URL = "http://localhost:5008";

// Create a theme matching AITraining
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976D2", // Deep blue
      light: "#4791db",
      dark: "#115293",
    },
    secondary: {
      main: "#DC004E", // Vibrant pink
      light: "#ff4081",
      dark: "#9a0036",
    },
    background: {
      default: "#f4f6f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#333",
      secondary: "#666",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[4],
  },
}));

// Define the Session interface
interface Session {
  _id: string;
  clientName: string;
  clientId?: string;
  sessionLength: number; // in minutes
  caseWorker: string;
  caseWorkerName?: string; // Add this field (optional with ?)
  tags: string[];
  keyNote: string;
  date: string;
}

// Sessions component
const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  // Fetch sessions function
  const fetchSessions = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const organizationId = localStorage.getItem("organizationId");

      if (!organizationId) {
        console.error("No organization ID found in localStorage");
        return;
      }

      // Use the transcription service URL with organizationId
      const response = await axios.get(
        `${TRANSCRIPTION_API_URL}/api/sessions?organizationId=${organizationId}`,
      );
      console.log("Fetched sessions:", response.data);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  // Fetch sessions when component mounts
  useEffect(() => {
    fetchSessions();
  }, []);

  // Function to start a new session
  const startNewSession = () => {
    setIsRecording(true);
  };

  // Function to handle session form close
  const handleSessionFormClose = (newSession?: Session) => {
    if (newSession) {
      console.log("New session saved:", newSession);
      // Add the new session to the list
      setSessions((prevSessions) => [...prevSessions, newSession]);
    }
    setShowSessionForm(false);
    // Refresh sessions from the server
    fetchSessions();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          p: 3,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            color: theme.palette.primary.dark,
          }}
        >
          <MeetingRoom sx={{ mr: 2, color: theme.palette.primary.main }} />
          Client Sessions
        </Typography>

        {/* Session Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StyledCard>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                  Total Sessions
                </Typography>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  {sessions.length}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Start New Session Button */}
        {!isRecording && !showSessionForm && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={startNewSession}
            sx={{
              mb: 2,
              alignSelf: "flex-start",
              boxShadow: theme.shadows[2],
              "&:hover": {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Start New Session
          </Button>
        )}

        {isRecording ? (
          <StyledCard sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography
                  variant="h5"
                  sx={{ color: theme.palette.primary.dark }}
                >
                  <Mic sx={{ mr: 1, verticalAlign: "middle" }} />
                  Recording Session
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setIsRecording(false)}
                  startIcon={<Delete />}
                  sx={{
                    borderRadius: theme.shape.borderRadius,
                  }}
                >
                  Go Back
                </Button>
              </Box>
              <RecordingSection
                setIsRecording={setIsRecording}
                setShowSessionForm={setShowSessionForm}
              />
            </CardContent>
          </StyledCard>
        ) : showSessionForm ? (
          <SessionDetailsForm onClose={handleSessionFormClose} />
        ) : (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Session History
              </Typography>
              <Tooltip title="Refresh Sessions">
                <IconButton onClick={fetchSessions} sx={{ ml: 1 }}>
                  <Refresh color="primary" />
                </IconButton>
              </Tooltip>
            </Box>
            <SessionsTable sessions={sessions} />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
};

// Session Details Form Component
const SessionDetailsForm = ({
  onClose,
}: {
  onClose: (newSession?: Session) => void;
}) => {
  const [caseWorkerName, setCaseWorkerName] = useState("");
  const [clientName, setClientName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [keyNote, setKeyNote] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  // State for clients dropdown
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch clients
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const CLIENT_API_URL = "http://localhost:5009"; // Client service port
      const response = await axios.get(`${CLIENT_API_URL}/api/clients`);
      console.log("Fetched clients:", response.data);
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle client search
  const handleClientSearch = (searchText: string) => {
    setClientName(searchText);

    if (!searchText) {
      // If search text is empty, show all clients
      setFilteredClients(clients);
      return;
    }

    // Filter clients based on search text
    const filtered = clients.filter((client) =>
      client.personalInfo.name.toLowerCase().includes(searchText.toLowerCase()),
    );

    setFilteredClients(filtered);
  };

  // Fetch clients when component mounts
  useEffect(() => {
    fetchClients();
  }, []);

  // Get session data from localStorage if available
  useEffect(() => {
    const transcription = localStorage.getItem("sessionTranscription");
    if (transcription) {
      setKeyNote(transcription);
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserInfo(userId);
    } else {
      setCaseWorkerName("Unknown User");
    }
  }, []);

  const fetchUserInfo = async (userId: string) => {
    try {
      const AUTH_API_URL = "http://localhost:5007"; // Corrected port
      const response = await axios.get(
        `${AUTH_API_URL}/api/auth/user/${userId}`,
      );

      console.log("User info response:", response.data); // Debugging log

      if (response.data && response.data.firstName) {
        const userName = response.data.lastName
          ? `${response.data.firstName} ${response.data.lastName}`
          : response.data.firstName;
        setCaseWorkerName(userName);
      } else {
        console.warn("User data missing firstName or lastName:", response.data);
        setCaseWorkerName("Unknown User");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setCaseWorkerName("Unknown User");
    }
  };

  // Function to handle adding a tag
  const handleAddTag = () => {
    if (currentTag.trim() && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  // Function to handle removing a tag
  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  // Function to handle key press in tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Function to save session
  const saveSession = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const userId = localStorage.getItem("userId");

      if (!sessionId) {
        console.error("No session ID found");
        alert("No session was created. Please try again.");
        return;
      }

      // Fetch user details to get caseWorker and caseWorkerName
      let caseWorker = null;
      let caseWorkerName = "Unknown User";

      if (userId) {
        try {
          const AUTH_API_URL = "http://localhost:5007";
          const response = await axios.get(
            `${AUTH_API_URL}/api/auth/user/${userId}`,
          );

          if (response.data) {
            caseWorker = userId; // Use userId as caseWorker
            caseWorkerName = response.data.lastName
              ? `${response.data.firstName} ${response.data.lastName}`
              : response.data.firstName;
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }

      const sessionData = {
        clientName: clientName || "No name",
        clientId: selectedClientId, // Add this line to include the client ID
        tags: tags,
        keyNote: keyNote,
        caseWorker,
        caseWorkerName,
      };

      console.log("Updating session with data:", sessionData);

      const response = await axios.put(
        `${TRANSCRIPTION_API_URL}/api/sessions/${sessionId}`,
        sessionData,
      );

      console.log("Session updated:", response.data);

      localStorage.removeItem("sessionId"); // Clear session ID after update
      onClose(response.data);
    } catch (error) {
      console.error("Error updating session:", error);
      alert("Failed to update session.");
      onClose();
    }
  };

  return (
    <StyledCard sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            color: theme.palette.primary.dark,
            display: "flex",
            alignItems: "center",
            mb: 3,
          }}
        >
          <NoteAlt sx={{ mr: 2, color: theme.palette.primary.main }} />
          Session Details
        </Typography>

        <Box component="form" sx={{ mt: 2 }}>
          <Autocomplete
            fullWidth
            options={clients}
            getOptionLabel={(option) =>
              option.personalInfo?.name || "Unnamed Client"
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client Name"
                margin="normal"
                placeholder="Type to search clients"
                required
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <PersonOutline sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: theme.shape.borderRadius,
                  },
                }}
              />
            )}
            value={
              clients.find((client) => client._id === selectedClientId) || null
            }
            onChange={(event, newValue) => {
              if (newValue) {
                setClientName(newValue.personalInfo?.name || "");
                setSelectedClientId(newValue._id || "");
              } else {
                setClientName("");
                setSelectedClientId("");
              }
            }}
            noOptionsText="No matching clients found"
            filterOptions={(options, state) => {
              return options.filter((option) =>
                option.personalInfo?.name
                  ?.toLowerCase()
                  .includes(state.inputValue.toLowerCase()),
              );
            }}
          />
          <TextField
            fullWidth
            label="Case Worker Name"
            value={caseWorkerName}
            disabled={true} // Make it non-editable
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <PersonOutline sx={{ color: "text.secondary", mr: 1 }} />
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: theme.shape.borderRadius,
              },
            }}
          />
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                color: theme.palette.text.primary,
              }}
            >
              <Tag
                sx={{
                  mr: 1,
                  fontSize: 20,
                  color: theme.palette.secondary.main,
                }}
              />
              Tags (max 5)
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TextField
                label="Add Tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                disabled={tags.length >= 5}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: theme.shape.borderRadius,
                  },
                }}
              />

              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!currentTag.trim() || tags.length >= 5}
                sx={{
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                Add
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  sx={{
                    m: 0.5,
                    borderRadius: theme.shape.borderRadius,
                  }}
                  color="primary"
                />
              ))}
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Key Note"
            value={keyNote}
            onChange={(e) => setKeyNote(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            placeholder="Enter a key note about this session"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: theme.shape.borderRadius,
              },
            }}
          />
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => onClose()}
              sx={{
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={saveSession}
              startIcon={<Save />}
              sx={{
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[2],
                "&:hover": {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              Save Session
            </Button>
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default Sessions;
