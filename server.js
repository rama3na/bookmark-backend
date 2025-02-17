require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express(); 

 
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "https://bookmark-frontend-six.vercel.app",  
      "https://bookmark-frontend-venkata-ramanas-projects-4e9a24dd.vercel.app",  
    ],
    credentials: true,  
  })
);

app.use(helmet());  

 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 100,  
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

 
app.use(express.json());

 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch(err => console.error(" MongoDB connection error:", err));

const db = mongoose.connection;

 
db.once("open", async () => {
  console.log(" Database connection established.");
  
  try {
     
    const collections = await db.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    if (!collectionNames.includes("authCollectionObj")) {
      console.log(" authCollectionObj does not exist, creating...");
      await db.createCollection("authCollectionObj");
    }

    if (!collectionNames.includes("userCollectionObj")) {
      console.log("userCollectionObj does not exist, creating...");
      await db.createCollection("userCollectionObj");
    }

    
    app.set("authCollectionObj", db.collection("authCollectionObj"));
    app.set("userCollectionObj", db.collection("userCollectionObj"));

    console.log(" Collections set in app.");
  } catch (error) {
    console.error(" Error setting collections:", error);
  }
});

 
const authApp = require('./APIs/AuthApi');
const userApp = require('./APIs/UserApi');

 
app.use('/auth-api', authApp);
app.use('/user-api', userApp);

 
app.get("/", (req, res) => {
  res.send(" Bookmark Manager Backend is Live!");
});

 
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}...`);
});

 
setInterval(() => {
  console.log(" Server is still running...");
}, 30000);
