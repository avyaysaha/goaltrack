# GoalTrack

A beginner-friendly 2026 World Cup tracker built with HTML, CSS, and JavaScript.

## Pages

- Home
- Standings
- Match Schedule
- Stats

The website stores any optional API-Football key only in the visitor's browser.

## Automatic updates

The included GitHub Action can refresh fixtures, standings, scorers, cards, and
goalkeeper data, then write the public results to `live-data.js`.

The repository needs an Actions secret named `API_FOOTBALL_KEY`.

Scheduled updates are currently disabled because API-Football's free plan does
not provide access to the 2026 season.
