/* Safe-Alleys — app.js (app-style UI)
   Map first, minimal text, thumb-reach controls, bilingual EN/HI, DIGIPIN on tap. */

// ---------- DIGIPIN (official India Post algorithm) ----------
var DIGIPIN_GRID = [["F","C","9","8"],["J","3","2","7"],["K","4","5","6"],["L","M","P","T"]];
var BOUNDS = { minLat: 2.5, maxLat: 38.5, minLon: 63.5, maxLon: 99.5 };

function getDigiPin(lat, lon) {
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) throw new Error("Out of India range (lat 2.5-38.5)");
  if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) throw new Error("Out of India range (lon 63.5-99.5)");
  var minLat = BOUNDS.minLat, maxLat = BOUNDS.maxLat, minLon = BOUNDS.minLon, maxLon = BOUNDS.maxLon;
  var digiPin = "";
  for (var level = 1; level <= 10; level++) {
    var latDiv = (maxLat - minLat) / 4, lonDiv = (maxLon - minLon) / 4;
    var row = 3 - Math.floor((lat - minLat) / latDiv);
    var col = Math.floor((lon - minLon) / lonDiv);
    row = Math.max(0, Math.min(row, 3)); col = Math.max(0, Math.min(col, 3));
    digiPin += DIGIPIN_GRID[row][col];
    maxLat = minLat + latDiv * (4 - row); minLat = minLat + latDiv * (3 - row);
    minLon = minLon + lonDiv * col; maxLon = minLon + lonDiv;
  }
  return String(digiPin).toUpperCase();
}

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function $(id) { return document.getElementById(id); }
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

// ---------- i18n ----------
var LANG = localStorage.getItem("sa_lang") || "en";
function applyLang() {
  document.querySelectorAll("[data-en]").forEach(function (el) { el.textContent = el.getAttribute("data-" + LANG); });
  $("lang-btn").textContent = LANG === "en" ? "हिं" : "EN";
  document.documentElement.lang = LANG === "en" ? "en" : "hi";
}
$("lang-btn").addEventListener("click", function () {
  LANG = LANG === "en" ? "hi" : "en";
  localStorage.setItem("sa_lang", LANG);
  applyLang();
});
applyLang();

// ---------- map ----------
var map = L.map("map", { center: [28.6139, 77.209], zoom: 12, zoomControl: false, attributionControl: true });
L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.on("click", function (e) {
  var lat = e.latlng.lat, lon = e.latlng.lng, pin;
  try { pin = getDigiPin(lat, lon); } catch (err) { pin = null; }
  var content = pin
    ? '<div class="pin-pop"><strong>🛰️ DIGIPIN</strong><br>' +
      '<code class="pin-code">' + esc(pin) + "</code><br>" +
      "<small>" + lat.toFixed(6) + ", " + lon.toFixed(6) + "</small><br>" +
      '<button class="copy-btn" type="button" data-pin="' + esc(pin) + '">📋 ' + (LANG === "en" ? "Copy" : "कॉपी") + "</button></div>"
    : "⚠️ " + esc(err.message);
  L.popup({ maxWidth: 240 }).setLatLng(e.latlng).setContent(content).openOn(map);
});

document.addEventListener("click", function (e) {
  var t = e.target.closest ? e.target.closest(".copy-btn") : null;
  if (!t) return;
  var pin = t.getAttribute("data-pin") || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pin).then(function () { t.textContent = "✅"; }, function () { t.textContent = pin; });
  } else { t.textContent = pin; }
});

// ---------- locate me ----------
$("locate-btn").addEventListener("click", function () {
  if (!navigator.geolocation) return;
  var b = $("locate-btn");
  b.classList.add("busy");
  navigator.geolocation.getCurrentPosition(function (pos) {
    map.setView([pos.coords.latitude, pos.coords.longitude], 16);
    b.classList.remove("busy");
  }, function () { b.classList.remove("busy"); }, { enableHighAccuracy: true, timeout: 8000 });
});

// ---------- chips (advisory + legend) ----------
["advisory", "legend"].forEach(function (id) {
  $(id).addEventListener("click", function () {
    var open = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", open ? "false" : "true");
    this.classList.toggle("open", !open);
    var s = this.querySelector(".chip-short"), f = this.querySelector(".chip-full");
    if (open) { s.classList.remove("hidden"); f.classList.add("hidden"); }
    else { s.classList.add("hidden"); f.classList.remove("hidden"); }
  });
});

// ---------- bottom sheet ----------
var SHEET_HTML = {
  report:
    '<h3>➕ <span data-en="Report a spot" data-hi="जगह रिपोर्ट करें">Report a spot</span></h3>' +
    '<p class="sheet-sub" data-en="What did you feel here?" data-hi="यहाँ आपने क्या महसूस किया?">What did you feel here?</p>' +
    '<div class="cat-grid">' +
    '<button class="cat" disabled><span>🌑</span><span data-en="Unlit" data-hi="अंधेरा">Unlit</span></button>' +
    '<button class="cat" disabled><span>😠</span><span data-en="Harassment" data-hi="उत्पीड़न">Harassment</span></button>' +
    '<button class="cat" disabled><span>🏍️</span><span data-en="Theft" data-hi="चोरी">Theft</span></button>' +
    '<button class="cat" disabled><span>🐕</span><span data-en="Animals" data-hi="जानवर">Animals</span></button>' +
    '<button class="cat" disabled><span>🧱</span><span data-en="Structure" data-hi="ढाँचा">Structure</span></button>' +
    '<button class="cat" disabled><span>🌊</span><span data-en="Flooding" data-hi="बाढ़">Flooding</span></button>' +
    "</div>" +
    '<p class="sheet-note">🚧 <span data-en="One-tap reporting arrives in Phase 1. Today: tap the map to see the DIGIPIN of any spot." data-hi="एक-टैप रिपोर्टिंग Phase 1 में आएगी। आज: मैप पर टैप करके किसी भी जगह का DIGIPIN देखें।">One-tap reporting arrives in Phase 1. Today: tap the map to see the DIGIPIN of any spot.</span></p>'
};
function openSheet(key) {
  $("sheet-content").innerHTML = SHEET_HTML[key];
  $("sheet").setAttribute("aria-hidden", "false");
  $("sheet").classList.add("open");
  document.querySelectorAll("#sheet-content [data-en]").forEach(function (el) {
    el.textContent = el.getAttribute("data-" + LANG);
  });
}
function closeSheet() {
  $("sheet").setAttribute("aria-hidden", "true");
  $("sheet").classList.remove("open");
}
$("report-fab").addEventListener("click", function () { openSheet("report"); });
$("sheet").querySelector(".sheet-close").addEventListener("click", closeSheet);
$("sheet").querySelector(".sheet-handle").addEventListener("click", closeSheet);

// ---------- install ----------
var deferredPrompt = null;
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault(); deferredPrompt = e; show("install-btn");
});
$("install-btn").addEventListener("click", function () {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
});
var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && !window.matchMedia("(display-mode: standalone)").matches) {
  show("ios-hint");
  setTimeout(function () { hide("ios-hint"); }, 8000);
}

// ---------- service worker ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function () {});
}
