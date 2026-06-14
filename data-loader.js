/*
  Load the site's saved results, then refresh the fixture calendar directly
  from FIFA's official public API. If FIFA is temporarily unavailable, the
  saved JSON remains available as a fallback.
*/
const fifaCalendarUrl =
  "https://api.fifa.com/api/v3/calendar/matches" +
  "?idCompetition=17&idSeason=285023" +
  "&from=2026-06-11&to=2026-07-20&language=en&count=200";

const venueTimeZones = {
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

function fifaText(items) {
  return items?.find(function (item) {
    return item.Locale === "en-GB";
  })?.Description || items?.[0]?.Description || "";
}

function displayTeam(team) {
  const name = fifaText(team?.TeamName);
  return { USA: "United States", "Congo DR": "DR Congo" }[name] || name;
}

function placeholderName(code) {
  if (/^1[A-L]$/.test(code)) return `Winner Group ${code.slice(1)}`;
  if (/^2[A-L]$/.test(code)) return `Runner-up Group ${code.slice(1)}`;
  if (/^3[A-L]+$/.test(code)) {
    return `Best third-place team ${code.slice(1).split("").join("/")}`;
  }
  if (/^W\d+$/.test(code)) return `Winner Match ${code.slice(1)}`;
  if (/^RU\d+$/.test(code)) return `Runner-up Match ${code.slice(2)}`;
  return code || "TBD";
}

function matchKey(home, away) {
  return `${home.toLowerCase()}|${away.toLowerCase()}`;
}

function mergeOfficialCalendar(data, payload) {
  if (!Array.isArray(payload?.Results) || payload.Results.length !== 104) {
    throw new Error("FIFA did not return the complete 104-match calendar.");
  }

  const completed = new Map(data.matches.map(function (match) {
    return [matchKey(match.home, match.away), match];
  }));

  data.matches = payload.Results
    .sort(function (a, b) {
      return a.MatchNumber - b.MatchNumber;
    })
    .map(function (item) {
      const stageName = fifaText(item.StageName);
      const groupName = fifaText(item.GroupName);
      const city = fifaText(item.Stadium?.CityName);
      const stadium = fifaText(item.Stadium?.Name);
      const home = item.Home ? displayTeam(item.Home) : placeholderName(item.PlaceHolderA);
      const away = item.Away ? displayTeam(item.Away) : placeholderName(item.PlaceHolderB);
      const localKickoff = new Date(item.LocalDate);
      const fixture = {
        date: localKickoff.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC"
        }),
        stage: stageName === "First Stage" ? "Group Stage" : "Knockout",
        group: stageName === "First Stage"
          ? groupName
          : `Match ${item.MatchNumber} · ${stageName}`,
        time: `${localKickoff.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC"
        })} local`,
        kickoffISO: item.Date,
        home,
        homeFlag: item.Home?.Abbreviation || item.PlaceHolderA || "TBD",
        away,
        awayFlag: item.Away?.Abbreviation || item.PlaceHolderB || "TBD",
        location: [stadium, city].filter(Boolean).join(" · "),
        venueTimeZone: venueTimeZones[city] || "America/New_York"
      };
      const saved = completed.get(matchKey(home, away));
      return saved ? { ...saved, ...fixture } : fixture;
    });

  return data;
}

fetch("data/manual-data.json", { cache: "no-store" })
  .then(function (response) {
    if (!response.ok) {
      throw new Error(`Data request failed with status ${response.status}.`);
    }
    return response.json();
  })
  .then(async function (data) {
    try {
      const fifaResponse = await fetch(fifaCalendarUrl, { cache: "no-store" });
      if (!fifaResponse.ok) {
        throw new Error(`FIFA request failed with status ${fifaResponse.status}.`);
      }
      mergeOfficialCalendar(data, await fifaResponse.json());
    } catch (error) {
      console.warn("Using the saved schedule because FIFA could not be reached.", error);
    }

    window.GOALTRACK_DATA = data;
    const applicationScript = document.createElement("script");
    applicationScript.src = "script.js";
    document.body.appendChild(applicationScript);
  })
  .catch(function (error) {
    console.error(error);
    const message = document.createElement("p");
    message.className = "data-load-error";
    message.textContent = location.protocol === "file:"
      ? "GoalTrack data needs a local web server. Open http://127.0.0.1:4173 instead of this file."
      : "GoalTrack could not load manual-data.json. Please refresh the page.";
    document.body.prepend(message);
  });
