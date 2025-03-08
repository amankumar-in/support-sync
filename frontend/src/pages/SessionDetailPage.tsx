import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { PlayArrow, Pause, Download } from "@mui/icons-material";

const TRANSCRIPTION_API_URL = "http://localhost:5008";

interface Session {
  _id: string;
  clientName: string;
  sessionLength: number;
  caseWorker: string;
  caseWorkerName: string;
  tags: string[];
  keyNote: string;
  date: string;
  transcription?: string;
  audioFilePath: string;
}

const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await axios.get(
          `${TRANSCRIPTION_API_URL}/api/sessions/${id}`,
        );
        const sessionData = response.data;
        setSession(sessionData);

        console.log("Session data:", sessionData);
        console.log("Audio file path:", sessionData.audioFilePath);

        // Fetch audio file
        if (sessionData.audioFilePath) {
          try {
            console.log(
              "Attempting to fetch audio for path:",
              sessionData.audioFilePath,
            );
            const audioResponse = await axios.get(
              `${TRANSCRIPTION_API_URL}/api/sessions/audio/${sessionData._id}`,
            );
            console.log("Audio response:", audioResponse);

            // Set the audio URL directly from the signed URL
            if (audioResponse.data && audioResponse.data.audioUrl) {
              setAudioUrl(audioResponse.data.audioUrl);
              console.log("Set audio URL from signed URL");
            } else {
              console.error("No audio URL in response:", audioResponse.data);
            }
          } catch (audioError: unknown) {
            if (axios.isAxiosError(audioError)) {
              console.error(
                "Detailed Axios audio fetch error:",
                audioError.response || audioError.message,
              );
            } else {
              console.error("Detailed audio fetch error:", String(audioError));
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching session details:", err);
        setError("Failed to load session details");
        setLoading(false);
      }
    };

    fetchSessionDetails();

    // Cleanup function
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
    };
  }, [id]);

  const togglePlay = () => {
    if (!audioUrl) return;

    if (!audioPlayer) {
      const player = new Audio(audioUrl);
      setAudioPlayer(player);

      player.onended = () => {
        setIsPlaying(false);
      };

      player.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioPlayer.pause();
        setIsPlaying(false);
      } else {
        audioPlayer.play();
        setIsPlaying(true);
      }
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `session_${id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!session) return <Typography>No session found</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Session Details
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Client Information</Typography>
          <Typography>Name: {session.clientName}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Session Audio</Typography>
          {audioUrl ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={togglePlay} color="primary">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={downloadAudio} color="secondary">
                <Download />
              </IconButton>
            </Box>
          ) : (
            <Typography>No audio available</Typography>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Session Details</Typography>
          <Typography>Length: {session.sessionLength} seconds</Typography>
          <Typography>
            Date: {new Date(session.date).toLocaleString()}
          </Typography>
          <Typography>Case Worker: {session.caseWorkerName}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Tags</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {session.tags.map((tag, index) => (
              <Chip key={index} label={tag} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6">Key Notes</Typography>
          <Typography>{session.keyNote}</Typography>
        </Box>

        {session.transcription && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h6">Full Transcription</Typography>
              <Typography>{session.transcription}</Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default SessionDetailPage;
