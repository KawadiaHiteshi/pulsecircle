const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

console.log("ENV PATH:", path.join(__dirname, ".env"));
console.log("DB URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
  statement_timeout: 3000,
});

app.get("/", (req, res) => {
  res.json({ message: "PulseCircle backend running 🚀" });
});

app.post("/session/start", async (req, res) => {
  console.log("✅ HIT /session/start", req.body);

  try {
    const { initiator_uid, receiver_uid, context_label } = req.body;

    if (!initiator_uid || !receiver_uid) {
      return res.status(400).json({
        ok: false,
        error: "initiator_uid and receiver_uid are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO safety_sessions (initiator_uid, receiver_uid, context_label)
       VALUES ($1, $2, $3)
       RETURNING id, status, created_at, context_label`,
      [initiator_uid, receiver_uid, context_label || null]
    );

    return res.json({ ok: true, session: result.rows[0] });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// // ✅ Print registered routes (debug)
// app._router.stack.forEach((r) => {
//   if (r.route && r.route.path) {
//     const methods = Object.keys(r.route.methods).join(",").toUpperCase();
//     console.log("ROUTE:", methods, r.route.path);
//   }
// });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
