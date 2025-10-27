import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import File from "./models/File.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB Error:", err));

const storage = multer.diskStorage({
  destination: "api/upload/files",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded");

  const fileRecord = await File.create({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/api/upload/files/${file.filename}`
  });

  res.json(fileRecord);
});

app.get("/files", async (req, res) => {
  const files = await File.find().sort({ uploadedAt: -1 });
  res.json(files);
});

app.use("/api/upload/files", express.static(path.join(process.cwd(), "api/upload/files")));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
