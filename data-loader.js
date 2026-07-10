/*
  Load the single tournament data file before starting the application.
  Use a local web server for development because browsers block JSON requests
  from file:// pages.
*/
fetch("data/manual-data.json", { cache: "no-store" })
  .then(function (response) {
    if (!response.ok) {
      throw new Error(`Data request failed with status ${response.status}.`);
    }
    return response.json();
  })
  .then(function (data) {
    const savedOverride = localStorage.getItem("goalTrackManualDataOverride");
    if (savedOverride) {
      try {
        data = JSON.parse(savedOverride);
      } catch (error) {
        console.error("Saved edit-mode data could not be read.", error);
        localStorage.removeItem("goalTrackManualDataOverride");
      }
    }
    window.GOALTRACK_DATA = data;
    const applicationScript = document.createElement("script");
    applicationScript.src = `script.js?v=${Date.now()}`;
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
