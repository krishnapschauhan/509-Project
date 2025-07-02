const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Pool Setup
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "complaint_portal",
  password: "krishna1234",
  port: 5432,
});

// DB Connection Test
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to DB:", res.rows[0].now);
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is up and running!");
});


// ✅ USER REGISTRATION
app.post("/api/users/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, password]
    );
    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      res.status(409).json({ message: "Username already exists" });
    } else {
      console.error("❌ Registration error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});


// ✅ USER LOGIN
app.post("/api/users/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Login successful", user: result.rows[0] });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ✅ SUBMIT COMPLAINT
app.post("/api/complaints", async (req, res) => {
  const { username, category, location, landmark, urgency, description } = req.body;

  if (!username || !category || !location || !urgency) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaint (username, category, location, landmark, urgency, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [username, category, location, landmark, urgency, description]
    );

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error submitting complaint:", err);
    res.status(500).json({ message: "Failed to submit complaint" });
  }
});


// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
