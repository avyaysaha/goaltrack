import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Find the repository from this file, even if the command starts elsewhere.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const jsonPath = path.join(root, "outputs", "data", "manual-data.json");
const jsPath = path.join(root, "outputs", "manual-data.js");

const teams = {
  "Mexico": ["A", "MEX", 15], "Korea Republic": ["A", "KOR", 22],
  "Czechia": ["A", "CZE", 44], "South Africa": ["A", "RSA", 61],
  "Canada": ["B", "CAN", 27], "Bosnia and Herzegovina": ["B", "BIH", 71],
  "Qatar": ["B", "QAT", 51], "Switzerland": ["B", "SUI", 17],
  "Brazil": ["C", "BRA", 5], "Morocco": ["C", "MAR", 11],
  "Haiti": ["C", "HAI", 84], "Scotland": ["C", "SCO", 36],
  "United States": ["D", "USA", 14], "Paraguay": ["D", "PAR", 39],
  "Australia": ["D", "AUS", 26], "Türkiye": ["D", "TUR", 25],
  "Germany": ["E", "GER", 9], "Curaçao": ["E", "CUW", 82],
  "Côte d'Ivoire": ["E", "CIV", 42], "Ecuador": ["E", "ECU", 23],
  "Netherlands": ["F", "NED", 7], "Japan": ["F", "JPN", 18],
  "Sweden": ["F", "SWE", 43], "Tunisia": ["F", "TUN", 40],
  "Belgium": ["G", "BEL", 8], "Egypt": ["G", "EGY", 34],
  "IR Iran": ["G", "IRN", 20], "New Zealand": ["G", "NZL", 86],
  "Spain": ["H", "ESP", 1], "Cabo Verde": ["H", "CPV", 68],
  "Saudi Arabia": ["H", "KSA", 60], "Uruguay": ["H", "URU", 16],
  "France": ["I", "FRA", 3], "Senegal": ["I", "SEN", 19],
  "Iraq": ["I", "IRQ", 58], "Norway": ["I", "NOR", 29],
  "Argentina": ["J", "ARG", 2], "Algeria": ["J", "ALG", 35],
  "Austria": ["J", "AUT", 24], "Jordan": ["J", "JOR", 66],
  "Portugal": ["K", "POR", 6], "DR Congo": ["K", "COD", 56],
  "Uzbekistan": ["K", "UZB", 50], "Colombia": ["K", "COL", 13],
  "England": ["L", "ENG", 4], "Croatia": ["L", "CRO", 10],
  "Ghana": ["L", "GHA", 72], "Panama": ["L", "PAN", 30]
};

