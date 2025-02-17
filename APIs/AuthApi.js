const exp = require("express");
const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authApp = exp.Router();
authApp.use(exp.json());

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// ✅ User Registration (Signup)
authApp.post('/register', expressAsyncHandler(async (req, res) => {
    const authCollectionObj = req.app.get("authCollectionObj");
    
    // Debugging: Check if collection is initialized
    if (!authCollectionObj) {
        console.error("❌ Database collection not initialized!");
        return res.status(500).json({ message: "Database not initialized yet." });
    }

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await authCollectionObj.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    try {
        // 🔹 Hash password using bcrypt
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        await authCollectionObj.insertOne({ email, password: hashedPassword });
        console.log("✅ User registered successfully:", email);

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error hashing password:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));

// ✅ User Login
authApp.post('/login', expressAsyncHandler(async (req, res) => {
    const authCollectionObj = req.app.get("authCollectionObj");
    if (!authCollectionObj) {
        return res.status(500).json({ message: "Database not initialized yet." });
    }

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await authCollectionObj.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ FIX: Generate and send the token
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
        message: "Success",
        token: token,  // ✅ Ensure token is included
        user: { email: user.email }
    });
}));


authApp.get('/get-user', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const authCollectionObj = req.app.get("authCollectionObj");

        const user = await authCollectionObj.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User details retrieved",
            user: { email: user.email }
        });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

module.exports = authApp;
