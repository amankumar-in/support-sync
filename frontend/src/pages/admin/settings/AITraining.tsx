import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  Refresh,
  Add,
  InsertDriveFile,
  Psychology,
} from "@mui/icons-material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";

// Custom theme
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

const AITraining = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [instructions, setInstructions] = useState("");
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const organizationId = localStorage.getItem("organizationId") || "";

  // Fetch previously uploaded training data
  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5010/api/ai-training/${organizationId}`,
      );
      const data = await response.json();
      setTrainingData(data);
    } catch (error) {
      console.error("Error fetching training data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleFileRemove = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0 && instructions.trim() === "") {
      alert("Please upload files or enter training instructions.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("instructions", instructions);
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://localhost:5010/api/ai-training", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      const data = await response.json();
      alert(data.message);
      setFiles([]);
      setInstructions("");
      setShowUploadForm(false);
      fetchTrainingData();
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload training data.");
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      await fetch(`http://localhost:5010/api/ai-training/${id}`, {
        method: "DELETE",
      });
      fetchTrainingData();
    } catch (error) {
      console.error("Delete Error:", error);
    }
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
          <Psychology sx={{ mr: 2, color: theme.palette.primary.main }} />
          AI Training Center
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StyledCard>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                  Total Instructions
                </Typography>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  {trainingData.length}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StyledCard>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                  Total Files
                </Typography>
                <Typography
                  variant="h4"
                  color="secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  {trainingData.reduce(
                    (acc, item) => acc + item.files.length,
                    0,
                  )}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Add Instructions/Files Button */}
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            mb: 2,
            alignSelf: "flex-start",
            boxShadow: theme.shadows[2],
            "&:hover": {
              boxShadow: theme.shadows[4],
            },
          }}
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? "Cancel" : "Add Instructions/Files"}
        </Button>

        {/* Upload Form */}
        {showUploadForm && (
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: theme.shape.borderRadius,
            }}
          >
            {/* Instructions Input */}
            <TextField
              label="Training Instructions (Optional)"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius,
                },
              }}
              disabled={uploading}
            />

            {/* File Upload Section */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                border: `2px dashed ${theme.palette.primary.light}`,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: theme.palette.background.default,
              }}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={uploading}
                  sx={{
                    boxShadow: theme.shadows[2],
                    "&:hover": {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  Upload Files
                </Button>
              </label>
            </Paper>

            {/* File List */}
            {files.length > 0 && (
              <List>
                {files.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleFileRemove(index)}
                        disabled={uploading}
                      >
                        <Delete color="error" />
                      </IconButton>
                    }
                  >
                    <InsertDriveFile
                      sx={{ mr: 2, color: theme.palette.primary.light }}
                    />
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Upload Progress */}
            {uploading && (
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                color="primary"
                sx={{
                  mt: 2,
                  mb: 2,
                  height: 10,
                  borderRadius: 5,
                }}
              />
            )}

            {/* Submit Button */}
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleUploadSubmit}
              disabled={uploading}
              sx={{
                mt: 2,
                py: 1.5,
                boxShadow: theme.shadows[2],
                "&:hover": {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {uploading ? "Uploading..." : "Submit for Training"}
            </Button>
          </Paper>
        )}

        {/* Training Data Section */}
        <Divider sx={{ my: 3 }} />
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            color: theme.palette.text.primary,
          }}
        >
          Previous Training Data
          <Tooltip title="Refresh Training Data">
            <IconButton onClick={fetchTrainingData} sx={{ ml: 1 }}>
              <Refresh color="primary" />
            </IconButton>
          </Tooltip>
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          trainingData.map((entry) => (
            <StyledCard key={entry._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography
                  variant="body1"
                  gutterBottom
                  color="text.primary"
                  sx={{ mb: 2 }}
                >
                  {entry.instructions || "No instructions provided"}
                </Typography>

                {entry.files.map((file: any, idx: number) => (
                  <Chip
                    key={idx}
                    icon={<InsertDriveFile />}
                    label={file.filename}
                    variant="outlined"
                    color="primary"
                    sx={{
                      mr: 1,
                      mb: 1,
                      borderRadius: 2,
                    }}
                  />
                ))}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteTraining(entry._id)}
                    sx={{
                      borderRadius: theme.shape.borderRadius,
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          ))
        )}
      </Box>
    </ThemeProvider>
  );
};

export default AITraining;
