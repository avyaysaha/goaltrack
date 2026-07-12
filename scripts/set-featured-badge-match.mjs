import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const jsonPaths = [
  path.join(root, "data", "manual-data.json"),
  path.join(root, "outputs", "data", "manual-data.json")
];

function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function optionalScore(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a whole number, like 0, 1, or 2.`);
  }
  return Number(value);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[left.length][right.length];
}

const data = JSON.parse(fs.readFileSync(jsonPaths[0], "utf8").replace(/^\uFEFF/, ""));
const teamNames = Object.values(data.standings || {})
  .flat()
  .map((team) => team.name);

function resolveTeam(value) {
  const entered = normalize(value);
  const exact = teamNames.find((name) => normalize(name) === entered);
  if (exact) return exact;

  const closest = teamNames
    .map((name) => ({ name, distance: editDistance(entered, normalize(name)) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (closest && closest.distance <= 4) return closest.name;
  throw new Error(`Team "${value}" was not recognized. Use the name shown on the standings page.`);
}

const home = resolveTeam(required("HOME_TEAM"));
const away = resolveTeam(required("AWAY_TEAM"));
if (home === away) throw new Error("Home and away teams must be different.");
const homeScore = optionalScore("HOME_SCORE");
const awayScore = optionalScore("AWAY_SCORE");
if ((homeScore === null) !== (awayScore === null)) {
  throw new Error("Enter both home_score and away_score, or leave both blank.");
}

for (const jsonPath of jsonPaths) {
  const fileData = JSON.parse(fs.readFileSync(jsonPath, "utf8").replace(/^\uFEFF/, ""));
  fileData.featuredBadgeMatch = {
    home,
    away,
    ...(homeScore !== null ? { homeScore, awayScore } : {}),
    label: `${home} vs ${away}`,
    updatedAt: new Date().toISOString()
  };
  fileData.updatedAt = new Date().toISOString();
  fs.writeFileSync(jsonPath, JSON.stringify(fileData, null, 2) + "\n", "utf8");
}

console.log(`Featured badge background set to ${home} vs ${away}.`);
