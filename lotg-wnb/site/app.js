const app = document.querySelector("#app");

const state = {
  loading: true,
  tournament: null,
  previousTeams: [],
  activeTab: "schedule",
  activeCourt: 1,
  wizard: null,
  toast: "",
  adminRoute: window.location.pathname.startsWith("/admin"),
};

const canEdit = () => state.adminRoute;

const icon = (name) => {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
  };
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const makeAbbreviation = (name, fallback = "TM") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  if (words.length > 1) return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
  return words[0].replace(/[^a-z0-9]/gi, "").slice(0, 3).padEnd(2, "X").toUpperCase();
};

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const gameMinutes = 10;
const bufferMinutes = 3;
const slotMinutes = gameMinutes + bufferMinutes;
const startMinutes = (19 * 60) + 15;
const scheduleVersion = 2;

function formatTime(slot) {
  const totalMinutes = startMinutes + ((slot - 1) * slotMinutes);
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
}

function permutations(items) {
  if (items.length < 2) return [items];
  return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]));
}

function normalizedTeamName(team) {
  return `${team.name} ${team.abbr}`.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function isLateTeam(team) {
  return Boolean(team.arrivingLate) || normalizedTeamName(team).includes("SYL");
}

function idleStreak(order, teamId) {
  let current = 0;
  let longest = 0;
  order.forEach(([home, away]) => {
    if (home.id === teamId || away.id === teamId) current = 0;
    else {
      current += 1;
      longest = Math.max(longest, current);
    }
  });
  return longest;
}

function scheduleScore(order, teams, lateTeamIds) {
  if (order[0].some((team) => lateTeamIds.has(team.id))) return Number.POSITIVE_INFINITY;
  const missedRoundPlaces = [0, 2, 4].reduce((total, startIndex) => {
    const roundTeams = new Set(order.slice(startIndex, startIndex + 2).flatMap((game) => game.map((team) => team.id)));
    return total + (teams.length - roundTeams.size);
  }, 0);
  const idleStreaks = teams.map((team) => idleStreak(order, team.id));
  const backToBackGames = teams.reduce((total, team) => total + order.reduce((count, game, index) => {
    if (!index) return count;
    const playedNow = game.some((entrant) => entrant.id === team.id);
    const playedBefore = order[index - 1].some((entrant) => entrant.id === team.id);
    return count + Number(playedNow && playedBefore);
  }, 0), 0);
  return (missedRoundPlaces * 100000)
    + (Math.max(...idleStreaks) * 10000)
    + (idleStreaks.reduce((total, streak) => total + (streak ** 2), 0) * 100)
    + backToBackGames;
}

function roundRobin(group, existingGames = []) {
  const matchups = [];
  group.teams.forEach((home, homeIndex) => {
    group.teams.slice(homeIndex + 1).forEach((away) => matchups.push([home, away]));
  });
  const lateTeamIds = new Set(group.teams.filter(isLateTeam).map((team) => team.id));
  const orderedMatchups = permutations(matchups)
    .map((order) => ({ order, score: scheduleScore(order, group.teams, lateTeamIds) }))
    .sort((first, second) => first.score - second.score)[0].order;
  const savedGames = new Map(existingGames.map((game) => [[game.homeId, game.awayId].sort().join("|"), game]));

  return orderedMatchups.map(([home, away], index) => {
    const saved = savedGames.get([home.id, away.id].sort().join("|"));
    return {
      id: saved?.id || uid("game"),
      phase: "round-robin",
      group: group.name,
      round: Math.floor(index / 2) + 1,
      slot: index + 1,
      court: group.court,
      homeId: home.id,
      awayId: away.id,
      homeScore: saved?.homeId === home.id ? saved.homeScore : saved?.awayScore ?? null,
      awayScore: saved?.awayId === away.id ? saved.awayScore : saved?.homeScore ?? null,
      complete: Boolean(saved?.complete),
    };
  });
}

function createTournament(teams) {
  const groups = [
    { name: "Court 1", court: 1, teams: teams.slice(0, 4) },
    { name: "Court 2", court: 2, teams: teams.slice(4, 8) },
  ];
  const games = groups.flatMap((group) => roundRobin(group));
  return {
    id: uid("night"),
    createdAt: new Date().toISOString(),
    teams,
    groups: groups.map((group) => ({ name: group.name, court: group.court, teamIds: group.teams.map((team) => team.id) })),
    games,
    quarterfinalsCreated: false,
    semifinalsCreated: false,
    finalCreated: false,
    gameMinutes,
    bufferMinutes,
    startTime: "7:15 PM",
    scheduleVersion,
  };
}

function upgradeTournamentSchedule(tournament) {
  if (!tournament || tournament.scheduleVersion === scheduleVersion || tournament.games.some((game) => game.phase !== "round-robin")) return false;
  const groups = tournament.groups.map((group) => ({
    ...group,
    teams: group.teamIds.map((teamId) => tournament.teams.find((team) => team.id === teamId)),
  }));
  const existingGames = tournament.games.filter((game) => game.phase === "round-robin");
  tournament.games = groups.flatMap((group) => roundRobin(group, existingGames.filter((game) => game.court === group.court)));
  tournament.scheduleVersion = scheduleVersion;
  return true;
}

function getTeam(teamId) {
  return state.tournament?.teams.find((team) => team.id === teamId);
}

function groupStandings(groupName) {
  if (!state.tournament) return [];
  const group = state.tournament.groups.find((item) => item.name === groupName);
  const rows = group.teamIds.map((teamId) => ({ team: getTeam(teamId), played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }));
  const rowMap = new Map(rows.map((row) => [row.team.id, row]));
  state.tournament.games
    .filter((game) => game.complete)
    .forEach((game) => {
      const home = rowMap.get(game.homeId);
      const away = rowMap.get(game.awayId);
      if (home) {
        home.played += 1;
        home.pointsFor += game.homeScore;
        home.pointsAgainst += game.awayScore;
        if (game.homeScore > game.awayScore) home.wins += 1;
        else home.losses += 1;
      }
      if (away) {
        away.played += 1;
        away.pointsFor += game.awayScore;
        away.pointsAgainst += game.homeScore;
        if (game.awayScore > game.homeScore) away.wins += 1;
        else away.losses += 1;
      }
    });
  return rows
    .map((row) => ({ ...row, difference: row.pointsFor - row.pointsAgainst }))
    .sort((a, b) => b.wins - a.wins || b.difference - a.difference || b.pointsFor - a.pointsFor || a.team.name.localeCompare(b.team.name));
}

function maybeCreateNextRound() {
  const tournament = state.tournament;
  const roundRobinGames = tournament.games.filter((game) => game.phase === "round-robin");
  if (!tournament.quarterfinalsCreated && roundRobinGames.length && roundRobinGames.every((game) => game.complete)) {
    const nextSlot = Math.max(...tournament.games.map((game) => game.slot)) + 1;
    const courtOne = groupStandings("Court 1");
    const courtTwo = groupStandings("Court 2");
    const quarterfinalTeams = [
      [courtOne[0].team, courtTwo[3].team],
      [courtTwo[1].team, courtOne[2].team],
      [courtTwo[0].team, courtOne[3].team],
      [courtOne[1].team, courtTwo[2].team],
    ];
    tournament.games.push(...quarterfinalTeams.map(([home, away], index) => ({
      id: uid("quarter"), phase: "quarterfinal", group: "Quarter Finals", round: Math.floor(index / 2) + 1,
      slot: nextSlot + Math.floor(index / 2), court: (index % 2) + 1,
      homeId: home.id, awayId: away.id, homeScore: null, awayScore: null, complete: false,
    })));
    tournament.quarterfinalsCreated = true;
    showToast("Quarter finals are ready");
    return;
  }

  const quarterfinals = tournament.games.filter((game) => game.phase === "quarterfinal");
  if (tournament.quarterfinalsCreated && !tournament.semifinalsCreated && quarterfinals.length === 4 && quarterfinals.every((game) => game.complete)) {
    const winners = quarterfinals.map((game) => getTeam(game.homeScore > game.awayScore ? game.homeId : game.awayId));
    const nextSlot = Math.max(...tournament.games.map((game) => game.slot)) + 1;
    tournament.games.push(
      { id: uid("semi"), phase: "semifinal", group: "Semi Finals", round: 1, slot: nextSlot, court: 1, homeId: winners[0].id, awayId: winners[1].id, homeScore: null, awayScore: null, complete: false },
      { id: uid("semi"), phase: "semifinal", group: "Semi Finals", round: 1, slot: nextSlot, court: 2, homeId: winners[2].id, awayId: winners[3].id, homeScore: null, awayScore: null, complete: false },
    );
    tournament.semifinalsCreated = true;
    showToast("Semi finals are ready");
    return;
  }

  const semifinals = tournament.games.filter((game) => game.phase === "semifinal");
  if (tournament.semifinalsCreated && !tournament.finalCreated && semifinals.length === 2 && semifinals.every((game) => game.complete)) {
    const winners = semifinals.map((game) => getTeam(game.homeScore > game.awayScore ? game.homeId : game.awayId));
    tournament.games.push({
      id: uid("final"), phase: "final", group: "Final", round: 1,
      slot: Math.max(...tournament.games.map((game) => game.slot)) + 1, court: 1,
      homeId: winners[0].id, awayId: winners[1].id, homeScore: null, awayScore: null, complete: false,
    });
    tournament.finalCreated = true;
    showToast("The final is ready");
  }
}

function champion() {
  const final = state.tournament?.games.find((game) => game.phase === "final" && game.complete);
  if (!final) return null;
  return getTeam(final.homeScore > final.awayScore ? final.homeId : final.awayId);
}

async function api(method = "GET", body) {
  const response = await fetch("/api/tournament", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Could not save the tournament");
  return response.json();
}

async function saveTournament() {
  await api("PUT", { tournament: state.tournament });
}

function showToast(message) {
  state.toast = message;
  renderToast();
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => { state.toast = ""; renderToast(); }, 2400);
}

function renderToast() {
  document.querySelector(".toast")?.remove();
  if (!state.toast) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="toast" role="status">${escapeHtml(state.toast)}</div>`);
}

function openWizard() {
  if (!canEdit()) return;
  state.wizard = { teams: blankTeams(8), error: "" };
  render();
}

function blankTeams(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: uid("team"),
    name: "",
    abbr: `T${index + 1}`,
    arrivingLate: false,
    court: index < 4 ? 1 : 2,
  }));
}

function wizardMarkup() {
  if (!state.wizard) return "";
  const wizard = state.wizard;
  const teamField = (index, label = index + 1) => {
    const team = wizard.teams[index];
    return `<div class="team-field ${team.arrivingLate ? "is-late" : ""}">
      <label for="team-${index}">${label}</label>
      <input id="team-${index}" class="text-input" data-team-name="${index}" value="${escapeHtml(team.name)}" placeholder="Team name" autocomplete="off" />
      <input class="text-input abbr-input" data-team-abbr="${index}" value="${escapeHtml(team.abbr)}" placeholder="AB" maxlength="3" aria-label="Team ${index + 1} abbreviation" />
      <button type="button" class="court-toggle court-${team.court}" data-team-court="${index}" aria-label="Team ${index + 1}, Court ${team.court}. Press to change courts">Court ${team.court}</button>
      <button type="button" class="late-toggle ${team.arrivingLate ? "active" : ""}" data-team-late="${index}" aria-pressed="${team.arrivingLate}"><span class="late-check">${team.arrivingLate ? "✓" : ""}</span><span>Arriving late</span></button>
    </div>`;
  };
  const lateCount = wizard.teams.filter((team) => team.arrivingLate).length;
  const courtOneCount = wizard.teams.filter((team) => team.court === 1).length;
  const courtTwoCount = wizard.teams.length - courtOneCount;
  const content = `
    <p class="modal-step">Eight-team tournament</p>
    <h2>Set up tonight’s draw</h2>
    <p class="modal-copy">Enter each team, then press its Court 1 or Court 2 button to move it. Each court needs four teams.</p>
    <div class="court-counts" aria-live="polite">
      <span class="court-count court-count-one">Court 1 <strong>${courtOneCount}/4</strong></span>
      <span class="court-count court-count-two">Court 2 <strong>${courtTwoCount}/4</strong></span>
    </div>
    <div class="late-summary">${lateCount}/4 teams marked as arriving late</div>
    <section class="team-assignment-setup"><div class="team-form">${wizard.teams.map((_, index) => teamField(index)).join("")}</div></section>
    ${wizard.error ? `<p class="form-error">${escapeHtml(wizard.error)}</p>` : ""}
    <div class="modal-actions"><button class="button button-primary" data-start-night>Generate all games</button></div>`;
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div>${content}</div>${state.tournament ? '<button class="close-button" data-close-wizard aria-label="Close">×</button>' : ""}</div></section></div>`;
}

function gameMarkup(game) {
  const home = getTeam(game.homeId);
  const away = getTeam(game.awayId);
  const homeWinner = game.complete && game.homeScore > game.awayScore;
  const awayWinner = game.complete && game.awayScore > game.homeScore;
  const scoreField = (side, team, score) => canEdit()
    ? `<input class="score-input" data-score="${side}" type="number" inputmode="numeric" min="0" value="${score ?? ""}" ${game.complete ? "disabled" : ""} aria-label="${escapeHtml(team.name)} score" />`
    : `<div class="score-value" aria-label="${escapeHtml(team.name)} score">${score ?? "—"}</div>`;
  const phaseLabel = game.phase === "round-robin" ? `Group round ${game.round}` : game.phase === "quarterfinal" ? "Quarterfinal" : game.phase === "semifinal" ? "Semifinal" : "Grand final";
  return `<article class="game-card ${game.complete ? "complete" : ""}" data-game-card="${game.id}">
    <div class="game-top"><span>${phaseLabel} · ${formatTime(game.slot)}</span><span class="${game.complete ? "complete-tag" : ""}">${game.complete ? canEdit() ? "Score saved" : "Final" : canEdit() ? "Enter score" : "Waiting"}</span></div>
    <div class="score-row"><div class="team-label ${homeWinner ? "winner" : ""}"><span class="abbr">${escapeHtml(home.abbr)}</span><span class="team-name">${escapeHtml(home.name)}</span></div>${scoreField("home", home, game.homeScore)}</div>
    <div class="score-row"><div class="team-label ${awayWinner ? "winner" : ""}"><span class="abbr">${escapeHtml(away.abbr)}</span><span class="team-name">${escapeHtml(away.name)}</span></div>${scoreField("away", away, game.awayScore)}</div>
    ${canEdit() ? `<div class="score-actions">${game.complete ? `<button class="edit-score" data-edit-score="${game.id}">Edit score</button>` : `<button class="save-score" data-save-score="${game.id}">Save score</button>`}</div>` : ""}
  </article>`;
}

function scheduleMarkup() {
  const court = state.activeCourt;
  const games = [...state.tournament.games]
    .filter((game) => game.court === court)
    .sort((first, second) => first.slot - second.slot);
  return `<div class="section-head"><div><h3>Tonight\u2019s games</h3><p>Every team plays all three court opponents once. Tap a court to see its games.</p></div></div>
    <div class="court-switch" role="tablist" aria-label="Pick a court">${[1, 2].map((id) => `<button class="court-pill ${court === id ? "active" : ""}" data-court="${id}" role="tab" aria-selected="${court === id}">Court ${id}</button>`).join("")}</div>
    <div class="court-column">${games.length ? games.map(gameMarkup).join("") : '<div class="court-open"><strong>No games on this court yet</strong></div>'}</div>`;
}

function overallStandings() {
  if (!state.tournament) return [];
  const rows = state.tournament.teams.map((team) => ({ team, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }));
  const rowMap = new Map(rows.map((row) => [row.team.id, row]));
  state.tournament.games
    .filter((game) => game.complete)
    .forEach((game) => {
      const home = rowMap.get(game.homeId);
      const away = rowMap.get(game.awayId);
      if (home) { home.played += 1; home.pointsFor += game.homeScore; home.pointsAgainst += game.awayScore; if (game.homeScore > game.awayScore) home.wins += 1; else home.losses += 1; }
      if (away) { away.played += 1; away.pointsFor += game.awayScore; away.pointsAgainst += game.homeScore; if (game.awayScore > game.homeScore) away.wins += 1; else away.losses += 1; }
    });
  return rows
    .map((row) => ({ ...row, difference: row.pointsFor - row.pointsAgainst }))
    .sort((a, b) => b.wins - a.wins || b.difference - a.difference || b.pointsFor - a.pointsFor || a.team.name.localeCompare(b.team.name));
}

function standingsMarkup() {
  const table = overallStandings();
  return `<div class="section-head"><div><h3>Ladder</h3><p>All teams in one table \u2014 wins, then points difference, then points scored.</p></div></div>
    <div class="standings-groups"><section class="standings-wrap"><table class="standings-table"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>+/-</th></tr></thead><tbody>${table.map((row, index) => `<tr><td class="rank">${index + 1}</td><td><strong>${escapeHtml(row.team.name)}</strong></td><td>${row.played}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.pointsFor}</td><td>${row.pointsAgainst}</td><td>${row.difference > 0 ? "+" : ""}${row.difference}</td></tr>`).join("")}</tbody></table></section></div>`;
}

