// ---- Sample data (skeleton only) ----
// x / y are percentage coordinates on the fake map. Replace with real
// lat/lng + a mapping library, and load these from your API when you build it out.
const TRAINERS = [
  { me: true,  name: "You",    emoji: "🧑‍🚀", x: 50, y: 55, dist: "—",      offers: "—",           wants: "—" },
  { name: "Ash",     emoji: "🧢", x: 32, y: 30, dist: "0.4 km", offers: "Pikachu",     wants: "Bulbasaur" },
  { name: "Misty",   emoji: "🌊", x: 68, y: 24, dist: "0.9 km", offers: "Staryu",      wants: "Charmander" },
  { name: "Brock",   emoji: "🪨", x: 22, y: 68, dist: "1.2 km", offers: "Onix",        wants: "Vulpix" },
  { name: "Gary",    emoji: "😎", x: 74, y: 62, dist: "1.6 km", offers: "Eevee",       wants: "Squirtle" },
  { name: "Nurse Joy", emoji: "⛑️", x: 46, y: 80, dist: "2.1 km", offers: "Chansey",   wants: "Ditto" },
  { name: "Lt. Surge", emoji: "⚡", x: 58, y: 40, dist: "2.8 km", offers: "Raichu",    wants: "Magnemite" },
];

// Expose for both the site and the app skeleton
if (typeof module !== "undefined") module.exports = { TRAINERS };
