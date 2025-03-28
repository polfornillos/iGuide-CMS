const { express, multer, path, fs, db } = require("../config/dependencies");

const router = express.Router();

// Set up Multer storage for partners
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/image_assets/Partners");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload Partner
router.post("/upload", upload.single("company_logo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { company_name, company_link } = req.body;
    const logoUrl = `/image_assets/Partners/${req.file.filename}`;
    const upload_date = new Date().toISOString().split("T")[0];
    const isDeleted = 0;

    const sql = "INSERT INTO partners (company_name, company_logo, company_link, upload_date, isDeleted) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [company_name, logoUrl, company_link, upload_date, isDeleted], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Partner added successfully", id: result.insertId });
    });
});

// Get All Partners
router.get("/", (req, res) => {
    db.query("SELECT * FROM partners", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get All Active Partners
router.get("/active", (req, res) => {
    db.query("SELECT company_logo, company_link FROM partners WHERE isDeleted = 0", (err, results) => {
        if (err) return res.status(500).json(err);

        // Format the results to add base URL to the logo
        const formattedResults = results.map(partner => ({
            company_logo: `http://localhost:5000${partner.company_logo}`,
            company_link: partner.company_link
        }));

        res.json(formattedResults);
    });
});

// Get Single Partner
router.get("/:id", (req, res) => {
    const partnerId = req.params.id;
    const sql = "SELECT * FROM partners WHERE id = ?";
    db.query(sql, [partnerId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Partner not found" });

        res.json(results[0]);
    });
});

// Delete Partner (including Logo)
router.delete("/:id", (req, res) => {
    const partnerId = req.params.id;
    db.query("SELECT company_logo FROM partners WHERE id = ?", [partnerId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Partner not found" });

        const imagePath = "public" + results[0].company_logo;
        db.query("DELETE FROM partners WHERE id = ?", [partnerId], (err) => {
            if (err) return res.status(500).json(err);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Error deleting logo:", err);
                }
            });
            res.json({ message: "Partner deleted successfully" });
        });
    });
});

// Update Partner
router.put("/:id", upload.single("company_logo"), (req, res) => {
    const { id } = req.params;
    const { company_name, company_link } = req.body;
    const newLogo = req.file ? `/image_assets/Partners/${req.file.filename}` : null;

    db.query("SELECT company_logo FROM partners WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Partner not found" });

        const oldImagePath = results[0].company_logo ? `public${results[0].company_logo}` : null;
        let sql = "UPDATE partners SET company_name = ?, company_link = ?" + (newLogo ? ", company_logo = ?" : "") + " WHERE id = ?";
        let values = newLogo ? [company_name, company_link, newLogo, id] : [company_name, company_link, id];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update partner." });
            if (newLogo && oldImagePath) {
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== "ENOENT") {
                        console.error("Error deleting old logo:", err);
                    }
                });
            }
            res.json({ message: "Partner updated successfully." });
        });
    });
});

// Archive/Unarchive Partner
router.put("/:id/archive", (req, res) => {
    const { id } = req.params;
    const { isDeleted } = req.body;

    db.query("UPDATE partners SET isDeleted = ? WHERE id = ?", [isDeleted, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Partner updated successfully" });
    });
});

module.exports = router;