function teamsMarkup() {
  return `<div class="section-head"><div><h3>Teams tonight</h3><p>These teams were assigned across Court 1 and Court 2 for tonight.</p></div></div><div class="team-list">${state.tournament.teams.map((team) => {
    const group = state.tournament.groups.find((item) => item.teamIds.includes(team.id));
    return `<div class="team-card"><span class="abbr">${escapeHtml(team.abbr)}</span><div><strong>${escapeHtml(team.name)}</strong><small>${escapeHtml(group.name)}${team.arrivingLate ? " · Arriving late · Starts round 2" : ""}</small></div></div>`;
  }).join("")}</div>`;
}

function dashboardMarkup() {
  const tournament = state.tournament;
  const completed = tournament.games.filter((game) => game.complete).length;
  const champ = champion();
  return `<main class="dashboard">
    ${champ ? `<section class="champion"><div class="champion-icon">#1</div><div><p>Tonight’s champions</p><h3>${escapeHtml(champ.name)}</h3></div></section>` : ""}
    <section class="hero"><div class="hero-copy"><p class="eyebrow">LOTG · 7:15 PM tip-off${canEdit() ? " · Admin" : ""}</p><h2>${canEdit() ? "Run game night." : "Game night is on."}</h2><p>${canEdit() ? "Manage two courts, timed games, scores, and the live ladder from one screen." : "Follow every court, score, and ladder update live throughout the night."}</p></div><div class="hero-meta"><div class="stat-chip"><span>Teams</span><strong>${tournament.teams.length}</strong></div><div class="stat-chip"><span>Games done</span><strong>${completed}/${tournament.games.length}</strong></div></div></section>
    <nav class="tabs" aria-label="Tournament sections">${[["schedule","Games"],["standings","Ladder"], ...(canEdit() ? [["teams","Teams"]] : [])].map(([id,label]) => `<button class="tab ${state.activeTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>
    <section>${state.activeTab === "schedule" ? scheduleMarkup() : state.activeTab === "standings" ? standingsMarkup() : teamsMarkup()}</section>
  </main>`;
}

const WELCOME_KEY = "lotg_welcome_seen_v1";
function welcomeMarkup() {
  if (localStorage.getItem(WELCOME_KEY)) return "";
  return `<div class="welcome-overlay" data-welcome>
    <div class="welcome-card">
      <img class="welcome-logo" src="/lotg-logo.jpg" alt="Love of the Game" />
      <p class="eyebrow">Yo \u2014 it\u2019s UNC \ud83c\udfc0</p>
      <h2>Welcome to Love of the Game Wednesdays</h2>
      <p>This is your schedule tracker for the Wednesday night runs \u2014 tonight\u2019s games, live scores and the ladder, all night, every week.</p>
      <p><strong>This is your schedule for tonight. Let\u2019s. Go.</strong></p>
      <div class="welcome-tip"><strong>Keep it in your pocket \u2014 add it as an app:</strong><br/>iPhone: Share \u2192 Add to Home Screen<br/>Android: \u22ee menu \u2192 Add to Home screen</div>
      <button class="button button-primary welcome-go" data-close-welcome>LET\u2019S GO \ud83d\udd25</button>
    </div>
  </div>`;
}

function render() {
  if (state.loading) {
    app.innerHTML = '<div class="loading"><div class="loading-mark" aria-label="Loading tournament"></div></div>';
    return;
  }
  const headerActions = canEdit()
    ? `<div class="header-actions">${state.tournament ? `<button class="button button-primary button-small" data-new-night>${icon("plus")} New night</button>` : ""}<a class="button button-ghost button-small" href="/">Public view</a></div>`
    : '<a class="button button-ghost button-small" href="/admin">Admin</a>';
  const emptyMarkup = canEdit()
    ? `<main class="empty"><section class="empty-card"><div class="ball"></div><p class="eyebrow">Admin setup</p><h2>Generate tonight’s draw</h2><p>Add eight teams, choose a random draw or assign four teams to each court, and mark any late arrivals.</p><button class="button button-primary" data-new-night>Set up tonight</button></section></main>`
    : `<main class="empty"><section class="empty-card"><div class="ball"></div><p class="eyebrow">Wednesday night basketball</p><h2>Tonight’s games are coming</h2><p>The games and ladder will appear here as soon as the admin sets up tonight’s tournament.</p></section></main>`;
  app.innerHTML = `<div class="shell"><header class="topbar"><div class="brand"><img class="brand-logo" src="/lotg-logo.jpg" alt="Love of the Game" /><div><p class="eyebrow">Wednesday nights</p><h1>Basketball Tournament</h1></div></div>${headerActions}</header>${state.tournament ? dashboardMarkup() : emptyMarkup}</div>${canEdit() ? wizardMarkup() : ""}${welcomeMarkup()}`;
  bindEvents();
  renderToast();
}

function bindEvents() {
  document.querySelectorAll("[data-new-night]").forEach((button) => button.addEventListener("click", openWizard));
  document.querySelector("[data-close-wizard]")?.addEventListener("click", () => { state.wizard = null; render(); });
  document.querySelectorAll("[data-court]").forEach((button) => button.addEventListener("click", () => { state.activeCourt = Number(button.dataset.court); render(); }));
  document.querySelector("[data-close-welcome]")?.addEventListener("click", () => {
    localStorage.setItem(WELCOME_KEY, "1");
    document.querySelector("[data-welcome]")?.remove();
  });
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.activeTab = button.dataset.tab; render(); }));
  document.querySelectorAll("[data-team-court]").forEach((button) => button.addEventListener("click", () => {
    const team = state.wizard.teams[Number(button.dataset.teamCourt)];
    team.court = team.court === 1 ? 2 : 1;
    state.wizard.error = "";
    render();
  }));
  document.querySelectorAll("[data-team-name]").forEach((input) => input.addEventListener("input", () => {
    const index = Number(input.dataset.teamName);
    const oldAuto = makeAbbreviation(state.wizard.teams[index].name, `T${index + 1}`);
    state.wizard.teams[index].name = input.value;
    if (!state.wizard.teams[index].abbr || state.wizard.teams[index].abbr === oldAuto || /^T\d$/.test(state.wizard.teams[index].abbr)) {
      state.wizard.teams[index].abbr = makeAbbreviation(input.value, `T${index + 1}`);
      document.querySelector(`[data-team-abbr="${index}"]`).value = state.wizard.teams[index].abbr;
    }
  }));
  document.querySelectorAll("[data-team-abbr]").forEach((input) => input.addEventListener("input", () => {
    input.value = input.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 3);
    state.wizard.teams[Number(input.dataset.teamAbbr)].abbr = input.value;
  }));
  document.querySelectorAll("[data-team-late]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.teamLate);
    const team = state.wizard.teams[index];
    const lateCount = state.wizard.teams.filter((item) => item.arrivingLate).length;
    if (!team.arrivingLate && lateCount >= 4) {
      state.wizard.error = "You can mark up to four teams as arriving late.";
      render();
      return;
    }
    team.arrivingLate = !team.arrivingLate;
    state.wizard.error = "";
    render();
  }));
  document.querySelector("[data-start-night]")?.addEventListener("click", startNight);
  document.querySelectorAll("[data-save-score]").forEach((button) => button.addEventListener("click", () => saveScore(button.dataset.saveScore)));
  document.querySelectorAll("[data-edit-score]").forEach((button) => button.addEventListener("click", () => editScore(button.dataset.editScore)));
}

