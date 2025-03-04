import React, { useState, useEffect, useCallback } from "react";

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
  Box,
  TextField,
  Chip,
} from "@mui/material";
import axios from "axios";

// Define the base URL for the transcription service
const TRANSCRIPTION_API_URL = "http://localhost:5008";

// Define the Session interface
interface Session {
  _id: string;
  clientName: string;
  sessionLength: number; // in minutes
  caseWorker: string;
  caseWorkerName?: string; // Add this field (optional with ?)
  tags: string[];
  keyNote: string;
  date: string;
}

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
const SessionsTable = ({ sessions }: { sessions: Session[] }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Client Name</TableCell>
            <TableCell>Session Length</TableCell>
            <TableCell>Case Worker</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell>Key Note</TableCell>
            <TableCell>View</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session.clientName || "No name"}</TableCell>
                <TableCell>{session.sessionLength} min</TableCell>
                {/* Need to show actual names below */}
                <TableCell>
                  {session.caseWorkerName || session.caseWorker}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {session.tags && session.tags.length > 0
                      ? session.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))
                      : "No tags"}
                  </Box>
                </TableCell>
                <TableCell>{session.keyNote || "No notes"}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      /* Handle view session */
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No sessions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Recording Section Component
const RecordingSection = ({
  setIsRecording,
  setShowSessionForm,
}: {
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSessionForm: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "paused"
  >("idle");
  const [transcription, setTranscription] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (recordingStatus === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  // Start recording function
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data]);

          // Simulate transcription
          simulateTranscription();
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log("Recording stopped, audio blob created", audioBlob.size);
      };

      recorder.start(1000); // Collect data every second for transcription
      setMediaRecorder(recorder);
      setRecordingStatus("recording");
      setIsRecording(true); // Use the prop to update parent component state
    } catch (error) {
      console.error("Error starting recording:", error);

      // Provide user-friendly error message
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Permission to record audio was denied. Please enable microphone access in your browser settings.",
        );
      } else {
        alert(
          "Unable to start recording. Please check your microphone and try again.",
        );
      }

      // Reset recording states
      setRecordingStatus("idle");
      setIsRecording(false);
    }
  };

  // Simulating live transcription (in a real app, this would call an API)
  const simulateTranscription = () => {
    // This is just placeholder functionality - in a real app you'd
    // send the audio chunk to a service like Whisper AI
    const phrases = [
      "I'm having difficulties with...",
      "Could you explain how to...",
      "I need assistance with...",
      "Thank you for your help with...",
      "I was wondering if...",
    ];

    // Add a random phrase to simulate incoming transcription
    if (recordingStatus === "recording") {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setTranscription((prev) => prev + " " + randomPhrase);
    }
  };

  // Pause recording function
  const pauseRecording = () => {
    if (mediaRecorder && recordingStatus === "recording") {
      mediaRecorder.pause();
      setRecordingStatus("paused");
    }
  };

  // Resume recording function
  const resumeRecording = () => {
    if (mediaRecorder && recordingStatus === "paused") {
      mediaRecorder.resume();
      setRecordingStatus("recording");
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    // Prevent multiple stops if already submitting
    if (isSubmitting || recordingStatus === "idle") return;

    // Set submitting state to prevent multiple submissions
    setIsSubmitting(true);

    if (mediaRecorder) {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        // Add metadata from localStorage
        formData.append("sessionLength", recordingTime.toString());
        formData.append("userId", localStorage.getItem("userId") || "");
        formData.append(
          "organizationId",
          localStorage.getItem("organizationId") || "",
        );

        // Store transcription in localStorage for later use
        if (transcription) {
          localStorage.setItem("sessionTranscription", transcription);
        }

        try {
          const response = await fetch(
            `${TRANSCRIPTION_API_URL}/api/sessions`,
            {
              method: "POST",
              body: formData,
            },
          );

          const data = await response.json();
          console.log("Session created with transcription:", data);

          if (data.session) {
            localStorage.setItem("sessionId", data.session._id); // Save session ID for additional details
          }

          // Reset recording state
          setRecordingStatus("idle");
          setIsRecording(false);
          setShowSessionForm(true);

          // Clear audio chunks and transcription
          setAudioChunks([]);
          setTranscription("");
          setRecordingTime(0);
        } catch (error) {
          console.error("Error uploading recording:", error);
          // Reset states even if there's an error
          setRecordingStatus("idle");
          setIsRecording(false);
        } finally {
          // Always reset submitting state
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        // Ensure states are reset
        setRecordingStatus("idle");
        setIsRecording(false);
        setIsSubmitting(false);
      }
    } else {
      // Fallback to reset states if no mediaRecorder
      setRecordingStatus("idle");
      setIsRecording(false);
      setIsSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Recording Session
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          Recording Time: {formatTime(recordingTime)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {recordingStatus === "idle" && (
          <Button
            variant="contained"
            color="primary"
            onClick={startRecording}
            disabled={isSubmitting}
          >
            Start Recording
          </Button>
        )}

        {recordingStatus === "recording" && (
          <Button
            variant="outlined"
            color="primary"
            onClick={pauseRecording}
            disabled={isSubmitting}
          >
            Pause
          </Button>
        )}

        {recordingStatus === "paused" && (
          <Button
            variant="outlined"
            color="primary"
            onClick={resumeRecording}
            disabled={isSubmitting}
          >
            Resume
          </Button>
        )}

        {(recordingStatus === "recording" || recordingStatus === "paused") && (
          <Button
            variant="contained"
            color="error"
            onClick={stopRecording}
            disabled={isSubmitting}
          >
            Stop Recording
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Paper
          sx={{
            p: 2,
            flexGrow: 1,
            maxHeight: "400px",
            overflowY: "auto",
            bgcolor: "#f5f5f5",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Live Transcription
          </Typography>
          <Typography variant="body1">
            {transcription || "Speak to see transcription appear here..."}
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
};

// Session Details Form Component
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
        tags: tags,
        keyNote: keyNote,
        caseWorker, // Add caseWorker
        caseWorkerName, // Add caseWorkerName
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
        <TextField
          fullWidth
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          margin="normal"
          placeholder="Enter client name or leave blank"
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
