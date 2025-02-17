const exp = require("express");
const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs"); // Use bcryptjs instead of bcrypt for compatibility
const jwt = require("jsonwebtoken");

const authApp = exp.Router();
authApp.use(exp.json());

// Ensure JWT_SECRET is set via environment variable
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
        // Check if the user already exists
        const existingUser = await authCollectionObj.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password using bcryptjs
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Insert the new user into the collection
        const insertResult = await authCollectionObj.insertOne({ email, password: hashedPassword });
        console.log("✅ User registered successfully:", insertResult);

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error during registration:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
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

    try {
        // Check if the user exists
        const user = await authCollectionObj.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare the provided password with the hashed password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate and send the JWT token
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Success",
            token: token,  // Send the token to the client
            user: { email: user.email }
        });
    } catch (error) {
        console.error("❌ Error during login:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}));

module.exports = authApp;
