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

app.use("/user", UserRoutes);
app.use("/student", StudentRoutes);
app.use("/donation", DonationRoutes);
app.use('/news', newsAchievementsRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ home: "home" });
});

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});