const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Import routes
const newsRoutes = require('./routes/newsRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const programsRoutes = require('./routes/programsRoutes');
const partnersRoutes = require('./routes/partnersRoutes');


// Use routes
app.use('/news', newsRoutes);
app.use('/artworks', artworkRoutes);
app.use('/programs', programsRoutes);
app.use('/partners', partnersRoutes);



app.listen(5000, () => {
    console.log('Server running on port 5000');
});