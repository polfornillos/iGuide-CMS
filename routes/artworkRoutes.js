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

    // Check if the student exists
    const checkStudentSql = "SELECT id, facebook_link, twitter_link, instagram_link FROM students WHERE student_name = ?";
    db.query(checkStudentSql, [student_name], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            const student_id = results[0].id;
            
            // Merge new links with existing ones
            const updatedFacebook = facebook_link || results[0].facebook_link;
            const updatedTwitter = twitter_link || results[0].twitter_link;
            const updatedInstagram = instagram_link || results[0].instagram_link;

            // Update student links if new ones are provided
            const updateStudentSql = "UPDATE students SET facebook_link = ?, twitter_link = ?, instagram_link = ? WHERE id = ?";
            db.query(updateStudentSql, [updatedFacebook, updatedTwitter, updatedInstagram, student_id], (err) => {
                if (err) return res.status(500).json(err);
            });

            insertArtwork(student_id);
        } else {
            const insertStudentSql = "INSERT INTO students (student_name, facebook_link, instagram_link, twitter_link) VALUES (?, ?, ?, ?)";
            db.query(insertStudentSql, [student_name, facebook_link, instagram_link, twitter_link], (err, result) => {
                if (err) return res.status(500).json(err);
                insertArtwork(result.insertId);
            });
        }
    });

    function insertArtwork(student_id) {
        const insertArtworkSql = "INSERT INTO artworks (student_id, artwork, title, upload_date, isDeleted) VALUES (?, ?, ?, ?, ?)";
        db.query(insertArtworkSql, [student_id, artwork, title, upload_date, isDeletedValue], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Artwork added successfully", id: result.insertId });
        });
    }
});

// Get All Artworks
router.get("/", (req, res) => {
    const sql = `SELECT a.id, a.title, a.artwork, a.upload_date, a.isDeleted, s.student_name, s.facebook_link, s.instagram_link, s.twitter_link
                 FROM artworks a
                 JOIN students s ON a.student_id = s.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get Active Artworks
router.get("/active", (req, res) => {
    const sql = `SELECT a.id, a.title, a.artwork, a.upload_date, s.student_name, s.facebook_link, s.instagram_link, s.twitter_link
                FROM artworks a
                JOIN students s ON a.student_id = s.id
                WHERE a.isDeleted = 0`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

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
    });
});

// Get Single Artwork
router.get("/:id", (req, res) => {
    const artworkId = req.params.id;
    const sql = `SELECT a.id, a.title, a.artwork, a.upload_date, s.student_name, s.facebook_link, s.instagram_link, s.twitter_link
                 FROM artworks a
                 JOIN students s ON a.student_id = s.id
                 WHERE a.id = ?`;
    db.query(sql, [artworkId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Artwork not found" });
        res.json(results[0]);
    });
});

// Delete Artwork
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

    db.query("SELECT student_id, artwork FROM artworks WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Artwork not found" });
        
        const current_student_id = results[0].student_id;
        const oldImagePath = results[0].artwork ? `public${results[0].artwork}` : null;

        // Check if the updated student name already exists in the database
        db.query("SELECT id FROM students WHERE student_name = ?", [student_name], (err, studentResults) => {
            if (err) return res.status(500).json(err);
            
            if (studentResults.length > 0) {
                // Student already exists, use their ID
                const existing_student_id = studentResults[0].id;
                const updateStudentSql = "UPDATE students SET student_name = ?, facebook_link = ?, twitter_link = ?, instagram_link = ? WHERE id = ?"
                db.query(updateStudentSql, [student_name, facebook_link, twitter_link, instagram_link, current_student_id], (err) => {
                    if (err) return res.status(500).json({ message: "Failed to update student details." });
                    updateArtwork(existing_student_id);
                });
            } else {
                // Student does not exist, update current student details
                const updateStudentSql = "UPDATE students SET student_name = ?, facebook_link = ?, twitter_link = ?, instagram_link = ? WHERE id = ?";
                db.query(updateStudentSql, [student_name, facebook_link, twitter_link, instagram_link, current_student_id], (err) => {
                    if (err) return res.status(500).json({ message: "Failed to update student details." });
                    updateArtwork(current_student_id);
                });
            }
        });
    });

    function updateArtwork(student_id) {
        let updateArtworkSql = "UPDATE artworks SET title = ?, student_id = ?" + (newArtwork ? ", artwork = ?" : "") + " WHERE id = ?";
        let values = newArtwork ? [title, student_id, newArtwork, id] : [title, student_id, id];

        db.query(updateArtworkSql, values, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update artwork." });

            if (newArtwork && oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== "ENOENT") {
                        console.error("Error deleting old image:", err);
                    }
                });
            }

            res.json({ message: "Artwork updated successfully." });
        });
    }
});

// Archive/Unarchive Artwork
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE artworks SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Artwork updated successfully" });
    });
});

module.exports = router;