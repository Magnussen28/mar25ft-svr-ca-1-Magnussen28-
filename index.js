require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function initDB() {
  try {await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    
    await db.query(`INSERT IGNORE INTO users (username, password) VALUES ('admin', 'P4ssword')`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS participants (
        email VARCHAR(255) PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        work_companyname VARCHAR(255),
        work_salary INT,
        work_currency VARCHAR(10),
        home_country VARCHAR(255),
        home_city VARCHAR(255)
      )
    `);
    console.log(" Database synced and redy.");
  } catch (err) {
    console.error(" Database setup error:", err);
  }
}
initDB();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const username = auth[0];
  const password = auth[1];

  try {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Authentication error" });
  }
};

function validateParticipant(data) {
  const { email, firstname, lastname, dob } = data;
  const errors = [];

  if (!email || !firstname || !lastname || !dob) {
    errors.push("Missing required fields (email, firstname, lastname, dob)");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dob && !dateRegex.test(dob)) {
    errors.push("Invalid DOB format. Use YYYY-MM-DD");
  }

  return errors;
}

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'API is running' });
});

app.post('/participants/add', authenticate, async (req, res) => {
  const validationErrors = validateParticipant(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const { email, firstname, lastname, dob, work, home } = req.body;

  try {
    await db.query(
      `INSERT INTO participants 
      (email, firstname, lastname, dob, work_companyname, work_salary, work_currency, home_country, home_city) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, firstname, lastname, dob,
        work?.companyname, work?.salary, work?.currency, 
        home?.country, home?.city                        
      ]
    );
    res.json({ message: "Participant added successfully", email: email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save participant. Email might already exist." });
  }
});

app.get('/participants', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participants');
    const formatted = rows.map(row => ({
      email: row.email,
      firstname: row.firstname,
      lastname: row.lastname,
      dob: row.dob,
      work: {
        companyname: row.work_companyname,
        salary: row.work_salary,
        currency: row.work_currency
      },
      home: {
        country: row.home_country,
        city: row.home_city
      }
    }));
    res.json({ data: formatted });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/participants/details', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT email, firstname, lastname FROM participants');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/participants/details/:email', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT firstname, lastname, dob FROM participants WHERE email = ?', [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: "Participant not found" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/participants/work/:email', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT work_companyname, work_salary, work_currency FROM participants WHERE email = ?', [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: "Participant not found" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/participants/home/:email', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT home_country, home_city FROM participants WHERE email = ?', [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: "Participant not found" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete('/participants/:email', authenticate, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM participants WHERE email = ?', [req.params.email]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Participant not found" });
    res.json({ message: "Participant deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete participnt" });
  }
});

app.put('/participants/:email', authenticate, async (req, res) => {
  const validationErrors = validateParticipant(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const { firstname, lastname, dob, work, home } = req.body;
  const email = req.params.email;

  try {
    const [result] = await db.query(
      `UPDATE participants SET 
      firstname=?, lastname=?, dob=?, 
      work_companyname=?, work_salary=?, work_currency=?, 
      home_country=?, home_city=? 
      WHERE email=?`,
      [
        firstname, lastname, dob,
        work?.companyname, work?.salary, work?.currency,
        home?.country, home?.city,
        email
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Participant not found" });
    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("Error updating participant:", err);
    res.status(500).json({ error: "An nexpected error occurred while updating the participant." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});