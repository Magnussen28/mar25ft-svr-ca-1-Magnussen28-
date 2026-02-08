require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

async function initDB() {
  try {
    await db.query("DROP TABLE IF EXISTS participants");

    // 2. Create Users table (for Admin)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    await db.query(`INSERT IGNORE INTO users (username, password) VALUES ('admin', 'P4ssword')`);
    console.log(" Admin user checked/created.");

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
    console.log(" Database tables are ready!");

  } catch (err) {
    console.error(" Error setting up database:", err);
  }
}

initDB();

// ceck if server is running
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running with the new database structure',
  });
});

// strart server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});