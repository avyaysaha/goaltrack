/*
  GoalTrack JavaScript
  --------------------
  This file is shared by all three pages. Each section first checks whether
  the HTML element it needs exists. That lets one script work everywhere.
*/

// ---------- 1. Mobile navigation ----------
const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");

if (menuButton && mainNav) {
  menuButton.addEventListener("click", function () {
    const menuIsOpen = mainNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", menuIsOpen);
  });
}

// ---------- 2. Home-page countdown ----------
const countdownElements = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds")
};

// The 2026 World Cup Final is scheduled for July 19 at MetLife Stadium.
// This uses Eastern Daylight Time, the venue's local time in July.
const finalKickoff = new Date("2026-07-19T15:00:00-04:00");

function updateCountdown() {
  // If there is no countdown on this page, stop the function early.
  if (!countdownElements.days) {
    return;
  }

  const now = new Date();
  const millisecondsLeft = Math.max(finalKickoff - now, 0);

  // JavaScript dates use milliseconds, so we convert them into useful units.
  const secondsLeft = Math.floor(millisecondsLeft / 1000);
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  // padStart adds a leading zero to values such as 4, making them display as 04.
  countdownElements.days.textContent = String(days).padStart(2, "0");
  countdownElements.hours.textContent = String(hours).padStart(2, "0");
  countdownElements.minutes.textContent = String(minutes).padStart(2, "0");
  countdownElements.seconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ---------- 3. World Cup 2026 group and standings data ----------
// An object stores named groups. Each group contains an array of team objects.
// Only completed matches should change these values. At the start of the
// tournament, every team correctly has zero games played and zero points.
const teamCountryCodes = {
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

function getTeamCountryCode(name, fallback = "") {
  return teamCountryCodes[name] || fallback;
}

function team(name, flag, fifaRank) {
  return {
    name,
    flag: getTeamCountryCode(name, flag),
    fifaRank,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gd: 0,
    points: 0
  };
}

// GitHub Actions replaces live-data.js after scheduled API updates. Keeping
// this separate from the main script lets the site update without rebuilding
// the beginner-friendly application code.
const publishedLiveData = window.GOALTRACK_LIVE_DATA || {};

let standingsData = {
  A: [
    { name: "Mexico", flag: "🇲🇽", fifaRank: 15, played: 1, won: 1, drawn: 0, lost: 0, gd: 2, points: 3 },
    { name: "Korea Republic", flag: "KOR", fifaRank: 22, played: 1, won: 1, drawn: 0, lost: 0, gd: 1, points: 3 },
    { name: "Czechia", flag: "CZE", fifaRank: 44, played: 1, won: 0, drawn: 0, lost: 1, gd: -1, points: 0 },
    { name: "South Africa", flag: "🇿🇦", fifaRank: 61, played: 1, won: 0, drawn: 0, lost: 1, gd: -2, points: 0 }
  ],
  B: [
    team("Canada", "🇨🇦", 27),
    team("Bosnia and Herzegovina", "🇧🇦", 71),
    team("Qatar", "🇶🇦", 51),
    team("Switzerland", "🇨🇭", 17)
  ],
  C: [
    team("Brazil", "🇧🇷", 5),
    team("Morocco", "🇲🇦", 11),
    team("Haiti", "🇭🇹", 84),
    team("Scotland", "SCO", 36)
  ],
  D: [
    team("United States", "🇺🇸", 14),
    team("Paraguay", "🇵🇾", 39),
    team("Australia", "🇦🇺", 26),
    team("Türkiye", "🇹🇷", 25)
  ],
  E: [
    team("Germany", "🇩🇪", 9),
    team("Curaçao", "🇨🇼", 82),
    team("Côte d'Ivoire", "🇨🇮", 42),
    team("Ecuador", "🇪🇨", 23)
  ],
  F: [
    team("Netherlands", "🇳🇱", 7),
    team("Japan", "🇯🇵", 18),
    team("Sweden", "🇸🇪", 43),
    team("Tunisia", "🇹🇳", 40)
  ],
  G: [
    team("Belgium", "🇧🇪", 8),
    team("Egypt", "🇪🇬", 34),
    team("IR Iran", "🇮🇷", 20),
    team("New Zealand", "🇳🇿", 86)
  ],
  H: [
    team("Spain", "🇪🇸", 1),
    team("Cabo Verde", "🇨🇻", 68),
    team("Saudi Arabia", "🇸🇦", 60),
    team("Uruguay", "🇺🇾", 16)
  ],
  I: [
    team("France", "🇫🇷", 3),
    team("Senegal", "🇸🇳", 19),
    team("Iraq", "🇮🇶", 58),
    team("Norway", "🇳🇴", 29)
  ],
  J: [
    team("Argentina", "🇦🇷", 2),
    team("Algeria", "🇩🇿", 35),
    team("Austria", "🇦🇹", 24),
    team("Jordan", "🇯🇴", 66)
  ],
  K: [
    team("Portugal", "🇵🇹", 6),
    team("DR Congo", "🇨🇩", 56),
    team("Uzbekistan", "🇺🇿", 50),
    team("Colombia", "🇨🇴", 13)
  ],
  L: [
    team("England", "ENG", 4),
    team("Croatia", "🇭🇷", 10),
    team("Ghana", "🇬🇭", 72),
    team("Panama", "🇵🇦", 30)
  ]
};

// Reuse the most recent live standings on the homepage so team dots retain
// their progress after the user updates data on the standings page.
try {
  const cachedStandings = JSON.parse(localStorage.getItem("goalTrackStandings") || "null");
  if (cachedStandings) {
    standingsData = { ...standingsData, ...cachedStandings };
  }
} catch (error) {
  // Invalid cache data is ignored and the bundled standings remain available.
}

if (publishedLiveData.standings) {
  standingsData = { ...standingsData, ...publishedLiveData.standings };
}

// Do not let an older browser cache erase the confirmed opening result.
// Newer live standings with more than one match played are left unchanged.
const cachedMexico = standingsData.A.find(function (entry) {
  return entry.name === "Mexico";
});
const cachedSouthAfrica = standingsData.A.find(function (entry) {
  return entry.name === "South Africa";
});
const cachedKorea = standingsData.A.find(function (entry) {
  return entry.name === "Korea Republic";
});
const cachedCzechia = standingsData.A.find(function (entry) {
  return entry.name === "Czechia";
});
if ((cachedMexico?.played || 0) < 1 && (cachedSouthAfrica?.played || 0) < 1) {
  Object.assign(cachedMexico, { played: 1, won: 1, drawn: 0, lost: 0, gd: 2, points: 3 });
  Object.assign(cachedSouthAfrica, { played: 1, won: 0, drawn: 0, lost: 1, gd: -2, points: 0 });
}
if ((cachedKorea?.played || 0) < 1 && (cachedCzechia?.played || 0) < 1) {
  Object.assign(cachedKorea, { played: 1, won: 1, drawn: 0, lost: 0, gd: 1, points: 3 });
  Object.assign(cachedCzechia, { played: 1, won: 0, drawn: 0, lost: 1, gd: -1, points: 0 });
}
localStorage.setItem("goalTrackStandings", JSON.stringify(standingsData));

// Convert bundled and cached team badges to one consistent three-letter format.
Object.values(standingsData).flat().forEach(function (entry) {
  entry.flag = getTeamCountryCode(entry.name, entry.flag);
});

const standingsBody = document.querySelector("#standings-body");
const groupTabs = document.querySelector("#group-tabs");
const groupLabel = document.querySelector("#group-label");
const groupName = document.querySelector("#group-name");
const groupStatus = document.querySelector("#group-status");
const teamOrbitDots = document.querySelector("#team-orbit-dots");

function renderTeamOrbit() {
  if (!teamOrbitDots) {
    return;
  }

  const allTeams = Object.entries(standingsData).flatMap(function ([group, teams]) {
    return teams.map(function (entry, index) {
      return { ...entry, group, groupPosition: index + 1 };
    });
  }).filter(function (entry) {
    // Eliminated teams leave the tournament orbit completely.
    return !entry.eliminated;
  });
  // Each dot uses a recognizable national team or flag color.
  const nationalColors = {
    "Mexico": "#006847",
    "South Africa": "#007749",
    "Korea Republic": "#cd2e3a",
    "Czechia": "#11457e",
    "Canada": "#d80621",
    "Bosnia and Herzegovina": "#002395",
    "Qatar": "#8a1538",
    "Switzerland": "#d52b1e",
    "Brazil": "#ffdf00",
    "Morocco": "#c1272d",
    "Haiti": "#00209f",
    "Scotland": "#005eb8",
    "United States": "#3c3b6e",
    "Paraguay": "#d52b1e",
    "Australia": "#ffcd00",
    "Türkiye": "#e30a17",
    "Germany": "#f2c500",
    "Curaçao": "#002b7f",
    "Côte d'Ivoire": "#f77f00",
    "Ecuador": "#ffdd00",
    "Netherlands": "#f36c21",
    "Japan": "#bc002d",
    "Sweden": "#006aa7",
    "Tunisia": "#e70013",
    "Belgium": "#ef3340",
    "Egypt": "#ce1126",
    "IR Iran": "#239f40",
    "New Zealand": "#151515",
    "Spain": "#aa151b",
    "Cabo Verde": "#003893",
    "Saudi Arabia": "#006c35",
    "Uruguay": "#5bc0eb",
    "France": "#002654",
    "Senegal": "#00853f",
    "Iraq": "#ce1126",
    "Norway": "#ba0c2f",
    "Argentina": "#75aadb",
    "Algeria": "#006233",
    "Austria": "#ed2939",
    "Jordan": "#ce1126",
    "Portugal": "#046a38",
    "DR Congo": "#007fff",
    "Uzbekistan": "#0099b5",
    "Colombia": "#fcd116",
    "England": "#c8102e",
    "Croatia": "#ff0000",
    "Ghana": "#fcd116",
    "Panama": "#da121a"
  };

  teamOrbitDots.innerHTML = allTeams.map(function (entry, index) {
    const angle = (index / allTeams.length) * Math.PI * 2 - Math.PI / 2;
    // Wins, points, and later rounds move a team inward. Losses create an
    // outward penalty. Confirmed elimination removes the team above.
    const stageProgress = entry.stageProgress || 0;
    const inwardProgress =
      stageProgress * 24 +
      Math.min(entry.points || 0, 9) * 2 +
      (entry.won || 0) * 7;
    const lossPenalty = (entry.lost || 0) * 12;
    const color = nationalColors[entry.name] || "#ffffff";

    return `
      <button
        class="team-orbit-dot ${inwardProgress > 0 ? "has-progress" : ""} ${lossPenalty > 0 ? "has-loss" : ""}"
        type="button"
        style="
          --dot-angle: ${angle};
          --dot-progress: ${inwardProgress};
          --loss-penalty: ${lossPenalty};
          --team-color: ${color};
        "
        data-label="${entry.name} · ${entry.won}W ${entry.lost}L · ${entry.points} pts"
        aria-label="${entry.name}, ${entry.won} wins, ${entry.lost} losses, ${entry.points} points">
      </button>
    `;
  }).join("");

  positionTeamOrbitDots();
}

function positionTeamOrbitDots() {
  if (!teamOrbitDots) {
    return;
  }

  const bounds = teamOrbitDots.getBoundingClientRect();
  const outerRadius = Math.max(Math.min(bounds.width, bounds.height) / 2 - 12, 110);
  const startingRadius = Math.max(outerRadius - 30, 95);
  const minimumRadius = Math.min(outerRadius, 135);

  teamOrbitDots.querySelectorAll(".team-orbit-dot").forEach(function (dot) {
    const angle = Number(dot.style.getPropertyValue("--dot-angle"));
    const progress = Number(dot.style.getPropertyValue("--dot-progress"));
    const lossPenalty = Number(dot.style.getPropertyValue("--loss-penalty"));
    const radius = Math.min(
      Math.max(startingRadius - progress + lossPenalty, minimumRadius),
      outerRadius
    );
    dot.style.setProperty("--dot-x", `${Math.cos(angle) * radius}px`);
    dot.style.setProperty("--dot-y", `${Math.sin(angle) * radius}px`);
  });
}

function showGroup(groupLetter) {
  if (!standingsBody) {
    return;
  }

  // map() changes every team object into a string of HTML.
  standingsBody.innerHTML = standingsData[groupLetter].map(function (team, index) {
    const position = index + 1;
    // Do not visually declare qualifiers until matches have been completed.
    const hasResults = standingsData[groupLetter].some(function (entry) {
      return entry.played > 0;
    });
    let rowClass = "";
    if (hasResults && position <= 2) rowClass = "advances";
    if (hasResults && position === 3) rowClass = "third";
    const goalDifference = team.gd > 0 ? `+${team.gd}` : team.gd;

    return `
      <tr class="${rowClass}">
        <td class="position">${position}</td>
        <td>
          <div class="team-cell">
            <span class="team-flag ${/^[A-Z0-9]{2,3}$/.test(team.flag) ? "team-code" : ""}">${team.flag}</span>
            <span>${team.name}</span>
          </div>
        </td>
        <td class="fifa-rank">${team.fifaRank}</td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td>${goalDifference}</td>
        <td class="points">${team.points}</td>
      </tr>
    `;
  }).join("");

  groupLabel.textContent = `GROUP ${groupLetter}`;
  groupName.textContent = `Group ${groupLetter} standings`;
  groupStatus.textContent = standingsData[groupLetter].some(function (entry) {
    return entry.played > 0;
  }) ? "After completed matches" : "No completed matches";

  // Update the highlighted tab so the user knows which group is visible.
  document.querySelectorAll(".group-tab").forEach(function (button) {
    button.classList.toggle("active", button.dataset.group === groupLetter);
  });
}

if (groupTabs) {
  // Object.keys returns ["A", "B", "C", "D"] for our sample data.
  Object.keys(standingsData).forEach(function (groupLetter) {
    const button = document.createElement("button");
    button.className = "group-tab";
    button.type = "button";
    button.dataset.group = groupLetter;
    button.textContent = `Group ${groupLetter}`;
    button.addEventListener("click", function () {
      showGroup(groupLetter);
    });
    groupTabs.appendChild(button);
  });

  showGroup("A");
}

renderTeamOrbit();
window.addEventListener("resize", positionTeamOrbitDots);

// ---------- 4. Selected official match schedule data ----------
// Times below are local to the stadium. "TBD" means the kickoff time was not
// included in this beginner-friendly selection of the published calendar.
let matches = [
  {
    date: "Thursday, June 11, 2026",
    stage: "Group Stage",
    group: "Group A",
    time: "1:00 PM local",
    home: "Mexico",
    homeFlag: "🇲🇽",
    away: "South Africa",
    awayFlag: "🇿🇦",
    location: "Estadio Azteca · Mexico City",
    status: "FT",
    homeScore: 2,
    awayScore: 0
  },
  {
    date: "Thursday, June 11, 2026",
    stage: "Group Stage",
    group: "Group A",
    time: "8:00 PM local",
    home: "Korea Republic",
    homeFlag: "🇰🇷",
    away: "Czechia",
    awayFlag: "🇨🇿",
    location: "Estadio Akron · Guadalajara",
    status: "FT",
    elapsed: 96,
    homeScore: 2,
    awayScore: 1
  },
  {
    date: "Friday, June 12, 2026",
    stage: "Group Stage",
    group: "Group B",
    time: "3:00 PM local",
    home: "Canada",
    homeFlag: "🇨🇦",
    away: "Bosnia and Herzegovina",
    awayFlag: "🇧🇦",
    location: "BMO Field · Toronto"
  },
  {
    date: "Friday, June 12, 2026",
    stage: "Group Stage",
    group: "Group D",
    time: "6:00 PM local",
    home: "United States",
    homeFlag: "🇺🇸",
    away: "Paraguay",
    awayFlag: "🇵🇾",
    location: "SoFi Stadium · Los Angeles"
  },
  {
    date: "Saturday, June 13, 2026",
    stage: "Group Stage",
    group: "Group B",
    time: "12:00 PM local",
    home: "Qatar",
    homeFlag: "🇶🇦",
    away: "Switzerland",
    awayFlag: "🇨🇭",
    location: "Levi's Stadium · San Francisco Bay Area"
  },
  {
    date: "Saturday, June 13, 2026",
    stage: "Group Stage",
    group: "Group C",
    time: "6:00 PM local",
    home: "Brazil",
    homeFlag: "🇧🇷",
    away: "Morocco",
    awayFlag: "🇲🇦",
    location: "Gillette Stadium · Boston"
  },
  {
    date: "Saturday, June 13, 2026",
    stage: "Group Stage",
    group: "Group C",
    time: "9:00 PM local",
    home: "Haiti",
    homeFlag: "🇭🇹",
    away: "Scotland",
    awayFlag: "SCO",
    location: "MetLife Stadium · New York/New Jersey"
  },
  {
    date: "Saturday, June 13, 2026",
    stage: "Group Stage",
    group: "Group D",
    time: "9:00 PM local",
    home: "Australia",
    homeFlag: "🇦🇺",
    away: "Türkiye",
    awayFlag: "🇹🇷",
    location: "BC Place · Vancouver"
  },
  {
    date: "Sunday, June 14, 2026",
    stage: "Group Stage",
    group: "Group E",
    time: "12:00 PM local",
    home: "Germany",
    homeFlag: "🇩🇪",
    away: "Curaçao",
    awayFlag: "🇨🇼",
    location: "NRG Stadium · Houston"
  },
  {
    date: "Sunday, June 14, 2026",
    stage: "Group Stage",
    group: "Group F",
    time: "3:00 PM local",
    home: "Netherlands",
    homeFlag: "🇳🇱",
    away: "Japan",
    awayFlag: "🇯🇵",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Monday, June 15, 2026",
    stage: "Group Stage",
    group: "Group G",
    time: "12:00 PM local",
    home: "Belgium",
    homeFlag: "🇧🇪",
    away: "Egypt",
    awayFlag: "🇪🇬",
    location: "Lumen Field · Seattle"
  },
  {
    date: "Monday, June 15, 2026",
    stage: "Group Stage",
    group: "Group H",
    time: "12:00 PM local",
    home: "Spain",
    homeFlag: "🇪🇸",
    away: "Cabo Verde",
    awayFlag: "🇨🇻",
    location: "Mercedes-Benz Stadium · Atlanta"
  },
  {
    date: "Tuesday, June 16, 2026",
    stage: "Group Stage",
    group: "Group I",
    time: "3:00 PM local",
    home: "France",
    homeFlag: "🇫🇷",
    away: "Senegal",
    awayFlag: "🇸🇳",
    location: "MetLife Stadium · New York/New Jersey"
  },
  {
    date: "Tuesday, June 16, 2026",
    stage: "Group Stage",
    group: "Group I",
    time: "TBD",
    home: "Iraq",
    homeFlag: "IRQ",
    away: "Norway",
    awayFlag: "NOR",
    location: "Gillette Stadium · Boston"
  },
  {
    date: "Tuesday, June 16, 2026",
    stage: "Group Stage",
    group: "Group J",
    time: "8:00 PM local",
    home: "Argentina",
    homeFlag: "🇦🇷",
    away: "Algeria",
    awayFlag: "🇩🇿",
    location: "Arrowhead Stadium · Kansas City"
  },
  {
    date: "Wednesday, June 17, 2026",
    stage: "Group Stage",
    group: "Group K",
    time: "12:00 PM local",
    home: "Portugal",
    homeFlag: "🇵🇹",
    away: "DR Congo",
    awayFlag: "🇨🇩",
    location: "NRG Stadium · Houston"
  },
  {
    date: "Wednesday, June 17, 2026",
    stage: "Group Stage",
    group: "Group L",
    time: "3:00 PM local",
    home: "England",
    homeFlag: "ENG",
    away: "Croatia",
    awayFlag: "🇭🇷",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Thursday, June 18, 2026",
    stage: "Group Stage",
    group: "Group B",
    time: "3:00 PM local",
    home: "Canada",
    homeFlag: "🇨🇦",
    away: "Qatar",
    awayFlag: "🇶🇦",
    location: "BC Place · Vancouver"
  },
  {
    date: "Friday, June 19, 2026",
    stage: "Group Stage",
    group: "Group D",
    time: "12:00 PM local",
    home: "United States",
    homeFlag: "🇺🇸",
    away: "Australia",
    awayFlag: "🇦🇺",
    location: "Lumen Field · Seattle"
  },
  {
    date: "Monday, June 22, 2026",
    stage: "Group Stage",
    group: "Group I",
    time: "TBD",
    home: "Norway",
    homeFlag: "NOR",
    away: "Senegal",
    awayFlag: "SEN",
    location: "MetLife Stadium · New York/New Jersey"
  },
  {
    date: "Wednesday, June 24, 2026",
    stage: "Group Stage",
    group: "Group B",
    time: "12:00 PM local",
    home: "Switzerland",
    homeFlag: "🇨🇭",
    away: "Canada",
    awayFlag: "🇨🇦",
    location: "BC Place · Vancouver"
  },
  {
    date: "Thursday, June 25, 2026",
    stage: "Group Stage",
    group: "Group D",
    time: "7:00 PM local",
    home: "Türkiye",
    homeFlag: "🇹🇷",
    away: "United States",
    awayFlag: "🇺🇸",
    location: "SoFi Stadium · Los Angeles"
  },
  {
    date: "Friday, June 26, 2026",
    stage: "Group Stage",
    group: "Group I",
    time: "TBD",
    home: "Norway",
    homeFlag: "NOR",
    away: "France",
    awayFlag: "FRA",
    location: "Gillette Stadium · Boston"
  },
  {
    date: "Sunday, June 28, 2026",
    stage: "Knockout",
    group: "Match 73 · Round of 32",
    time: "12:00 PM local",
    home: "Runner-up Group A",
    homeFlag: "A2",
    away: "Runner-up Group B",
    awayFlag: "B2",
    location: "SoFi Stadium · Los Angeles"
  },
  {
    date: "Monday, June 29, 2026",
    stage: "Knockout",
    group: "Match 74 · Round of 32",
    time: "1:00 PM local",
    home: "Winner Group E",
    homeFlag: "E1",
    away: "Best third-place team A/B/C/D/F",
    awayFlag: "3rd",
    location: "Gillette Stadium · Boston"
  },
  {
    date: "Monday, June 29, 2026",
    stage: "Knockout",
    group: "Match 75 · Round of 32",
    time: "2:30 PM local",
    home: "Winner Group F",
    homeFlag: "F1",
    away: "Runner-up Group C",
    awayFlag: "C2",
    location: "Estadio BBVA · Monterrey"
  },
  {
    date: "Monday, June 29, 2026",
    stage: "Knockout",
    group: "Match 76 · Round of 32",
    time: "8:00 PM local",
    home: "Winner Group C",
    homeFlag: "C1",
    away: "Runner-up Group F",
    awayFlag: "F2",
    location: "NRG Stadium · Houston"
  },
  {
    date: "Tuesday, June 30, 2026",
    stage: "Knockout",
    group: "Match 78 · Round of 32",
    time: "12:00 PM local",
    home: "Runner-up Group E",
    homeFlag: "E2",
    away: "Runner-up Group I",
    awayFlag: "I2",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Tuesday, June 30, 2026",
    stage: "Knockout",
    group: "Match 77 · Round of 32",
    time: "5:00 PM local",
    home: "Winner Group I",
    homeFlag: "I1",
    away: "Best third-place team C/D/F/G/H",
    awayFlag: "3rd",
    location: "MetLife Stadium · New York/New Jersey"
  },
  {
    date: "Tuesday, June 30, 2026",
    stage: "Knockout",
    group: "Match 79 · Round of 32",
    time: "8:00 PM local",
    home: "Winner Group A",
    homeFlag: "A1",
    away: "Best third-place team C/E/F/H/I",
    awayFlag: "3rd",
    location: "Estadio Azteca · Mexico City"
  },
  {
    date: "Wednesday, July 1, 2026",
    stage: "Knockout",
    group: "Match 80 · Round of 32",
    time: "12:00 PM local",
    home: "Winner Group L",
    homeFlag: "L1",
    away: "Best third-place team E/H/I/J/K",
    awayFlag: "3rd",
    location: "Mercedes-Benz Stadium · Atlanta"
  },
  {
    date: "Wednesday, July 1, 2026",
    stage: "Knockout",
    group: "Match 82 · Round of 32",
    time: "1:00 PM local",
    home: "Winner Group G",
    homeFlag: "G1",
    away: "Best third-place team A/E/H/I/J",
    awayFlag: "3rd",
    location: "Lumen Field · Seattle"
  },
  {
    date: "Wednesday, July 1, 2026",
    stage: "Knockout",
    group: "Match 81 · Round of 32",
    time: "5:00 PM local",
    home: "Winner Group D",
    homeFlag: "D1",
    away: "Best third-place team B/E/F/I/J",
    awayFlag: "3rd",
    location: "Levi's Stadium · San Francisco Bay Area"
  },
  {
    date: "Thursday, July 2, 2026",
    stage: "Knockout",
    group: "Match 84 · Round of 32",
    time: "12:00 PM local",
    home: "Winner Group H",
    homeFlag: "H1",
    away: "Runner-up Group J",
    awayFlag: "J2",
    location: "SoFi Stadium · Los Angeles"
  },
  {
    date: "Thursday, July 2, 2026",
    stage: "Knockout",
    group: "Match 83 · Round of 32",
    time: "7:00 PM local",
    home: "Runner-up Group K",
    homeFlag: "K2",
    away: "Runner-up Group L",
    awayFlag: "L2",
    location: "BMO Field · Toronto"
  },
  {
    date: "Thursday, July 2, 2026",
    stage: "Knockout",
    group: "Match 85 · Round of 32",
    time: "8:00 PM local",
    home: "Winner Group B",
    homeFlag: "B1",
    away: "Best third-place team E/F/G/I/J",
    awayFlag: "3rd",
    location: "BC Place · Vancouver"
  },
  {
    date: "Friday, July 3, 2026",
    stage: "Knockout",
    group: "Match 88 · Round of 32",
    time: "1:00 PM local",
    home: "Runner-up Group D",
    homeFlag: "D2",
    away: "Runner-up Group G",
    awayFlag: "G2",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Friday, July 3, 2026",
    stage: "Knockout",
    group: "Match 86 · Round of 32",
    time: "6:00 PM local",
    home: "Winner Group J",
    homeFlag: "J1",
    away: "Runner-up Group H",
    awayFlag: "H2",
    location: "Hard Rock Stadium · Miami"
  },
  {
    date: "Friday, July 3, 2026",
    stage: "Knockout",
    group: "Match 87 · Round of 32",
    time: "8:30 PM local",
    home: "Winner Group K",
    homeFlag: "K1",
    away: "Best third-place team D/E/I/J/L",
    awayFlag: "3rd",
    location: "Arrowhead Stadium · Kansas City"
  },
  {
    date: "Saturday, July 4, 2026",
    stage: "Knockout",
    group: "Match 89 · Round of 16",
    time: "1:00 PM local",
    home: "Winner Match 73",
    homeFlag: "73",
    away: "Winner Match 75",
    awayFlag: "75",
    location: "Lincoln Financial Field · Philadelphia"
  },
  {
    date: "Saturday, July 4, 2026",
    stage: "Knockout",
    group: "Match 90 · Round of 16",
    time: "5:00 PM local",
    home: "Winner Match 74",
    homeFlag: "74",
    away: "Winner Match 77",
    awayFlag: "77",
    location: "NRG Stadium · Houston"
  },
  {
    date: "Sunday, July 5, 2026",
    stage: "Knockout",
    group: "Match 91 · Round of 16",
    time: "4:00 PM local",
    home: "Winner Match 76",
    homeFlag: "76",
    away: "Winner Match 78",
    awayFlag: "78",
    location: "MetLife Stadium · New York/New Jersey"
  },
  {
    date: "Sunday, July 5, 2026",
    stage: "Knockout",
    group: "Match 92 · Round of 16",
    time: "7:00 PM local",
    home: "Winner Match 79",
    homeFlag: "79",
    away: "Winner Match 80",
    awayFlag: "80",
    location: "Estadio Azteca · Mexico City"
  },
  {
    date: "Monday, July 6, 2026",
    stage: "Knockout",
    group: "Match 93 · Round of 16",
    time: "2:00 PM local",
    home: "Winner Match 83",
    homeFlag: "83",
    away: "Winner Match 84",
    awayFlag: "84",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Monday, July 6, 2026",
    stage: "Knockout",
    group: "Match 94 · Round of 16",
    time: "5:00 PM local",
    home: "Winner Match 81",
    homeFlag: "81",
    away: "Winner Match 82",
    awayFlag: "82",
    location: "Lumen Field · Seattle"
  },
  {
    date: "Tuesday, July 7, 2026",
    stage: "Knockout",
    group: "Match 95 · Round of 16",
    time: "12:00 PM local",
    home: "Winner Match 86",
    homeFlag: "86",
    away: "Winner Match 88",
    awayFlag: "88",
    location: "Mercedes-Benz Stadium · Atlanta"
  },
  {
    date: "Tuesday, July 7, 2026",
    stage: "Knockout",
    group: "Match 96 · Round of 16",
    time: "1:00 PM local",
    home: "Winner Match 85",
    homeFlag: "85",
    away: "Winner Match 87",
    awayFlag: "87",
    location: "BC Place · Vancouver"
  },
  {
    date: "Thursday, July 9, 2026",
    stage: "Knockout",
    group: "Match 97 · Quarterfinal",
    time: "4:00 PM local",
    home: "Winner Match 89",
    homeFlag: "89",
    away: "Winner Match 90",
    awayFlag: "90",
    location: "Gillette Stadium · Boston"
  },
  {
    date: "Friday, July 10, 2026",
    stage: "Knockout",
    group: "Match 98 · Quarterfinal",
    time: "12:00 PM local",
    home: "Winner Match 93",
    homeFlag: "93",
    away: "Winner Match 94",
    awayFlag: "94",
    location: "SoFi Stadium · Los Angeles"
  },
  {
    date: "Saturday, July 11, 2026",
    stage: "Knockout",
    group: "Match 99 · Quarterfinal",
    time: "5:00 PM local",
    home: "Winner Match 91",
    homeFlag: "91",
    away: "Winner Match 92",
    awayFlag: "92",
    location: "Hard Rock Stadium · Miami"
  },
  {
    date: "Saturday, July 11, 2026",
    stage: "Knockout",
    group: "Match 100 · Quarterfinal",
    time: "8:00 PM local",
    home: "Winner Match 95",
    homeFlag: "95",
    away: "Winner Match 96",
    awayFlag: "96",
    location: "Arrowhead Stadium · Kansas City"
  },
  {
    date: "Tuesday, July 14, 2026",
    stage: "Knockout",
    group: "Match 101 · Semifinal",
    time: "2:00 PM local",
    home: "Winner Match 97",
    homeFlag: "97",
    away: "Winner Match 98",
    awayFlag: "98",
    location: "AT&T Stadium · Dallas"
  },
  {
    date: "Wednesday, July 15, 2026",
    stage: "Knockout",
    group: "Match 102 · Semifinal",
    time: "3:00 PM local",
    home: "Winner Match 99",
    homeFlag: "99",
    away: "Winner Match 100",
    awayFlag: "100",
    location: "Mercedes-Benz Stadium · Atlanta"
  },
  {
    date: "Saturday, July 18, 2026",
    stage: "Knockout",
    group: "Match 103 · Third-place match",
    time: "5:00 PM local",
    home: "Loser Match 101",
    homeFlag: "101",
    away: "Loser Match 102",
    awayFlag: "102",
    location: "Hard Rock Stadium · Miami"
  },
  {
    date: "Sunday, July 19, 2026",
    stage: "Knockout",
    group: "Match 104 · Final",
    time: "3:00 PM local",
    home: "Winner Match 101",
    homeFlag: "101",
    away: "Winner Match 102",
    awayFlag: "102",
    location: "MetLife Stadium · New York/New Jersey"
  }
];

// The schedule reuses the same three-letter codes as the standings table.
// Knockout placeholders such as A1 or 3rd keep their existing short labels.
matches = matches.map(function (match) {
  return {
    ...match,
    homeFlag: getTeamCountryCode(match.home, match.homeFlag),
    awayFlag: getTeamCountryCode(match.away, match.awayFlag)
  };
});

if (Array.isArray(publishedLiveData.matches) && publishedLiveData.matches.length) {
  matches = publishedLiveData.matches.map(function (match) {
    return {
      ...match,
      homeFlag: getTeamCountryCode(match.home, match.homeFlag || match.home.slice(0, 3).toUpperCase()),
      awayFlag: getTeamCountryCode(match.away, match.awayFlag || match.away.slice(0, 3).toUpperCase())
    };
  });
}

const scheduleList = document.querySelector("#schedule-list");
const emptyMessage = document.querySelector("#empty-message");
const teamSearch = document.querySelector("#team-search");
const apiKeyInputs = document.querySelectorAll(".api-key-input");
const apiSaveButtons = document.querySelectorAll(".api-save-button");
const apiMessages = document.querySelectorAll(".api-message");
const apiPopupButtons = document.querySelectorAll(".api-popup-button");
const apiDialogs = document.querySelectorAll(".api-dialog");
const apiDialogCloseButtons = document.querySelectorAll(".api-dialog-close");
let currentFilter = "all";

const API_BASE_URL = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

function normalizeTeamName(name) {
  const aliases = {
    "south korea": "korea republic",
    "usa": "united states",
    "ivory coast": "côte d'ivoire",
    "iran": "ir iran",
    "cape verde": "cabo verde",
    "turkey": "türkiye",
    "congo dr": "dr congo"
  };
  const normalized = name.toLowerCase().trim();
  return aliases[normalized] || normalized;
}

function findBundledTeam(name) {
  const targetName = normalizeTeamName(name);
  return Object.values(standingsData).flat().find(function (entry) {
    return normalizeTeamName(entry.name) === targetName;
  });
}

function showApiMessage(message) {
  apiMessages.forEach(function (element) {
    element.textContent = message;
  });
}

async function apiRequest(path) {
  const apiKey = localStorage.getItem("goalTrackApiKey");
  if (!apiKey) {
    throw new Error("Add and save an API-Football key first.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey }
  });

  if (!response.ok) {
    throw new Error(`Live API returned ${response.status}.`);
  }

  const data = await response.json();
  const apiErrors = data.errors && Object.values(data.errors).filter(Boolean);
  if (apiErrors && apiErrors.length) {
    throw new Error(String(apiErrors[0]));
  }

  return data.response || [];
}

function applyLiveStandings(apiResponse) {
  const groups = apiResponse[0]?.league?.standings;
  if (!groups || !groups.length) {
    throw new Error("The API did not return World Cup standings.");
  }

  const updatedStandings = {};
  groups.forEach(function (groupTable) {
    const groupName = groupTable[0]?.group || "";
    const groupLetter = groupName.match(/Group ([A-L])/i)?.[1]?.toUpperCase();
    if (!groupLetter) {
      return;
    }

    const groupIsComplete = groupTable.every(function (row) {
      return row.all.played >= 3;
    });

    updatedStandings[groupLetter] = groupTable.map(function (row) {
      const bundledTeam = findBundledTeam(row.team.name);
      return {
        name: bundledTeam?.name || row.team.name,
        flag: bundledTeam?.flag || row.team.name.slice(0, 3).toUpperCase(),
        fifaRank: bundledTeam?.fifaRank || "—",
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        gd: row.goalsDiff,
        points: row.points,
        stageProgress: bundledTeam?.stageProgress || 0,
        // Fourth place is certainly eliminated after all group matches.
        // Third place remains visible until the cross-group ranking is settled.
        eliminated: bundledTeam?.eliminated || (groupIsComplete && row.rank === 4)
      };
    });
  });

  if (!Object.keys(updatedStandings).length) {
    throw new Error("No group tables were found in the API response.");
  }

  standingsData = { ...standingsData, ...updatedStandings };
  localStorage.setItem("goalTrackStandings", JSON.stringify(standingsData));
  showGroup(document.querySelector(".group-tab.active")?.dataset.group || "A");
  renderTeamOrbit();
}

function updateKnockoutProgress(apiFixtures) {
  const finishedStatuses = ["FT", "AET", "PEN"];
  const stageLevels = [
    { pattern: /round of 32/i, level: 1 },
    { pattern: /round of 16/i, level: 2 },
    { pattern: /quarter/i, level: 3 },
    { pattern: /semi/i, level: 4 },
    { pattern: /final/i, level: 5 }
  ];

  apiFixtures.forEach(function (item) {
    const round = item.league.round || "";
    if (/group/i.test(round) || !finishedStatuses.includes(item.fixture.status.short)) {
      return;
    }

    const stage = stageLevels.find(function (entry) {
      return entry.pattern.test(round);
    });
    if (!stage) {
      return;
    }

    const homeWon = item.teams.home.winner === true;
    const awayWon = item.teams.away.winner === true;
    if (!homeWon && !awayWon) {
      return;
    }

    const winnerName = homeWon ? item.teams.home.name : item.teams.away.name;
    const loserName = homeWon ? item.teams.away.name : item.teams.home.name;
    const winner = findBundledTeam(winnerName);
    const loser = findBundledTeam(loserName);

    if (winner) {
      winner.stageProgress = Math.max(winner.stageProgress || 0, stage.level + 1);
      winner.eliminated = false;
    }
    if (loser) {
      loser.stageProgress = Math.max(loser.stageProgress || 0, stage.level);
      loser.eliminated = true;
    }
  });
}

function applyLiveFixtures(apiFixtures) {
  if (!apiFixtures.length) {
    throw new Error("The API did not return World Cup fixtures.");
  }

  updateKnockoutProgress(apiFixtures);

  matches = apiFixtures.map(function (item) {
    const kickoff = new Date(item.fixture.date);
    const homeTeam = findBundledTeam(item.teams.home.name);
    const awayTeam = findBundledTeam(item.teams.away.name);
    const round = item.league.round || "World Cup";
    const isGroupStage = /group/i.test(round);
    const status = item.fixture.status.short;

    return {
      date: kickoff.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
      }),
      stage: isGroupStage ? "Group Stage" : "Knockout",
      group: round,
      time: kickoff.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      kickoffISO: item.fixture.date,
      home: homeTeam?.name || item.teams.home.name,
      homeFlag: homeTeam?.flag || item.teams.home.name.slice(0, 3).toUpperCase(),
      away: awayTeam?.name || item.teams.away.name,
      awayFlag: awayTeam?.flag || item.teams.away.name.slice(0, 3).toUpperCase(),
      location: [item.fixture.venue?.name, item.fixture.venue?.city].filter(Boolean).join(" · ") || "Venue TBD",
      venueTimeZone: getVenueTimeZone(item.fixture.venue?.city || ""),
      fixtureId: item.fixture.id,
      status,
      elapsed: item.fixture.status.elapsed,
      homeScore: item.goals.home,
      awayScore: item.goals.away
    };
  }).sort(function (a, b) {
    return new Date(a.kickoffISO) - new Date(b.kickoffISO);
  });

  localStorage.setItem("goalTrackStandings", JSON.stringify(standingsData));
  renderTeamOrbit();
  renderSchedule();
}

