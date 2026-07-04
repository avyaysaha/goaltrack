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

function score(name) {
  const raw = String(process.env[name] || "").trim();
  const match = raw.match(/^(\d+)(?:\((\d+)\))?$/);
  if (!match) {
    throw new Error(`${name} must be a number, or penalty format like 1(4).`);
  }
  return {
    goals: Number(match[1]),
    shootout: match[2] === undefined ? null : Number(match[2])
  };
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
const extraFields = [
  "time", "venue", "yellow", "red", "penalties", "winner", "shootout", "home_keeper", "away_keeper",
  "home_shots", "away_shots",
  "home_shots_on_target", "away_shots_on_target",
  "home_possession", "away_possession",
  "home_passes", "away_passes",
  "home_pass_accuracy", "away_pass_accuracy",
  "home_dribble_accuracy", "away_dribble_accuracy",
  "home_fouls", "away_fouls",
  "home_offsides", "away_offsides",
  "home_corners", "away_corners"
];
const extraFieldPattern = extraFields.join("|");
const extraPattern = new RegExp(
  `(?:^|[\\n,]\\s*)(${extraFieldPattern})\\s*=\\s*(.*?)(?=(?:[\\n,]\\s*)(?:${extraFieldPattern})\\s*=|$)`,
  "gis"
);
for (const match of String(process.env.EXTRA_DETAILS || "").matchAll(extraPattern)) {
  const name = match[1].toLowerCase();
  const value = match[2].trim();
  extraDetails[name] = extraDetails[name] ? `${extraDetails[name]}; ${value}` : value;
}

function extraValue(name) {
  return extraDetails[name] || "";
}

const statInputMap = {
  shots: "shots",
  shots_on_target: "shotsOnTarget",
  possession: "possession",
  passes: "passes",
  pass_accuracy: "passAccuracy",
  dribble_accuracy: "dribbleAccuracy",
  fouls: "fouls",
  offsides: "offsides",
  corners: "corners"
};

function optionalStat(name) {
  if (!Object.prototype.hasOwnProperty.call(extraDetails, name)) {
    return null;
  }

  const value = Number(extraValue(name));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or greater.`);
  }
  return value;
}

function buildTeamStats(side, previousStats = {}) {
  const stats = { ...(previousStats || {}) };
  for (const [inputName, jsonName] of Object.entries(statInputMap)) {
    const value = optionalStat(`${side}_${inputName}`);
    if (value !== null) {
      stats[jsonName] = value;
    }
  }
  return Object.keys(stats).length ? stats : null;
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8").replace(/^\uFEFF/, ""));
const home = resolveTeam(required("HOME_TEAM"));
const away = resolveTeam(required("AWAY_TEAM"));
if (home === away) throw new Error("Home and away teams must be different.");

const previouslyEliminated = new Set(
  Object.values(data.standings || {})
    .flat()
    .filter((team) => team.eliminated)
    .map((team) => team.name)
);

const key = (match) => `${normalize(match.home)}|${normalize(match.away)}`;
const matchNumberFromText = (value) => {
  const found = String(value || "").match(/Match\s+(\d+)/i);
  return found ? Number(found[1]) : 0;
};
const enteredMatchNumber = matchNumberFromText(process.env.GROUP_OR_ROUND);
const existingIndex = data.matchUpdates.findIndex((match) => key(match) === key({ home, away }));
const existingMatch = existingIndex >= 0 ? data.matchUpdates[existingIndex] : {};
const scheduledMatch = (data.matches || []).find((match) => key(match) === key({ home, away })) ||
  (enteredMatchNumber
    ? (data.matches || []).find((match) =>
        match.stage === "Knockout" &&
        matchNumberFromText(match.group) === enteredMatchNumber
      )
    : {}) ||
  {};
const previousMatch = { ...scheduledMatch, ...existingMatch };
const hasExtra = (name) => Object.prototype.hasOwnProperty.call(extraDetails, name);
const scorersWereSupplied = String(process.env.SCORERS || "").trim().length > 0;

const homeScoreInput = score("HOME_SCORE");
const awayScoreInput = score("AWAY_SCORE");
const homeScore = homeScoreInput.goals;
const awayScore = awayScoreInput.goals;
const matchLabel = `${home} vs ${away}`;
const enteredStage = String(process.env.STAGE || "Group Stage");
const enteredRound = String(process.env.GROUP_OR_ROUND || "");
const looksLikeKnockout = /\b(round of|quarter|semi|final|third|match\s+\d+)/i.test(enteredRound);
const resolvedStage = looksLikeKnockout ? "Knockout" : enteredStage;
const hasShootoutScores = homeScoreInput.shootout !== null || awayScoreInput.shootout !== null;
if (hasShootoutScores && (homeScoreInput.shootout === null || awayScoreInput.shootout === null)) {
  throw new Error("Enter penalty scores for both teams, like 1(4) and 1(3).");
}
if (hasShootoutScores && resolvedStage !== "Knockout") {
  throw new Error("Penalty score format is only supported for Knockout matches.");
}
if (hasShootoutScores && homeScore !== awayScore) {
  throw new Error("Penalty score format is only needed when a knockout match is tied after play.");
}
if (hasShootoutScores && homeScoreInput.shootout === awayScoreInput.shootout) {
  throw new Error("Penalty shootout scores cannot be tied.");
}
const inferredShootoutWinner = hasShootoutScores
  ? (homeScoreInput.shootout > awayScoreInput.shootout ? home : away)
  : "";
const explicitShootoutWinner = hasExtra("winner") ? resolveTeam(extraValue("winner")) : "";
const shootoutWinner = explicitShootoutWinner || inferredShootoutWinner;
const shootoutScore = hasShootoutScores
  ? `${homeScoreInput.shootout}-${awayScoreInput.shootout}`
  : (hasExtra("shootout") ? extraValue("shootout") : "");
if (explicitShootoutWinner && explicitShootoutWinner !== home && explicitShootoutWinner !== away) {
  throw new Error("winner must be one of the two teams in the match.");
}
if (explicitShootoutWinner && inferredShootoutWinner && explicitShootoutWinner !== inferredShootoutWinner) {
  throw new Error("winner does not match the penalty scores.");
}
if (explicitShootoutWinner && resolvedStage !== "Knockout") {
  throw new Error("winner is only supported for Knockout matches.");
}
if (explicitShootoutWinner && homeScore !== awayScore) {
  throw new Error("winner is only needed when a knockout match is tied after play.");
}
const homeStats = buildTeamStats("home", previousMatch.homeStats);
const awayStats = buildTeamStats("away", previousMatch.awayStats);
const update = {
  date: required("MATCH_DATE").replace(/\s+/g, " ").replace(/\s+,/g, ","),
  stage: resolvedStage,
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
  ...(homeScoreInput.shootout !== null ? { homeShootoutScore: homeScoreInput.shootout } : {}),
  ...(awayScoreInput.shootout !== null ? { awayShootoutScore: awayScoreInput.shootout } : {}),
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
  ...(shootoutWinner ? { shootoutWinner } : {}),
  ...(shootoutScore ? { shootout: shootoutScore } : {}),
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
    : (previousMatch.awayKeeper || ""),
  ...(homeStats ? { homeStats } : {}),
  ...(awayStats ? { awayStats } : {})
};
if (!Number.isFinite(update.penalties) || update.penalties < 0) {
  throw new Error("penalties in extra details must be zero or greater.");
}

if (existingIndex >= 0) data.matchUpdates[existingIndex] = update;
else data.matchUpdates.push(update);

const scheduledIndex = (data.matches || []).findIndex((match) => key(match) === key(update)) >= 0
  ? (data.matches || []).findIndex((match) => key(match) === key(update))
  : (enteredMatchNumber
      ? (data.matches || []).findIndex((match) =>
          match.stage === "Knockout" &&
          matchNumberFromText(match.group) === enteredMatchNumber
        )
      : -1);
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

function completedStatMatches() {
  return (data.matches || []).filter((match) =>
    ["FT", "AET", "PEN"].includes(match.status) &&
    Number.isInteger(match.homeScore) &&
    Number.isInteger(match.awayScore)
  );
}

const completedMatches = completedGroupMatches();
const completedStatsMatches = completedStatMatches();

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

function finishedWithWinner(match) {
  return match.stage === "Knockout" &&
    ["FT", "AET", "PEN"].includes(match.status) &&
    Number.isInteger(match.homeScore) &&
    Number.isInteger(match.awayScore) &&
    (match.homeScore !== match.awayScore || Boolean(match.shootoutWinner));
}

const eliminatedTeams = new Set(previouslyEliminated);
for (const match of data.matches || []) {
  if (!finishedWithWinner(match)) continue;
  if (match.shootoutWinner) {
    eliminatedTeams.add(match.shootoutWinner === match.home ? match.away : match.home);
  } else {
    eliminatedTeams.add(match.homeScore > match.awayScore ? match.away : match.home);
  }
}

for (const group of Object.values(standings)) {
  for (const team of group) {
    if (eliminatedTeams.has(team.name)) {
      team.eliminated = true;
    }
  }
}

const allScorers = completedStatsMatches.flatMap((match) => match.scorers || []);
const scorerTotals = new Map();
for (const event of allScorers) {
  const id = `${event.player}|${event.team}`;
  const row = scorerTotals.get(id) || { name: event.player, value: 0, detail: event.team };
  row.value += 1;
  scorerTotals.set(id, row);
}

const keeperTotals = new Map();
for (const match of completedStatsMatches) {
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
  for (const match of completedStatsMatches) {
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
  redCardEvents: completedStatsMatches.flatMap((match) => match.redCards || []),
  yellowCardEvents: completedStatsMatches.flatMap((match) => match.yellowCards || []),
  penaltyEvents: completedStatsMatches.flatMap((match) =>
    Array.from({ length: match.penalties || 0 }, () => ({ match: `${match.home} vs ${match.away}` }))
  ),
  matchStats: completedStatsMatches.map((match) => ({
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
