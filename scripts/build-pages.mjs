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
    env: { ...process.env, GITHUB_PAGES: "true", NEXT_PUBLIC_BASE_PATH: "/miskova" },
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

console.log("6. Providing static mock for /api/reviews...");
const staticApiReviewsDir = path.join(outDir, "api", "reviews");
fs.mkdirSync(staticApiReviewsDir, { recursive: true });
const staticReviewPayload = JSON.stringify({
  success: true,
  data: [],
  stats: {
    averageRating: 0,
    totalReviews: 0,
    breakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  },
  total: 0,
});
fs.writeFileSync(path.join(staticApiReviewsDir, "index.html"), staticReviewPayload);
fs.writeFileSync(path.join(staticApiReviewsDir, "index.json"), staticReviewPayload);
fs.writeFileSync(path.join(outDir, "api", "reviews.json"), staticReviewPayload);

console.log("7. Mirroring assets and images under out/miskova/ for bulletproof resolution...");
const miskovaSubdir = path.join(outDir, "miskova");
fs.mkdirSync(miskovaSubdir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(path.join(outDir, "assets"))) {
  copyRecursive(path.join(outDir, "assets"), path.join(miskovaSubdir, "assets"));
}
if (fs.existsSync(path.join(outDir, "images"))) {
  copyRecursive(path.join(outDir, "images"), path.join(miskovaSubdir, "images"));
}
if (fs.existsSync(path.join(outDir, "fonts"))) {
  copyRecursive(path.join(outDir, "fonts"), path.join(miskovaSubdir, "fonts"));
}

console.log("8. Post-processing HTML and JS to ensure asset paths resolve under /miskova/...");
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/\.(html|js|css|txt|json)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // Replace /images/ with /miskova/images/ (handling double quotes, single quotes, backticks)
      const imagesRegex = /([`"'])\/images\//g;
      if (imagesRegex.test(content)) {
        content = content.replace(/([`"'])\/images\//g, "$1/miskova/images/");
        changed = true;
      }

      // Replace /assets/ with /miskova/assets/ (handling double quotes, single quotes, backticks)
      const assetsRegex = /([`"'])\/assets\//g;
      if (assetsRegex.test(content)) {
        content = content.replace(/([`"'])\/assets\//g, "$1/miskova/assets/");
        changed = true;
      }

      // Avoid any accidental double-prefixing like /miskova/miskova/
      if (content.includes("/miskova/miskova/")) {
        content = content.replaceAll("/miskova/miskova/", "/miskova/");
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
