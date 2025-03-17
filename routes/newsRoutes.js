const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

// Set up Multer storage for news
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/Image Assets/News');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload News
router.post("/upload", upload.single("thumbnail"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description } = req.body;
    const thumbnailUrl = `/Image Assets/News/${req.file.filename}`;
    const upload_date = new Date().toISOString().split("T")[0];
    const isDeleted = 0;

    const sql = "INSERT INTO news (title, description, thumbnail, upload_date, isDeleted) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [title, description, thumbnailUrl, upload_date, isDeleted], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "News added successfully", id: result.insertId });
    });
});

// Get All News
router.get("/", (req, res) => {
    db.query("SELECT * FROM news", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get Single News
router.get("/:id", (req, res) => {
    const newsId = req.params.id;
    const sql = "SELECT * FROM news WHERE id = ?";
    db.query(sql, [newsId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "News not found" });

        res.json(results[0]);
    });
});

// Delete News (including Image)
router.delete("/:id", (req, res) => {
    const newsId = req.params.id;
    db.query("SELECT thumbnail FROM news WHERE id = ?", [newsId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "News not found" });

        const imagePath = "public" + results[0].thumbnail;
        db.query("DELETE FROM news WHERE id = ?", [newsId], (err) => {
            if (err) return res.status(500).json(err);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Error deleting image:", err);
                }
            });
            res.json({ message: "News deleted successfully" });
        });
    });
});

// Update News
router.put("/:id", upload.single("thumbnail"), (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const newThumbnail = req.file ? `/Image Assets/News/${req.file.filename}` : null;

    db.query("SELECT thumbnail FROM news WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "News not found" });

        const oldImagePath = results[0].thumbnail ? `public${results[0].thumbnail}` : null;
        let sql = "UPDATE news SET title = ?, description = ?" + (newThumbnail ? ", thumbnail = ?" : "") + " WHERE id = ?";
        let values = newThumbnail ? [title, description, newThumbnail, id] : [title, description, id];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update news." });
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

// Archive/Unarchive News
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE news SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "News updated successfully" });
    });
});

module.exports = router;
