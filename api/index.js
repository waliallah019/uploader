import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import File from "./models/File.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB Error:", err));

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer();

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const uploadStream = cloudinary.v2.uploader.upload_stream(
    { resource_type: "auto", folder: "simple-uploader" },
    async (error, result) => {
      if (error) return res.status(500).json({ error });

      const fileRecord = await File.create({
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: result.secure_url
      });

      res.json(fileRecord);
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// Get all files
app.get("/files", async (req, res) => {
  const files = await File.find().sort({ uploadedAt: -1 });
  res.json(files);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
