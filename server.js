const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/Image Assets/News'); // Save in 'public' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Route to upload image and save the URL in DB
app.post('/upload', upload.single('thumbnail'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description } = req.body;
    const thumbnailUrl = `/Image Assets/News/${req.file.filename}`;

    const sql = 'INSERT INTO news (title, description, thumbnail) VALUES (?, ?, ?)';
    db.query(sql, [title, description, thumbnailUrl], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'News added successfully', id: result.insertId });
    });
});

// Route to fetch news
app.get('/news', (req, res) => {
    db.query('SELECT * FROM news', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Route to delete news and its image
app.delete("/news/:id", (req, res) => {
    const newsId = req.params.id;

    // Get the image filename before deleting the news
    const getImageSql = "SELECT thumbnail FROM news WHERE id = ?";
    db.query(getImageSql, [newsId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "News not found" });

        const imagePath = "public" + results[0].thumbnail; // Full path to the image

        // Delete the news record from the database
        const deleteSql = "DELETE FROM news WHERE id = ?";
        db.query(deleteSql, [newsId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            // Check if the file exists before deleting
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Error deleting image:", err);
                }
            });

            res.json({ message: "News deleted successfully" });
        });
    });
});

// Route to edit news
app.put("/news/:id", upload.single("thumbnail"), (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const newThumbnail = req.file ? `/Image Assets/News/${req.file.filename}` : null;

    // Step 1: Get the old image before updating the database
    const getImageSql = "SELECT thumbnail FROM news WHERE id = ?";
    db.query(getImageSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "News not found" });

        const oldImagePath = results[0].thumbnail ? `public${results[0].thumbnail}` : null;

        // Step 2: Update the database with the new image
        let sql = "UPDATE news SET title = ?, description = ?" + (newThumbnail ? ", thumbnail = ?" : "") + " WHERE id = ?";
        let values = newThumbnail ? [title, description, newThumbnail, id] : [title, description, id];

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ message: "Failed to update news." });

            // Step 3: Delete the old image file if a new one was uploaded
            if (newThumbnail && oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== "ENOENT") {
                        console.error("Error deleting old image:", err);
                    }
                });
            }

            res.json({ message: "News updated successfully." });
        });
    });
});


// Route to fetch a single news item
app.get('/news/:id', (req, res) => {
    const newsId = req.params.id;
    const sql = 'SELECT * FROM news WHERE id = ?';

    db.query(sql, [newsId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'News not found' });

        res.json(results[0]); // Return only the first result
    });
});

// Start server
app.listen(5000, () => {
    console.log('Server running on port 5000');
});

