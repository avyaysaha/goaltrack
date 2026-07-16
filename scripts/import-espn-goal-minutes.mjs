import fs from "node:fs";

const DATA_PATH = "data/manual-data.json";
const START_DATE = new Date("2026-06-11T00:00:00Z");
const END_DATE = new Date("2026-07-15T00:00:00Z");
const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\busa\b/g, "united states")
    .replace(/\bus\b/g, "united states")
    .replace(/\bsouth korea\b/g, "korea republic")
    .replace(/\bczech republic\b/g, "czechia")
    .replace(/\bcape verde\b/g, "cabo verde")
    .replace(/\bbosnia-herzegovina\b/g, "bosnia and herzegovina")
    .replace(/\bbosnia herz?egovina\b/g, "bosnia and herzegovina")
    .replace(/\bivory coast\b/g, "cote divoire")
    .replace(/\bcote d'ivoire\b/g, "cote divoire")
    .replace(/\bcongo dr\b/g, "dr congo")
    .replace(/\bdr congo\b/g, "dr congo")
    .replace(/\bir iran\b/g, "iran")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchKey(home, away) {
  return [normalizeName(home), normalizeName(away)].sort().join("|");
}

function dateKey(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function eachDate(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function espnMinute(displayValue) {
  const text = String(displayValue || "").replace(/\s+/g, "");
  const stoppage = text.match(/^(\d+)'\+(\d+)'?$/);
  if (stoppage) {
    return `${stoppage[1]}+${stoppage[2]}'`;
  }

  const normal = text.match(/^(\d+)'?$/);
  return normal ? `${normal[1]}'` : "";
}

function playerName(detail) {
  return detail.athletesInvolved?.[0]?.displayName ||
    detail.athletesInvolved?.[0]?.fullName ||
    "Unknown scorer";
}

function eventTeams(event) {
  const competitors = event.competitions?.[0]?.competitors || [];
  return competitors.map((competitor) => ({
    homeAway: competitor.homeAway,
    name: competitor.team?.displayName || competitor.team?.name || competitor.team?.shortDisplayName || "",
    id: String(competitor.team?.id || "")
  }));
}

function teamNameFromId(teams, id) {
  return teams.find((team) => team.id === String(id))?.name || "";
}

async function fetchScoreboard(date) {
  const url = `${ESPN_SCOREBOARD}?dates=${dateKey(date)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN request failed for ${dateKey(date)} with ${response.status}`);
  }
  return response.json();
}

function findLocalMatch(data, espnHome, espnAway) {
  const key = matchKey(espnHome, espnAway);
  return data.matches.find((match) => matchKey(match.home, match.away) === key);
}

function updateDetailedGoalEvents(data, matchLabel, scorers) {
  data.detailedStats ||= {};
  data.detailedStats.goalEvents = (data.detailedStats.goalEvents || [])
    .filter((event) => normalizeName(event.match) !== normalizeName(matchLabel));
  data.detailedStats.goalEvents.push(...scorers);
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const updates = [];
const unmatched = [];

for (const date of eachDate(START_DATE, END_DATE)) {
  const scoreboard = await fetchScoreboard(date);
  for (const event of scoreboard.events || []) {
    const competition = event.competitions?.[0];
    if (!competition?.status?.type?.completed) {
      continue;
    }

    const teams = eventTeams(event);
    const espnHome = teams.find((team) => team.homeAway === "home")?.name;
    const espnAway = teams.find((team) => team.homeAway === "away")?.name;
    if (!espnHome || !espnAway) {
      continue;
    }

    const localMatch = findLocalMatch(data, espnHome, espnAway);
    if (!localMatch) {
      unmatched.push(`${espnHome} vs ${espnAway}`);
      continue;
    }

    const scorers = (competition.details || [])
      .filter((detail) => detail.scoringPlay && !detail.shootout)
      .map((detail) => {
        const team = teamNameFromId(teams, detail.team?.id);
        return {
          player: playerName(detail),
          team,
          minute: espnMinute(detail.clock?.displayValue),
          match: `${localMatch.home} vs ${localMatch.away}`
        };
      })
      .filter((goal) => goal.team && goal.minute);

    if (!scorers.length) {
      continue;
    }

    localMatch.scorers = scorers.map((goal) => ({
      ...goal,
      team: normalizeName(goal.team) === normalizeName(localMatch.home) ? localMatch.home :
        normalizeName(goal.team) === normalizeName(localMatch.away) ? localMatch.away : goal.team
    }));
    updateDetailedGoalEvents(data, `${localMatch.home} vs ${localMatch.away}`, localMatch.scorers);
    updates.push(`${localMatch.home} vs ${localMatch.away}: ${localMatch.scorers.map((goal) => `${goal.player} ${goal.minute}`).join(", ")}`);
  }
}

fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  updatedMatches: updates.length,
  updates,
  unmatched: [...new Set(unmatched)].sort()
}, null, 2));
