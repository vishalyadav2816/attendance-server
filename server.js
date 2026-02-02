require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
app.use(express.json());

// ============================================
// 1. CLOUDINARY SETTINGS (SECURED)
// ============================================
// Now we use "process.env" so the secrets are not in the file
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// ============================================
// 2. MONGODB CONNECTION (SECURED)
// ============================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

// ============================================
// 3. DATABASE STRUCTURE
// ============================================
const AttendanceSchema = new mongoose.Schema({
    workerName: String,
    checkInTime: String,
    address: String,
    photoUrl: String,
    date: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// ============================================
// 4. IMAGE UPLOAD SETTINGS
// ============================================
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'attendance_app',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage: storage });

// ============================================
// 5. THE API ROUTE
// ============================================
app.post('/api/mark-attendance', upload.single('photo'), async (req, res) => {
    try {
        console.log("Receiving upload for:", req.body.workerName);
        
        const newRecord = new Attendance({
            workerName: req.body.workerName,
            checkInTime: req.body.checkInTime,
            address: req.body.address,
            photoUrl: req.file.path
        });

        await newRecord.save();
        
        res.status(200).json({ message: "Success", data: newRecord });
        console.log("✅ Saved to DB!");
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));