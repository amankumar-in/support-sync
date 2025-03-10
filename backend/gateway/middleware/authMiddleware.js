const jwt = require("jsonwebtoken");
const axios = require("axios");

// You'll need to install these dependencies
// npm install jsonwebtoken axios

const authMiddleware = async (req, res, next) => {
  try {
    // Check for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token required",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    try {
      // Assuming you have a secret key configured in your environment variables
      // This is a simplistic approach - in production, you might want to forward
      // the token verification to the auth service instead
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret",
      );
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

module.exports = authMiddleware;
