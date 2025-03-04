import React, { useState, useEffect } from "react";
import { Typography, Button, Box, Paper } from "@mui/material";
const TRANSCRIPTION_API_URL = "http://localhost:5008";

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
export default RecordingSection;