function readDetailedStatsCache() {
  let cached = {};
  try {
    cached = JSON.parse(localStorage.getItem("goalTrackDetailedStats") || "{}");
  } catch (error) {
    cached = {};
  }

  const publishedStats = publishedLiveData.detailedStats || {};
  return { ...cached, ...publishedStats };
}

function saveFixtureEvents(fixtureEventResults) {
  const cached = readDetailedStatsCache();
  const fixtureEvents = { ...(cached.fixtureEvents || {}) };

  fixtureEventResults.forEach(function (result) {
    fixtureEvents[result.fixtureId] = result.events;
  });

  const allEvents = Object.entries(fixtureEvents).flatMap(function ([fixtureId, events]) {
    return events.map(function (event) {
      return { ...event, fixtureId };
    });
  });
  const scorerTotals = {};

  allEvents.forEach(function (event) {
    const type = String(event.type || "").toLowerCase();
    const detail = String(event.detail || "").toLowerCase();
    const playerName = event.player?.name;
    if (type !== "goal" || detail.includes("missed") || detail.includes("own goal") || !playerName) {
      return;
    }

    const playerId = event.player?.id || `${playerName}-${event.team?.name || ""}`;
    if (!scorerTotals[playerId]) {
      scorerTotals[playerId] = {
        name: playerName,
        value: 0,
        detail: event.team?.name || "Team unavailable"
      };
    }
    scorerTotals[playerId].value += 1;
  });

  const isCard = function (event, cardName) {
    return String(event.type || "").toLowerCase() === "card" &&
      String(event.detail || "").toLowerCase().includes(cardName);
  };
  const withMatchLabel = function (event) {
    const match = matches.find(function (entry) {
      return String(entry.fixtureId) === String(event.fixtureId);
    });
    return {
      fixtureId: event.fixtureId,
      match: match ? `${match.home} vs ${match.away}` : "",
      team: event.team?.name || "",
      player: event.player?.name || ""
    };
  };

  const updated = {
    ...cached,
    fixtureEvents,
    scorers: Object.values(scorerTotals).sort(function (a, b) {
      return b.value - a.value || a.name.localeCompare(b.name);
    }),
    redCardEvents: allEvents
      .filter(function (event) {
        return isCard(event, "red card") || isCard(event, "second yellow");
      })
      .map(withMatchLabel),
    yellowCardEvents: allEvents
      .filter(function (event) {
        return isCard(event, "yellow card");
      })
      .map(withMatchLabel),
    penaltyEvents: allEvents
      .filter(function (event) {
        return String(event.type || "").toLowerCase() === "goal" &&
          String(event.detail || "").toLowerCase().includes("penalty") &&
          !String(event.detail || "").toLowerCase().includes("missed");
      })
      .map(withMatchLabel)
  };

  localStorage.setItem("goalTrackDetailedStats", JSON.stringify(updated));
}

