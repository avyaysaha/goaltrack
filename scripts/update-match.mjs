import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Find the repository from this file, even if the command starts elsewhere.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const jsonPath = path.join(root, "outputs", "data", "manual-data.json");
const publishedJsonPath = path.join(root, "data", "manual-data.json");

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
  "Cote d'Ivoire": ["E", "CIV", 42], "Ecuador": ["E", "ECU", 23],
  "Netherlands": ["F", "NED", 7], "Japan": ["F", "JPN", 18],
  "Sweden": ["F", "SWE", 43], "Tunisia": ["F", "TUN", 40],
  "Belgium": ["G", "BEL", 8], "Egypt": ["G", "EGY", 34],
  "Iran": ["G", "IRN", 20], "New Zealand": ["G", "NZL", 86],
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
  return String(value || "").split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function namedEvents(value, match) {
  return list(value).map((item) => {
    const [player = "", team = ""] = item.split("|").map((part) => part.trim());
    const resolvedTeam = resolveTeam(team, false);
    return player && resolvedTeam ? { player, team: resolvedTeam, match } : null;
  }).filter(Boolean);
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

function resolveTeam(value, requiredTeam = true) {
  const entered = normalize(value);
  if (!entered) return "";
  const exact = Object.keys(teams).find((name) => normalize(name) === entered);
  if (exact) return exact;

  const closest = Object.keys(teams)
    .map((name) => ({ name, distance: editDistance(entered, normalize(name)) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (closest && closest.distance <= 4) return closest.name;
  if (requiredTeam) throw new Error(`Team "${value}" was not recognized. Use the name shown on the standings page.`);
  return "";
}

const extraDetails = {};
const extraPattern = /(?:^|[\n,]\s*)(time|venue|yellow|red|penalties|home_keeper|away_keeper)\s*=\s*(.*?)(?=(?:[\n,]\s*)(?:time|venue|yellow|red|penalties|home_keeper|away_keeper)\s*=|$)/gis;
for (const match of String(process.env.EXTRA_DETAILS || "").matchAll(extraPattern)) {
  const name = match[1].toLowerCase();
  const value = match[2].trim();
  extraDetails[name] = extraDetails[name] ? `${extraDetails[name]}; ${value}` : value;
}

function extraValue(name) {
  return extraDetails[name] || "";
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8").replace(/^\uFEFF/, ""));
const home = resolveTeam(required("HOME_TEAM"));
const away = resolveTeam(required("AWAY_TEAM"));
if (home === away) throw new Error("Home and away teams must be different.");

const key = (match) => `${normalize(match.home)}|${normalize(match.away)}`;
const existingIndex = data.matchUpdates.findIndex((match) => key(match) === key({ home, away }));
const existingMatch = existingIndex >= 0 ? data.matchUpdates[existingIndex] : {};
const scheduledMatch = (data.matches || []).find((match) => key(match) === key({ home, away })) || {};
const previousMatch = { ...scheduledMatch, ...existingMatch };
const hasExtra = (name) => Object.prototype.hasOwnProperty.call(extraDetails, name);
const scorersWereSupplied = String(process.env.SCORERS || "").trim().length > 0;

const homeScore = number("HOME_SCORE");
const awayScore = number("AWAY_SCORE");
const matchLabel = `${home} vs ${away}`;
const update = {
  date: required("MATCH_DATE").replace(/\s+/g, " ").replace(/\s+,/g, ","),
  stage: String(process.env.STAGE || "Group Stage"),
  group: String(process.env.GROUP_OR_ROUND || `Group ${teams[home][0]}`),
  time: hasExtra("time") ? extraValue("time") : (previousMatch.time || "TBD"),
  home,
  homeFlag: teams[home][1],
  away,
  awayFlag: teams[away][1],
  location: hasExtra("venue") ? extraValue("venue") : (previousMatch.location || "Venue TBD"),
  status: "FT",
  elapsed: number("ELAPSED", 90),
  homeScore,
  awayScore,
  scorers: scorersWereSupplied
    ? namedEvents(process.env.SCORERS, matchLabel)
    : (previousMatch.scorers || []),
  yellowCards: hasExtra("yellow")
    ? namedEvents(extraValue("yellow"), matchLabel)
    : (previousMatch.yellowCards || []),
  redCards: hasExtra("red")
    ? namedEvents(extraValue("red"), matchLabel)
    : (previousMatch.redCards || []),
  penalties: hasExtra("penalties")
    ? Number(extraValue("penalties") || 0)
    : (previousMatch.penalties || 0),
  ...(Number.isInteger(previousMatch.predictedHomeScore) && Number.isInteger(previousMatch.predictedAwayScore)
    ? {
        predictedHomeScore: previousMatch.predictedHomeScore,
        predictedAwayScore: previousMatch.predictedAwayScore
      }
    : {}),
  homeKeeper: hasExtra("home_keeper")
    ? extraValue("home_keeper")
    : (previousMatch.homeKeeper || ""),
  awayKeeper: hasExtra("away_keeper")
    ? extraValue("away_keeper")
    : (previousMatch.awayKeeper || "")
};
if (!Number.isFinite(update.penalties) || update.penalties < 0) {
  throw new Error("penalties in extra details must be zero or greater.");
}

if (existingIndex >= 0) data.matchUpdates[existingIndex] = update;
else data.matchUpdates.push(update);

const scheduledIndex = (data.matches || []).findIndex((match) => key(match) === key(update));
if (scheduledIndex >= 0) data.matches[scheduledIndex] = { ...data.matches[scheduledIndex], ...update };
else {
  data.matches ||= [];
  data.matches.push(update);
}

const standings = {};
for (const [name, [group, code, fifaRank]] of Object.entries(teams)) {
  standings[group] ||= [];
  standings[group].push({
    name, flag: code, fifaRank, played: 0, won: 0, drawn: 0, lost: 0, gd: 0, points: 0
  });
}

function completedGroupMatches() {
  return (data.matches || []).filter((match) =>
    match.stage === "Group Stage" &&
    ["FT", "AET", "PEN"].includes(match.status) &&
    Number.isInteger(match.homeScore) &&
    Number.isInteger(match.awayScore)
  );
}

const completedMatches = completedGroupMatches();

for (const match of completedMatches) {
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

const allScorers = completedMatches.flatMap((match) => match.scorers || []);
const scorerTotals = new Map();
for (const event of allScorers) {
  const id = `${event.player}|${event.team}`;
  const row = scorerTotals.get(id) || { name: event.player, value: 0, detail: event.team };
  row.value += 1;
  scorerTotals.set(id, row);
}

const keeperTotals = new Map();
for (const match of completedMatches) {
  const keeperEntries = [
    { name: match.homeKeeper, team: match.home, conceded: match.awayScore },
    { name: match.awayKeeper, team: match.away, conceded: match.homeScore }
  ];
  for (const entry of keeperEntries) {
    if (!entry.name) continue;
    const id = `${entry.name}|${entry.team}`;
    const keeper = keeperTotals.get(id) || {
      name: entry.name, team: entry.team, cleanSheets: 0, conceded: 0, appearances: 0
    };
    keeper.cleanSheets += entry.conceded === 0 ? 1 : 0;
    keeper.conceded += entry.conceded;
    keeper.appearances += 1;
    keeperTotals.set(id, keeper);
  }
}

function countEventsByTeam(eventKey) {
  const totals = {};
  for (const match of completedMatches) {
    for (const event of match[eventKey] || []) {
      if (event.team) totals[event.team] = (totals[event.team] || 0) + 1;
    }
  }
  return totals;
}

const keepers = [...keeperTotals.values()].map((keeper) => ({
  name: keeper.name,
  value: keeper.cleanSheets,
  detail: `${keeper.team} · ${keeper.conceded} goals conceded in ${keeper.appearances} appearance${keeper.appearances === 1 ? "" : "s"}`
}));

data.updatedAt = new Date().toISOString();
data.standings = standings;
data.detailedStats = {
  scorers: [...scorerTotals.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  keepers: keepers.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  redCards: countEventsByTeam("redCards"),
  yellowCards: countEventsByTeam("yellowCards"),
  redCardEvents: completedMatches.flatMap((match) => match.redCards || []),
  yellowCardEvents: completedMatches.flatMap((match) => match.yellowCards || []),
  penaltyEvents: completedMatches.flatMap((match) =>
    Array.from({ length: match.penalties || 0 }, () => ({ match: `${match.home} vs ${match.away}` }))
  ),
  matchStats: completedMatches.map((match) => ({
    match: `${match.home} vs ${match.away}`,
    redCards: (match.redCards || []).length,
    yellowCards: (match.yellowCards || []).length,
    penalties: match.penalties || 0,
    elapsed: match.elapsed || 90
  }))
};

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
fs.mkdirSync(path.dirname(publishedJsonPath), { recursive: true });
fs.writeFileSync(publishedJsonPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${matchLabel}: ${homeScore}-${awayScore}`);
