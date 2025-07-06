const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();


app.use(cors());
app.use(bodyParser.json());


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "complaint_portal",
  password: "krishna1234",
  port: 5432,
});


pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to DB:", res.rows[0].now);
  }
});


app.get("/", (req, res) => {
  res.send("✅ Server is up and running!");
});



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


// USER LOGIN
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


//  SUBMIT COMPLAINT
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

// ADMIN LOGIN (Hardcoded)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ message: "Admin login successful" });
  } else {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
});

//Get All Complaints

app.get("/api/admin/complaints", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaint ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Get All Workers
app.get("/api/admin/workers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM workers ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching workers:", err);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});


// Assign Worker to Complaint
app.post("/api/admin/assign", async (req, res) => {
  const { complaintId, workerName } = req.body;

  try {
    await pool.query(
      `UPDATE complaint SET assigned_worker = $1, status = 'Assigned' WHERE id = $2`,
      [workerName, complaintId]
    );
    await pool.query(
      `UPDATE workers SET available = false WHERE name = $1`,
      [workerName]
    );
    res.status(200).json({ message: "Worker assigned successfully" });
  } catch (err) {
    console.error("❌ Error assigning worker:", err);
    res.status(500).json({ message: "Assignment failed" });
  }
});

// Mark Complaint as Successful
app.post("/api/admin/mark-success", async (req, res) => {
  const { complaintId } = req.body;

  try {
    await pool.query(
      `UPDATE complaint SET status = 'Successful' WHERE id = $1`,
      [complaintId]
    );
    res.status(200).json({ message: "Complaint marked as successful" });
  } catch (err) {
    console.error("❌ Error updating complaint status:", err);
    res.status(500).json({ message: "Update failed" });
  }
});



//Server Setup
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