function saveTopScorers(apiScorers) {
  if (!apiScorers.length) {
    return;
  }

  const cached = readDetailedStatsCache();
  const scorers = apiScorers.map(function (entry) {
    const statistics = entry.statistics?.[0] || {};
    return {
      name: entry.player?.name || "Unknown player",
      value: Number(statistics.goals?.total) || 0,
      detail: statistics.team?.name || "Team unavailable"
    };
  }).filter(function (entry) {
    return entry.value > 0;
  });

  if (scorers.length) {
    localStorage.setItem("goalTrackDetailedStats", JSON.stringify({ ...cached, scorers }));
  }
}

function saveFixturePlayerStats(fixturePlayerResults) {
  const cached = readDetailedStatsCache();
  const fixturePlayers = { ...(cached.fixturePlayers || {}) };
  fixturePlayerResults.forEach(function (result) {
    fixturePlayers[result.fixtureId] = result.players;
  });

  const keeperTotals = {};
  Object.entries(fixturePlayers).forEach(function ([fixtureId, teams]) {
    teams.forEach(function (teamEntry) {
      teamEntry.players?.forEach(function (playerEntry) {
        const statistics = playerEntry.statistics?.[0] || {};
        const position = String(statistics.games?.position || "");
        const minutes = Number(statistics.games?.minutes) || 0;
        if (!/^g(oalkeeper)?$/i.test(position) || minutes <= 0) {
          return;
        }

        const playerId = playerEntry.player?.id || `${playerEntry.player?.name}-${teamEntry.team?.name}`;
        if (!keeperTotals[playerId]) {
          keeperTotals[playerId] = {
            name: playerEntry.player?.name || "Unknown goalkeeper",
            team: teamEntry.team?.name || "Team unavailable",
            saves: 0,
            cleanSheets: 0,
            appearances: 0
          };
        }

        const keeper = keeperTotals[playerId];
        const conceded = Number(statistics.goals?.conceded) || 0;
        keeper.saves += Number(statistics.goals?.saves) || 0;
        keeper.cleanSheets += conceded === 0 ? 1 : 0;
        keeper.appearances += 1;
      });
    });
  });

  const keepers = Object.values(keeperTotals)
    .sort(function (a, b) {
      return b.cleanSheets - a.cleanSheets || b.saves - a.saves || a.name.localeCompare(b.name);
    })
    .map(function (keeper) {
      return {
        name: keeper.name,
        value: keeper.cleanSheets,
        detail: `${keeper.team} · ${keeper.saves} saves`
      };
    });

  if (keepers.length) {
    localStorage.setItem("goalTrackDetailedStats", JSON.stringify({
      ...cached,
      fixturePlayers,
      keepers
    }));
  }
}

