const exp = require("express");
const { ObjectId } = require("mongodb");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken"); 
const userApp = exp.Router();
userApp.use(exp.json());

// Middleware for Token Authentication
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// ✅ Add a New Bookmark
userApp.post('/adduser', verifyToken, expressAsyncHandler(async (req, res) => {
    const userCollectionObj = req.app.get("userCollectionObj");  // Fixed collection name
    const { title, content } = req.body;  // Ensure field names match frontend

    if (!title || !content) {
        return res.status(400).json({ message: "Title and Content (URL) are required" });
    }

    const newBookmark = { title, content, userId: req.user.email };

    await userCollectionObj.insertOne(newBookmark);
    res.json({ message: "Bookmark added successfully" });
}));

// ✅ Get All Bookmarks (Only for Authenticated User)
userApp.get('/get-bookmarks', verifyToken, expressAsyncHandler(async (req, res) => {
    const userCollectionObj = req.app.get("userCollectionObj");  // Fixed collection name

    const bookmarks = await userCollectionObj.find({ userId: req.user.email }).toArray();
    res.json({ message: "Bookmarks retrieved", payload: bookmarks });
}));

// ✅ Update Bookmark
userApp.put('/update-bookmark/:id', verifyToken, expressAsyncHandler(async (req, res) => {
    const bookmarkCollectionObj = req.app.get("userCollectionObj");  // ✅ Ensure correct collection
    const bookmarkId = req.params.id;

    if (!ObjectId.isValid(bookmarkId)) {
        return res.status(400).json({ message: "Invalid bookmark ID" });
    }

    const updatedBookmark = req.body;
    const result = await bookmarkCollectionObj.updateOne(
        { _id: new ObjectId(bookmarkId), userId: req.user.email },  // ✅ Ensure the user can only update their own bookmarks
        { $set: updatedBookmark }
    );

    if (result.modifiedCount > 0) {
        res.json({ message: "Bookmark updated successfully" });
    } else {
        res.status(400).json({ message: "Update failed or unauthorized" });
    }
}));


// ✅ Delete Bookmark
userApp.delete('/delete-bookmark/:id', verifyToken, expressAsyncHandler(async (req, res) => {
    const bookmarkCollectionObj = req.app.get("userCollectionObj"); // ✅ Ensure correct collection
    const bookmarkId = req.params.id;

    if (!ObjectId.isValid(bookmarkId)) {
        return res.status(400).json({ message: "Invalid bookmark ID" });
    }

    const result = await bookmarkCollectionObj.deleteOne({ 
        _id: new ObjectId(bookmarkId), 
        userId: req.user.email 
    });

    if (result.deletedCount > 0) {
        res.json({ message: "Bookmark deleted successfully" });
    } else {
        res.status(400).json({ message: "Bookmark deletion failed or unauthorized" });
    }
}));


module.exports = userApp;
