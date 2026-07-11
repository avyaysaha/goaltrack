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
const finalKickoff = new Date(window.GOALTRACK_DATA.tournament.finalKickoff);

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
const siteData = window.GOALTRACK_DATA;
const teamCountryCodes = siteData.teamCountryCodes;

function getTeamCountryCode(name, fallback = "") {
  return teamCountryCodes[name] || fallback;
}

let standingsData = structuredClone(siteData.standings);
localStorage.setItem("goalTrackStandings", JSON.stringify(standingsData));

// Convert bundled and cached team badges to one consistent three-letter format.
Object.values(standingsData).flat().forEach(function (entry) {
  entry.flag = getTeamCountryCode(entry.name, entry.flag);
});

function recalculateStandingsFromFinishedMatches() {
  const teamRows = new Map();

  Object.entries(standingsData).forEach(function ([groupLetter, teams]) {
    teams.forEach(function (team) {
      Object.assign(team, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gd: 0,
        points: 0
      });
      teamRows.set(team.name, { team, groupLetter });
    });
  });

  (siteData.matches || []).forEach(function (match) {
    if (
      match.stage !== "Group Stage" ||
      !["FT", "AET", "PEN"].includes(match.status) ||
      !Number.isInteger(match.homeScore) ||
      !Number.isInteger(match.awayScore)
    ) {
      return;
    }

    const home = teamRows.get(match.home);
    const away = teamRows.get(match.away);
    if (!home || !away || home.groupLetter !== away.groupLetter) {
      return;
    }

    home.team.played += 1;
    away.team.played += 1;
    home.team.gd += match.homeScore - match.awayScore;
    away.team.gd += match.awayScore - match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.team.won += 1;
      home.team.points += 3;
      away.team.lost += 1;
    } else if (match.awayScore > match.homeScore) {
      away.team.won += 1;
      away.team.points += 3;
      home.team.lost += 1;
    } else {
      home.team.drawn += 1;
      away.team.drawn += 1;
      home.team.points += 1;
      away.team.points += 1;
    }
  });

  Object.values(standingsData).forEach(function (group) {
    group.sort(function (a, b) {
      return b.points - a.points ||
        b.gd - a.gd ||
        b.won - a.won ||
        Number(a.fifaRank) - Number(b.fifaRank) ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
  });

  localStorage.setItem("goalTrackStandings", JSON.stringify(standingsData));
}

recalculateStandingsFromFinishedMatches();

const standingsBody = document.querySelector("#standings-body");
const groupTabs = document.querySelector("#group-tabs");
const groupLabel = document.querySelector("#group-label");
const groupName = document.querySelector("#group-name");
const groupStatus = document.querySelector("#group-status");
const teamOrbitDots = document.querySelector("#team-orbit-dots");
const badgeAnimationStage = document.querySelector("#badge-animation-stage");
let badgeAnimationTimer = null;

function getGroupStageSurvivorNames() {
  const groupEntries = Object.entries(standingsData);
  const groupsAreComplete = groupEntries.length > 0 && groupEntries.every(function ([, teams]) {
    return teams.every(function (team) {
      return team.played >= 3;
    });
  });

  if (!groupsAreComplete) {
    return null;
  }

  const survivorNames = new Set();
  const thirdPlaceTeams = [];

  groupEntries.forEach(function ([group, teams]) {
    teams.forEach(function (team, index) {
      if (index < 2) {
        survivorNames.add(team.name);
      } else if (index === 2) {
        thirdPlaceTeams.push({ ...team, group });
      }
    });
  });

  thirdPlaceTeams
    .sort(function (a, b) {
      return b.points - a.points ||
        b.gd - a.gd ||
        b.won - a.won ||
        Number(a.fifaRank) - Number(b.fifaRank) ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    })
    .slice(0, 8)
    .forEach(function (team) {
      survivorNames.add(team.name);
    });

  return survivorNames;
}

function getTournamentRecord(teamName) {
  return (siteData.matches || []).reduce(function (record, match) {
    if (
      !["FT", "AET", "PEN"].includes(match.status) ||
      !Number.isInteger(match.homeScore) ||
      !Number.isInteger(match.awayScore) ||
      (match.home !== teamName && match.away !== teamName)
    ) {
      return record;
    }

    const isHome = match.home === teamName;
    const goalsFor = isHome ? match.homeScore : match.awayScore;
    const goalsAgainst = isHome ? match.awayScore : match.homeScore;

    const shootoutWinner = match.stage === "Knockout" ? match.shootoutWinner : "";
    if (shootoutWinner === teamName) {
      record.won += 1;
    } else if (shootoutWinner && shootoutWinner !== teamName) {
      record.lost += 1;
    } else if (goalsFor > goalsAgainst) {
      record.won += 1;
    } else if (goalsFor < goalsAgainst) {
      record.lost += 1;
    } else {
      record.drawn += 1;
    }

    return record;
  }, { won: 0, drawn: 0, lost: 0 });
}

function renderTeamOrbit() {
  if (!teamOrbitDots) {
    return;
  }

  const allTeams = Object.entries(standingsData).flatMap(function ([group, teams]) {
    return teams.map(function (entry, index) {
      return { ...entry, group, groupPosition: index + 1 };
    });
  });
  const groupStageSurvivors = getGroupStageSurvivorNames();
  // Each dot uses a recognizable national team or flag color.
  const nationalColors = siteData.nationalColors;

  teamOrbitDots.innerHTML = allTeams.map(function (entry, index) {
    const angle = (index / allTeams.length) * Math.PI * 2 - Math.PI / 2;
    // Wins, points, and later rounds move a team inward. Losses push the dot
    // farther back, so eliminated teams remain visible instead of disappearing.
    const tournamentRecord = getTournamentRecord(entry.name);
    const stageProgress = entry.stageProgress || 0;
    const inwardProgress =
      stageProgress * 24 +
      Math.min(entry.points || 0, 9) * 2 +
      (tournamentRecord.won || 0) * 7;
    const lossPenalty = (tournamentRecord.lost || 0) * 12;
    const color = nationalColors[entry.name] || "#ffffff";
    const isEliminated = entry.eliminated || (groupStageSurvivors && !groupStageSurvivors.has(entry.name));
    const labelText = isEliminated
      ? `${entry.name} · ELIMINATED`
      : `${entry.name} · ${tournamentRecord.won}W ${tournamentRecord.lost}L`;
    const ariaLabel = isEliminated
      ? `${entry.name}, eliminated`
      : `${entry.name}, ${tournamentRecord.won} wins, ${tournamentRecord.lost} losses`;

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
        data-label="${labelText}"
        aria-label="${ariaLabel}">
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

function renderBadgeAnimation() {
  if (!badgeAnimationStage) {
    return;
  }

  let allTeams = Object.entries(standingsData).flatMap(function ([group, teams]) {
    return teams.map(function (entry) {
      return { ...entry, group };
    });
  });
  allTeams = allTeams.sort(function () {
    return Math.random() - 0.5;
  });
  const shirtBadgeUrls = siteData.shirtBadgeUrls || {};
  const nationalColors = siteData.nationalColors || {};
  const badgeDuration = 5000;
  const animationTypes = ["from-right", "from-left", "from-top", "from-bottom", "from-middle", "split-replace", "close-in"];

  const randomAnimationType = function () {
    return animationTypes[Math.floor(Math.random() * animationTypes.length)];
  };

  const getShirtBadgeUrl = function (teamName) {
    const normalizedTeam = normalizeTeamName(teamName);
    const directUrl = shirtBadgeUrls[teamName];
    if (directUrl) {
      return directUrl;
    }

    const matchingEntry = Object.entries(shirtBadgeUrls).find(function ([name]) {
      return normalizeTeamName(name) === normalizedTeam;
    });
    return matchingEntry ? matchingEntry[1] : "";
  };

  const renderTeamBadge = function (team) {
    const code = getTeamCountryCode(team.name, team.flag || team.name.slice(0, 3).toUpperCase());
    const badgeUrl = getShirtBadgeUrl(team.name);
    const color = nationalColors[team.name] || "#1769e0";
    const animationType = randomAnimationType();
    const badgeContent = badgeUrl
      ? `<img src="${escapeHtml(badgeUrl)}" alt="">`
      : `
        <div class="shirt-crest-fallback" style="--badge-color:${color};">
          <span>${escapeHtml(code)}</span>
        </div>
      `;

    badgeAnimationStage.innerHTML = `
      <div
        class="shirt-badge-background badge-${animationType} ${normalizeTeamName(team.name).includes("switzerland") ? "badge-needs-white-backdrop" : ""}"
        style="--badge-color:${color};"
        title="${escapeHtml(team.name)}">
        ${badgeContent}
      </div>
    `;
  };

  let activeIndex = 0;
  renderTeamBadge(allTeams[activeIndex]);
  clearInterval(badgeAnimationTimer);
  badgeAnimationTimer = setInterval(function () {
    activeIndex = (activeIndex + 1) % allTeams.length;
    if (activeIndex === 0) {
      allTeams = allTeams.sort(function () {
        return Math.random() - 0.5;
      });
    }
    renderTeamBadge(allTeams[activeIndex]);
  }, badgeDuration);
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
renderBadgeAnimation();
window.addEventListener("resize", positionTeamOrbitDots);

// ---------- 4. Match schedule loaded from manual-data.json ----------
let matches = structuredClone(siteData.matches);

// The schedule reuses the same three-letter codes as the standings table.
// Knockout placeholders such as A1 or 3rd keep their existing short labels.
matches = matches.map(function (match, dataIndex) {
  return {
    ...match,
    dataIndex,
    homeFlag: getTeamCountryCode(match.home, match.homeFlag),
    awayFlag: getTeamCountryCode(match.away, match.awayFlag)
  };
});

const scheduleList = document.querySelector("#schedule-list");
const emptyMessage = document.querySelector("#empty-message");

const knockoutBracket = document.querySelector("#knockout-bracket");
const scheduleMatchDetails = new Map();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanDisplayText(value) {
  return String(value ?? "")
    .replace(/Ãƒâ€šÃ‚Â·|Ã‚Â·|Â·/g, " · ")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢/g, " · ")
    .replace(/Ãƒâ€šÃ‚Â|Ã‚Â|Â/g, "")
    .replace(/\s*[•]\s*/gu, " · ")
    .replace(/\s*·\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isEditModeEnabled() {
  return localStorage.getItem("goalTrackEditMode") === "unlocked";
}

function syncEditModeClass() {
  document.body.classList.toggle("edit-mode-active", isEditModeEnabled());
}

function saveEditedSiteData() {
  localStorage.setItem("goalTrackManualDataOverride", JSON.stringify(window.GOALTRACK_DATA));
}

function parseEditableNumber(value) {
  const trimmed = String(value || "").trim();
  if (trimmed === "") {
    return null;
  }
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function setOptionalNumber(target, key, value) {
  const number = parseEditableNumber(value);
  if (number === null) {
    delete target[key];
    return;
  }
  target[key] = number;
}

function setOptionalValue(target, key, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    delete target[key];
    return;
  }
  target[key] = trimmed;
}

function exitEditModeOnly() {
  localStorage.removeItem("goalTrackEditMode");
  location.reload();
}

function deleteBrowserEdits() {
  localStorage.removeItem("goalTrackManualDataOverride");
  localStorage.removeItem("goalTrackEditMode");
  location.reload();
}

function renderEditModeToolbar() {
  const existingToolbar = document.querySelector("#edit-mode-toolbar");
  if (!isEditModeEnabled()) {
    existingToolbar?.remove();
    return;
  }
  if (existingToolbar) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.id = "edit-mode-toolbar";
  toolbar.className = "edit-mode-toolbar";
  toolbar.innerHTML = `
    <strong>Edit mode is on</strong>
    <button class="edit-mode-exit" type="button">Exit edit mode</button>
    <button class="edit-mode-delete" type="button">Delete browser edits</button>
  `;
  document.body.appendChild(toolbar);
  toolbar.querySelector(".edit-mode-exit").addEventListener("click", exitEditModeOnly);
  toolbar.querySelector(".edit-mode-delete").addEventListener("click", function () {
    if (confirm("Delete the edits saved in this browser?")) {
      deleteBrowserEdits();
    }
  });
}

syncEditModeClass();
renderEditModeToolbar();

function getMatchNumber(match) {
  const matchText = String(match.group || "");
  const found = matchText.match(/Match\s+(\d+)/i);
  return found ? Number(found[1]) : 0;
}

function normalizeScheduleKeyPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getScheduleMatchKey(match) {
  return [
    getMatchNumber(match) || match.group || "match",
    match.date,
    match.home,
    match.away
  ].map((part) => normalizeScheduleKeyPart(part)).join("|");
}

function isFinishedMatch(match) {
  return ["FT", "AET", "PEN"].includes(match.status) &&
    Number.isInteger(match.homeScore) &&
    Number.isInteger(match.awayScore);
}

function getKnockoutResult(match, kind) {
  if (!match || !isFinishedMatch(match)) {
    return "";
  }

  if (match.shootoutWinner) {
    if (kind === "winner") {
      return match.shootoutWinner;
    }
    return match.shootoutWinner === match.home ? match.away : match.home;
  }

  if (match.homeScore === match.awayScore) {
    return "";
  }

  const homeWon = match.homeScore > match.awayScore;
  if (kind === "winner") {
    return homeWon ? match.home : match.away;
  }
  return homeWon ? match.away : match.home;
}

function resolveKnockoutSlot(teamName, matchByNumber) {
  const text = String(teamName || "TBD");
  const winnerMatch = text.match(/^Winner Match\s+(\d+)$/i);
  const runnerUpMatch = text.match(/^Runner-up Match\s+(\d+)$/i);

  if (winnerMatch) {
    return getKnockoutResult(matchByNumber.get(Number(winnerMatch[1])), "winner") || text;
  }

  if (runnerUpMatch) {
    return getKnockoutResult(matchByNumber.get(Number(runnerUpMatch[1])), "runner-up") || text;
  }

  return text;
}

function knockoutRoundName(match) {
  const text = String(match.group || "");
  if (/Round of 32/i.test(text)) return "Round of 32";
  if (/Round of 16/i.test(text)) return "Round of 16";
  if (/Quarter-final/i.test(text)) return "Quarter-finals";
  if (/Semi-final/i.test(text)) return "Semi-finals";
  if (/third place/i.test(text)) return "Third-place match";
  if (/Final/i.test(text)) return "Final";
  return "Knockout";
}

function bracketTeamRow(name, score, winner, shootoutScore = null) {
  const code = getTeamCountryCode(name, "");
  const codeMarkup = /^[A-Z0-9]{2,3}$/.test(code)
    ? `<span class="bracket-team-code">${code}</span>`
    : "";
  const displayScore = Number.isInteger(score)
    ? `${score}${Number.isInteger(shootoutScore) ? `(${shootoutScore})` : ""}`
    : "";
  const scoreMarkup = displayScore ? `<span class="bracket-score">${displayScore}</span>` : "";
  return `<div class="bracket-team${winner ? " bracket-team-winner" : ""}">${codeMarkup}<span>${name}</span>${scoreMarkup}</div>`;
}

function getSourceMatchNumbers(match) {
  return [match.homeSource || match.home, match.awaySource || match.away]
    .map((teamName) => String(teamName || "").match(/^Winner Match\s+(\d+)$/i))
    .filter(Boolean)
    .map((matchNumber) => Number(matchNumber[1]));
}

function renderBracketMatchCard(match, matchByNumber) {
  const matchNumber = getMatchNumber(match);
  const matchKey = getScheduleMatchKey(match);
  const finished = isFinishedMatch(match);
  const homeName = resolveKnockoutSlot(match.home, matchByNumber);
  const awayName = resolveKnockoutSlot(match.away, matchByNumber);
  const homeWinner = finished && (match.shootoutWinner === match.home || (!match.shootoutWinner && match.homeScore > match.awayScore));
  const awayWinner = finished && (match.shootoutWinner === match.away || (!match.shootoutWinner && match.awayScore > match.homeScore));
  const roundLabel = knockoutRoundName(match);
  const displayDateTime = getMatchDateTime(match);
  const displayLocation = cleanMatchLocation(match.location);
  scheduleMatchDetails.set(matchKey, { ...match, matchKey });

  return `
    <article class="bracket-match${finished ? " bracket-match-finished" : ""}" tabindex="0" role="button" data-match-key="${escapeHtml(matchKey)}" aria-label="Open team stats for ${escapeHtml(homeName)} vs ${escapeHtml(awayName)}">
      <div class="bracket-round-label">${roundLabel}</div>
      <div class="bracket-match-meta"><span>Match ${matchNumber}</span></div>
      ${bracketTeamRow(homeName, finished ? match.homeScore : null, homeWinner, match.homeShootoutScore)}
      ${bracketTeamRow(awayName, finished ? match.awayScore : null, awayWinner, match.awayShootoutScore)}
      <div class="bracket-match-details">
        <span>${match.date}</span>
        <span>${displayDateTime.time}</span>
        <span>⌖ ${displayLocation}</span>
      </div>
    </article>
  `;
}

function renderAdvancementNode(match, matchByNumber) {
  const childMatches = getSourceMatchNumbers(match)
    .map((matchNumber) => matchByNumber.get(matchNumber))
    .filter(Boolean);

  if (!childMatches.length) {
    return `<div class="advance-node advance-leaf">${renderBracketMatchCard(match, matchByNumber)}</div>`;
  }

  return `
    <div class="advance-node">
      <div class="advance-children">
        ${childMatches.map((childMatch) => renderAdvancementNode(childMatch, matchByNumber)).join("")}
      </div>
      <div class="advance-connector" aria-hidden="true"></div>
      <div class="final-stage-wrap">
        ${renderBracketMatchCard(match, matchByNumber)}
      </div>
    </div>
  `;
}

function renderReverseAdvancementNode(match, matchByNumber) {
  const childMatches = getSourceMatchNumbers(match)
    .map((matchNumber) => matchByNumber.get(matchNumber))
    .filter(Boolean);

  if (!childMatches.length) {
    return `<div class="advance-node advance-node-right advance-leaf">${renderBracketMatchCard(match, matchByNumber)}</div>`;
  }

  return `
    <div class="advance-node advance-node-right">
      <div class="final-stage-wrap">
        ${renderBracketMatchCard(match, matchByNumber)}
      </div>
      <div class="advance-connector" aria-hidden="true"></div>
      <div class="advance-children advance-children-right">
        ${childMatches.map((childMatch) => renderReverseAdvancementNode(childMatch, matchByNumber)).join("")}
      </div>
    </div>
  `;
}

function renderKnockoutBracket(searchText) {
  if (!knockoutBracket) {
    return;
  }

  const showBracket = (currentFilter === "all" || currentFilter === "Knockout") && !searchText;
  knockoutBracket.hidden = !showBracket;
  if (!showBracket) {
    knockoutBracket.innerHTML = "";
    return;
  }

  const knockoutMatches = matches
    .filter((match) => match.stage === "Knockout")
    .sort((a, b) => getMatchNumber(a) - getMatchNumber(b));
  const matchByNumber = new Map(knockoutMatches.map((match) => [getMatchNumber(match), match]));
  const finalMatch = matchByNumber.get(104) || knockoutMatches.find((match) => /Final/i.test(match.group || ""));
  const thirdPlaceMatch = matchByNumber.get(103);
  const semifinalMatches = finalMatch
    ? getSourceMatchNumbers(finalMatch)
      .map((matchNumber) => matchByNumber.get(matchNumber))
      .filter(Boolean)
    : [];
  const leftSemifinal = semifinalMatches[0];
  const rightSemifinal = semifinalMatches[1];
  const championshipBracket = finalMatch
    ? `
      <div class="split-bracket">
        <div class="bracket-half bracket-half-left">
          ${leftSemifinal ? renderAdvancementNode(leftSemifinal, matchByNumber) : ""}
        </div>
        <div class="bracket-finals-column">
          <div class="finals-card championship-card">
            ${renderBracketMatchCard(finalMatch, matchByNumber)}
          </div>
          ${thirdPlaceMatch ? `
            <div class="third-place-after-final">
              <div class="third-place-line" aria-hidden="true"></div>
              <div class="finals-card third-place-card">
                ${renderBracketMatchCard(thirdPlaceMatch, matchByNumber)}
              </div>
            </div>
          ` : ""}
        </div>
        <div class="bracket-half bracket-half-right">
          ${rightSemifinal ? renderReverseAdvancementNode(rightSemifinal, matchByNumber) : ""}
        </div>
      </div>
    `
    : "<p>No final match found in the current data.</p>";

  knockoutBracket.innerHTML = `
    <div class="bracket-heading">
      <div>
        <p class="section-kicker">KNOCKOUT BRACKET</p>
        <h2>Advancement path</h2>
      </div>
      <p>Each pair of matches feeds into the next round.</p>
    </div>
    <div class="advancement-scroll">
      <div class="advancement-tree">${championshipBracket}</div>
    </div>
  `;
}

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
  return structuredClone(siteData.detailedStats || {});
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

const venueTimeZones = siteData.venueTimeZones;

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

function cleanMatchLocation(location) {
  return cleanDisplayText(String(location || "Venue TBD")
    .replace(/^\s*⌖\s*/u, "")
    .replace(/\s*,?\s*You said:.*$/i, "")
    .replace(/\s*,?\s*yellow=Player\|Team.*$/i, "")
  );
}

function getDisplayGroup(match) {
  if (match.group && match.group !== "Group") {
    return match.group;
  }

  const team = findBundledTeam(match.home) || findBundledTeam(match.away);
  return team ? `Group ${team.group}` : (match.group || "Group");
}

function renderEditField(label, inputMarkup) {
  return `
    <label class="match-edit-field">
      <span class="match-edit-label-text">${label}</span>
      ${inputMarkup}
    </label>
  `;
}

function clampStarRating(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.max(0, Math.min(5, Math.round(number * 10) / 10));
}

function starSvgMarkup(className) {
  const starPath = "M10 1.5 12.6 7 18.6 7.4 14.1 11.3 15.5 17.2 10 14.1 4.5 17.2 5.9 11.3 1.4 7.4 7.4 7Z";
  return `
    <svg class="${className}" viewBox="0 0 100 20" aria-hidden="true" focusable="false">
      ${[0, 1, 2, 3, 4].map(function (index) {
        return `<path d="${starPath}" transform="translate(${index * 20} 0)"></path>`;
      }).join("")}
    </svg>
  `;
}

function renderStarRating(value) {
  const rating = clampStarRating(value);
  if (rating === null) {
    return `<span class="star-rating-empty">--</span>`;
  }

  return `
    <span class="star-rating" style="--rating-percent:${rating * 20}%;" role="img" aria-label="${rating.toFixed(1)} out of 5 stars">
      <span class="star-rating-back">${starSvgMarkup("star-rating-svg")}</span>
      <span class="star-rating-front">${starSvgMarkup("star-rating-svg")}</span>
    </span>
  `;
}

function renderPerformanceEditField(label, inputName, value) {
  const rating = clampStarRating(value) ?? 0;
  return `
    <div class="match-edit-field performance-edit-field">
      <span class="match-edit-label-text">${label}</span>
      <input type="hidden" name="${inputName}" value="${rating ? rating.toFixed(1) : ""}">
      <button
        class="performance-star-editor"
        type="button"
        data-target-name="${inputName}"
        aria-label="Set ${label} by tenths of a star">
        ${renderStarRating(rating)}
      </button>
      <span class="performance-edit-help">Click anywhere on the stars. Each tiny step is 0.1 star.</span>
    </div>
  `;
}

function renderMatchEditForm(match) {
  if (!isEditModeEnabled()) {
    return "";
  }

  const homeStats = match.homeStats || {};
  const awayStats = match.awayStats || {};
  const status = match.status || "";
  const homeName = escapeHtml(match.home);
  const awayName = escapeHtml(match.away);
  const statFields = [
    ["shots", "Shots"],
    ["shotsOnTarget", "Shots OT"],
    ["performance", "Performance /5"],
    ["possession", "Possession %"],
    ["passes", "Passes"],
    ["passAccuracy", "Pass accuracy %"],
    ["fouls", "Fouls"],
    ["offsides", "Offsides"],
    ["corners", "Corners"]
  ];

  return `
    <form class="match-edit-form" data-match-key="${escapeHtml(match.matchKey)}">
      <div class="match-edit-section-title">
        <strong>Match result</strong>
        <span>Use status like FT, AET, PEN, or Upcoming.</span>
      </div>
      <div class="match-edit-row">
        ${renderEditField("Match status", `<input name="status" value="${escapeHtml(status)}" placeholder="FT">`)}
        ${renderEditField(`${homeName} score`, `<input name="homeScore" type="number" value="${Number.isInteger(match.homeScore) ? match.homeScore : ""}">`)}
        ${renderEditField(`${awayName} score`, `<input name="awayScore" type="number" value="${Number.isInteger(match.awayScore) ? match.awayScore : ""}">`)}
      </div>
      <div class="match-edit-section-title">
        <strong>Cards and penalties</strong>
        <span>Enter total cards and penalty kicks for this match.</span>
      </div>
      <div class="match-edit-row">
        ${renderEditField("Total yellow cards", `<input name="yellowCards" type="number" min="0" value="${Array.isArray(match.yellowCards) ? match.yellowCards.length : (Number.isFinite(Number(match.yellowCards)) ? Number(match.yellowCards) : "")}">`)}
        ${renderEditField("Total red cards", `<input name="redCards" type="number" min="0" value="${Array.isArray(match.redCards) ? match.redCards.length : (Number.isFinite(Number(match.redCards)) ? Number(match.redCards) : "")}">`)}
        ${renderEditField("Total penalty kicks", `<input name="penalties" type="number" min="0" value="${Number.isFinite(Number(match.penalties)) ? Number(match.penalties) : ""}">`)}
      </div>
      <div class="match-edit-section-title">
        <strong>Team stats</strong>
        <span>Compare the home team and away team numbers.</span>
      </div>
      <div class="match-edit-team-labels" aria-hidden="true">
        <span>${homeName}</span>
        <span>${awayName}</span>
      </div>
      ${statFields.map(function ([key, label]) {
        if (key === "performance") {
          return `
            <div class="match-edit-row">
              ${renderPerformanceEditField(`${homeName} ${label}`, `home_${key}`, homeStats[key])}
              ${renderPerformanceEditField(`${awayName} ${label}`, `away_${key}`, awayStats[key])}
            </div>
          `;
        }
        const numberRules = key === "performance" ? `min="0" max="5" step="0.1"` : `min="0"`;
        return `
          <div class="match-edit-row">
            ${renderEditField(`${homeName} ${label}`, `<input name="home_${key}" type="number" ${numberRules} value="${homeStats[key] ?? ""}">`)}
            ${renderEditField(`${awayName} ${label}`, `<input name="away_${key}" type="number" ${numberRules} value="${awayStats[key] ?? ""}">`)}
          </div>
        `;
      }).join("")}
      <button class="match-edit-save" type="submit">Save match</button>
    </form>
  `;
}

function getScheduleTeamDisplay(match, matchByNumber) {
  const home = match.stage === "Knockout"
    ? resolveKnockoutSlot(match.home, matchByNumber)
    : match.home;
  const away = match.stage === "Knockout"
    ? resolveKnockoutSlot(match.away, matchByNumber)
    : match.away;

  return {
    home,
    away,
    homeFlag: getTeamCountryCode(home, match.homeFlag),
    awayFlag: getTeamCountryCode(away, match.awayFlag)
  };
}

function isKnockoutPlaceholderMatch(match) {
  return /^Winner Match\s+\d+$/i.test(String(match.home || "")) ||
    /^Winner Match\s+\d+$/i.test(String(match.away || "")) ||
    /^Runner-up Match\s+\d+$/i.test(String(match.home || "")) ||
    /^Runner-up Match\s+\d+$/i.test(String(match.away || ""));
}

function preferScheduleMatch(currentMatch, nextMatch) {
  const currentFinished = ["FT", "AET", "PEN"].includes(currentMatch.status);
  const nextFinished = ["FT", "AET", "PEN"].includes(nextMatch.status);
  if (currentFinished !== nextFinished) {
    return nextFinished ? nextMatch : currentMatch;
  }

  const currentPlaceholder = isKnockoutPlaceholderMatch(currentMatch);
  const nextPlaceholder = isKnockoutPlaceholderMatch(nextMatch);
  if (currentPlaceholder !== nextPlaceholder) {
    return nextPlaceholder ? currentMatch : nextMatch;
  }

  return nextMatch;
}

function dedupeScheduleMatches(sourceMatches) {
  const byKnockoutNumber = new Map();
  const normalMatches = [];

  sourceMatches.forEach(function (match) {
    const matchNumber = match.stage === "Knockout" ? getMatchNumber(match) : 0;
    if (!matchNumber) {
      normalMatches.push(match);
      return;
    }

    const existing = byKnockoutNumber.get(matchNumber);
    byKnockoutNumber.set(matchNumber, existing ? preferScheduleMatch(existing, match) : match);
  });

  return normalMatches.concat(Array.from(byKnockoutNumber.values()));
}

function getMatchLabel(match) {
  return `${match.home} vs ${match.away}`;
}

function findDetailedMatchStats(match) {
  const label = normalizeScheduleKeyPart(getMatchLabel(match));
  return (siteData.detailedStats?.matchStats || []).find(function (record) {
    return normalizeScheduleKeyPart(record.match) === label;
  }) || {};
}

function countTeamEvents(events, teamName) {
  return (events || []).filter(function (event) {
    return normalizeScheduleKeyPart(event.team) === normalizeScheduleKeyPart(teamName);
  }).length;
}

function statFromSideObjects(match, statsRecord, side, keys) {
  const sideObjects = [
    match.teamStats?.[side],
    match.stats?.[side],
    match[`${side}Stats`],
    statsRecord.teamStats?.[side],
    statsRecord.stats?.[side],
    statsRecord[`${side}Stats`]
  ].filter(Boolean);

  for (const source of sideObjects) {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
        return source[key];
      }
    }
  }

  const prefix = side === "home" ? "home" : "away";
  const capitalizedPrefix = prefix[0].toUpperCase() + prefix.slice(1);
  for (const source of [match, statsRecord]) {
    for (const key of keys) {
      const directKeys = [
        `${prefix}${key[0].toUpperCase()}${key.slice(1)}`,
        `${key}${capitalizedPrefix}`
      ];
      for (const directKey of directKeys) {
        if (source[directKey] !== undefined && source[directKey] !== null && source[directKey] !== "") {
          return source[directKey];
        }
      }
    }
  }

  return null;
}

function formatMatchStat(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return `${value}${suffix}`;
}

function getTeamMatchStat(match, statsRecord, side, row) {
  const teamName = side === "home" ? match.home : match.away;
  if (row.eventKey === "yellowCards") {
    return statFromSideObjects(match, statsRecord, side, row.keys) ??
      countTeamEvents(match.yellowCards, teamName);
  }
  if (row.eventKey === "redCards") {
    return statFromSideObjects(match, statsRecord, side, row.keys) ??
      countTeamEvents(match.redCards, teamName);
  }

  return statFromSideObjects(match, statsRecord, side, row.keys);
}

function numericStatValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function betterStatSide(row, homeValue, awayValue) {
  const homeNumber = numericStatValue(homeValue);
  const awayNumber = numericStatValue(awayValue);
  if (homeNumber === null || awayNumber === null || homeNumber === awayNumber) {
    return "";
  }

  if (row.lowerIsBetter) {
    return homeNumber < awayNumber ? "home" : "away";
  }

  return homeNumber > awayNumber ? "home" : "away";
}

const matchStatRows = [
  { label: "Shots", keys: ["shots", "totalShots"] },
  { label: "Shots on Target", keys: ["shotsOnTarget", "onTarget", "shotOnTarget"] },
  { label: "Performance", keys: ["performance", "rating", "teamPerformance"], suffix: "/5" },
  { label: "Possession", keys: ["possession", "possessionPercentage", "possessionPercent"], suffix: "%" },
  { label: "Passes", keys: ["passes", "totalPasses"] },
  { label: "Pass Accuracy", keys: ["passAccuracy", "passingAccuracy", "passAccuracyPercentage"], suffix: "%" },
  { label: "Fouls", keys: ["fouls", "foulsCommitted"], lowerIsBetter: true },
  { label: "Yellow Cards", keys: ["yellowCards"], eventKey: "yellowCards", lowerIsBetter: true },
  { label: "Red Cards", keys: ["redCards"], eventKey: "redCards", lowerIsBetter: true },
  { label: "Offsides", keys: ["offsides", "offside"], lowerIsBetter: true },
  { label: "Corners", keys: ["corners", "cornerKicks"] }
];

function ensureMatchStatsDialog() {
  let dialog = document.querySelector("#match-stats-dialog");
  if (dialog) {
    return dialog;
  }

  dialog = document.createElement("dialog");
  dialog.id = "match-stats-dialog";
  dialog.className = "match-stats-dialog";
  document.body.appendChild(dialog);

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return dialog;
}

function openMatchStatsDialog(matchKey) {
  const match = scheduleMatchDetails.get(matchKey);
  if (!match) {
    return;
  }

  const statsRecord = findDetailedMatchStats(match);
  const dialog = ensureMatchStatsDialog();
  const hasScore = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
  const scoreText = hasScore
    ? `${match.homeScore}${Number.isInteger(match.homeShootoutScore) ? `(${match.homeShootoutScore})` : ""} - ${match.awayScore}${Number.isInteger(match.awayShootoutScore) ? `(${match.awayShootoutScore})` : ""}`
    : "VS";

  dialog.innerHTML = `
    <div class="match-stats-modal">
      <button class="match-stats-close" type="button" aria-label="Close match stats">×</button>
      <div class="match-stats-heading">
        <span>${escapeHtml(match.group || match.stage || "Match")}</span>
        <h2>${escapeHtml(match.home)} <b>${escapeHtml(scoreText)}</b> ${escapeHtml(match.away)}</h2>
        <p>${escapeHtml(match.date)} · ${escapeHtml(match.time || "")} · ${escapeHtml(cleanMatchLocation(match.location))}</p>
      </div>
      <div class="match-stats-table" role="table" aria-label="Team stats for ${escapeHtml(getMatchLabel(match))}">
        <div class="match-stats-row match-stats-head" role="row">
          <span role="columnheader">${escapeHtml(getTeamCountryCode(match.home, match.homeFlag))} ${escapeHtml(match.home)}</span>
          <strong role="columnheader">Team Stat</strong>
          <span role="columnheader">${escapeHtml(match.away)} ${escapeHtml(getTeamCountryCode(match.away, match.awayFlag))}</span>
        </div>
        ${matchStatRows.map(function (row) {
          const homeValue = getTeamMatchStat(match, statsRecord, "home", row);
          const awayValue = getTeamMatchStat(match, statsRecord, "away", row);
          const betterSide = betterStatSide(row, homeValue, awayValue);
          const homeHighlight = betterSide === "home" ? "stat-better" : "";
          const awayHighlight = betterSide === "away" ? "stat-better" : "";
          const highlightStyle = "color:#08794a;";
          return `
            <div class="match-stats-row" role="row">
              <span class="match-stats-value ${homeHighlight}" ${homeHighlight ? `style="${highlightStyle}"` : ""} role="cell">${row.label === "Performance" ? renderStarRating(homeValue) : escapeHtml(formatMatchStat(homeValue, row.suffix || ""))}</span>
              <strong role="cell">${escapeHtml(row.label)}</strong>
              <span class="match-stats-value ${awayHighlight}" ${awayHighlight ? `style="${highlightStyle}"` : ""} role="cell">${row.label === "Performance" ? renderStarRating(awayValue) : escapeHtml(formatMatchStat(awayValue, row.suffix || ""))}</span>
            </div>
          `;
        }).join("")}
      </div>
      <p class="match-stats-note">Advanced stats show when they are added to manual-data.json. Cards are counted from the match event list.</p>
    </div>
  `;

  dialog.querySelector(".match-stats-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.showModal();
}

function renderSchedule() {
  if (!scheduleList) {
    return;
  }

  const searchText = teamSearch.value.trim().toLowerCase();
  const scheduleMatches = dedupeScheduleMatches(matches);
  scheduleMatchDetails.clear();
  const matchByNumber = new Map(
    scheduleMatches
      .filter((match) => match.stage === "Knockout")
      .map((match) => [getMatchNumber(match), match])
  );

  renderKnockoutBracket(searchText);

  // filter() keeps only matches that meet both the stage and search rules.
  const visibleMatches = scheduleMatches
    .filter(function (match) {
      const bracketReplacesKnockout = !searchText && (currentFilter === "all" || currentFilter === "Knockout");
      if (bracketReplacesKnockout && match.stage === "Knockout") {
        return false;
      }
      const matchesStage = currentFilter === "all" || match.stage === currentFilter;
      const displayTeams = getScheduleTeamDisplay(match, matchByNumber);
      const teams = `${displayTeams.home} ${displayTeams.away} ${match.home} ${match.away}`.toLowerCase();
      const matchesSearch = teams.includes(searchText);
      return matchesStage && matchesSearch;
    })
    // FIFA's match numbers are not always in kickoff order. Sort by the real
    // kickoff timestamp so each date and match card appears chronologically.
    .sort(function (a, b) {
      const aKickoff = a.kickoffISO
        ? new Date(a.kickoffISO)
        : venueLocalToDate(a.date, a.time, a.venueTimeZone || getVenueTimeZone(a.location));
      const bKickoff = b.kickoffISO
        ? new Date(b.kickoffISO)
        : venueLocalToDate(b.date, b.time, b.venueTimeZone || getVenueTimeZone(b.location));
      return aKickoff - bKickoff;
    });

  // Group matches by the visitor's local date. A late match may appear under a
  // different calendar day than the stadium date in another part of the world.
  const matchesByDate = {};
  visibleMatches.forEach(function (match) {
    const displayDateTime = getMatchDateTime(match);
    if (!matchesByDate[displayDateTime.date]) {
      matchesByDate[displayDateTime.date] = [];
    }
    const matchKey = getScheduleMatchKey(match);
    const displayMatch = { ...match, displayTime: displayDateTime.time, matchKey };
    scheduleMatchDetails.set(matchKey, displayMatch);
    matchesByDate[displayDateTime.date].push(displayMatch);
  });

  scheduleList.innerHTML = Object.entries(matchesByDate).map(function ([date, dayMatches]) {
    const matchCards = dayMatches.map(function (match) {
      const displayTeams = getScheduleTeamDisplay(match, matchByNumber);
      const hasScore = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
      const hasPrediction = Number.isInteger(match.predictedHomeScore) && Number.isInteger(match.predictedAwayScore);
      const finished = ["FT", "AET", "PEN"].includes(match.status);
      const live = ["1H", "HT", "2H", "ET", "BT", "P"].includes(match.status);
      const homeDisplayScore = hasScore
        ? `${match.homeScore}${Number.isInteger(match.homeShootoutScore) ? `(${match.homeShootoutScore})` : ""}`
        : "";
      const awayDisplayScore = hasScore
        ? `${match.awayScore}${Number.isInteger(match.awayShootoutScore) ? `(${match.awayShootoutScore})` : ""}`
        : "";
      const scoreOrVersus = hasScore
        ? `<div class="versus score">${homeDisplayScore}<span>-</span>${awayDisplayScore}</div>`
        : `<div class="versus">VS</div>`;
      const predictionLine = hasPrediction
        ? `<span class="match-prediction">⌖ Predicted Score: ${displayTeams.homeFlag} ${match.predictedHomeScore}-${match.predictedAwayScore} ${displayTeams.awayFlag}</span>`
        : "";
      const statusLabel = finished
        ? `Full time · ${match.displayTime}`
        : live
          ? `${match.elapsed || ""}' LIVE · ${match.displayTime}`
          : match.displayTime;
      const displayLocation = cleanMatchLocation(match.location);
      const displayGroup = getDisplayGroup(match);

      return `
        <article class="match-card${finished ? " match-card-finished" : ""}" tabindex="0" role="button" data-match-key="${escapeHtml(match.matchKey)}" aria-label="Open team stats for ${escapeHtml(displayTeams.home)} vs ${escapeHtml(displayTeams.away)}">
          <div class="match-meta">
            <span>${displayGroup}</span>
            <span class="${live ? "live-badge" : ""}">${statusLabel}</span>
          </div>
          <div class="teams">
            <div class="team"><span class="${/^[A-Z0-9]{2,3}$/.test(displayTeams.homeFlag) ? "team-code" : ""}">${displayTeams.homeFlag}</span>${displayTeams.home}</div>
            ${scoreOrVersus}
            <div class="team">${displayTeams.away}<span class="${/^[A-Z0-9]{2,3}$/.test(displayTeams.awayFlag) ? "team-code" : ""}">${displayTeams.awayFlag}</span></div>
          </div>
          <div class="match-details">
            <span class="match-location">⌖ ${displayLocation}</span>
            ${predictionLine}
          </div>
          ${renderMatchEditForm(match)}
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

  emptyMessage.hidden = visibleMatches.length > 0 || !knockoutBracket.hidden;
}

if (scheduleList) {
  scheduleList.addEventListener("click", function (event) {
    if (event.target.closest(".match-edit-form")) {
      return;
    }
    const card = event.target.closest(".match-card");
    if (card) {
      openMatchStatsDialog(card.dataset.matchKey);
    }
  });

  scheduleList.addEventListener("keydown", function (event) {
    if (event.target.closest(".match-edit-form")) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const card = event.target.closest(".match-card");
    if (card) {
      event.preventDefault();
      openMatchStatsDialog(card.dataset.matchKey);
    }
  });

  scheduleList.addEventListener("click", function (event) {
    const editor = event.target.closest(".performance-star-editor");
    if (!editor) {
      return;
    }

    event.preventDefault();
    const starStrip = editor.querySelector(".star-rating");
    const rect = (starStrip || editor).getBoundingClientRect();
    const position = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const rating = Math.max(0.1, Math.min(5, Math.ceil((position / rect.width) * 50) / 10));
    const form = editor.closest(".match-edit-form");
    const input = form?.elements[editor.dataset.targetName];
    if (!input) {
      return;
    }

    input.value = rating.toFixed(1);
    editor.innerHTML = renderStarRating(rating);
  });

  scheduleList.addEventListener("submit", function (event) {
    const form = event.target.closest(".match-edit-form");
    if (!form) {
      return;
    }

    event.preventDefault();
    const match = scheduleMatchDetails.get(form.dataset.matchKey);
    const sourceMatch = window.GOALTRACK_DATA.matches?.[match?.dataIndex];
    if (!sourceMatch) {
      return;
    }

    const formData = new FormData(form);
    const homeScore = parseEditableNumber(formData.get("homeScore"));
    const awayScore = parseEditableNumber(formData.get("awayScore"));
    const status = String(formData.get("status") || "").trim();
    sourceMatch.status = status || "Upcoming";
    sourceMatch.homeScore = homeScore;
    sourceMatch.awayScore = awayScore;
    setOptionalNumber(sourceMatch, "yellowCards", formData.get("yellowCards"));
    setOptionalNumber(sourceMatch, "redCards", formData.get("redCards"));
    setOptionalNumber(sourceMatch, "penalties", formData.get("penalties"));

    sourceMatch.homeStats = sourceMatch.homeStats || {};
    sourceMatch.awayStats = sourceMatch.awayStats || {};
    [
      "shots",
      "shotsOnTarget",
      "performance",
      "possession",
      "passes",
      "passAccuracy",
      "fouls",
      "offsides",
      "corners"
    ].forEach(function (key) {
      setOptionalNumber(sourceMatch.homeStats, key, formData.get(`home_${key}`));
      setOptionalNumber(sourceMatch.awayStats, key, formData.get(`away_${key}`));
    });

    saveEditedSiteData();
    location.reload();
  });

  if (knockoutBracket) {
    knockoutBracket.addEventListener("click", function (event) {
      const card = event.target.closest(".bracket-match");
      if (card) {
        openMatchStatsDialog(card.dataset.matchKey);
      }
    });

    knockoutBracket.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const card = event.target.closest(".bracket-match");
      if (card) {
        event.preventDefault();
        openMatchStatsDialog(card.dataset.matchKey);
      }
    });
  }

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

function getKeeperResultTotals() {
  const totals = new Map();

  matches.forEach(function (match) {
    if (!["FT", "AET", "PEN"].includes(match.status)) {
      return;
    }

    [
      { name: match.homeKeeper, team: match.home, conceded: match.awayScore },
      { name: match.awayKeeper, team: match.away, conceded: match.homeScore }
    ].forEach(function (entry) {
      if (!entry.name || !Number.isInteger(entry.conceded)) {
        return;
      }

      const total = totals.get(entry.name) || {
        team: entry.team,
        appearances: 0,
        goalsConceded: 0
      };
      total.appearances += 1;
      total.goalsConceded += entry.conceded;
      totals.set(entry.name, total);
    });
  });

  return totals;
}

function getDetailedStats() {
  const emptyTeamValues = {};
  getAllTeams().forEach(function (entry) {
    emptyTeamValues[entry.name] = 0;
  });

  const cached = readDetailedStatsCache();

  const verifiedScorers = [];
  const verifiedKeepers = [];
  const fallbackMatchStats = [];

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
  const keeperResults = getKeeperResultTotals();
  const keepers = [...keeperMap.values()]
    .map(function (keeper) {
      const result = keeperResults.get(keeper.name);
      if (!result) {
        return keeper;
      }
      return {
        ...keeper,
        goalsConceded: result.goalsConceded,
        detail: `${result.team} · ${result.goalsConceded} goals conceded in ${result.appearances} appearance${result.appearances === 1 ? "" : "s"}`
      };
    })
    .sort(function (a, b) {
      return b.value - a.value ||
        (a.goalsConceded ?? Number.POSITIVE_INFINITY) -
          (b.goalsConceded ?? Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });

  return {
    goals: { ...getTeamGoalsFromResults(), ...(cached.goals || {}) },
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
  const colors = siteData.nationalColors;
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
      <div class="coordinate-chart" role="img" aria-label="${config.title} trend chart">
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
    .map(function (match, sourceIndex) {
      return { ...match, sourceIndex };
    })
    .filter(function (match) {
      return ["FT", "AET", "PEN"].includes(match.status) &&
        Number.isInteger(match.homeScore) &&
        Number.isInteger(match.awayScore);
    })
    .sort(function (a, b) {
      // Compare the published fixture dates first. If a workflow update omits
      // the kickoff time, preserve the schedule's original fixture order
      // instead of treating the missing time as January 1, 1970.
      const fixtureDay = function (match) {
        const dateText = match.date.replace(/^[A-Za-z]+,\s*/, "");
        const timestamp = Date.parse(`${dateText} 00:00:00 UTC`);
        return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
      };
      const dayDifference = fixtureDay(a) - fixtureDay(b);
      if (dayDifference !== 0) {
        return dayDifference;
      }

      const aDate = a.kickoffISO
        ? new Date(a.kickoffISO)
        : venueLocalToDate(a.date, a.time, a.venueTimeZone || getVenueTimeZone(a.location));
      const bDate = b.kickoffISO
        ? new Date(b.kickoffISO)
        : venueLocalToDate(b.date, b.time, b.venueTimeZone || getVenueTimeZone(b.location));
      const aTime = aDate?.getTime();
      const bTime = bDate?.getTime();
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
        return aTime - bTime;
      }
      return a.sourceIndex - b.sourceIndex;
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

function leaderboardLines(entries) {
  return entries.map(function (entry) {
    return [entry.name, entry.value, entry.detail || ""].join("|");
  }).join("\n");
}

function parseLeaderboardLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map(function (line) {
      const [name, score, detail = ""] = line.split("|").map(function (part) {
        return part.trim();
      });
      return {
        name,
        value: Number(score),
        detail
      };
    })
    .filter(function (entry) {
      return entry.name && Number.isFinite(entry.value);
    });
}

function renderLeaderboardEditor(stats) {
  const leaderboardGrid = document.querySelector(".leaderboard-grid");
  if (!leaderboardGrid) {
    return;
  }

  const existingPanel = document.querySelector("#leaderboard-edit-panel");
  if (!isEditModeEnabled()) {
    existingPanel?.remove();
    return;
  }

  const panel = existingPanel || document.createElement("section");
  panel.id = "leaderboard-edit-panel";
  panel.className = "leaderboard-edit-panel";
  panel.innerHTML = `
    <div class="leaderboard-edit-heading">
      <div>
        <span>Edit mode</span>
        <h2>Edit leaderboards</h2>
      </div>
      <p>Use one line per entry: <strong>Name | Number | Detail</strong>. Team goals can be changed here, or by editing match scores on the Match Schedule page.</p>
    </div>
    <form class="leaderboard-edit-form">
      <label>
        Player goals
        <textarea name="scorers" spellcheck="false">${escapeHtml(leaderboardLines(stats.scorers || []))}</textarea>
      </label>
      <label>
        Team goals
        <textarea name="teamGoals" spellcheck="false">${escapeHtml(leaderboardLines(topEntries(stats.goals).map(function ([name, value]) {
          const team = getAllTeams().find(function (entry) {
            return normalizeTeamName(entry.name) === normalizeTeamName(name);
          });
          return { name, value, detail: `Group ${team?.group || "—"}` };
        })))}</textarea>
      </label>
      <label>
        Keepers
        <textarea name="keepers" spellcheck="false">${escapeHtml(leaderboardLines(stats.keepers || []))}</textarea>
      </label>
      <div class="edit-actions">
        <button class="button button-primary" type="submit">Save leaderboards</button>
        <button class="button button-secondary" type="button" data-exit-edit-mode>Exit edit mode</button>
        <button class="button button-secondary danger-button" type="button" data-delete-browser-edits>Delete browser edits</button>
      </div>
    </form>
  `;

  if (!existingPanel) {
    leaderboardGrid.insertAdjacentElement("afterend", panel);
  }

  panel.querySelector(".leaderboard-edit-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    window.GOALTRACK_DATA.detailedStats = window.GOALTRACK_DATA.detailedStats || {};
    window.GOALTRACK_DATA.detailedStats.scorers = parseLeaderboardLines(formData.get("scorers"));
    window.GOALTRACK_DATA.detailedStats.goals = Object.fromEntries(
      parseLeaderboardLines(formData.get("teamGoals")).map(function (entry) {
        return [entry.name, entry.value];
      })
    );
    window.GOALTRACK_DATA.detailedStats.keepers = parseLeaderboardLines(formData.get("keepers"));
    saveEditedSiteData();
    location.reload();
  }, { once: true });

  panel.querySelector("[data-exit-edit-mode]").addEventListener("click", exitEditModeOnly, { once: true });

  panel.querySelector("[data-delete-browser-edits]").addEventListener("click", function () {
    if (confirm("Delete the edits saved in this browser?")) {
      deleteBrowserEdits();
    }
  }, { once: true });
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

  renderLeaderboardEditor(stats);
}

renderStatsDashboard();

// ---------- 6. Home-page tournament overview ----------
const overviewSection = document.querySelector("#tournament-overview");
const overviewLastMatch = document.querySelector("#overview-last-match");
const overviewLastDetail = document.querySelector("#overview-last-detail");
const overviewNextMatch = document.querySelector("#overview-next-match");
const overviewNextDetail = document.querySelector("#overview-next-detail");
const overviewTotals = document.querySelector("#overview-totals");
const overviewScorerTitle = document.querySelector("#overview-scorer-title");
const overviewTeamTitle = document.querySelector("#overview-team-title");
const overviewKeeperTitle = document.querySelector("#overview-keeper-title");

function getMatchTimestamp(match) {
  const kickoff = match.kickoffISO
    ? new Date(match.kickoffISO)
    : venueLocalToDate(match.date, match.time, match.venueTimeZone || getVenueTimeZone(match.location));
  const timestamp = kickoff?.getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function getUpcomingMatches() {
  return matches
    .filter(function (match) {
      return !isFinishedMatch(match);
    })
    .sort(function (a, b) {
      return getMatchTimestamp(a) - getMatchTimestamp(b);
    });
}

function getOverviewMatchDisplay(match) {
  if (!match) {
    return null;
  }

  if (match.stage !== "Knockout") {
    return { ...match };
  }

  const matchByNumber = new Map(
    matches
      .filter((entry) => entry.stage === "Knockout")
      .map((entry) => [getMatchNumber(entry), entry])
  );
  const displayTeams = getScheduleTeamDisplay(match, matchByNumber);
  return {
    ...match,
    home: displayTeams.home,
    away: displayTeams.away
  };
}

function formatOverviewMatch(match) {
  if (!match) {
    return "No match found";
  }

  if (isFinishedMatch(match)) {
    return cleanDisplayText(`${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`);
  }

  return cleanDisplayText(`${match.home} vs ${match.away}`);
}

function formatOverviewDetail(match) {
  if (!match) {
    return "";
  }

  const dateTime = getMatchDateTime(match);
  const venue = cleanMatchLocation(match.location);
  return cleanDisplayText([dateTime.date, dateTime.time, venue].filter(Boolean).join(" · "));
}

function countMatchEvents(match, statsRecord, eventName, recordKey) {
  if (Array.isArray(match[eventName])) {
    return match[eventName].length;
  }
  if (Number.isFinite(Number(match[eventName]))) {
    return Number(match[eventName]);
  }
  if (statsRecord && Number.isFinite(Number(statsRecord[recordKey || eventName]))) {
    return Number(statsRecord[recordKey || eventName]);
  }
  return 0;
}

function getTournamentOverviewTotals(stats) {
  const totals = {
    goals: 0,
    redCards: 0,
    yellowCards: 0,
    penalties: 0,
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    fouls: 0,
    offsides: 0,
    corners: 0
  };

  getCompletedMatches().forEach(function (match) {
    const statsRecord = findDetailedMatchStats(match);
    totals.goals += (match.homeScore || 0) + (match.awayScore || 0);
    totals.redCards += countMatchEvents(match, statsRecord, "redCards");
    totals.yellowCards += countMatchEvents(match, statsRecord, "yellowCards");
    totals.penalties += countMatchEvents(match, statsRecord, "penalties");

    [
      ["shots", "Shots"],
      ["shotsOnTarget", "Shots on Target"],
      ["passes", "Passes"],
      ["fouls", "Fouls"],
      ["offsides", "Offsides"],
      ["corners", "Corners"]
    ].forEach(function ([key, label]) {
      const row = matchStatRows.find(function (entry) {
        return entry.label === label;
      });
      totals[key] += Number(getTeamMatchStat(match, statsRecord, "home", row)) || 0;
      totals[key] += Number(getTeamMatchStat(match, statsRecord, "away", row)) || 0;
    });
  });

  if (!totals.redCards) {
    totals.redCards = Object.values(stats.redCards || {}).reduce(function (sum, value) {
      return sum + (Number(value) || 0);
    }, 0);
  }
  if (!totals.yellowCards) {
    totals.yellowCards = Object.values(stats.yellowCards || {}).reduce(function (sum, value) {
      return sum + (Number(value) || 0);
    }, 0);
  }
  if (!totals.penalties) {
    totals.penalties = Object.values(stats.penalties || {}).reduce(function (sum, value) {
      return sum + (Number(value) || 0);
    }, 0);
  }

  return totals;
}

const overviewTotalIcons = {
  Goals: { className: "icon-golden-cleat" },
  "Red cards": { className: "icon-red-card" },
  "Yellow cards": { className: "icon-yellow-card" },
  PKs: { className: "icon-golden-goal" },
  Shots: { className: "icon-kick-ball" },
  "Shots on target": { className: "icon-kick-ball" },
  Passes: { className: "icon-kick-ball" },
  Fouls: { className: "icon-slide-tackle" },
  Offsides: { className: "icon-checkered-flag" },
  Corners: { className: "icon-corner-flag" }
};

function overviewIconMarkup(config) {
  if (!config) {
    return "";
  }

  const svgIcons = {
    "icon-golden-cleat": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="cleat-upper" d="M10 34 L24 34 L29 23 L40 23 L43 31 L58 37 C60 38 60 42 57 44 L43 50 L18 50 C12 50 8 45 8 39 C8 36 9 35 10 34 Z"></path>
        <path class="cleat-sole" d="M13 49 H46"></path>
        <path class="cleat-laces" d="M30 29 H40 M29 34 H42 M27 39 H44"></path>
        <path class="cleat-stud" d="M19 50 L16 57 M31 50 L29 57 M43 50 L45 57"></path>
      </svg>
    `,
    "icon-golden-goal": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="goal-frame" d="M13 49 V18 H51 V49"></path>
        <path class="goal-net" d="M13 29 H51 M13 39 H51 M25 18 V49 M38 18 V49"></path>
        <circle class="goal-ball" cx="46" cy="43" r="7"></circle>
      </svg>
    `,
    "icon-kick-ball": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="shot-motion" d="M9 21 H25 M7 32 H23 M11 43 H27"></path>
        <circle class="shot-ball" cx="43" cy="32" r="15"></circle>
        <path class="soccer-panel" d="M43 24 L50 29 L47 38 H39 L36 29 Z"></path>
        <path class="soccer-seams" d="M43 24 L43 17 M50 29 L57 27 M47 38 L52 45 M39 38 L34 45 M36 29 L29 27"></path>
      </svg>
    `,
    "icon-golden-ball": `
      <svg viewBox="0 0 64 64" focusable="false">
        <circle class="gold-ball" cx="32" cy="32" r="22"></circle>
        <path class="soccer-panel" d="M32 21 L42 28 L38 40 H26 L22 28 Z"></path>
        <path class="soccer-seams" d="M32 21 L32 10 M42 28 L53 24 M38 40 L45 50 M26 40 L19 50 M22 28 L11 24"></path>
      </svg>
    `,
    "icon-golden-glove": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="glove-fingers" d="M19 31 V15 C19 11 25 11 25 15 V29 M25 28 V12 C25 8 31 8 31 12 V28 M31 28 V12 C31 8 37 8 37 12 V29 M37 30 V16 C37 12 43 12 43 16 V34"></path>
        <path class="glove-palm" d="M18 31 C14 28 10 33 14 38 L24 51 H43 C49 51 53 47 53 40 V30 C53 26 47 26 47 30 V36 C44 34 41 34 38 37 L34 41 L27 34 C24 31 21 31 18 31 Z"></path>
        <path class="glove-cuff" d="M25 51 H45 V58 H25 Z"></path>
      </svg>
    `,
    "icon-slide-tackle": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="foul-lanyard" d="M18 20 C23 10 40 10 45 22"></path>
        <rect class="foul-whistle" x="12" y="27" width="34" height="20" rx="10"></rect>
        <path class="foul-mouth" d="M44 31 H57 V41 H44 Z"></path>
        <circle class="foul-hole" cx="25" cy="37" r="5"></circle>
      </svg>
    `,
    "icon-checkered-flag": `
      <svg viewBox="0 0 64 64" focusable="false">
        <path class="flag-pole" d="M18 10 V56"></path>
        <path class="flag-border" d="M20 12 H54 V36 H20 Z"></path>
        <path class="flag-black" d="M20 12 H31 V24 H20 Z M42 12 H54 V24 H42 Z M31 24 H42 V36 H31 Z"></path>
      </svg>
    `
  };

  if (svgIcons[config.className]) {
    return `
      <span class="overview-icon ${config.className}" aria-hidden="true">
        ${svgIcons[config.className]}
      </span>
    `;
  }

  return `<span class="overview-icon ${config.className}" aria-hidden="true">${config.icon || ""}</span>`;
}

function renderTournamentOverview() {
  if (!overviewSection) {
    return;
  }

  const stats = getDetailedStats();
  const completedMatches = getCompletedMatches();
  const lastMatch = getOverviewMatchDisplay(completedMatches[completedMatches.length - 1]);
  const nextMatch = getOverviewMatchDisplay(getUpcomingMatches()[0]);

  overviewLastMatch.textContent = formatOverviewMatch(lastMatch);
  overviewLastDetail.textContent = formatOverviewDetail(lastMatch);
  overviewNextMatch.textContent = formatOverviewMatch(nextMatch);
  overviewNextDetail.textContent = formatOverviewDetail(nextMatch);

  let totals;
  try {
    totals = getTournamentOverviewTotals(stats);
  } catch (error) {
    console.error("Tournament overview totals failed:", error);
    totals = {
      goals: getGoalTrendData().at(-1)?.cumulativeValue || 0,
      redCards: 0,
      yellowCards: 0,
      penalties: 0,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      fouls: 0,
      offsides: 0,
      corners: 0
    };
  }

  const totalCards = [
    ["Goals", totals.goals],
    ["Red cards", totals.redCards],
    ["Yellow cards", totals.yellowCards],
    ["PKs", totals.penalties],
    ["Shots", totals.shots],
    ["Shots on target", totals.shotsOnTarget],
    ["Passes", totals.passes],
    ["Fouls", totals.fouls],
    ["Offsides", totals.offsides],
    ["Corners", totals.corners]
  ];

  overviewTotals.innerHTML = totalCards.map(function ([label, value]) {
    const icon = overviewIconMarkup(overviewTotalIcons[label]);
    return `
      <article>
        <span>${icon}${escapeHtml(label)}</span>
        <strong>${Number(value).toLocaleString("en-US")}</strong>
      </article>
    `;
  }).join("");

  const teamGoalRows = topEntries(stats.goals).map(function ([name, value]) {
    const team = getAllTeams().find(function (entry) {
      return normalizeTeamName(entry.name) === normalizeTeamName(name);
    });
    return { name, value, detail: `Group ${team?.group || "-"}` };
  });

  if (overviewScorerTitle) {
    overviewScorerTitle.textContent = stats.scorers?.[0]?.name || "Most goals";
  }
  if (overviewTeamTitle) {
    overviewTeamTitle.textContent = teamGoalRows[0]?.name || "Most team goals";
  }
  if (overviewKeeperTitle) {
    overviewKeeperTitle.textContent = stats.keepers?.[0]?.name || "Best keeper";
  }

}

renderTournamentOverview();

// ---------- 7. GoalTrack site-data assistant ----------
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

function addEditModePrompt() {
  const message = document.createElement("div");
  message.className = "chat-message assistant";
  const text = document.createElement("span");
  text.textContent = isEditModeEnabled()
    ? "Edit mode is on. You can exit edit mode without deleting your saved browser edits."
    : "Edit mode is locked. Unlock it to type scores and match stats on Match Schedule, and edit player/keeper leaderboards on Stats.";
  const button = document.createElement("button");
  button.className = "chat-action-button";
  button.type = "button";
  button.textContent = isEditModeEnabled() ? "Exit edit mode" : "Unlock edit mode";
  button.addEventListener("click", isEditModeEnabled() ? exitEditModeOnly : openEditPasswordDialog);
  message.append(text, button);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function ensureEditPasswordDialog() {
  let dialog = document.querySelector("#edit-password-dialog");
  if (dialog) {
    return dialog;
  }

  dialog = document.createElement("dialog");
  dialog.id = "edit-password-dialog";
  dialog.className = "edit-dialog";
  dialog.innerHTML = `
    <div class="edit-dialog-card">
      <button class="edit-dialog-close" type="button" aria-label="Close password dialog">×</button>
      <h2>Edit mode</h2>
      <p>Enter the password to unlock schedule and leaderboard editing.</p>
      <label>
        Password
        <input class="edit-password-input" type="password" autocomplete="off">
      </label>
      <p class="edit-error" role="alert"></p>
      <button class="button button-primary edit-unlock-button" type="button">Unlock</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const closeButton = dialog.querySelector(".edit-dialog-close");
  const input = dialog.querySelector(".edit-password-input");
  const error = dialog.querySelector(".edit-error");
  const unlockButton = dialog.querySelector(".edit-unlock-button");

  closeButton.addEventListener("click", function () {
    dialog.close();
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  function unlock() {
    if (input.value === "1 Trophy") {
      input.value = "";
      error.textContent = "";
      dialog.close();
      localStorage.setItem("goalTrackEditMode", "unlocked");
      syncEditModeClass();
      renderEditModeToolbar();
      addChatMessage("Edit mode is on. Go to Match Schedule to edit scores and stats, or Stats to edit player goals and keepers.", "assistant");
      renderSchedule();
      renderStatsDashboard();
      return;
    }
    error.textContent = "Incorrect password.";
    input.select();
  }

  unlockButton.addEventListener("click", unlock);
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      unlock();
    }
  });

  return dialog;
}

function openEditPasswordDialog() {
  const dialog = ensureEditPasswordDialog();
  dialog.showModal();
  dialog.querySelector(".edit-password-input").focus();
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
    if (question.toLowerCase() === "edit") {
      window.setTimeout(addEditModePrompt, 180);
      return;
    }
    window.setTimeout(function () {
      addChatMessage(answerTrackerQuestion(question), "assistant");
    }, 180);
  });
}