async function updateLiveFixtureDetails(apiFixtures) {
  const finishedStatuses = ["FT", "AET", "PEN"];
  const completedFixtures = apiFixtures.filter(function (item) {
    return finishedStatuses.includes(item.fixture.status.short);
  });
  if (!completedFixtures.length) {
    return 0;
  }

  showApiMessage(`Loading player goal events for ${completedFixtures.length} completed matches...`);
  const [eventResults, playerResults] = await Promise.all([
    Promise.allSettled(completedFixtures.map(async function (item) {
      const events = await apiRequest(`/fixtures/events?fixture=${item.fixture.id}`);
      return { fixtureId: item.fixture.id, events };
    })),
    Promise.allSettled(completedFixtures.map(async function (item) {
      const players = await apiRequest(`/fixtures/players?fixture=${item.fixture.id}`);
      return { fixtureId: item.fixture.id, players };
    }))
  ]);
  const successfulResults = eventResults
    .filter(function (result) { return result.status === "fulfilled"; })
    .map(function (result) { return result.value; });
  const successfulPlayerResults = playerResults
    .filter(function (result) { return result.status === "fulfilled"; })
    .map(function (result) { return result.value; });

  if (successfulResults.length) {
    saveFixtureEvents(successfulResults);
  }
  if (successfulPlayerResults.length) {
    saveFixturePlayerStats(successfulPlayerResults);
  }
  return Math.max(successfulResults.length, successfulPlayerResults.length);
}

