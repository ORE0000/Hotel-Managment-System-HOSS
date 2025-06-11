import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load from environment variable  and also Updated 
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

if (!GOOGLE_SCRIPT_URL) {
  console.error("❌ Missing GOOGLE_SCRIPT_URL in environment variables.");
  process.exit(1); // stop server if critical env variable is missing
}

// Middleware
app.use(
  cors({
    origin: "https://booking.hotelomshivshankar.com", // ✅ Your real frontend
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Proxy Endpoint
app.all("/api", async (req, res) => {
  console.log(`Incoming ${req.method} request`, {
    query: req.query,
    body: req.body,
  });

  try {
    const config = {
      method: req.method,
      url: GOOGLE_SCRIPT_URL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (req.method === "GET") {
      config.params = {
        ...req.query,
        ...(req.query.search && { search: req.query.search }),
      };
    } else {
      config.params = {
        ...req.query,
        ...(req.query.search && { search: req.query.search }),
      };
      config.data = req.body;
    }

    const response = await axios(config);

    console.log("✅ Google Script Response:", {
      status: response.status,
      data: response.data,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const errRes = error.response || {};
    const status = errRes.status || 500;

    const errorDetails = {
      message: error.message,
      response: errRes.data || null,
      status,
      config: {
        method: req.method,
        url: GOOGLE_SCRIPT_URL,
        params: req.query,
        data: req.body,
      },
    };

    console.error("❌ Proxy error:", errorDetails);
    res.status(status).json({
      error: error.message,
      details: errorDetails,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Proxy server is running ✅" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
