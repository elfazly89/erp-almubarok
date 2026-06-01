import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data.json");
const raw = fs.readFileSync(dataPath, "utf-8");
const parsed = JSON.parse(raw);

console.log("Total entries in JSON:", parsed.length);

const tables = parsed.filter((item: any) => item.type === "table");
console.log("\nFound tables:");
tables.forEach((t: any) => {
  const count = t.data ? t.data.length : 0;
  const sample = t.data && t.data.length > 0 ? Object.keys(t.data[0]).join(", ") : "no data";
  console.log(`- ${t.name}: ${count} rows (Columns: ${sample})`);
});
