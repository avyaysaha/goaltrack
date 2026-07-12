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

function matchKey(match) {
  return `${normalize(match.home)}|${normalize(match.away)}`;
}

function sameFixture(match, home, away) {
  return matchKey(match) === `${normalize(home)}|${normalize(away)}` ||
    matchKey(match) === `${normalize(away)}|${normalize(home)}`;
}

function getMatchNumber(match) {
  const text = `${match.matchNumber || ""} ${match.group || ""}`;
  const found = text.match(/match\s*(\d+)/i);
  return found ? Number(found[1]) : Number(match.matchNumber) || null;
}

function getKnockoutResult(match, kind) {
  if (!match || !["FT", "AET", "PEN"].includes(match.status)) {
    return "";
  }

  if (match.shootoutWinner) {
    if (kind === "winner") return match.shootoutWinner;
    if (match.shootoutWinner === match.home) return match.away;
    if (match.shootoutWinner === match.away) return match.home;
    return "";
  }

  if (!Number.isInteger(match.homeScore) || !Number.isInteger(match.awayScore) || match.homeScore === match.awayScore) {
    return "";
  }

  const homeWon = match.homeScore > match.awayScore;
  return kind === "winner"
    ? (homeWon ? match.home : match.away)
    : (homeWon ? match.away : match.home);
}

function resolveBracketSlot(teamName, matchByNumber) {
  const winner = String(teamName || "").match(/^Winner Match (\d+)$/i);
  if (winner) {
    return getKnockoutResult(matchByNumber.get(Number(winner[1])), "winner") || teamName;
  }

  const runnerUp = String(teamName || "").match(/^Runner-up Match (\d+)$/i);
  if (runnerUp) {
    return getKnockoutResult(matchByNumber.get(Number(runnerUp[1])), "runnerUp") || teamName;
  }

  return teamName;
}

function displayedFixture(match, matchByNumber) {
  return {
    home: resolveBracketSlot(match.home, matchByNumber),
    away: resolveBracketSlot(match.away, matchByNumber)
  };
}

function updateScheduleScore(fileData, home, away, homeScore, awayScore) {
  if (homeScore === null) {
    return;
  }

  const matchByNumber = new Map((fileData.matches || [])
    .map((match) => [getMatchNumber(match), match])
    .filter(([number]) => Number.isInteger(number)));

  const applyScore = function (match) {
    const displayed = displayedFixture(match, matchByNumber);
    const homeIsStoredHome = normalize(displayed.home) === normalize(home);
    match.status = match.status === "FT" || match.status === "AET" || match.status === "PEN"
      ? match.status
      : "LIVE";
    match.homeScore = homeIsStoredHome ? homeScore : awayScore;
    match.awayScore = homeIsStoredHome ? awayScore : homeScore;
    return match;
  };

  const scheduleMatch = (fileData.matches || []).find((match) => {
    if (sameFixture(match, home, away)) return true;
    const displayed = displayedFixture(match, matchByNumber);
    return sameFixture(displayed, home, away);
  });
  if (scheduleMatch) {
    applyScore(scheduleMatch);
  }

  fileData.matchUpdates ||= [];
  const updateMatch = fileData.matchUpdates.find((match) => {
    if (sameFixture(match, home, away)) return true;
    const displayed = displayedFixture(match, matchByNumber);
    return sameFixture(displayed, home, away);
  });
  if (updateMatch) {
    applyScore(updateMatch);
  } else if (scheduleMatch) {
    fileData.matchUpdates.push({ ...scheduleMatch });
  }
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
  updateScheduleScore(fileData, home, away, homeScore, awayScore);
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
