import fs from "node:fs";

const API_URL =
  "https://api.fifa.com/api/v3/calendar/matches" +
  "?idCompetition=17&idSeason=285023" +
  "&from=2026-06-11&to=2026-07-20&language=en&count=200";

const DATA_FILES = [
  "outputs/data/manual-data.json",
  "data/manual-data.json"
];

const TEAM_NAME_OVERRIDES = {
  USA: "United States",
  "Congo DR": "DR Congo"
};

const TIME_ZONES = {
  "Mexico City": "America/Mexico_City",
  Guadalajara: "America/Mexico_City",
  Monterrey: "America/Monterrey",
  Toronto: "America/Toronto",
  Vancouver: "America/Vancouver",
  "Los Angeles": "America/Los_Angeles",
  "San Francisco Bay Area": "America/Los_Angeles",
  Seattle: "America/Los_Angeles",
  Houston: "America/Chicago",
  Dallas: "America/Chicago",
  "Kansas City": "America/Chicago",
  Atlanta: "America/New_York",
  Miami: "America/New_York",
  Boston: "America/New_York",
  Philadelphia: "America/New_York",
  "New Jersey": "America/New_York"
};

function localizedText(items) {
  return items?.find((item) => item.Locale === "en-GB")?.Description
    || items?.[0]?.Description
    || "";
}

function teamName(team) {
  const officialName = localizedText(team?.TeamName);
  return TEAM_NAME_OVERRIDES[officialName] || officialName;
}

function placeholderName(code) {
  if (/^1[A-L]$/.test(code)) return `Winner Group ${code.slice(1)}`;
  if (/^2[A-L]$/.test(code)) return `Runner-up Group ${code.slice(1)}`;

  const thirdPlace = code.match(/^3([A-L]+)$/);
  if (thirdPlace) {
    return `Best third-place team ${thirdPlace[1].split("").join("/")}`;
  }

  const winner = code.match(/^W(\d+)$/);
  if (winner) return `Winner Match ${winner[1]}`;

  const runnerUp = code.match(/^RU(\d+)$/);
  if (runnerUp) return `Runner-up Match ${runnerUp[1]}`;

  return code || "TBD";
}

function dateLabel(localDate) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(localDate));
}

function timeLabel(localDate) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(localDate)) + " local";
}

function stageLabel(stage) {
  return stage === "First Stage" ? "Group Stage" : "Knockout";
}

function roundLabel(matchNumber, stage, group) {
  if (stage === "First Stage") return group;
  return `Match ${matchNumber} · ${stage}`;
}

function fixtureKey(home, away) {
  return `${home.toLowerCase()}|${away.toLowerCase()}`;
}

function officialFixture(item) {
  const stage = localizedText(item.StageName);
  const group = localizedText(item.GroupName);
  const city = localizedText(item.Stadium?.CityName);
  const stadium = localizedText(item.Stadium?.Name);
  const home = item.Home ? teamName(item.Home) : placeholderName(item.PlaceHolderA);
  const away = item.Away ? teamName(item.Away) : placeholderName(item.PlaceHolderB);

  return {
    date: dateLabel(item.LocalDate),
    stage: stageLabel(stage),
    group: roundLabel(item.MatchNumber, stage, group),
    time: timeLabel(item.LocalDate),
    kickoffISO: item.Date,
    home,
    homeFlag: item.Home?.Abbreviation || item.PlaceHolderA || "TBD",
    away,
    awayFlag: item.Away?.Abbreviation || item.PlaceHolderB || "TBD",
    location: [stadium, city].filter(Boolean).join(" · "),
    venueTimeZone: TIME_ZONES[city] || "America/New_York"
  };
}

const response = await fetch(API_URL);
if (!response.ok) {
  throw new Error(`FIFA calendar request failed with HTTP ${response.status}`);
}

const payload = await response.json();
const officialMatches = payload.Results
  .sort((a, b) => {
    const kickoffDifference = new Date(a.Date) - new Date(b.Date);
    return kickoffDifference || a.MatchNumber - b.MatchNumber;
  })
  .map(officialFixture);
const syncedAt = new Date().toISOString();

if (officialMatches.length !== 104) {
  throw new Error(`Expected 104 FIFA fixtures, received ${officialMatches.length}`);
}

for (const file of DATA_FILES) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const detailedMatches = new Map(
    data.matches
      .filter((match) => match.status || match.scorers || match.yellowCards || match.redCards)
      .map((match) => [fixtureKey(match.home, match.away), match])
  );

  data.matches = officialMatches.map((fixture) => {
    const detail = detailedMatches.get(fixtureKey(fixture.home, fixture.away));
    return detail ? { ...fixture, ...detail, ...fixture } : fixture;
  });

  data.updatedAt = syncedAt;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

console.log("Updated both local JSON files with 104 official FIFA fixtures.");
