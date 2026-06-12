# GoalTrack

A beginner-friendly 2026 World Cup tracker built with HTML, CSS, and JavaScript.

## Pages

- Home
- Standings
- Match Schedule
- Stats

The website stores any optional API-Football key only in the visitor's browser.

## Automatic updates

GitHub Actions runs `scripts/update-world-cup.mjs` every 10 minutes. It writes
the latest public tournament data to `live-data.js`, which the pages load before
the main application script.

The repository needs an Actions secret named `API_FOOTBALL_KEY`.
