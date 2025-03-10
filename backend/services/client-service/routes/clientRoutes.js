const express = require("express");
const router = express.Router();

// If you’re using Node < 18, install node-fetch: npm install node-fetch
// Then uncomment the line below and use it in your code.
// const fetch = require("node-fetch");

const Client = require("../models/Client");

//
// GET all clients with optional filtering by type and organizationId
//
router.get("/", async (req, res) => {
  try {
    const { type, organizationId } = req.query;
    let query = {};

    // Filter by client type if provided
    if (type) {
      query.type = type;
    }

    // If an organizationId (UUID or ObjectId) is provided
    if (organizationId) {
      // Instead of directly querying the Organization model,
      // call the auth-service endpoint to get the org _id
      const lookupUrl = `http://localhost:5007/api/auth/organizations/lookup/${organizationId}`;

      const orgResponse = await fetch(lookupUrl);
      if (!orgResponse.ok) {
        // If 404 or other error from auth-service, handle accordingly
        console.warn(
          `No organization found for uniqueIdentifier: ${organizationId}`,
        );
        // Return empty array to keep consistent with original logic
        return res.json([]);
      }

      const { _id } = await orgResponse.json();
      query.organization = _id;
      console.log(`Found organization _id: ${_id} for UUID: ${organizationId}`);
    }

    console.log("Final query:", query);
    const clients = await Client.find(query);
    console.log(`Found ${clients.length} clients matching the query`);
    res.json(clients);
  } catch (error) {
    console.error("Error in GET /clients route:", error);
    res.status(500).json({ message: error.message });
  }
});

//
// CREATE a new client
//
router.post("/", async (req, res) => {
  console.log("Received client creation request");
  try {
    // 1) Look up the organization _id from auth-service
    const organizationUuid = req.body.organization;
    let organizationId;

    if (organizationUuid) {
      const lookupUrl = `${process.env.AUTH_SERVICE_URL}/api/auth/organizations/lookup/${organizationId}`;
      console.log("Attempting to fetch from URL:", lookupUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const orgResponse = await fetch(lookupUrl, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("Fetch response status:", orgResponse.status);

        if (!orgResponse.ok) {
          console.error(
            "Organization not found in auth-service for UUID:",
            organizationUuid,
            "Status:",
            orgResponse.status,
          );
          return res
            .status(400)
            .json({ message: "Organization not found with the provided UUID" });
        }

        const orgData = await orgResponse.json();
        console.log("Organization response data:", orgData);
        const { _id } = orgData;
        organizationId = _id;
        console.log(
          `Found organization with _id: ${organizationId} for UUID: ${organizationUuid}`,
        );
      } catch (fetchError) {
        console.error("Fetch operation error:", fetchError);
        return res.status(500).json({
          message: "Error connecting to auth service",
          error: fetchError.message,
        });
      }
    } else {
      return res.status(400).json({ message: "Organization UUID is required" });
    }

    // 2) Create the client using that _id
    const client = new Client({
      organization: organizationId, // The resolved ObjectId
      type: req.body.type,
      personalInfo: {
        name: req.body.personalInfo.name,
        age: req.body.personalInfo.age,
        contactInfo: req.body.personalInfo.contactInfo,
        emergencyContacts: req.body.personalInfo.emergencyContacts,
      },
      caseDetails: {
        caseStatus: req.body.caseDetails?.caseStatus || "Active",
        assignedCaseWorker: req.body.caseDetails?.assignedCaseWorker,
        startDate: req.body.caseDetails?.startDate || new Date(),
        notes: req.body.caseDetails?.notes || [],
      },
      additionalDetails: req.body.additionalDetails || {},
    });

    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (error) {
    console.error("Client creation error:", error);
    res.status(400).json({ message: error.message });
  }
});

//
// GET client by ID
//
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    console.error("Error in GET /clients/:id route:", error);
    res.status(500).json({ message: error.message });
  }
});

//
// UPDATE client by ID
//
router.patch("/:id", async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(updatedClient);
  } catch (error) {
    console.error("Error in PATCH /clients/:id route:", error);
    res.status(400).json({ message: error.message });
  }
});

//
// DELETE client by ID
//
router.delete("/:id", async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ message: "Client deleted" });
  } catch (error) {
    console.error("Error in DELETE /clients/:id route:", error);
    res.status(500).json({ message: error.message });
  }
});
router.get("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.status(200).json({ message: "Test endpoint is working" });
});
module.exports = router;
