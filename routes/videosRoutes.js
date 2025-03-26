const { express, db } = require("../config/dependencies");

const router = express.Router();

// Upload Video
router.post("/upload", (req, res) => {
    const { title, description, video_link } = req.body;
    
    // Validate if video_link is provided and is a valid URL
    if (!video_link || !/^https?:\/\/.+/.test(video_link)) {
        return res.status(400).json({ message: "Invalid or missing video link" });
    }
    
    const upload_date = new Date().toISOString().split("T")[0];
    const isDeleted = 0;

    const sql = "INSERT INTO video_archive (title, description, video_link, upload_date, isDeleted) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [title, description, video_link, upload_date, isDeleted], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Video added successfully", id: result.insertId });
    });
});

// Get All Video
router.get("/", (req, res) => {
    db.query("SELECT * FROM video_archive", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get All Active Videos
router.get("/active", (req, res) => {
    db.query("SELECT * FROM video_archive WHERE isDeleted = 0", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

// Get Single Video
router.get("/:id", (req, res) => {
    const videoId = req.params.id;
    const sql = "SELECT * FROM video_archive WHERE id = ?";
    db.query(sql, [videoId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Video not found" });

        res.json(results[0]);
    });
});

// Delete Video
router.delete("/:id", (req, res) => {
    const videoId = req.params.id;
    db.query("DELETE FROM video_archive WHERE id = ?", [videoId], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Video deleted successfully" });
    });
});

// Update Video
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, video_link } = req.body;

    if (!video_link || !/^https?:\/\/.+/.test(video_link)) {
        return res.status(400).json({ message: "Invalid or missing video link" });
    }

    const sql = "UPDATE video_archive SET title = ?, description = ?, video_link = ? WHERE id = ?";
    db.query(sql, [title, description, video_link, id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update video." });

        res.json({ message: "Video updated successfully." });
    });
});

// Archive/Unarchive Video
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE video_archive SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });

        res.json({ message: "Video updated successfully" });
    });
});


module.exports = router;
