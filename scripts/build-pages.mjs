import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const apiDir = path.join(root, "src", "app", "api");
const tempApiDir = path.join(root, "src", "api_server");
const outDir = path.join(root, "out");

try {
  console.log("1. Preparing API routes for static export...");
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, tempApiDir);
  }

  console.log("2. Running static build (GITHUB_PAGES=true)...");
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, GITHUB_PAGES: "true" },
  });
} finally {
  console.log("3. Restoring API routes...");
  if (fs.existsSync(tempApiDir)) {
    fs.renameSync(tempApiDir, apiDir);
  }
}

console.log("4. Creating .nojekyll in out/...");
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

console.log("5. Ensuring 404.html exists for GitHub Pages routing...");
const notFoundHtml = path.join(outDir, "_not-found", "index.html");
if (fs.existsSync(notFoundHtml)) {
  fs.copyFileSync(notFoundHtml, path.join(outDir, "404.html"));
}

console.log("6. Post-processing HTML and JS to ensure asset paths resolve under /miskova/...");
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/\.(html|js|css|txt|json)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // Replace /images/ with /miskova/images/ (avoid double prefixing)
      if (content.includes('"/images/') || content.includes("'/images/")) {
        content = content
          .replaceAll('"/images/', '"/miskova/images/')
          .replaceAll("'/images/", "'/miskova/images/");
        changed = true;
      }

      // Replace /assets/ with /miskova/assets/ (avoid double prefixing)
      if (content.includes('"/assets/') || content.includes("'/assets/")) {
        content = content
          .replaceAll('"/assets/', '"/miskova/assets/')
          .replaceAll("'/assets/", "'/miskova/assets/");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, "utf8");
      }
    }
  }
}

walk(outDir);
console.log("Static build for GitHub Pages completed successfully in out/!");
