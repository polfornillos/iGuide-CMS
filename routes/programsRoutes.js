const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

// Set up Multer storage for news
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/image_assets/Programs');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload Program
router.post("/upload", upload.single("cover_image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { department_name, program_name, program_specialization, program_description, number_of_terms, duration, internship, careers } = req.body;
    const cover_image = `/image_assets/Programs/${req.file.filename}`;
    const upload_date = new Date().toISOString().split("T")[0];

    const sql = "INSERT INTO programs (program_name, department_name, program_specialization, program_description, number_of_terms, duration, internship, careers, cover_image, upload_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [program_name, department_name, program_specialization, program_description, number_of_terms, duration, internship, careers, cover_image, upload_date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Program added successfully", id: result.insertId });
    });
});

// Get All Programs
router.get("/", (req, res) => {
    db.query("SELECT * FROM programs", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get all programs for School of Computing
router.get("/soc", (req, res) => {
    const sql = "SELECT * FROM programs WHERE isDeleted = 0 AND department_name = ?";
    db.query(sql, ["School of Computing"], (err, results) => {
        if (err) return res.status(500).json(err);

        // Modify each program's cover_image to include the full URL
        const formattedResults = results.map(program => ({
            ...program,
            cover_image: `http://localhost:5000${program.cover_image}`
        }));

        res.json(formattedResults);
    });
});

// Get all programs for School of Business and Arts
router.get("/sbla", (req, res) => {
    const sql = "SELECT * FROM programs WHERE isDeleted = 0 AND department_name = ?";
    db.query(sql, ["School of Business and Liberal Arts"], (err, results) => {
        if (err) return res.status(500).json(err);

        // Modify each program's cover_image to include the full URL
        const formattedResults = results.map(program => ({
            ...program,
            cover_image: `http://localhost:5000${program.cover_image}`
        }));

        res.json(formattedResults);
    });
});

// Get all programs for School of Design and the Arts
router.get("/sda", (req, res) => {
    const sql = "SELECT * FROM programs WHERE isDeleted = 0 AND department_name = ?";
    db.query(sql, ["School of Design and the Arts"], (err, results) => {
        if (err) return res.status(500).json(err);

        // Modify each program's cover_image to include the full URL
        const formattedResults = results.map(program => ({
            ...program,
            cover_image: `http://localhost:5000${program.cover_image}`
        }));

        res.json(formattedResults);
    });
});

// Get all programs for Senior High School
router.get("/shs", (req, res) => {
    const sql = "SELECT * FROM programs WHERE isDeleted = 0 AND department_name = ?";
    db.query(sql, ["Senior High School"], (err, results) => {
        if (err) return res.status(500).json(err);

        // Modify each program's cover_image to include the full URL
        const formattedResults = results.map(program => ({
            ...program,
            cover_image: `http://localhost:5000${program.cover_image}`
        }));

        res.json(formattedResults);
    });
});


// Get Single Program
router.get("/:id", (req, res) => {
    const programId = req.params.id;
    const sql = "SELECT * FROM programs WHERE id = ?";
    db.query(sql, [programId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Program not found" });

        res.json(results[0]);
    });
});


// Delete Program (including Image)
router.delete("/:id", (req, res) => {
    const programId = req.params.id;
    db.query("SELECT cover_image FROM programs WHERE id = ?", [programId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Program not found" });

        const imagePath = "public" + results[0].cover_image;
        db.query("DELETE FROM programs WHERE id = ?", [programId], (err) => {
            if (err) return res.status(500).json(err);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Error deleting image:", err);
                }
            });
            res.json({ message: "Program deleted successfully" });
        });
    });
});

// Update Program
router.put("/:id", upload.single("cover_image"), (req, res) => {
    const { id } = req.params;
    const { department_name, program_name, program_specialization, program_description, number_of_terms, duration, internship, careers } = req.body;
    const newCoverImage = req.file ? `/image_assets/Programs/${req.file.filename}` : null;

    db.query("SELECT cover_image FROM programs WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Program not found" });

        const oldImagePath = results[0].cover_image ? `public${results[0].cover_image}` : null;
        let sql = "UPDATE programs SET department_name = ?, program_name = ?, program_specialization = ?, program_description = ?, number_of_terms = ?, duration = ?, internship = ?, careers = ?" +
                  (newCoverImage ? ", cover_image = ?" : "") + " WHERE id = ?";
        let values = newCoverImage ? [department_name, program_name, program_specialization, program_description, number_of_terms, duration, internship, careers, newCoverImage, id] : 
                                     [department_name, program_name, program_specialization, program_description, number_of_terms, duration, internship, careers, id];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update program." });
            if (newCoverImage && oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== "ENOENT") {
                        console.error("Error deleting old image:", err);
                    }
                });
            }
            res.json({ message: "Program updated successfully." });
        });
    });
});

// Archive/Unarchive Program
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE programs SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Program updated successfully" });
    });
});

module.exports = router;