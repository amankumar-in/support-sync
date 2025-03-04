import React, { useState, useEffect, useCallback } from "react";
import SessionsTable from "./SessionsTable";
import RecordingSection from "./RecordingSection";

import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  TextField,
  Chip,
  Autocomplete,
} from "@mui/material";
import axios from "axios";

// Define the base URL for the transcription service
const TRANSCRIPTION_API_URL = "http://localhost:5008";

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
    <Container>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Sessions</Typography>
        {!isRecording && !showSessionForm && (
          <Button variant="contained" color="primary" onClick={startNewSession}>
            Start New Session
          </Button>
        )}
      </Box>

      {isRecording ? (
        <RecordingSection
          setIsRecording={setIsRecording}
          setShowSessionForm={setShowSessionForm}
        />
      ) : showSessionForm ? (
        <SessionDetailsForm onClose={handleSessionFormClose} />
      ) : (
        <SessionsTable sessions={sessions} />
      )}
    </Container>
  );
};

// Sessions table component

// Recording Section Component

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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
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
        />
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
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
            />

            <Button
              variant="outlined"
              onClick={handleAddTag}
              disabled={!currentTag.trim() || tags.length >= 5}
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
        />
        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button variant="outlined" onClick={() => onClose()}>
            Cancel
          </Button>

          <Button variant="contained" color="primary" onClick={saveSession}>
            Save Session
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default Sessions;
