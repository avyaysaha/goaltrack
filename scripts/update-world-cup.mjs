import fs from "node:fs/promises";

const API_BASE_URL = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1;
const SEASON = 2026;
const FINISHED = new Set(["FT", "AET", "PEN"]);
const key = process.env.API_FOOTBALL_KEY;

if (!key) {
  throw new Error("Missing GitHub Actions secret: API_FOOTBALL_KEY");
}

const aliases = {
  "South Korea": "Korea Republic",
  "USA": "United States",
  "Ivory Coast": "Côte d'Ivoire",
  "Iran": "IR Iran",
  "Cape Verde": "Cabo Verde",
  "Turkey": "Türkiye",
  "Congo DR": "DR Congo"
};

const countryCodes = {
  "Mexico": "MEX", "Korea Republic": "KOR", "Czechia": "CZE", "South Africa": "RSA",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "Paraguay": "PAR", "Australia": "AUS", "Türkiye": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Côte d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "IR Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN"
};

const rankings = {
  "Spain": 1, "Argentina": 2, "France": 3, "England": 4, "Brazil": 5, "Portugal": 6,
  "Netherlands": 7, "Belgium": 8, "Germany": 9, "Croatia": 10, "Morocco": 11,
  "Colombia": 13, "United States": 14, "Mexico": 15, "Uruguay": 16, "Switzerland": 17,
  "Japan": 18, "Senegal": 19, "IR Iran": 20, "Korea Republic": 22, "Ecuador": 23,
  "Austria": 24, "Türkiye": 25, "Australia": 26, "Canada": 27, "Norway": 29,
  "Panama": 30, "Egypt": 34, "Algeria": 35, "Scotland": 36, "Paraguay": 39,
  "Tunisia": 40, "Côte d'Ivoire": 42, "Sweden": 43, "Czechia": 44,
  "Uzbekistan": 50, "Qatar": 51, "DR Congo": 56, "Iraq": 58, "Saudi Arabia": 60,
  "South Africa": 61, "Jordan": 66, "Cabo Verde": 68, "Bosnia and Herzegovina": 71,
  "Ghana": 72, "Curaçao": 82, "Haiti": 84, "New Zealand": 86
};

function normalizeName(name = "") {
  return aliases[name] || name;
}

