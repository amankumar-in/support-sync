import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Toolbar,
  FormHelperText,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

// Define interfaces for form data structure
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface Note {
  content: string;
}

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

interface PersonalInfo {
  name: string;
  age: string;
  contactInfo: ContactInfo;
  emergencyContacts: EmergencyContact[];
}

interface CaseDetails {
  caseStatus: "Active" | "Pending" | "Closed";
  assignedCaseWorker?: string;
  startDate: string;
  notes: Note[];
}

interface ChildSpecific {
  schoolInfo: string;
  specialNeeds: string[];
}

interface FosterFamilySpecific {
  licensingStatus: string;
  maxCapacity: string;
}

interface AdditionalDetails {
  childSpecific: ChildSpecific;
  fosterFamilySpecific: FosterFamilySpecific;
}

interface ClientFormData {
  type: string;
  personalInfo: PersonalInfo;
  caseDetails: CaseDetails;
  additionalDetails: AdditionalDetails;
}

interface FormErrors {
  type?: string;
  "personalInfo.name"?: string;
  [key: string]: string | undefined;
}

interface Caseworker {
  _id: string;
  firstName: string;
  lastName: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// Step labels
const steps = [
  "Client Type",
  "Basic Details",
  "Case Details",
  "Additional Details",
  "Review",
];

const CreateClient = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<ClientFormData>({
    type: "",
    personalInfo: {
      name: "",
      age: "",
      contactInfo: {
        address: "",
        phone: "",
        email: "",
      },
      emergencyContacts: [
        {
          name: "",
          relationship: "",
          phone: "",
        },
      ],
    },
    caseDetails: {
      caseStatus: "Active",
      assignedCaseWorker: "",
      startDate: new Date().toISOString().split("T")[0],
      notes: [
        {
          content: "",
        },
      ],
    },
    additionalDetails: {
      childSpecific: {
        schoolInfo: "",
        specialNeeds: [""],
      },
      fosterFamilySpecific: {
        licensingStatus: "",
        maxCapacity: "",
      },
    },
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [caseworkers, setCaseworkers] = useState<Caseworker[]>([]);

  // Fetch caseworkers for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        console.log("Debug - userId:", userId);
        console.log("Debug - token exists:", !!token);

        if (userId && token) {
          // Use the full URL for the auth-service
          const response = await fetch(
            `http://localhost:5007/api/auth/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          console.log("Debug - Response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Debug - Users data:", data);
            setUsers(data);
          } else {
            const errorText = await response.text();
            console.error(
              "Failed to fetch organization users:",
              response.status,
              errorText,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching organization users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    // For nested objects like personalInfo.name
    if (field.includes(".")) {
      const fields = field.split(".");
      setFormData((prevData) => {
        const newData = { ...prevData };

        if (fields.length === 2) {
          // Handle 2-level nesting (e.g., personalInfo.name)
          (newData[fields[0] as keyof ClientFormData] as any)[fields[1]] =
            value;
        } else if (fields.length === 3) {
          // Handle 3-level nesting (e.g., personalInfo.contactInfo.address)
          (
            (newData[fields[0] as keyof ClientFormData] as any)[
              fields[1]
            ] as any
          )[fields[2]] = value;
        }

        return newData;
      });
    } else {
      // For top-level fields like 'type'
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }

    // Clear errors when field is updated
    if (errors[field]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: undefined,
      }));
    }
  };

  const handleEmergencyContactChange = (
    index: number,
    field: keyof EmergencyContact,
    value: string,
  ) => {
    setFormData((prevData) => {
      const newContacts = [...prevData.personalInfo.emergencyContacts];
      newContacts[index] = {
        ...newContacts[index],
        [field]: value,
      };

      return {
        ...prevData,
        personalInfo: {
          ...prevData.personalInfo,
          emergencyContacts: newContacts,
        },
      };
    });
  };

  const handleAddEmergencyContact = () => {
    setFormData((prevData) => ({
      ...prevData,
      personalInfo: {
        ...prevData.personalInfo,
        emergencyContacts: [
          ...prevData.personalInfo.emergencyContacts,
          { name: "", relationship: "", phone: "" },
        ],
      },
    }));
  };

  const handleSpecialNeedChange = (index: number, value: string) => {
    setFormData((prevData) => {
      const newSpecialNeeds = [
        ...prevData.additionalDetails.childSpecific.specialNeeds,
      ];
      newSpecialNeeds[index] = value;

      return {
        ...prevData,
        additionalDetails: {
          ...prevData.additionalDetails,
          childSpecific: {
            ...prevData.additionalDetails.childSpecific,
            specialNeeds: newSpecialNeeds,
          },
        },
      };
    });
  };

  const handleAddSpecialNeed = () => {
    setFormData((prevData) => ({
      ...prevData,
      additionalDetails: {
        ...prevData.additionalDetails,
        childSpecific: {
          ...prevData.additionalDetails.childSpecific,
          specialNeeds: [
            ...prevData.additionalDetails.childSpecific.specialNeeds,
            "",
          ],
        },
      },
    }));
  };

  const handleNoteChange = (index: number, value: string) => {
    setFormData((prevData) => {
      const newNotes = [...prevData.caseDetails.notes];
      newNotes[index] = {
        ...newNotes[index],
        content: value,
      };

      return {
        ...prevData,
        caseDetails: {
          ...prevData.caseDetails,
          notes: newNotes,
        },
      };
    });
  };

  const handleAddNote = () => {
    setFormData((prevData) => ({
      ...prevData,
      caseDetails: {
        ...prevData.caseDetails,
        notes: [...prevData.caseDetails.notes, { content: "" }],
      },
    }));
  };

  const validateStep = () => {
    const newErrors: FormErrors = {};

    if (activeStep === 0) {
      if (!formData.type) {
        newErrors.type = "Please select a client type";
      }
    } else if (activeStep === 1) {
      if (!formData.personalInfo.name) {
        newErrors["personalInfo.name"] = "Name is required";
      }

      // Age validation only for Child
      if (formData.type === "Child" && !formData.personalInfo.age) {
        newErrors["personalInfo.age"] = "Age is required for children";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      // Skip Case Details step for Foster Families
      if (activeStep === 1 && formData.type === "FosterFamily") {
        setActiveStep(3); // Jump to Additional Details step
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    // Skip Case Details step for Foster Families when going back
    if (activeStep === 3 && formData.type === "FosterFamily") {
      setActiveStep(1); // Go back to Basic Details step
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Create a copy of the form data
    const submitData = {
      ...formData,
      organization: localStorage.getItem("organizationId"),
    };

    // Remove assignedCaseWorker if it's an empty string
    if (!submitData.caseDetails.assignedCaseWorker) {
      delete submitData.caseDetails.assignedCaseWorker;
    }

    try {
      const response = await fetch("http://localhost:5009/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Full error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      navigate("/clients");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Form sections based on active step
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Client Type
            </Typography>
            <FormControl fullWidth error={!!errors.type} sx={{ mt: 2 }}>
              <InputLabel>Client Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e: SelectChangeEvent) =>
                  handleInputChange("type", e.target.value)
                }
                label="Client Type"
              >
                <MenuItem value="Child">Child</MenuItem>
                <MenuItem value="FosterFamily">Foster Family</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={
                    formData.type === "Child" ? "Child Name" : "Parent Names"
                  }
                  value={formData.personalInfo.name}
                  onChange={(e) =>
                    handleInputChange("personalInfo.name", e.target.value)
                  }
                  error={!!errors["personalInfo.name"]}
                  helperText={errors["personalInfo.name"]}
                  required
                />
              </Grid>

              {/* Age field - only for Child */}
              {formData.type === "Child" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number" // Change this to type="number"
                    value={formData.personalInfo.age}
                    onChange={(e) =>
                      handleInputChange("personalInfo.age", e.target.value)
                    }
                    error={!!errors["personalInfo.age"]}
                    helperText={errors["personalInfo.age"]}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Contact Information
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.personalInfo.contactInfo.address}
                  onChange={(e) =>
                    handleInputChange(
                      "personalInfo.contactInfo.address",
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.personalInfo.contactInfo.phone}
                  onChange={(e) =>
                    handleInputChange(
                      "personalInfo.contactInfo.phone",
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.personalInfo.contactInfo.email}
                  onChange={(e) =>
                    handleInputChange(
                      "personalInfo.contactInfo.email",
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Emergency Contacts
                </Typography>
              </Grid>
              {formData.personalInfo.emergencyContacts.map((contact, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      value={contact.name}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      value={contact.relationship}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "relationship",
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={contact.phone}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          index,
                          "phone",
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                </React.Fragment>
              ))}
              <Grid item xs={12}>
                <Button onClick={handleAddEmergencyContact}>
                  Add Emergency Contact
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      // Rest of the code remains the same...

      // The remaining case statements follow the same pattern as before,
      // but with proper TypeScript typing

      // I'm not including the entire code here to save space, but the TypeScript
      // fixes would be similar for the remaining case statements

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Case Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Case Status</InputLabel>
                  <Select
                    value={formData.caseDetails.caseStatus}
                    onChange={(e: SelectChangeEvent) =>
                      handleInputChange(
                        "caseDetails.caseStatus",
                        e.target.value as "Active" | "Pending" | "Closed",
                      )
                    }
                    label="Case Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Caseworker</InputLabel>
                  <Select
                    value={formData.caseDetails.assignedCaseWorker}
                    onChange={(e: SelectChangeEvent) =>
                      handleInputChange(
                        "caseDetails.assignedCaseWorker",
                        e.target.value,
                      )
                    }
                    label="Assigned Caseworker"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.caseDetails.startDate}
                  onChange={(e) =>
                    handleInputChange("caseDetails.startDate", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Case Notes
                </Typography>
              </Grid>
              {formData.caseDetails.notes.map((note, index) => (
                <Grid item xs={12} key={index}>
                  <TextField
                    fullWidth
                    label={`Note ${index + 1}`}
                    multiline
                    rows={3}
                    value={note.content}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button onClick={handleAddNote}>Add Note</Button>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Additional Details
            </Typography>

            {formData.type === "Child" ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="School Information"
                    multiline
                    rows={3}
                    value={formData.additionalDetails.childSpecific.schoolInfo}
                    onChange={(e) =>
                      handleInputChange(
                        "additionalDetails.childSpecific.schoolInfo",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Special Needs
                  </Typography>
                </Grid>
                {formData.additionalDetails.childSpecific.specialNeeds.map(
                  (need, index) => (
                    <Grid item xs={12} key={index}>
                      <TextField
                        fullWidth
                        label={`Special Need ${index + 1}`}
                        value={need}
                        onChange={(e) =>
                          handleSpecialNeedChange(index, e.target.value)
                        }
                      />
                    </Grid>
                  ),
                )}
                <Grid item xs={12}>
                  <Button onClick={handleAddSpecialNeed}>
                    Add Special Need
                  </Button>
                </Grid>
              </Grid>
            ) : formData.type === "FosterFamily" ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Licensing Status"
                    value={
                      formData.additionalDetails.fosterFamilySpecific
                        .licensingStatus
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "additionalDetails.fosterFamilySpecific.licensingStatus",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Capacity"
                    type="number"
                    value={
                      formData.additionalDetails.fosterFamilySpecific
                        .maxCapacity
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "additionalDetails.fosterFamilySpecific.maxCapacity",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
              </Grid>
            ) : (
              <Typography>Please select a client type first</Typography>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Client Type:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formData.type}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Personal Information:
              </Typography>
              <Typography variant="body1">
                Name: {formData.personalInfo.name}
              </Typography>
              <Typography variant="body1">
                Age: {formData.personalInfo.age || "N/A"}
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Contact Info:
              </Typography>
              <Typography variant="body1">
                Address: {formData.personalInfo.contactInfo.address || "N/A"}
              </Typography>
              <Typography variant="body1">
                Phone: {formData.personalInfo.contactInfo.phone || "N/A"}
              </Typography>
              <Typography variant="body1">
                Email: {formData.personalInfo.contactInfo.email || "N/A"}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Case Details:
              </Typography>
              <Typography variant="body1">
                Status: {formData.caseDetails.caseStatus}
              </Typography>
              <Typography variant="body1">
                Start Date: {formData.caseDetails.startDate}
              </Typography>
            </Paper>

            {formData.type === "Child" && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Child Specific Details:
                </Typography>
                <Typography variant="body1">
                  School Info:{" "}
                  {formData.additionalDetails.childSpecific.schoolInfo || "N/A"}
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Special Needs:
                </Typography>
                {formData.additionalDetails.childSpecific.specialNeeds.map(
                  (need, index) =>
                    need && (
                      <Typography key={index} variant="body1">
                        • {need}
                      </Typography>
                    ),
                )}
              </Paper>
            )}

            {formData.type === "FosterFamily" && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Foster Family Specific Details:
                </Typography>
                <Typography variant="body1">
                  Licensing Status:{" "}
                  {formData.additionalDetails.fosterFamilySpecific
                    .licensingStatus || "N/A"}
                </Typography>
                <Typography variant="body1">
                  Max Capacity:{" "}
                  {formData.additionalDetails.fosterFamilySpecific
                    .maxCapacity || "N/A"}
                </Typography>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />
        <Toolbar /> {/* Spacing */}
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/clients")}
              sx={{ mb: 2 }}
            >
              Back to Clients
            </Button>

            <Typography variant="h4" gutterBottom>
              Create New Client
            </Typography>

            <Stepper
              activeStep={
                formData.type === "FosterFamily" && activeStep > 1
                  ? activeStep - 1
                  : activeStep
              }
              sx={{ pt: 3, pb: 5 }}
            >
              {steps.map(
                (label, index) =>
                  // Skip Case Details step in stepper for Foster Families
                  (formData.type !== "FosterFamily" || index !== 2) && (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ),
              )}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  Back
                </Button>
              )}

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                >
                  Create Client
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default CreateClient;