async function refreshLiveData() {
  const apiKey = localStorage.getItem("goalTrackApiKey");
  if (!apiKey) {
    apiDialogs[0]?.showModal();
    showApiMessage("Paste a key, save it, then press update again.");
    throw new Error("Live API key required.");
  }

  showApiMessage("Contacting the live World Cup API...");
  const query = `league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`;
  const results = await Promise.allSettled([
    apiRequest(`/fixtures?${query}`),
    apiRequest(`/standings?${query}`),
    apiRequest(`/players/topscorers?${query}`)
  ]);

  let updatedSections = 0;
  let updatedEventFixtures = 0;
  if (results[0].status === "fulfilled") {
    applyLiveFixtures(results[0].value);
    updatedSections += 1;
    updatedEventFixtures = await updateLiveFixtureDetails(results[0].value);
  }
  if (results[1].status === "fulfilled") {
    applyLiveStandings(results[1].value);
    updatedSections += 1;
  }
  if (results[2].status === "fulfilled") {
    saveTopScorers(results[2].value);
  }

  if (!updatedSections) {
    const reason = results[0].reason?.message || results[1].reason?.message || "Live update failed.";
    showApiMessage(`${reason} Bundled data is still displayed.`);
    throw new Error(reason);
  }

  const updateTime = saveUpdateTime();
  showUpdateTime(updateTime);
  showApiMessage(updatedSections === 2
    ? updatedEventFixtures
      ? `Live schedule, standings, and player data updated for ${updatedEventFixtures} completed matches.`
      : "Schedule and standings updated, but the API did not return player events."
    : "Part of the live data updated; bundled fallback is shown for the rest.");
}

apiKeyInputs.forEach(function (input) {
  input.value = localStorage.getItem("goalTrackApiKey") || "";
});

apiPopupButtons.forEach(function (button, index) {
  button.addEventListener("click", function () {
    const dialog = apiDialogs[index] || apiDialogs[0];
    dialog?.showModal();
    dialog?.querySelector(".api-key-input")?.focus();
  });
});

apiDialogCloseButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    button.closest(".api-dialog")?.close();
  });
});

apiDialogs.forEach(function (dialog) {
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

apiSaveButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const input = button.closest(".api-setup-content").querySelector(".api-key-input");
    const key = input.value.trim();
    if (!key) {
      localStorage.removeItem("goalTrackApiKey");
      showApiMessage("API key removed. Bundled data will be used.");
      return;
    }
    localStorage.setItem("goalTrackApiKey", key);
    showApiMessage("API key saved in this browser only.");
  });
});

const venueTimeZones = {
  "Mexico City": "America/Mexico_City",
  "Guadalajara": "America/Mexico_City",
  "Monterrey": "America/Monterrey",
  "Toronto": "America/Toronto",
  "Inglewood": "America/Los_Angeles",
  "Los Angeles": "America/Los_Angeles",
  "Santa Clara": "America/Los_Angeles",
  "San Francisco Bay Area": "America/Los_Angeles",
  "Foxborough": "America/New_York",
  "Boston": "America/New_York",
  "East Rutherford": "America/New_York",
  "New York": "America/New_York",
  "New York/New Jersey": "America/New_York",
  "Vancouver": "America/Vancouver",
  "Houston": "America/Chicago",
  "Arlington": "America/Chicago",
  "Dallas": "America/Chicago",
  "Seattle": "America/Los_Angeles",
  "Atlanta": "America/New_York",
  "Kansas City": "America/Chicago",
  "Philadelphia": "America/New_York",
  "Miami Gardens": "America/New_York",
  "Miami": "America/New_York"
};

function getVenueTimeZone(location) {
  const city = Object.keys(venueTimeZones).find(function (name) {
    return location.includes(name);
  });
  return city ? venueTimeZones[city] : "America/New_York";
}

// Convert a stadium-local date and time into one exact moment. JavaScript does
// not include a direct "date in named time zone" constructor, so this helper
// calculates the venue's UTC offset using Intl.DateTimeFormat.
function venueLocalToDate(dateLabel, timeLabel, timeZone) {
  const monthNumbers = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
  };
  const dateMatch = dateLabel.match(/^[A-Za-z]+, ([A-Za-z]+) (\d+), (\d{4})$/);
  const timeMatch = timeLabel.match(/(\d+):(\d{2}) (AM|PM)/);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  let hour = Number(timeMatch[1]) % 12;
  if (timeMatch[3] === "PM") {
    hour += 12;
  }

  const values = {
    year: Number(dateMatch[3]),
    month: monthNumbers[dateMatch[1]],
    day: Number(dateMatch[2]),
    hour,
    minute: Number(timeMatch[2])
  };
  const utcGuess = Date.UTC(values.year, values.month, values.day, values.hour, values.minute);

  function getOffset(timestamp) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(timestamp));
    const part = function (type) {
      return Number(parts.find(function (item) { return item.type === type; }).value);
    };
    const representedAsUtc = Date.UTC(
      part("year"), part("month") - 1, part("day"), part("hour"), part("minute")
    );
    return representedAsUtc - timestamp;
  }

  let timestamp = utcGuess - getOffset(utcGuess);
  timestamp = utcGuess - getOffset(timestamp);
  return new Date(timestamp);
}

function getMatchDateTime(match) {
  const venueTimeZone = match.venueTimeZone || getVenueTimeZone(match.location);
  const kickoff = match.kickoffISO
    ? new Date(match.kickoffISO)
    : venueLocalToDate(match.date, match.time, venueTimeZone);

  if (!kickoff || Number.isNaN(kickoff.getTime())) {
    return { date: match.date, time: match.time };
  }

  const visitorDate = kickoff.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const visitorTime = kickoff.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
  const venueTime = kickoff.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: venueTimeZone,
    timeZoneName: "short"
  });

  return {
    date: visitorDate,
    time: `${visitorTime} (${venueTime} venue local)`
  };
}

// Save the update time in localStorage so it is remembered on both pages.
function saveUpdateTime() {
  const updateTime = new Date().toISOString();
  localStorage.setItem("goalTrackLastUpdate", updateTime);
  return updateTime;
}

function showUpdateTime(isoTime) {
  if (!isoTime) {
    return;
  }

  const readableTime = new Date(isoTime).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });

}

