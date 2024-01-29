// Dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { weeklyScraper, scrape } from "./utils/scrapper.js";
// Load env variables
dotenv.config();
// Create express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
weeklyScraper.start();
// scrape(process.env.PAGE_TO_CRAWL);
// Pass the google maps url to the start function

// Routes
app.get("/:lang", (req, res) => {
  const lang = req.params.lang;
  const dir = path.join(cwd(), "public", `data/index_${lang}.json`);
  const data = JSON.parse(fs.readFileSync(dir, "utf-8"));
  if (data.length === 0) {
    return res.json([]).status(200);
  }
  return res.json(data).status(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
