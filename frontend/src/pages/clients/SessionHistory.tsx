import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
} from "@mui/material";
import { PlayArrow, Pause, Download } from "@mui/icons-material";
import axios from "axios";

// Define Session interface (keeping the original interface)
interface Session {
  _id: string;
  clientName: string;
  sessionLength: number;
  tags: string[];
  keyNote: string;
  date: Date;
  audioFilePath?: string;
  transcription?: string;
  caseWorkerName?: string;
}

interface SessionHistoryProps {
  clientId?: string;
  clientName?: string;
  onSessionClick: (sessionId: string) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  clientId,
  clientName,
  onSessionClick,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [audioPlayers, setAudioPlayers] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [playingSessionId, setPlayingSessionId] = useState<string | null>(null);

  // Directly fetch organization UUID from localStorage
  const organizationUuid = localStorage.getItem("organizationId") || "";

  useEffect(() => {
    if (!clientId || !organizationUuid) {
      console.error(
        "Missing parameters - clientId:",
        clientId,
        "organizationUuid:",
        organizationUuid,
      );
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const url = `http://localhost:5008/api/sessions?clientId=${clientId}&organizationId=${organizationUuid}`;
        console.log("Fetching sessions with URL:", url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        console.log("Sessions data received:", data);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [clientId, organizationUuid]);

  const togglePlay = async (session: Session) => {
    // If no audio file path, return
    if (!session.audioFilePath) return;

    // If currently playing this session, pause
    if (playingSessionId === session._id) {
      const player = audioPlayers[session._id];
      player.pause();
      setPlayingSessionId(null);
      return;
    }

    // Stop any currently playing audio
    if (playingSessionId) {
      const currentPlayer = audioPlayers[playingSessionId];
      currentPlayer.pause();
    }

    try {
      // Fetch audio file
      const audioResponse = await axios.get(
        `http://localhost:5008/api/sessions/audio/${session._id}`,
        { responseType: "blob" },
      );

      const audioBlob = new Blob([audioResponse.data], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create or get existing audio player
      let player = audioPlayers[session._id];
      if (!player) {
        player = new Audio(audioUrl);
        setAudioPlayers((prev) => ({ ...prev, [session._id]: player }));
      } else {
        player.src = audioUrl;
      }

      player.play();
      setPlayingSessionId(session._id);

      player.onended = () => {
        setPlayingSessionId(null);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const downloadAudio = async (session: Session) => {
    if (!session.audioFilePath) return;

    try {
      const audioResponse = await axios.get(
        `http://localhost:5008/api/sessions/audio/${session._id}`,
        { responseType: "blob" },
      );

      const audioBlob = new Blob([audioResponse.data], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `session_${session._id}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error("Error downloading audio:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Session Timeline
      </Typography>

      {sessions.length === 0 ? (
        <Typography>No sessions found for this client.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {sessions
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((session) => (
              <Card
                key={session._id}
                sx={{
                  mb: 2,
                  cursor: "pointer",
                  height: "240px",
                  backgroundColor: "#f0f8ff", // Very light blue background
                  display: "flex",
                  "&:hover": { boxShadow: 3 },
                }}
                onClick={() => onSessionClick(session._id)}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    width: "100%",
                    p: 2,
                    "&:last-child": { pb: 2 },
                  }}
                >
                  {/* Left Column - 1/3 width */}
                  <Box
                    sx={{
                      width: "33%",
                      pr: 2,
                      borderRight: "1px solid #e0e0e0",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <Box>
                      {/* Date and Session Length Row */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {session.sessionLength} mins
                        </Typography>
                      </Box>

                      {/* Tags Row */}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mb: 2,
                          maxHeight: "40px",
                          overflow: "hidden",
                        }}
                      >
                        {session.tags.slice(0, 4).map((tag, index) => (
                          <Box
                            key={index}
                            sx={{
                              bgcolor: "primary.light",
                              color: "white",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "12px",
                            }}
                          >
                            {tag}
                          </Box>
                        ))}
                      </Box>

                      {/* Case Worker */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "12px" }}
                        >
                          Case Worker:
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "16px",
                            mt: 1,
                          }}
                        >
                          {session.caseWorkerName || "Unnamed Worker"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Audio Controls */}
                    {session.audioFilePath && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          gap: 1,
                        }}
                      >
                        <Button
                          variant="text"
                          startIcon={
                            playingSessionId === session._id ? (
                              <Pause />
                            ) : (
                              <PlayArrow />
                            )
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(session);
                          }}
                        >
                          {playingSessionId === session._id ? "Pause" : "Play"}
                        </Button>
                        <Button
                          variant="text"
                          startIcon={<Download />}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadAudio(session);
                          }}
                        >
                          Download
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Right Column - 2/3 width */}
                  <Box
                    sx={{
                      width: "67%",
                      pl: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        height: "100%",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 8,
                        WebkitBoxOrient: "vertical",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {session.transcription ||
                        session.keyNote ||
                        "No transcription available"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
      )}
    </Box>
  );
};

export default SessionHistory;
