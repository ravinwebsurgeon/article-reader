const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const sourceDir = path.join(__dirname, "../share-extension-template");
const targetDir = path.join(__dirname, "../ios");

// Copy fresh backup into ios/
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log("✅ ShareExtension restored successfully!");