function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function number(name, fallback = 0) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be zero or greater.`);
  return value;
}

function list(value) {
  return String(value || "").split(";").map((item) => item.trim()).filter(Boolean);
}

function namedEvents(value, match) {
  return list(value).map((item) => {
    const [player = "", team = ""] = item.split("|").map((part) => part.trim());
    return { player, team, match };
  });
}

function extraValue(name) {
  const line = String(process.env.EXTRA_DETAILS || "")
    .split(/\r?\n/)
    .find((entry) => entry.toLowerCase().startsWith(`${name.toLowerCase()}=`));
  return line ? line.slice(line.indexOf("=") + 1).trim() : "";
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const home = required("HOME_TEAM");
const away = required("AWAY_TEAM");
if (!teams[home] || !teams[away]) throw new Error("Use team names exactly as shown on the standings page.");
if (home === away) throw new Error("Home and away teams must be different.");

const homeScore = number("HOME_SCORE");
const awayScore = number("AWAY_SCORE");
const matchLabel = `${home} vs ${away}`;
const update = {
  date: required("MATCH_DATE"),
  stage: String(process.env.STAGE || "Group Stage"),
  group: String(process.env.GROUP_OR_ROUND || `Group ${teams[home][0]}`),
  time: extraValue("time") || "TBD",
  home,
  homeFlag: teams[home][1],
  away,
  awayFlag: teams[away][1],
  location: extraValue("venue") || "Venue TBD",
  status: "FT",
  elapsed: number("ELAPSED", 90),
  homeScore,
  awayScore,
  scorers: namedEvents(process.env.SCORERS, matchLabel),
  yellowCards: namedEvents(extraValue("yellow"), matchLabel),
  redCards: namedEvents(extraValue("red"), matchLabel),
  penalties: Number(extraValue("penalties") || 0),
  homeKeeper: extraValue("home_keeper"),
  awayKeeper: extraValue("away_keeper")
};
if (!Number.isFinite(update.penalties) || update.penalties < 0) {
  throw new Error("penalties in extra details must be zero or greater.");
}

const key = (match) => `${match.home.toLowerCase()}|${match.away.toLowerCase()}|${match.date}`;
const existingIndex = data.matchUpdates.findIndex((match) => key(match) === key(update));
if (existingIndex >= 0) data.matchUpdates[existingIndex] = update;
else data.matchUpdates.push(update);

const standings = {};
for (const [name, [group, code, fifaRank]] of Object.entries(teams)) {
  standings[group] ||= [];
  standings[group].push({
    name, flag: code, fifaRank, played: 0, won: 0, drawn: 0, lost: 0, gd: 0, points: 0
  });
}

for (const match of data.matchUpdates) {
  if (match.stage !== "Group Stage") continue;
  const group = teams[match.home]?.[0];
  if (!group || teams[match.away]?.[0] !== group) continue;
  const homeRow = standings[group].find((row) => row.name === match.home);
  const awayRow = standings[group].find((row) => row.name === match.away);
  homeRow.played += 1;
  awayRow.played += 1;
  homeRow.gd += match.homeScore - match.awayScore;
  awayRow.gd += match.awayScore - match.homeScore;
  if (match.homeScore > match.awayScore) {
    homeRow.won += 1; homeRow.points += 3; awayRow.lost += 1;
  } else if (match.awayScore > match.homeScore) {
    awayRow.won += 1; awayRow.points += 3; homeRow.lost += 1;
  } else {
    homeRow.drawn += 1; awayRow.drawn += 1;
    homeRow.points += 1; awayRow.points += 1;
  }
}

for (const group of Object.values(standings)) {
  group.sort((a, b) => b.points - a.points || b.gd - a.gd || a.name.localeCompare(b.name));
}

const allScorers = data.matchUpdates.flatMap((match) => match.scorers || []);
const scorerTotals = new Map();
for (const event of allScorers) {
  const id = `${event.player}|${event.team}`;
  const row = scorerTotals.get(id) || { name: event.player, value: 0, detail: event.team };
  row.value += 1;
  scorerTotals.set(id, row);
}

const keepers = [];
for (const match of data.matchUpdates) {
  if (match.homeKeeper) {
    keepers.push({ name: match.homeKeeper, value: match.awayScore === 0 ? 1 : 0, detail: `${match.home} · ${match.awayScore} goals conceded` });
  }
  if (match.awayKeeper) {
    keepers.push({ name: match.awayKeeper, value: match.homeScore === 0 ? 1 : 0, detail: `${match.away} · ${match.homeScore} goals conceded` });
  }
}

data.updatedAt = new Date().toISOString();
data.standings = standings;
data.detailedStats = {
  scorers: [...scorerTotals.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  keepers: keepers.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  redCardEvents: data.matchUpdates.flatMap((match) => match.redCards || []),
  yellowCardEvents: data.matchUpdates.flatMap((match) => match.yellowCards || []),
  penaltyEvents: data.matchUpdates.flatMap((match) =>
    Array.from({ length: match.penalties || 0 }, () => ({ match: `${match.home} vs ${match.away}` }))
  ),
  matchStats: data.matchUpdates.map((match) => ({
    match: `${match.home} vs ${match.away}`,
    redCards: (match.redCards || []).length,
    yellowCards: (match.yellowCards || []).length,
    penalties: match.penalties || 0,
    elapsed: match.elapsed || 90
  }))
};

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(
  jsPath,
  `// Generated by the private "Update Match Manually" GitHub Action.\nwindow.GOALTRACK_MANUAL_DATA = ${JSON.stringify(data, null, 2)};\n`
);
console.log(`Updated ${matchLabel}: ${homeScore}-${awayScore}`);