async function api(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "x-apisports-key": key }
  });
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${path}`);
  }
  const data = await response.json();
  const errors = data.errors && Object.values(data.errors).filter(Boolean);
  if (errors?.length) {
    throw new Error(`${errors[0]}: ${path}`);
  }
  return data.response || [];
}

async function optionalApi(path) {
  try {
    return await api(path);
  } catch (error) {
    console.warn(`Optional data unavailable: ${error.message}`);
    return null;
  }
}

async function readPreviousData() {
  try {
    return JSON.parse(await fs.readFile("data/live-data.json", "utf8"));
  } catch {
    return {
      detailedStats: { fixtureEvents: {}, fixturePlayers: {} }
    };
  }
}

function buildStandings(response) {
  const groups = response[0]?.league?.standings || [];
  return Object.fromEntries(groups.flatMap((table) => {
    const letter = table[0]?.group?.match(/Group ([A-L])/i)?.[1]?.toUpperCase();
    if (!letter) return [];
    const complete = table.every((row) => row.all.played >= 3);
    return [[letter, table.map((row) => {
      const name = normalizeName(row.team.name);
      return {
        name,
        flag: countryCodes[name] || name.slice(0, 3).toUpperCase(),
        fifaRank: rankings[name] || "—",
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        gd: row.goalsDiff,
        points: row.points,
        stageProgress: 0,
        eliminated: complete && row.rank === 4
      };
    })]];
  }));
}

function buildMatches(fixtures) {
  return fixtures.map((item) => {
    const kickoff = new Date(item.fixture.date);
    const home = normalizeName(item.teams.home.name);
    const away = normalizeName(item.teams.away.name);
    const round = item.league.round || "World Cup";
    return {
      date: kickoff.toLocaleDateString("en-US", {
        timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric"
      }),
      stage: /group/i.test(round) ? "Group Stage" : "Knockout",
      group: round,
      time: kickoff.toLocaleTimeString("en-US", {
        timeZone: "UTC", hour: "numeric", minute: "2-digit"
      }),
      kickoffISO: item.fixture.date,
      home,
      homeFlag: countryCodes[home] || home.slice(0, 3).toUpperCase(),
      away,
      awayFlag: countryCodes[away] || away.slice(0, 3).toUpperCase(),
      location: [item.fixture.venue?.name, item.fixture.venue?.city].filter(Boolean).join(" · ") || "Venue TBD",
      fixtureId: item.fixture.id,
      status: item.fixture.status.short,
      elapsed: item.fixture.status.elapsed,
      homeScore: item.goals.home,
      awayScore: item.goals.away
    };
  }).sort((a, b) => new Date(a.kickoffISO) - new Date(b.kickoffISO));
}

function fixtureLabel(fixture, matches) {
  const match = matches.find((entry) => String(entry.fixtureId) === String(fixture));
  return match ? `${match.home} vs ${match.away}` : "";
}

function buildEventStats(fixtureEvents, matches) {
  const allEvents = Object.entries(fixtureEvents).flatMap(([fixtureId, events]) =>
    events.map((event) => ({ ...event, fixtureId }))
  );
  const scorers = new Map();
  const eventRows = (predicate) => allEvents.filter(predicate).map((event) => ({
    fixtureId: event.fixtureId,
    match: fixtureLabel(event.fixtureId, matches),
    team: normalizeName(event.team?.name || ""),
    player: event.player?.name || ""
  }));
  const isCard = (event, detail) =>
    String(event.type).toLowerCase() === "card" &&
    String(event.detail).toLowerCase().includes(detail);

  for (const event of allEvents) {
    const type = String(event.type).toLowerCase();
    const detail = String(event.detail).toLowerCase();
    const name = event.player?.name;
    if (type !== "goal" || detail.includes("missed") || detail.includes("own goal") || !name) continue;
    const id = event.player?.id || `${name}-${event.team?.name || ""}`;
    const row = scorers.get(id) || {
      name,
      value: 0,
      detail: normalizeName(event.team?.name || "Team unavailable")
    };
    row.value += 1;
    scorers.set(id, row);
  }

  const redCardEvents = eventRows((event) =>
    isCard(event, "red card") || isCard(event, "second yellow")
  );
  const yellowCardEvents = eventRows((event) => isCard(event, "yellow card"));
  const penaltyEvents = eventRows((event) =>
    String(event.type).toLowerCase() === "goal" &&
    String(event.detail).toLowerCase().includes("penalty") &&
    !String(event.detail).toLowerCase().includes("missed")
  );

  const matchStats = matches.filter((match) => FINISHED.has(match.status)).map((match) => {
    const fixtureId = String(match.fixtureId);
    return {
      fixtureId: match.fixtureId,
      match: `${match.home} vs ${match.away}`,
      redCards: redCardEvents.filter((event) => String(event.fixtureId) === fixtureId).length,
      yellowCards: yellowCardEvents.filter((event) => String(event.fixtureId) === fixtureId).length,
      penalties: penaltyEvents.filter((event) => String(event.fixtureId) === fixtureId).length
    };
  });

  return {
    scorers: [...scorers.values()].sort((a, b) =>
      b.value - a.value || a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    ),
    redCardEvents,
    yellowCardEvents,
    penaltyEvents,
    matchStats
  };
}

function buildKeepers(fixturePlayers) {
  const totals = new Map();
  for (const teams of Object.values(fixturePlayers)) {
    for (const teamEntry of teams) {
      for (const playerEntry of teamEntry.players || []) {
        const stat = playerEntry.statistics?.[0] || {};
        if (!/^g(oalkeeper)?$/i.test(String(stat.games?.position || ""))) continue;
        if ((Number(stat.games?.minutes) || 0) <= 0) continue;
        const name = playerEntry.player?.name || "Unknown goalkeeper";
        const id = playerEntry.player?.id || `${name}-${teamEntry.team?.name || ""}`;
        const row = totals.get(id) || {
          name,
          team: normalizeName(teamEntry.team?.name || "Team unavailable"),
          saves: 0,
          cleanSheets: 0
        };
        const conceded = Number(stat.goals?.conceded) || 0;
        row.saves += Number(stat.goals?.saves) || 0;
        row.cleanSheets += conceded === 0 ? 1 : 0;
        totals.set(id, row);
      }
    }
  }
  return [...totals.values()]
    .sort((a, b) =>
      b.cleanSheets - a.cleanSheets || b.saves - a.saves || a.name.localeCompare(b.name)
    )
    .map((keeper) => ({
      name: keeper.name,
      value: keeper.cleanSheets,
      detail: `${keeper.team} · ${keeper.saves} saves`
    }));
}

const query = `league=${LEAGUE_ID}&season=${SEASON}`;
const previous = await readPreviousData();
const fixtures = await api(`/fixtures?${query}`);

const matches = buildMatches(fixtures);
const completed = fixtures.filter((item) => FINISHED.has(item.fixture.status.short));
const previousFinishedIds = new Set(
  (previous.matches || [])
    .filter((match) => FINISHED.has(match.status))
    .map((match) => String(match.fixtureId))
);
const newlyCompleted = completed.filter((item) =>
  !previousFinishedIds.has(String(item.fixture.id))
);
const needsFullRefresh = !previous.standings || newlyCompleted.length > 0;
const standingsResponse = needsFullRefresh
  ? await api(`/standings?${query}`)
  : null;
const topScorersResponse = needsFullRefresh
  ? await optionalApi(`/players/topscorers?${query}`)
  : null;
const fixtureEvents = { ...(previous.detailedStats?.fixtureEvents || {}) };
const fixturePlayers = { ...(previous.detailedStats?.fixturePlayers || {}) };

const detailFixtures = previous.updatedAt ? newlyCompleted : completed;
for (const item of detailFixtures) {
  const id = String(item.fixture.id);
  if (!Array.isArray(fixtureEvents[id]) || fixtureEvents[id].length === 0) {
    const events = await optionalApi(`/fixtures/events?fixture=${item.fixture.id}`);
    if (events) fixtureEvents[id] = events;
  }
  if (!Array.isArray(fixturePlayers[id]) || fixturePlayers[id].length === 0) {
    const players = await optionalApi(`/fixtures/players?fixture=${item.fixture.id}`);
    if (players) fixturePlayers[id] = players;
  }
}

const eventStats = buildEventStats(fixtureEvents, matches);
const topScorers = (topScorersResponse || []).map((entry) => {
  const stat = entry.statistics?.[0] || {};
  return {
    name: entry.player?.name || "Unknown player",
    value: Number(stat.goals?.total) || 0,
    detail: normalizeName(stat.team?.name || "Team unavailable")
  };
}).filter((entry) => entry.value > 0);

const data = {
  updatedAt: new Date().toISOString(),
  standings: standingsResponse
    ? buildStandings(standingsResponse)
    : previous.standings,
  matches,
  detailedStats: {
    fixtureEvents,
    fixturePlayers,
    scorers: topScorers.length
      ? topScorers
      : (eventStats.scorers.length ? eventStats.scorers : previous.detailedStats?.scorers || []),
    keepers: buildKeepers(fixturePlayers),
    redCardEvents: eventStats.redCardEvents,
    yellowCardEvents: eventStats.yellowCardEvents,
    penaltyEvents: eventStats.penaltyEvents,
    matchStats: eventStats.matchStats
  }
};

const comparable = (value) => JSON.stringify({ ...value, updatedAt: null });
if (comparable(data) === comparable(previous)) {
  data.updatedAt = previous.updatedAt;
}

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/live-data.json", `${JSON.stringify(data, null, 2)}\n`);
await fs.writeFile(
  "live-data.js",
  `// Generated by GitHub Actions. Do not edit manually.\nwindow.GOALTRACK_LIVE_DATA = ${JSON.stringify(data, null, 2)};\n`
);
console.log(`Updated ${matches.length} matches at ${data.updatedAt}`);
