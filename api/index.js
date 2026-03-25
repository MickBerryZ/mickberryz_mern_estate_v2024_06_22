import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import cookieParser from 'cookie-parser';
import path from "path"
import multer from 'multer';
import fs from 'fs';

import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.resolve()

// This tells dotenv to look in the root folder specifically
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log("--- Upload Attempt Started ---");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mickberryz-mern-estate', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'jfif', 'webp'],
    },
});

mongoose
    .connect(process.env.MONGO)
    .then(() => {
        console.log('connected to MongoDB!');
    })
    .catch((err) => {
        console.log(err);
    })

const app = express();

app.use(express.json()); // allows json input on the server 
app.use(cookieParser());

const upload = multer({ storage: storage });

// 4. Create the route that React will call to upload the picture
app.post('/api/upload', upload.array('images', 6), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            console.log("❌ No files were passed to the backend.");
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const imageUrls = req.files.map(file => file.path);
        console.log("✅ Success! Images uploaded:", imageUrls);
        res.status(200).json(imageUrls);
    } catch (error) {
        console.error("❌ CLOUDINARY UPLOAD ERROR:");
        console.error(error); // This prints the full error in your terminal
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
// -----------------------------

app.listen(3000, () => {
    console.log('Sever is running on port 3000!');
});

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

app.use(express.static(path.join(__dirname, '/client/dist')))

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
})

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    })
})