function renderSchedule() {
  if (!scheduleList) {
    return;
  }

  const searchText = teamSearch.value.trim().toLowerCase();

  // filter() keeps only matches that meet both the stage and search rules.
  const visibleMatches = matches.filter(function (match) {
    const matchesStage = currentFilter === "all" || match.stage === currentFilter;
    const teams = `${match.home} ${match.away}`.toLowerCase();
    const matchesSearch = teams.includes(searchText);
    return matchesStage && matchesSearch;
  });

  // Group matches by the visitor's local date. A late match may appear under a
  // different calendar day than the stadium date in another part of the world.
  const matchesByDate = {};
  visibleMatches.forEach(function (match) {
    const displayDateTime = getMatchDateTime(match);
    if (!matchesByDate[displayDateTime.date]) {
      matchesByDate[displayDateTime.date] = [];
    }
    matchesByDate[displayDateTime.date].push({ ...match, displayTime: displayDateTime.time });
  });

  scheduleList.innerHTML = Object.entries(matchesByDate).map(function ([date, dayMatches]) {
    const matchCards = dayMatches.map(function (match) {
      const hasScore = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
      const finished = ["FT", "AET", "PEN"].includes(match.status);
      const live = ["1H", "HT", "2H", "ET", "BT", "P"].includes(match.status);
      const scoreOrVersus = hasScore
        ? `<div class="versus score">${match.homeScore}<span>–</span>${match.awayScore}</div>`
        : `<div class="versus">VS</div>`;
      const statusLabel = finished
        ? `Full time · ${match.displayTime}`
        : live
          ? `${match.elapsed || ""}' LIVE · ${match.displayTime}`
          : match.displayTime;

      return `
        <article class="match-card">
          <div class="match-meta">
            <span>${match.group}</span>
            <span class="${live ? "live-badge" : ""}">${statusLabel}</span>
          </div>
          <div class="teams">
            <div class="team"><span class="${/^[A-Z0-9]{2,3}$/.test(match.homeFlag) ? "team-code" : ""}">${match.homeFlag}</span>${match.home}</div>
            ${scoreOrVersus}
            <div class="team">${match.away}<span class="${/^[A-Z0-9]{2,3}$/.test(match.awayFlag) ? "team-code" : ""}">${match.awayFlag}</span></div>
          </div>
          <p class="match-location">⌖ ${match.location}</p>
        </article>
      `;
    }).join("");

    return `
      <section class="date-group">
        <div class="date-heading"><h2>${date}</h2></div>
        <div class="match-grid">${matchCards}</div>
      </section>
    `;
  }).join("");

  emptyMessage.hidden = visibleMatches.length > 0;
}

if (scheduleList) {
  document.querySelectorAll(".filter-button").forEach(function (button) {
    button.addEventListener("click", function () {
      currentFilter = button.dataset.filter;

      document.querySelectorAll(".filter-button").forEach(function (otherButton) {
        otherButton.classList.toggle("active", otherButton === button);
      });

      renderSchedule();
    });
  });

  teamSearch.addEventListener("input", renderSchedule);
  renderSchedule();

}

// ---------- 5. Stats dashboard ----------
const statsChartGrid = document.querySelector("#stats-chart-grid");
const scorerLeaderboard = document.querySelector("#scorer-leaderboard");
const teamGoalsLeaderboard = document.querySelector("#team-goals-leaderboard");
const keeperLeaderboard = document.querySelector("#keeper-leaderboard");

function getTeamGoalsFromResults() {
  const totals = {};
  getAllTeams().forEach(function (entry) {
    totals[entry.name] = 0;
  });

  matches.forEach(function (match) {
    if (Number.isInteger(match.homeScore)) {
      totals[match.home] = (totals[match.home] || 0) + match.homeScore;
    }
    if (Number.isInteger(match.awayScore)) {
      totals[match.away] = (totals[match.away] || 0) + match.awayScore;
    }
  });
  return totals;
}

