const express = require('express');
const { MongoClient } = require('mongodb');
const bodyparser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyparser.json());

const url = process.env.MONGO_URL;  // Using .env variable
const client = new MongoClient(url);
const dbName = 'passop';
let db;  // Will hold the connected DB instance

// Async function to connect to MongoDB before starting server
async function startDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Stop server if DB fails to connect
    }
}

// Get all passwords
app.get('/', async (req, res) => {
    try {
        const collection = db.collection('passwords');
        const findResult = await collection.find({}).toArray();
        res.json(findResult);
    } catch (err) {
        console.error('❌ Error fetching passwords:', err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Save a Password
app.post('/', async (req, res) => {
    const password = req.body;
    const collection = db.collection('passwords');
    const findResult = await collection.insertOne(password);
    res.send({ success: true, result: findResult });
});

// Delete a Password
app.delete('/:id', async (req, res) => {
    try {
        const collection = db.collection('passwords');
        const result = await collection.deleteOne({ id: req.params.id });
        if (result.deletedCount === 1) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "Not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Edit password
app.put('/:id', async (req, res) => {
    try {
        const collection = db.collection('passwords');

        console.log("---- EDIT REQUEST ----");
        console.log("req.params.id:", req.params.id);
        console.log("req.body:", req.body);

        const { id, ...updateData } = req.body;

        const result = await collection.updateOne(
            { id: req.params.id },
            { $set: updateData }
        );

        console.log("Mongo result:", result);

        if (result.matchedCount === 0) {
            console.log("No document matched for id:", req.params.id);
            return res.status(404).json({ success: false, message: "Password not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error in PUT /:id:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start the server AFTER DB is connected
startDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
});
