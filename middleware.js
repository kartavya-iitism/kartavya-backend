const jwt = require('jsonwebtoken');
const User = require('./models/User')

module.exports.checkToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next();
    } else {
        res.status(403).json({ message: "forbidden" })
    }
}

module.exports.checkVerified = (req, res, next) => {
    jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        const user = await User.findOne({ username: authorizedData.username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.isVerified && req.originalUrl !== '/api/user/view') {
            return res.status(403).json({ message: "Account not verified. Please verify your account to access this page." });
        }
        req.user = user;
        next();
    });
};