// Leaderboards rank higher totals first. When totals are tied, names are
// ordered alphabetically so player and team lists behave consistently.
function compareGoalLeaders(a, b) {
  return b.value - a.value ||
    a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

function getDetailedStats() {
  const emptyTeamValues = {};
  getAllTeams().forEach(function (entry) {
    emptyTeamValues[entry.name] = 0;
  });

  const cached = readDetailedStatsCache();

  const verifiedScorers = [
    { name: "Julián Quiñones", value: 1, detail: "Mexico" },
    { name: "Raúl Jiménez", value: 1, detail: "Mexico" },
    { name: "Ladislav Krejčí", value: 1, detail: "Czechia" },
    { name: "Hwang In-beom", value: 1, detail: "Korea Republic" },
    { name: "Oh Hyeon-gyu", value: 1, detail: "Korea Republic" }
  ];
  const verifiedKeepers = [
    { name: "Raúl Rangel", value: 1, detail: "Mexico · 0 goals conceded" },
    { name: "Kim Seung-gyu", value: 0, detail: "Korea Republic · 1 goal conceded" },
    { name: "Ronwen Williams", value: 0, detail: "South Africa · 2 goals conceded" },
    { name: "Matěj Kovář", value: 0, detail: "Czechia · 2 goals conceded" }
  ];
  const fallbackMatchStats = [
    {
      match: "Mexico vs South Africa",
      redCards: 3,
      yellowCards: 3,
      penalties: 0
    }
  ];

  // Merge verified scorers with cached API data. This also upgrades browsers
  // that saved the leaderboard before the second completed match.
  const scorerMap = new Map();
  [...verifiedScorers, ...(cached.scorers || [])].forEach(function (scorer) {
    const existing = scorerMap.get(scorer.name);
    if (!existing || scorer.value > existing.value) {
      scorerMap.set(scorer.name, scorer);
    }
  });
  const scorers = [...scorerMap.values()].sort(compareGoalLeaders);

  const keeperMap = new Map();
  [...verifiedKeepers, ...(cached.keepers || [])].forEach(function (keeper) {
    const existing = keeperMap.get(keeper.name);
    if (!existing || keeper.value > existing.value) {
      keeperMap.set(keeper.name, keeper);
    }
  });
  const keepers = [...keeperMap.values()].sort(function (a, b) {
    return b.value - a.value || a.name.localeCompare(b.name);
  });

  return {
    goals: getTeamGoalsFromResults(),
    redCards: { ...emptyTeamValues, ...(cached.redCards || {}) },
    yellowCards: { ...emptyTeamValues, ...(cached.yellowCards || {}) },
    penalties: { ...emptyTeamValues, ...(cached.penalties || {}) },
    freeKicks: { ...emptyTeamValues, ...(cached.freeKicks || {}) },
    goalEvents: cached.goalEvents || [],
    redCardEvents: cached.redCardEvents || [],
    yellowCardEvents: cached.yellowCardEvents || [],
    penaltyEvents: cached.penaltyEvents || [],
    freeKickEvents: cached.freeKickEvents || [],
    matchStats: cached.matchStats?.length ? cached.matchStats : fallbackMatchStats,
    scorers,
    keepers
  };
}

function getFallbackGoalEvents() {
  const events = [];
  matches.forEach(function (match) {
    if (!["FT", "AET", "PEN"].includes(match.status)) {
      return;
    }
    for (let index = 0; index < (match.homeScore || 0); index += 1) {
      events.push({
        team: match.home,
        opponent: match.away,
        match: `${match.home} vs ${match.away}`,
        x: null,
        y: null
      });
    }
    for (let index = 0; index < (match.awayScore || 0); index += 1) {
      events.push({
        team: match.away,
        opponent: match.home,
        match: `${match.home} vs ${match.away}`,
        x: null,
        y: null
      });
    }
  });
  return events;
}

function renderGoalCoordinateMap(goalEvents) {
  const locatedGoals = goalEvents.filter(function (goal) {
    return Number.isFinite(Number(goal.x)) && Number.isFinite(Number(goal.y));
  });
  const unlocatedGoals = goalEvents.filter(function (goal) {
    return !Number.isFinite(Number(goal.x)) || !Number.isFinite(Number(goal.y));
  });

  return `
    <article class="stat-chart-card goal-map-card">
      <div class="stat-chart-heading">
        <div><span>01</span><h3>All Tournament Goals</h3></div>
        <b>${goalEvents.length} recorded · ${locatedGoals.length} located</b>
      </div>
      <div class="goal-pitch" role="img" aria-label="Football pitch coordinate grid of tournament goals">
        <div class="pitch-halfway"></div>
        <div class="pitch-center-circle"></div>
        <div class="pitch-center-dot"></div>
        <div class="pitch-box pitch-box-left"></div>
        <div class="pitch-box pitch-box-right"></div>
        <div class="pitch-goal pitch-goal-left"></div>
        <div class="pitch-goal pitch-goal-right"></div>
        <div class="pitch-grid-label x-label">X coordinate →</div>
        <div class="pitch-grid-label y-label">Y coordinate →</div>
        ${locatedGoals.map(function (goal, index) {
          const team = findBundledTeam(goal.team);
          return `
            <button
              class="goal-marker"
              type="button"
              style="left:${Math.max(0, Math.min(Number(goal.x), 100))}%;top:${100 - Math.max(0, Math.min(Number(goal.y), 100))}%;--marker-color:${team ? getNationalColor(team.name) : "#ed334e"}"
              aria-label="${goal.player || "Goal"} for ${goal.team} at coordinate ${goal.x}, ${goal.y}"
              data-goal="${goal.player || `Goal ${index + 1}`} · ${goal.team} · (${goal.x}, ${goal.y})">
            </button>
          `;
        }).join("")}
        ${locatedGoals.length ? "" : `
          <div class="pitch-empty">
            <strong>No goal-location coordinates yet</strong>
            <span>The live feed currently supplies scores, but not shot x/y positions.</span>
          </div>
        `}
      </div>
      <div class="unlocated-goals">
        <strong>Goals without coordinates (${unlocatedGoals.length})</strong>
        <div>
          ${unlocatedGoals.map(function (goal, index) {
            return `<span>${index + 1}. ${goal.team} · ${goal.match}</span>`;
          }).join("") || "<span>Every recorded goal has a location.</span>"}
        </div>
      </div>
    </article>
  `;
}

function getNationalColor(teamName) {
  const colors = {
    "Mexico": "#006847", "South Africa": "#007749", "Korea Republic": "#cd2e3a",
    "Czechia": "#11457e", "Canada": "#d80621", "Bosnia and Herzegovina": "#002395",
    "Qatar": "#8a1538", "Switzerland": "#d52b1e", "Brazil": "#ffdf00",
    "Morocco": "#c1272d", "Haiti": "#00209f", "Scotland": "#005eb8",
    "United States": "#3c3b6e", "Paraguay": "#d52b1e", "Australia": "#ffcd00",
    "Türkiye": "#e30a17", "Germany": "#f2c500", "Curaçao": "#002b7f",
    "Côte d'Ivoire": "#f77f00", "Ecuador": "#ffdd00", "Netherlands": "#f36c21",
    "Japan": "#bc002d", "Sweden": "#006aa7", "Tunisia": "#e70013",
    "Belgium": "#ef3340", "Egypt": "#ce1126", "IR Iran": "#239f40",
    "New Zealand": "#151515", "Spain": "#aa151b", "Cabo Verde": "#003893",
    "Saudi Arabia": "#006c35", "Uruguay": "#5bc0eb", "France": "#002654",
    "Senegal": "#00853f", "Iraq": "#ce1126", "Norway": "#ba0c2f",
    "Argentina": "#75aadb", "Algeria": "#006233", "Austria": "#ed2939",
    "Jordan": "#ce1126", "Portugal": "#046a38", "DR Congo": "#007fff",
    "Uzbekistan": "#0099b5", "Colombia": "#fcd116", "England": "#c8102e",
    "Croatia": "#ff0000", "Ghana": "#fcd116", "Panama": "#da121a"
  };
  return colors[teamName] || "#ed334e";
}

function topEntries(values, limit = 5) {
  return Object.entries(values)
    .sort(function (a, b) {
      return compareGoalLeaders(
        { name: a[0], value: a[1] },
        { name: b[0], value: b[1] }
      );
    })
    .slice(0, limit);
}

function renderCoordinateChart(config) {
  const entries = topEntries(config.values);
  const highestValue = Math.max(...entries.map(function (entry) { return entry[1]; }), 1);
  const hasData = entries.some(function (entry) { return entry[1] > 0; });

  return `
    <article class="stat-chart-card">
      <div class="stat-chart-heading">
        <div><span>${config.number}</span><h3>${config.title}</h3></div>
        <b>${hasData ? "Top 5 teams" : "Awaiting data"}</b>
      </div>
      <div class="coordinate-chart" role="img" aria-label="${config.title} comparison chart">
        <div class="chart-axis-label">Teams</div>
        ${entries.map(function ([teamName, value], index) {
          const team = findBundledTeam(teamName);
          const width = value === 0 ? 2 : Math.max((value / highestValue) * 100, 8);
          return `
            <div class="chart-row">
              <div class="chart-team"><span>${team?.flag || teamName.slice(0, 2).toUpperCase()}</span>${teamName}</div>
              <div class="chart-track">
                <div class="chart-bar color-${(index % 3) + 1}" style="width:${width}%"></div>
                <strong>${value}</strong>
              </div>
            </div>
          `;
        }).join("")}
        <div class="chart-scale">
          <span>0</span><span>${Math.ceil(highestValue / 2)}</span><span>${highestValue}</span>
        </div>
        <div class="chart-value-label">${config.unit}</div>
      </div>
    </article>
  `;
}

// Build one chronological point for every completed match. Each point stores
// the running total, so this displays a trend rather than comparing teams.
function getGoalTrendData() {
  const completedMatches = getCompletedMatches();

  let cumulativeGoals = 0;
  return completedMatches.map(function (match, index) {
    const matchGoals = match.homeScore + match.awayScore;
    cumulativeGoals += matchGoals;
    return {
      number: index + 1,
      matchValue: matchGoals,
      cumulativeValue: cumulativeGoals,
      date: match.date.replace(/^[A-Za-z]+, /, ""),
      label: `${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`
    };
  });
}

function getTimePlayedTrendData() {
  let cumulativeMinutes = 0;

  return getCompletedMatches().map(function (match, index) {
    const matchMinutes = Number(match.elapsed) ||
      (["AET", "PEN"].includes(match.status) ? 120 : 90);
    cumulativeMinutes += matchMinutes;

    return {
      number: index + 1,
      matchValue: matchMinutes,
      cumulativeValue: cumulativeMinutes,
      date: match.date.replace(/^[A-Za-z]+, /, ""),
      label: `${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`
    };
  });
}

function getCompletedMatches() {
  return matches
    .filter(function (match) {
      return ["FT", "AET", "PEN"].includes(match.status) &&
        Number.isInteger(match.homeScore) &&
        Number.isInteger(match.awayScore);
    })
    .sort(function (a, b) {
      const aDate = a.kickoffISO
        ? new Date(a.kickoffISO)
        : venueLocalToDate(a.date, a.time, a.venueTimeZone || getVenueTimeZone(a.location));
      const bDate = b.kickoffISO
        ? new Date(b.kickoffISO)
        : venueLocalToDate(b.date, b.time, b.venueTimeZone || getVenueTimeZone(b.location));
      return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
    });
}

function normalizeFixtureLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function eventBelongsToMatch(event, match) {
  if (event.fixtureId && match.fixtureId) {
    return String(event.fixtureId) === String(match.fixtureId);
  }

  const eventLabel = normalizeFixtureLabel(
    event.match ||
    event.fixture ||
    event.label ||
    `${event.home || event.homeTeam || ""} ${event.away || event.awayTeam || ""}`
  );
  const home = normalizeFixtureLabel(match.home);
  const away = normalizeFixtureLabel(match.away);
  return eventLabel.includes(home) && eventLabel.includes(away);
}

// Detailed feeds can store either individual event arrays or one matchStats
// record per fixture. Supporting both keeps this beginner project flexible.
function getDetailedTrendData(stats, config) {
  let cumulativeValue = 0;
  let hasTimelineData = false;

  const trend = getCompletedMatches().map(function (match, index) {
    const matchRecord = stats.matchStats.find(function (record) {
      return eventBelongsToMatch(record, match);
    });
    let matchValue = 0;

    if (matchRecord && Number.isFinite(Number(matchRecord[config.matchKey]))) {
      matchValue = Number(matchRecord[config.matchKey]);
      hasTimelineData = true;
    } else {
      const matchingEvents = stats[config.eventsKey].filter(function (event) {
        return eventBelongsToMatch(event, match);
      });
      if (matchingEvents.length) {
        matchValue = matchingEvents.reduce(function (total, event) {
          return total + (Number(event.count) || 1);
        }, 0);
        hasTimelineData = true;
      }
    }

    cumulativeValue += matchValue;
    return {
      number: index + 1,
      matchValue,
      cumulativeValue,
      date: match.date.replace(/^[A-Za-z]+, /, ""),
      label: `${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`
    };
  });

  return { trend, hasTimelineData };
}

function renderTrendChart(config, trendData, hasTimelineData = true) {
  const width = 900;
  const height = 330;
  const padding = { top: 24, right: 28, bottom: 52, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const total = trendData.length ? trendData[trendData.length - 1].cumulativeValue : 0;
  const maximum = Math.max(total, config.minimumScale || 5);
  const pointCount = Math.max(trendData.length, 1);

  // Start at zero so the first completed match creates a visible rise.
  const points = [{ number: 0, cumulativeValue: 0, label: "Tournament start", date: "" }]
    .concat(trendData)
    .map(function (point, index) {
      return {
        ...point,
        x: padding.left + (index / pointCount) * chartWidth,
        y: padding.top + chartHeight - (point.cumulativeValue / maximum) * chartHeight
      };
    });

  const linePoints = points.map(function (point) {
    return `${point.x},${point.y}`;
  }).join(" ");
  const fillPoints = `${padding.left},${padding.top + chartHeight} ${linePoints} ${padding.left + chartWidth},${padding.top + chartHeight}`;
  const tickValues = Array.from({ length: 6 }, function (_, index) {
    return Math.round((maximum / 5) * index);
  });
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return `
    <article class="stat-chart-card trend-chart-card ${config.className || ""}">
      <div class="stat-chart-heading">
        <div><span>${config.number}</span><h3>${config.title}</h3></div>
        <b>${hasTimelineData ? `${total} ${config.summaryLabel}` : (config.unavailableLabel || "Awaiting event timeline")}</b>
      </div>
      <div class="goal-trend-wrap">
        <svg class="goal-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${config.ariaLabel}">
          <title>${config.ariaLabel}</title>
          <desc>The line rises as ${config.descriptionLabel} are added after each completed match.</desc>
          ${tickValues.map(function (value) {
            const y = padding.top + chartHeight - (value / maximum) * chartHeight;
            return `
              <line class="trend-grid-line" x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}"></line>
              <text class="trend-y-label" x="${padding.left - 12}" y="${y + 4}">${value}</text>
            `;
          }).join("")}
          <line class="trend-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}"></line>
          <line class="trend-axis" x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}"></line>
          <polygon class="trend-area" points="${fillPoints}"></polygon>
          <polyline class="trend-line" points="${linePoints}"></polyline>
          ${points.map(function (point, index) {
            const detail = index === 0
              ? point.label
              : `${point.date}: ${point.label}; ${point.matchValue} in match; ${point.cumulativeValue} cumulative`;
            return `
              <g class="trend-point">
                <circle cx="${point.x}" cy="${point.y}" r="${index === 0 ? 5 : 7}">
                  <title>${detail}</title>
                </circle>
                ${labelIndexes.has(index) ? `<text class="trend-x-label" x="${point.x}" y="${height - 18}">${index === 0 ? "Start" : `Match ${point.number}`}</text>` : ""}
              </g>
            `;
          }).join("")}
          <text class="trend-axis-title trend-axis-title-y" x="16" y="${height / 2}">${config.axisLabel}</text>
          <text class="trend-axis-title" x="${padding.left + chartWidth / 2}" y="${height - 1}">Completed matches in chronological order</text>
        </svg>
        ${trendData.length && hasTimelineData ? "" : `<p class="trend-empty">${trendData.length ? config.waitingText : "The trend will begin when the first match reaches full time."}</p>`}
      </div>
    </article>
  `;
}

function renderLeaderboard(container, entries, valueLabel, emptyText, padToFive = false) {
  if (!container) {
    return;
  }

  if (!entries.length) {
    container.innerHTML = Array.from({ length: 5 }, function (_, index) {
      return `
        <div class="leaderboard-row leaderboard-placeholder">
          <span class="leader-position">${index + 1}</span>
          <div><strong>Awaiting live data</strong><span>${index === 0 ? emptyText : "—"}</span></div>
          <b>—</b>
        </div>
      `;
    }).join("");
    return;
  }

  const visibleEntries = entries.slice(0, 5);
  const rows = visibleEntries.map(function (entry, index) {
    return `
      <div class="leaderboard-row">
        <span class="leader-position">${index + 1}</span>
        <div><strong>${entry.name}</strong><span>${entry.detail || ""}</span></div>
        <b>${entry.value} ${valueLabel}</b>
      </div>
    `;
  });

  if (padToFive) {
    while (rows.length < 5) {
      rows.push(`
        <div class="leaderboard-row leaderboard-placeholder">
          <span class="leader-position">${rows.length + 1}</span>
          <div><strong>Next goalkeeper</strong><span>Appears after another match is completed</span></div>
          <b>—</b>
        </div>
      `);
    }
  }

  container.innerHTML = rows.join("");
}

function renderStatsDashboard() {
  if (!statsChartGrid) {
    return;
  }

  const stats = getDetailedStats();
  const goalTrendData = getGoalTrendData();
  const timePlayedTrendData = getTimePlayedTrendData();
  const chartConfigs = [
    {
      number: "02", title: "Red Cards", eventsKey: "redCardEvents", matchKey: "redCards",
      summaryLabel: "red cards", axisLabel: "Cumulative red cards", descriptionLabel: "red cards",
      ariaLabel: "Cumulative red cards during the tournament", minimumScale: 5,
      className: "red-card-trend", waitingText: "Red-card totals are not available from the current data source."
    },
    {
      number: "03", title: "Yellow Cards", eventsKey: "yellowCardEvents", matchKey: "yellowCards",
      summaryLabel: "yellow cards", axisLabel: "Cumulative yellow cards", descriptionLabel: "yellow cards",
      ariaLabel: "Cumulative yellow cards during the tournament", minimumScale: 5,
      className: "yellow-card-trend", waitingText: "Yellow-card totals are not available from the current data source."
    },
    {
      number: "04", title: "Penalty Kicks", eventsKey: "penaltyEvents", matchKey: "penalties",
      summaryLabel: "penalty kicks", axisLabel: "Cumulative penalty kicks", descriptionLabel: "penalty kicks",
      ariaLabel: "Cumulative penalty kicks during the tournament", minimumScale: 5,
      className: "penalty-trend", waitingText: "Penalty-kick totals are not available from the current data source."
    }
  ];
  const goalsConfig = {
    number: "01", title: "All Tournament Goals", summaryLabel: "goals",
    axisLabel: "Cumulative goals", descriptionLabel: "goals",
    ariaLabel: "Cumulative goals scored during the tournament",
    minimumScale: 5, className: "goal-trend-card"
  };
  const timePlayedConfig = {
    number: "05", title: "Time Played", summaryLabel: "minutes",
    axisLabel: "Cumulative minutes", descriptionLabel: "minutes played",
    ariaLabel: "Cumulative minutes played during the tournament",
    minimumScale: 90, className: "time-played-trend"
  };
  statsChartGrid.innerHTML = renderTrendChart(goalsConfig, goalTrendData) +
    chartConfigs.map(function (config) {
      const detailedTrend = getDetailedTrendData(stats, config);
      return renderTrendChart(config, detailedTrend.trend, detailedTrend.hasTimelineData);
    }).join("") +
    renderTrendChart(timePlayedConfig, timePlayedTrendData);

  renderLeaderboard(
    scorerLeaderboard,
    stats.scorers,
    "goals",
    "Individual players and their goal totals will appear after the live statistics feed returns them."
  );

  const teamGoalRows = topEntries(stats.goals).map(function ([name, value]) {
    const team = getAllTeams().find(function (entry) {
      return normalizeTeamName(entry.name) === normalizeTeamName(name);
    });
    return { name, value, detail: `Group ${team?.group || "—"}` };
  });
  renderLeaderboard(teamGoalsLeaderboard, teamGoalRows, "goals", "No completed match scores yet.");

  renderLeaderboard(
    keeperLeaderboard,
    stats.keepers,
    "clean sheets",
    "Goalkeeper and clean-sheet data will appear after the live statistics feed returns it.",
    true
  );
}

renderStatsDashboard();

// ---------- 6. GoalTrack site-data assistant ----------
const chatToggle = document.querySelector("#chat-toggle");
const chatPanel = document.querySelector("#chat-panel");
const chatClose = document.querySelector("#chat-close");
const chatMessages = document.querySelector("#chat-messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");

function openChat() {
  chatPanel.classList.add("open");
  chatPanel.setAttribute("aria-hidden", "false");
  chatToggle.setAttribute("aria-expanded", "true");
  chatInput.focus();
}

function closeChat() {
  chatPanel.classList.remove("open");
  chatPanel.setAttribute("aria-hidden", "true");
  chatToggle.setAttribute("aria-expanded", "false");
  chatToggle.focus();
}

function addChatMessage(text, role) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAllTeams() {
  return Object.entries(standingsData).flatMap(function ([group, teams]) {
    return teams.map(function (entry) {
      return { ...entry, group };
    });
  });
}

function findTeamInQuestion(question) {
  const normalizedQuestion = normalizeTeamName(question);
  return getAllTeams()
    .sort(function (a, b) { return b.name.length - a.name.length; })
    .find(function (entry) {
      return normalizedQuestion.includes(normalizeTeamName(entry.name));
    });
}

function formatMatchForChat(match) {
  const display = getMatchDateTime(match);
  const hasScore = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
  const result = hasScore
    ? `${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`
    : `${match.home} vs ${match.away}`;
  return `${result} — ${display.date}, ${display.time}, ${match.location}.`;
}

function answerTrackerQuestion(question) {
  const lower = question.toLowerCase().trim();
  const team = findTeamInQuestion(question);
  const groupMatch = lower.match(/\bgroup\s+([a-l])\b/i);

  if (/\b(help|what can you|examples?)\b/.test(lower)) {
    return "Try: “When does Mexico play?”, “Show Group A”, “What is France’s ranking?”, “Who has the most points?”, or “Where is the final?”";
  }

  if (/\b(final|championship)\b/.test(lower) && /\b(when|where|date|time|venue)\b/.test(lower)) {
    const finalMatch = matches.find(function (match) {
      return /final/i.test(match.group) && !/semi|third/i.test(match.group);
    });
    return finalMatch ? formatMatchForChat(finalMatch) : "The final is not currently listed in the tracker.";
  }

  if (groupMatch) {
    const groupLetter = groupMatch[1].toUpperCase();
    const groupTeams = standingsData[groupLetter];
    if (!groupTeams) {
      return `Group ${groupLetter} is not available.`;
    }
    return `Group ${groupLetter}: ${groupTeams.map(function (entry) {
      return `${entry.name} (${entry.points} pts)`;
    }).join(", ")}.`;
  }

  if (/\b(rank|ranking|ranked)\b/.test(lower)) {
    if (team) {
      return `${team.name} is ranked ${team.fifaRank} in the June 2026 world rankings and is in Group ${team.group}.`;
    }
    const rankedTeams = getAllTeams().filter(function (entry) {
      return Number.isFinite(Number(entry.fifaRank));
    }).sort(function (a, b) {
      return Number(a.fifaRank) - Number(b.fifaRank);
    });
    const leader = rankedTeams[0];
    return `${leader.name} has the highest world ranking in this tracker at number ${leader.fifaRank}.`;
  }

  if (/\b(goals?|red cards?|yellow cards?|penalt(y|ies)|free kicks?|goalkeepers?|keepers?|scorers?)\b/.test(lower)) {
    const stats = getDetailedStats();
    if (/\bgoals?\b/.test(lower) && team) {
      return `${team.name} has scored ${stats.goals[team.name] || 0} goals in completed matches currently stored by the tracker.`;
    }
    if (/\bgoals?\b/.test(lower)) {
      const leaders = topEntries(stats.goals).filter(function (entry) { return entry[1] > 0; });
      return leaders.length
        ? `Team goal leaders: ${leaders.map(function ([name, value]) { return `${name} (${value})`; }).join(", ")}.`
        : "No completed-match goals are currently stored.";
    }
    return "Detailed cards, penalties, free kicks, player scorers, and goalkeeper data appear when supplied by the live statistics feed.";
  }

  if (/\b(most|top|lead|leader|first)\b/.test(lower) && /\b(point|standing|group)\b/.test(lower)) {
    const leaders = getAllTeams().sort(function (a, b) {
      return b.points - a.points || b.gd - a.gd;
    });
    const bestPoints = leaders[0].points;
    const topTeams = leaders.filter(function (entry) {
      return entry.points === bestPoints;
    });
    return `The current points leader${topTeams.length > 1 ? "s are" : " is"} ${topTeams.map(function (entry) {
      return `${entry.name} (${entry.points} pts)`;
    }).join(", ")}.`;
  }

  if (team && /\b(point|standing|record|win|loss|played|group)\b/.test(lower)) {
    return `${team.name} is in Group ${team.group}: ${team.played} played, ${team.won} won, ${team.drawn} drawn, ${team.lost} lost, goal difference ${team.gd > 0 ? "+" : ""}${team.gd}, ${team.points} points.`;
  }

  if (team && /\b(when|next|play|match|schedule|fixture|where|venue|result|score)\b/.test(lower)) {
    const teamMatches = matches.filter(function (match) {
      return normalizeTeamName(match.home) === normalizeTeamName(team.name) ||
        normalizeTeamName(match.away) === normalizeTeamName(team.name);
    });
    if (!teamMatches.length) {
      return `I do not have a listed fixture for ${team.name}. Try updating the live API data.`;
    }

    const wantsResult = /\b(result|score|last|previous)\b/.test(lower);
    const finished = teamMatches.filter(function (match) {
      return ["FT", "AET", "PEN"].includes(match.status);
    });
    const upcoming = teamMatches.filter(function (match) {
      return !["FT", "AET", "PEN"].includes(match.status);
    });
    const selected = wantsResult
      ? finished[finished.length - 1]
      : upcoming[0] || finished[finished.length - 1];
    return selected ? formatMatchForChat(selected) : `No match information is available for ${team.name}.`;
  }

  if (team) {
    return `${team.name} is in Group ${team.group}, ranked ${team.fifaRank}, with ${team.points} points. Ask when they play or for their full record.`;
  }

  if (/\b(groups?|teams?)\b/.test(lower)) {
    return "The tournament has 12 groups, A through L, with four teams in each group. Ask “Show Group A” to see one.";
  }

  if (/\b(next match|next game|next fixture)\b/.test(lower)) {
    const nextMatch = matches.find(function (match) {
      return !["FT", "AET", "PEN"].includes(match.status);
    });
    return nextMatch ? formatMatchForChat(nextMatch) : "There are no upcoming matches in the current tracker data.";
  }

  return "I answer from GoalTrack’s current data. Include a team, group, ranking, fixture, result, venue, or standings question.";
}

if (chatToggle && chatPanel) {
  chatToggle.addEventListener("click", function () {
    if (chatPanel.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  });
  chatClose.addEventListener("click", closeChat);

  document.querySelectorAll(".chat-suggestions button").forEach(function (button) {
    button.addEventListener("click", function () {
      const question = button.textContent;
      addChatMessage(question, "user");
      addChatMessage(answerTrackerQuestion(question), "assistant");
    });
  });

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const question = chatInput.value.trim();
    if (!question) {
      return;
    }
    addChatMessage(question, "user");
    chatInput.value = "";
    window.setTimeout(function () {
      addChatMessage(answerTrackerQuestion(question), "assistant");
    }, 180);
  });
}
