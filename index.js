const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- AUTOMATISK DATABASE-OPPSETT (Siden lokal oppkobling feiler) ---
async function initDB() {
    try {
        console.log("🛠️ Sjekker database-tabeller...");
        
        // 1. Lag Users tabell
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);

        // 2. Lag Admin bruker (hvis den mangler)
        const [users] = await db.query("SELECT * FROM users WHERE username = 'admin'");
        if (users.length === 0) {
            await db.query(`INSERT INTO users (username, password) VALUES ('admin', 'P4ssword')`);
            console.log("✅ Admin-bruker opprettet.");
        }

        // 3. Lag Participants tabell
        await db.query(`
            CREATE TABLE IF NOT EXISTS participants (
                email VARCHAR(255) PRIMARY KEY,
                firstname VARCHAR(255) NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                dob VARCHAR(20),
                companyname VARCHAR(255),
                salary DECIMAL(15, 2),
                currency VARCHAR(10),
                country VARCHAR(255),
                city VARCHAR(255)
            )
        `);
        console.log("✅ Database-tabeller er klare!");
    } catch (error) {
        console.error("❌ Feil under database-oppsett:", error.message);
    }
}
// Kjør oppsettet med en gang serveren starter
initDB();

// --- MIDDLEWARE & ROUTES ---

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const username = auth[0];
    const password = auth[1];

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            next();
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
};

app.use('/participants', authenticateAdmin);

app.post('/participants/add', async (req, res) => {
    const { participant, work, home } = req.body;
    if (!participant || !participant.email || !participant.firstname) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const query = `INSERT INTO participants (email, firstname, lastname, dob, companyname, salary, currency, country, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [participant.email, participant.firstname, participant.lastname, participant.dob, work.companyname, work.salary, work.currency, home.country, home.city];
        await db.query(query, values);
        res.status(201).json({ message: 'Participant added successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Participant already exists' });
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM participants');
        const formatted = rows.map(row => ({
            participant: { email: row.email, firstname: row.firstname, lastname: row.lastname, dob: row.dob },
            work: { companyname: row.companyname, salary: row.salary, currency: row.currency },
            home: { country: row.country, city: row.city }
        }));
        res.json({ data: formatted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants/details', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT firstname, lastname, email FROM participants');
        res.json({ data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants/details/:email', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT firstname, lastname, dob FROM participants WHERE email = ?', [req.params.email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Participant not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants/work/:email', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT companyname, salary, currency FROM participants WHERE email = ?', [req.params.email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Participant not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants/home/:email', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT country, city FROM participants WHERE email = ?', [req.params.email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Participant not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/participants/:email', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM participants WHERE email = ?', [req.params.email]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Participant not found' });
        res.json({ message: 'Participant deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/participants/:email', async (req, res) => {
    const { participant, work, home } = req.body;
    try {
        const query = `UPDATE participants SET firstname=?, lastname=?, dob=?, companyname=?, salary=?, currency=?, country=?, city=? WHERE email=?`;
        const values = [participant.firstname, participant.lastname, participant.dob, work.companyname, work.salary, work.currency, home.country, home.city, req.params.email];
        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Participant not found' });
        res.json({ message: 'Participant updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});