async function startNight() {
  let teams = state.wizard.teams.map((team, index) => ({
    id: team.id || uid("team"),
    name: team.name.trim(),
    abbr: team.abbr.trim().toUpperCase(),
    arrivingLate: Boolean(team.arrivingLate) || normalizedTeamName(team).includes("SYL"),
    court: team.court,
    order: index,
  }));
  if (teams.some((team) => !team.name)) {
    state.wizard.error = "Add a name for every team.";
    render();
    return;
  }
  if (teams.some((team) => team.abbr.length < 2)) {
    state.wizard.error = "Every abbreviation needs at least two letters.";
    render();
    return;
  }
  if (new Set(teams.map((team) => team.name.toLowerCase())).size !== teams.length) {
    state.wizard.error = "Each team needs a different name.";
    render();
    return;
  }
  if (teams.filter((team) => team.arrivingLate).length > 4) {
    state.wizard.error = "You can mark up to four teams as arriving late.";
    render();
    return;
  }
  const courtOne = teams.filter((team) => team.court === 1);
  const courtTwo = teams.filter((team) => team.court === 2);
  if (courtOne.length !== 4 || courtTwo.length !== 4) {
    state.wizard.error = "Choose exactly four teams for Court 1 and four for Court 2.";
    render();
    return;
  }
  if ([courtOne, courtTwo].some((courtTeams) => courtTeams.filter((team) => team.arrivingLate).length > 2)) {
    state.wizard.error = "Each court needs at least two on-time teams. Move a late team to the other court.";
    render();
    return;
  }
  teams = [...courtOne, ...courtTwo].map(({ court, ...team }, index) => ({ ...team, order: index }));
  const oldTournament = state.tournament;
  state.tournament = createTournament(teams);
  try {
    const saved = await api("PUT", { tournament: state.tournament, previousTeams: [] });
    state.previousTeams = saved.previousTeams || [];
    state.wizard = null;
    state.activeTab = "schedule";
    render();
    showToast("Full schedule generated");
  } catch (error) {
    state.tournament = oldTournament;
    state.wizard.error = error.message;
    render();
  }
}

