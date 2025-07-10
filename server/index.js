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

// DB connection test
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("Connected to DB:", res.rows[0].now);
  }
});

app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// Register user
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
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

// User login
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
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Submit complaint
app.post("/api/complaints", async (req, res) => {
  const { username, category, location, landmark, urgency, description } = req.body;

  if (!username || !category || !location || !urgency) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaint (username, category, location, landmark, urgency, description, worker_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [username, category, location, landmark, urgency, description]
    );

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({ message: "Failed to submit complaint" });
  }
});

// Admin login
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ message: "Admin login successful" });
  } else {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
});

// Get all complaints
app.get("/api/admin/complaints", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaint ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Get all workers
app.get("/api/admin/workers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT worker_id AS id, name, available FROM workers ORDER BY worker_id"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching workers:", err.message);  // ⬅️ Add this
    console.error(err.stack);                               // ⬅️ Add this
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});



// Assign worker
app.post("/api/admin/assign", async (req, res) => {
  const { complaintId, workerName } = req.body;

  try {
    await pool.query(
      `UPDATE complaint SET assigned_worker = $1, status = 'Assigned', worker_status = 'Pending' WHERE id = $2`,
      [workerName, complaintId]
    );
    await pool.query(
      `UPDATE workers SET available = false WHERE name = $1`,
      [workerName]
    );
    res.status(200).json({ message: "Worker assigned successfully" });
  } catch (err) {
    console.error("Error assigning worker:", err);
    res.status(500).json({ message: "Assignment failed" });
  }
});

// Mark complaint as successful
app.post("/api/admin/mark-success", async (req, res) => {
  const { complaintId } = req.body;

  try {
    await pool.query(
      `UPDATE complaint SET status = 'Successful' WHERE id = $1`,
      [complaintId]
    );
    res.status(200).json({ message: "Complaint marked as successful" });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// Worker login
app.post("/api/workers/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM workers WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid worker credentials" });
    }

    const worker = result.rows[0];

    if (worker.password !== password) {
      return res.status(401).json({ message: "Invalid worker credentials" });
    }

    res.status(200).json({
      message: "Worker login successful",
      worker: {
        username: worker.username,
        name: worker.username, 
        id: worker.worker_id
      }
    });

  } catch (err) {
    console.error("Error logging in worker:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get complaints assigned to workers
app.get("/api/worker/complaints", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM complaint WHERE assigned_worker IS NOT NULL`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching worker complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Worker updates status
app.post("/api/worker/update-status", async (req, res) => {
  const { complaintId, action } = req.body;

  if (!complaintId || !action) {
    return res.status(400).json({ message: "Complaint ID and action are required" });
  }

  let newStatus;

  switch (action) {
    case "accept":
      newStatus = "Accepted";
      break;
    case "reject":
      newStatus = "Rejected";
      break;
    case "done":
      newStatus = "Completed";
      break;
    default:
      return res.status(400).json({ message: "Invalid action" });
  }

  try {
    await pool.query(
      `UPDATE complaint SET worker_status = $1 WHERE id = $2`,
      [newStatus, complaintId]
    );

    if (action === "done") {
      await pool.query(
        `UPDATE complaint SET worker_completed = true WHERE id = $1`,
        [complaintId]
      );
    }

    res.status(200).json({ message: `Status updated to ${newStatus}` });
  } catch (err) {
    console.error("Error updating worker status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// Update worker availability
app.post("/api/worker/set-availability", async (req, res) => {
  const { username, available } = req.body;

  if (!username || typeof available !== "boolean") {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    await pool.query(
      "UPDATE workers SET available = $1 WHERE username = $2",
      [available, username]
    );
    res.status(200).json({ message: "Availability updated" });
  } catch (err) {
    console.error("Error updating availability:", err);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// Auto-enable worker availability on dashboard load
app.post("/api/worker/auto-enable-availability", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username required" });
  }

  try {
    await pool.query("UPDATE workers SET available = true WHERE username = $1", [username]);
    res.status(200).json({ message: "Availability set to true" });
  } catch (err) {
    console.error("Error auto-enabling availability:", err);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// Get complaints assigned to a specific worker
app.post("/api/worker/my-complaints", async (req, res) => {
  const { username } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM complaint WHERE assigned_worker = $1 ORDER BY id DESC`,
      [username.trim()]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching worker-specific complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});


// Server setup
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
