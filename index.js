require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function initDB() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS participants (
        email VARCHAR(255) PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        dob DATE,
        work VARCHAR(255),
        home VARCHAR(255)
      )`;
    await db.query(createTableQuery);
    console.log(" Database is live!");
  } catch (err) {
    console.error(" Wrong under working:", err);
  }
}
initDB();

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    endpoints: {
      participants: '/participants'
    }
  });
});

// Hent alle deltakerene
app.get('/participants', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participants');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klarte ikke hente deltakere' });
  }
});

// Legg til ny deltake
app.post('/participants/add', async (req, res) => {
  const { email, firstname, lastname, dob, work, home } = req.body;
  
  if (!email || !firstname || !lastname) {
    return res.status(400).json({ error: 'Mangler email, fornavn eller etternavn' });
  }

  try {
    await db.query(
      'INSERT INTO participants (email, firstname, lastname, dob, work, home) VALUES (?, ?, ?, ?, ?, ?)',
      [email, firstname, lastname, dob, work, home]
    );
    res.json({ message: 'Deltaker lagt til!', email: email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Feil ved lagring (finnes e-posten fra før?)' });
  }
});

// Slett deltaker
app.delete('/participants/:email', async (req, res) => {
  const email = req.params.email;
  try {
    await db.query('DELETE FROM participants WHERE email = ?', [email]);
    res.json({ message: `Deltaker med e-post ${email} er slettet.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klarte ikke slette deltaker' });
  }
});

// Start serer
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});