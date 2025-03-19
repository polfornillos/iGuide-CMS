const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

// Set up Multer storage for artworks
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/image_assets/Artworks');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload Artwork
router.post("/upload", upload.single("artwork"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, student_name, facebook_link, twitter_link, instagram_link } = req.body;
    const artwork = `/image_assets/Artworks/${req.file.filename}`;
    const upload_date = new Date().toISOString().split("T")[0];
    const isDeletedValue = 0;

    // SQL query to insert artwork into the database
    const sql = "INSERT INTO artworks (title, student_name, artwork, upload_date, facebook_link, twitter_link, instagram_link, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, student_name, artwork, upload_date, facebook_link, twitter_link, instagram_link, isDeletedValue], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Artwork added successfully", id: result.insertId });
    });
});

// Get All Artworks
router.get("/", (req, res) => {
    db.query("SELECT * FROM artworks", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get All Artwork that is not archived
router.get("/active", (req, res) => {
    db.query(
        "SELECT id, title, student_name, artwork, facebook_link, instagram_link, twitter_link FROM artworks WHERE isDeleted = 0",
        (err, results) => {
            if (err) return res.status(500).json(err);

            // Format the results to include full image URL
            const formattedResults = results.map(artwork => ({
                id: artwork.id,
                student_name: artwork.student_name,
                title: artwork.title,
                artwork: `http://localhost:5000${artwork.artwork}`,
                facebook_link: artwork.facebook_link || "#", 
                instagram_link: artwork.instagram_link || "#",
                twitter_link: artwork.twitter_link || "#"
            }));

            res.json(formattedResults);
        }
    );
});


// Get Single Artwork
router.get("/:id", (req, res) => {
    const artworkId = req.params.id;
    const sql = "SELECT * FROM artworks WHERE id = ?";
    db.query(sql, [artworkId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Artwork not found" });
        res.json(results[0]);
    });
});

// Delete Artwork (including Image)
router.delete("/:id", (req, res) => {
    const artworkId = req.params.id;
    db.query("SELECT artwork FROM artworks WHERE id = ?", [artworkId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Artwork not found" });

        const imagePath = "public" + results[0].artwork;
        db.query("DELETE FROM artworks WHERE id = ?", [artworkId], (err) => {
            if (err) return res.status(500).json(err);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Error deleting image:", err);
                }
            });
            res.json({ message: "Artwork deleted successfully" });
        });
    });
});

// Update Artwork
router.put("/:id", upload.single("artwork"), (req, res) => {
    const { id } = req.params;
    const { title, student_name, facebook_link, twitter_link, instagram_link } = req.body;
    const newArtwork = req.file ? `/image_assets/Artworks/${req.file.filename}` : null;

    // Query to get the current artwork details
    db.query("SELECT artwork FROM artworks WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Artwork not found" });

        // Get the old image path to delete if a new image is uploaded
        const oldImagePath = results[0].artwork ? `public${results[0].artwork}` : null;

        // SQL query for updating the artwork
        let sql = "UPDATE artworks SET title = ?, student_name = ?, facebook_link = ?, twitter_link = ?, instagram_link = ?" + (newArtwork ? ", artwork = ?" : "") + " WHERE id = ?";
        let values = newArtwork ? [title, student_name, facebook_link, twitter_link, instagram_link, newArtwork, id] : [title, student_name, facebook_link, twitter_link, instagram_link, id];

        // Execute the update query
        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update artwork." });

            // If a new artwork was uploaded, delete the old one
            if (newArtwork && oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== "ENOENT") {
                        console.error("Error deleting old image:", err);
                    }
                });
            }

            res.json({ message: "Artwork updated successfully." });
        });
    });
});

//Archive/Unarchive News
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE artworks SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Artwork updated successfully" });
    });
});

module.exports = router;