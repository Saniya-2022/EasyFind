require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const userRoutes = require("./routes/user.route")  
const cookieParser = require("cookie-parser");

// const userDetails = require("./apis/users/userDetails");
const connectDB=require('./config/db')
// const securityRoutes = require("./apis/security/security.route");


const app = express();


// Database connection
connectDB()

// Middleware
const allowedOrigins = [
  "http://localhost:3109",
  "http://localhost:3116",
  "http://localhost:3110",
  "http://localhost:3111",
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:3117",
  "http://localhost:5173",
  "https://dev-easyfind.vjstartup.com", // add as needed
  "https://dev-easyfind-admin.vjstartup.com", // add as needed
  "https://easyfind.vjstartup.com", // add as needed
  "https://easyfind-admin.vjstartup.com", // add as needed
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // ✅ allow request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ required for cookies
}));

app.use(express.json());
app.use(cookieParser());
// app.use(passport.initialize());

// // DB Connect
// const connectDB = require("./config/db");
// connectDB();

// Routes
app.get("/" ,(req,res)=>{
    res.send("Hello world")
})
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy",
        service: "easyfind-be", 
        timestamp: new Date().toISOString()
    });
});
app.use("/auth", authRoutes);
app.use("/api/items/admin", adminRoutes);
app.use("/api/items", userRoutes);
// app.use("/api", userDetails);

// app.use("/api/security", securityRoutes);

// Start email scheduler
const { startEmailScheduler } = require('./utils/emailScheduler');
startEmailScheduler();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
