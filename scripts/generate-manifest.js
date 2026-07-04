// Scans the /images folder and writes manifest.json describing the folder
// tree of skins so the static site can render it without server-side code.
// Run with: node scripts/generate-manifest.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "images");
const OUTPUT_FILE = path.join(ROOT, "manifest.json");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function scanDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const folders = [];
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      folders.push({
        name: entry.name,
        ...scanDir(fullPath),
      });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const stat = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        path: path
          .relative(ROOT, fullPath)
          .split(path.sep)
          .join("/"),
        size: formatBytes(stat.size),
      });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, files };
}

if (!fs.existsSync(IMAGES_DIR)) {
  console.error(`Missing folder: ${IMAGES_DIR}`);
  process.exit(1);
}

const tree = { name: "images", ...scanDir(IMAGES_DIR) };
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tree, null, 2));

function countFiles(node) {
  return (
    node.files.length + node.folders.reduce((sum, f) => sum + countFiles(f), 0)
  );
}

console.log(`Wrote ${OUTPUT_FILE} (${countFiles(tree)} PNG files found).`);
