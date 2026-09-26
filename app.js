/* Safe-Alleys Phase 0 — app.js
   DIGIPIN encoder: official India Post algorithm (open source, Mo Communications / Dept. of Posts).
   Security: no secrets, no user PII sent anywhere in Phase 0; all DOM writes use textContent or esc(). */

// ---------- DIGIPIN (official) ----------
var DIGIPIN_GRID = [["F","C","9","8"],["J","3","2","7"],["K","4","5","6"],["L","M","P","T"]];
var BOUNDS = { minLat: 2.5, maxLat: 38.5, minLon: 63.5, maxLon: 99.5 };

function getDigiPin(lat, lon) {
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) throw new Error("Latitude out of range (India: 2.5 to 38.5)");
  if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) throw new Error("Longitude out of range (India: 63.5 to 99.5)");
  var minLat = BOUNDS.minLat, maxLat = BOUNDS.maxLat, minLon = BOUNDS.minLon, maxLon = BOUNDS.maxLon;
  var digiPin = "";
  for (var level = 1; level <= 10; level++) {
    var latDiv = (maxLat - minLat) / 4;
    var lonDiv = (maxLon - minLon) / 4;
    var row = 3 - Math.floor((lat - minLat) / latDiv);
    var col = Math.floor((lon - minLon) / lonDiv);
    row = Math.max(0, Math.min(row, 3));
    col = Math.max(0, Math.min(col, 3));
    digiPin += DIGIPIN_GRID[row][col];
    maxLat = minLat + latDiv * (4 - row);
    minLat = minLat + latDiv * (3 - row);
    minLon = minLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }
  return String(digiPin).toUpperCase();
}

// ---------- helpers ----------
function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function $(id) { return document.getElementById(id); }

// ---------- i18n (EN / HI) ----------
var LANG = localStorage.getItem("sa_lang") || "en";
function applyLang() {
  document.querySelectorAll("[data-en]").forEach(function (el) {
    el.textContent = el.getAttribute("data-" + LANG);
  });
  $("lang-btn").textContent = LANG === "en" ? "हिं" : "EN";
  document.documentElement.lang = LANG === "en" ? "en" : "hi";
}
$("lang-btn").addEventListener("click", function () {
  LANG = LANG === "en" ? "hi" : "en";
  localStorage.setItem("sa_lang", LANG);
  applyLang();
});
applyLang();

// ---------- map (Leaflet + OSM) ----------
var map = L.map("map", { center: [28.6139, 77.209], zoom: 11 });
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on("click", function (e) {
  var lat = e.latlng.lat, lon = e.latlng.lng;
  var pin, msg;
  try { pin = getDigiPin(lat, lon); }
  catch (err) { pin = null; msg = err.message; }
  var content;
  if (pin) {
    content =
      '<div class="pin-pop">' +
      "<strong>🛰️ DIGIPIN</strong><br>" +
      '<code class="pin-code">' + esc(pin) + "</code><br>" +
      "<small>" + lat.toFixed(6) + ", " + lon.toFixed(6) + "</small><br>" +
      '<button class="copy-btn" type="button" data-pin="' + esc(pin) + '">📋 Copy</button> ' +
      "<small>Reports coming in Phase 1 →</small>" +
      "</div>";
  } else {
    content = "⚠️ " + esc(msg);
  }
  L.popup({ maxWidth: 260 }).setLatLng(e.latlng).setContent(content).openOn(map);
});

document.addEventListener("click", function (e) {
  var t = e.target.closest ? e.target.closest(".copy-btn") : null;
  if (!t) return;
  var pin = t.getAttribute("data-pin") || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pin).then(function () { t.textContent = "✅ Copied"; },
      function () { t.textContent = pin; });
  } else { t.textContent = pin; }
});

// ---------- install prompt ----------
var deferredPrompt = null;
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredPrompt = e;
  $("install-btn").classList.remove("hidden");
});
$("install-btn").addEventListener("click", function () {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
  }
});
var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && !window.matchMedia("(display-mode: standalone)").matches) {
  $("ios-hint").classList.remove("hidden");
}

// ---------- service worker ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function () { /* offline support optional in Phase 0 */ });
}
