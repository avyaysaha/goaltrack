# GoalTrack

A beginner-friendly 2026 World Cup tracker built with HTML, CSS, and JavaScript.

## Pages

- Home
- Standings
- Match Schedule
- Stats

The website stores any optional API-Football key only in the visitor's browser.

## Automatic updates

GitHub Actions checks fixtures every 30 minutes. When a newly completed match is
found, it also refreshes standings, scorers, cards, and goalkeeper data. It
writes the public data to `live-data.js`, which loads before the main script.

The repository needs an Actions secret named `API_FOOTBALL_KEY`.
