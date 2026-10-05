if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const UserRoutes = require("./routes/User");
const DonationRoutes = require("./routes/Donation");
const StudentRoutes = require("./routes/Student");
const newsAchievementsRoutes = require("./routes/NewsAchievements")
const documentRoutes = require('./routes/Document');
const mediaRoutes = require('./routes/Media');
const contactRoutes = require('./routes/Contact');
const adminRoutes = require('./routes/Admin');
const path = require('path');
const passport = require("passport");
const cors = require("cors");
const dbUrl = process.env.DB_URL;
const port = process.env.PORT || 3000;



mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("connection open!!!!");
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(passport.initialize());

app.use("/api/user", UserRoutes);
app.use("/api/student", StudentRoutes);
app.use("/api/donation", DonationRoutes);
app.use('/api/news', newsAchievementsRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);


app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    immutable: true
}));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});