async function saveScore(gameId) {
  const game = state.tournament.games.find((item) => item.id === gameId);
  const card = document.querySelector(`[data-game-card="${gameId}"]`);
  const homeValue = card.querySelector('[data-score="home"]').value;
  const awayValue = card.querySelector('[data-score="away"]').value;
  if (homeValue === "" || awayValue === "") return showToast("Enter both scores");
  const homeScore = Number(homeValue);
  const awayScore = Number(awayValue);
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) return showToast("Use whole scores of 0 or more");
  const isReset = homeScore === 0 && awayScore === 0;
  if (!isReset && homeScore === awayScore) return showToast("Games need a winner, or use 0–0 to reset");
  const previousTournament = structuredClone(state.tournament);
  game.homeScore = homeScore;
  game.awayScore = awayScore;
  game.complete = !isReset;
  maybeCreateNextRound();
  render();
  try {
    await saveTournament();
    showToast(isReset ? "Game reset to 0–0" : "Score saved");
  } catch (error) {
    state.tournament = previousTournament;
    render();
    showToast(error.message);
  }
}

function editScore(gameId) {
  const game = state.tournament.games.find((item) => item.id === gameId);
  if (game.phase === "round-robin" && state.tournament.quarterfinalsCreated) {
    const playoffGames = state.tournament.games.filter((item) => item.phase !== "round-robin");
    if (playoffGames.some((item) => item.complete)) return showToast("Edit playoff scores first");
    state.tournament.games = state.tournament.games.filter((item) => item.phase === "round-robin");
    state.tournament.quarterfinalsCreated = false;
    state.tournament.semifinalsCreated = false;
    state.tournament.finalCreated = false;
  } else if (game.phase === "quarterfinal" && state.tournament.semifinalsCreated) {
    const laterGames = state.tournament.games.filter((item) => item.phase === "semifinal" || item.phase === "final");
    if (laterGames.some((item) => item.complete)) return showToast("Edit later playoff scores first");
    state.tournament.games = state.tournament.games.filter((item) => item.phase !== "semifinal" && item.phase !== "final");
    state.tournament.semifinalsCreated = false;
    state.tournament.finalCreated = false;
  } else if (game.phase === "semifinal" && state.tournament.finalCreated) {
    const final = state.tournament.games.find((item) => item.phase === "final");
    if (final?.complete) return showToast("Edit the final score first");
    state.tournament.games = state.tournament.games.filter((item) => item.phase !== "final");
    state.tournament.finalCreated = false;
  }
  game.complete = false;
  render();
}

async function init() {
  try {
    const data = await api();
    state.tournament = data.tournament || null;
    state.previousTeams = data.previousTeams || [];
    if (upgradeTournamentSchedule(state.tournament)) {
      maybeCreateNextRound();
      await saveTournament();
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    state.loading = false;
    if (!state.tournament && canEdit()) openWizard();
    else render();
  }
}

init();
