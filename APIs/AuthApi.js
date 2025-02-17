const exp = require("express");
const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authApp = exp.Router();
authApp.use(exp.json());

const JWT_SECRET = process.env.JWT_SECRET || "4f8fH7tJbC5zL9xK2G7fU6nR1vYdM9f3H6tP7qXwY8bM9tFz4bU5jXq8rS1cVZ7";

// ✅ User Registration (Signup)
authApp.post('/register', expressAsyncHandler(async (req, res) => {
    const authCollectionObj = req.app.get("authCollectionObj");

    if (!authCollectionObj) {
        console.error("❌ Database collection not initialized!");
        return res.status(500).json({ message: "Database not initialized yet." });
    }

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const existingUser = await authCollectionObj.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password using bcrypt
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const insertResult = await authCollectionObj.insertOne({ email, password: hashedPassword });
        console.log("✅ User registered successfully:", insertResult);

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error during registration:", error);
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

module.exports = authApp;
