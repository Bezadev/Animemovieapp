/* =========================================================
   AnimeZone — FULL SCRIPT (FINAL)
   Jikan API v4
   ✅ Added error handling & safe bindings
========================================================= */

/* ---------- GLOBAL ELEMENTS ---------- */
const heroTrack = document.getElementById("heroTrack");
const dotsWrap = document.getElementById("dots");

const recentsRow = document.getElementById("recentsRow");
const recentsEmpty = document.getElementById("recentsEmpty");

const releasesRow = document.getElementById("releasesRow");
const subRow = document.getElementById("subRow");
const dubRow = document.getElementById("dubRow");
const chinaRow = document.getElementById("chinaRow");

const genreButtons = document.getElementById("genreButtons");
const genreResults = document.getElementById("genreResults");

const playModal = document.getElementById("playModal");
const playContainer = document.getElementById("playContainer");
const playMeta = document.getElementById("playMeta");

const seeAllModal = document.getElementById("seeAllModal");
const seeAllTitle = document.getElementById("seeAllTitle");
const seeAllList = document.getElementById("seeAllList");

/* ---------- STORAGE ---------- */
const LS = {
  recents: "animezone_recents",
  mylist: "animezone_mylist"
};
const getLS = k => JSON.parse(localStorage.getItem(k)) || [];
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* =========================================================
   HELPER: FETCH WITH ERROR HANDLING
========================================================= */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* =========================================================
   HERO SECTION
========================================================= */
async function loadHero() {
  const data = await fetchJSON("https://api.jikan.moe/v4/top/anime?limit=10");

  heroTrack.innerHTML = "";
  dotsWrap.innerHTML = "";

  if (!data.length) {
    heroTrack.innerHTML = `<div class="muted">Failed to load top anime.</div>`;
    return;
  }

  data.forEach((anime, i) => {
    heroTrack.innerHTML += `
      <div class="slide">
        <img src="${anime.images?.jpg?.large_image_url || ''}">
        <div class="hero-actions">
          <button class="btn-play" data-id="${anime.mal_id}">Play</button>
          <button class="btn-list" data-id="${anime.mal_id}">+ My List</button>
        </div>
        <div class="meta">
          <span class="badge">${anime.type || "Anime"}</span>
          <div>${anime.title}</div>
        </div>
      </div>
    `;
    dotsWrap.innerHTML += `<div class="dot ${i===0 ? "active":""}" data-i="${i}"></div>`;
  });

  setupHero();
}

function setupHero() {
  const slides = [...heroTrack.children];
  const dots = [...dotsWrap.children];
  let index = 0;

  function goTo(i) {
    index = i;
    if (!slides[i]) return;
    heroTrack.scrollTo({ left: slides[i].offsetLeft - 20, behavior: "smooth" });
    dots.forEach(d => d.classList.remove("active"));
    if(dots[i]) dots[i].classList.add("active");
  }

  dots.forEach(d => d.onclick = () => goTo(+d.dataset.i));

  setInterval(() => goTo((index + 1) % slides.length), 10000);

  heroTrack.onclick = e => {
    if (e.target.classList.contains("btn-play")) onPlay(e.target.dataset.id);
    if (e.target.classList.contains("btn-list")) addToMyList(e.target.dataset.id);
  };
}

/* =========================================================
   PLAY FUNCTION
========================================================= */
async function onPlay(id) {
  const data = await fetchJSON(`https://api.jikan.moe/v4/anime/${id}`);
  if (!data) return;

  addToRecents(data);

  playContainer.innerHTML = data.trailer?.embed_url
    ? `<iframe src="${data.trailer.embed_url}" allowfullscreen></iframe>`
    : `<div class="muted">Trailer unavailable</div>`;

  playMeta.innerHTML = `<h3>${data.title}</h3><p>${data.synopsis || ""}</p>`;
  playModal.classList.add("open");
}

playModal.onclick = e => {
  if (e.target === playModal) playModal.classList.remove("open");
};

/* =========================================================
   MY LIST FUNCTION
========================================================= */
function addToMyList(id) {
  const list = getLS(LS.mylist);
  if (!list.includes(id)) {
    list.push(id);
    setLS(LS.mylist, list);
    alert("Added to My List");
  }
}

/* =========================================================
   RECENTS FUNCTION
========================================================= */
function addToRecents(anime) {
  let rec = getLS(LS.recents).filter(a => a.mal_id !== anime.mal_id);
  rec.unshift(anime);
  setLS(LS.recents, rec.slice(0,20));
  renderRecents();
}

function renderRecents() {
  const rec = getLS(LS.recents);
  if (!rec.length) {
    recentsEmpty.style.display = "block";
    recentsRow.innerHTML = "";
    return;
  }

  recentsEmpty.style.display = "none";
  recentsRow.innerHTML = rec.map(a => `
    <div class="card" data-id="${a.mal_id}">
      <img src="${a.images?.jpg?.image_url || ''}">
      <div class="title">${a.title}</div>
    </div>
  `).join("");

  recentsRow.onclick = e => {
    const card = e.target.closest(".card");
    if (card) onPlay(card.dataset.id);
  };
}

const recentsSeeAllBtn = document.getElementById("recentsSeeAll");
if(recentsSeeAllBtn) {
  recentsSeeAllBtn.onclick = () => openSeeAll("Recents", getLS(LS.recents));
}

/* =========================================================
   SEE ALL FUNCTION
========================================================= */
function openSeeAll(title, list) {
  seeAllTitle.textContent = title;
  seeAllList.innerHTML = list.map(a => `
    <div class="card" data-id="${a.mal_id}">
      <img src="${a.images?.jpg?.image_url || ''}">
      <div class="title">${a.title}</div>
    </div>
  `).join("");

  seeAllModal.classList.add("open");

  seeAllList.onclick = e => {
    const card = e.target.closest(".card");
    if (card) onPlay(card.dataset.id);
  };
}

const closeSeeAllBtn = document.getElementById("closeSeeAll");
if(closeSeeAllBtn) closeSeeAllBtn.onclick = () => seeAllModal.classList.remove("open");

/* =========================================================
   SECTIONS (Trending/All/Sub/Dub/China)
========================================================= */
async function fillRow(url, row) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    row.innerHTML = data.map(a => `
      <div class="card" data-id="${a.mal_id}">
        <img src="${a.images.jpg.image_url}">
        <div class="title">${a.title}</div>
      </div>
    `).join("");
    row.onclick = e => {
      const card = e.target.closest(".card");
      if (card) onPlay(card.dataset.id);
    };
  } catch (err) {
    console.error("Failed to load row:", err);
    row.innerHTML = `<div class="muted">Failed to load content. Try again later.</div>`;
  }
}


async function loadSections() {
  await fillRow("https://api.jikan.moe/v4/anime?limit=20", releasesRow);
  // await new Promise(r => setTimeout(r, 500)); // 0.5s delay
  await fillRow("https://api.jikan.moe/v4/anime?sfw=true&limit=20", subRow);
  // await new Promise(r => setTimeout(r, 500));
  await fillRow("https://api.jikan.moe/v4/anime?genres=8&limit=20", dubRow);
  // await new Promise(r => setTimeout(r, 500));
  await fillRow("https://api.jikan.moe/v4/anime?genres=78&limit=20", chinaRow);
}



/* =========================================================
   GENRES FUNCTION
========================================================= */
const GENRES = [
  { id: 1, name: "Action" },
  { id: 4, name: "Comedy" },
  { id: 10, name: "Fantasy" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" }
];

function loadGenreButtons() {
  genreButtons.innerHTML = GENRES.map(g =>
    `<button class="genre-btn" data-id="${g.id}">${g.name}</button>`
  ).join("");

  genreButtons.onclick = async e => {
    const btn = e.target.closest(".genre-btn");
    if (!btn) return;

    const data = await fetchJSON(`https://api.jikan.moe/v4/anime?genres=${btn.dataset.id}&limit=12`);

    genreResults.innerHTML = `
      <div class="genre-results-grid">
        ${data.map(a => `
          <div class="card" data-id="${a.mal_id}">
            <img src="${a.images?.jpg?.image_url || ''}">
            <div class="title">${a.title}</div>
          </div>
        `).join('')}
      </div>
    `;

    genreResults.onclick = e => {
      const card = e.target.closest(".card");
      if(card) onPlay(card.dataset.id);
    };
  };
}


// /* =========================================================
//    USER PANEL & STATS
// ========================================================= */
const navUser = document.getElementById("navUser");
const userPanel = document.getElementById("userPanel");

// Toggle panel
navUser.onclick = () => userPanel.classList.toggle("open");

// Click outside to close
userPanel.onclick = e => {
  if(e.target === userPanel) userPanel.classList.remove("open");
};

// Update stats dynamically
function updateUserStats() {
  const recents = JSON.parse(localStorage.getItem("animezone_recents")) || [];
  const myList = JSON.parse(localStorage.getItem("animezone_mylist")) || [];

  document.getElementById("statWatched").textContent = recents.length;
  document.getElementById("statList").textContent = myList.length;

  const genres = {};
  recents.forEach(a => a.genres?.forEach(g => {
    genres[g.name] = (genres[g.name] || 0) + 1;
  }));

  const topGenre = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById("statGenre").textContent = topGenre ? topGenre[0] : "—";
}

// Call on page load and after actions
updateUserStats();

// Actions
document.getElementById("clearRecents").onclick = () => {
  if(confirm("Clear watch history?")) {
    localStorage.removeItem("animezone_recents");
    updateUserStats();
  }
};

document.getElementById("clearMyList").onclick = () => {
  if(confirm("Clear My List?")) {
    localStorage.removeItem("animezone_mylist");
    updateUserStats();
  }
};




/* =========================================================
   THEME SWITCH
========================================================= */
const themeButtons = document.querySelectorAll(".theme-btn");

function applyTheme(mode){
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("animezone_theme", mode);

  // update active button
  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

// click handlers
themeButtons.forEach(btn => {
  btn.onclick = () => applyTheme(btn.dataset.mode);
});

// init on load
(() => {
  const saved = localStorage.getItem("animezone_theme") || "dark";
  applyTheme(saved);
})();


// close button 
const closeUserPanel = document.getElementById("closeUserPanel");

// Open/close panel
navUser.onclick = () => userPanel.classList.add("open");
closeUserPanel.onclick = () => userPanel.classList.remove("open");

// Also click outside to close
userPanel.onclick = e => {
  if(e.target === userPanel) userPanel.classList.remove("open");
};

/* =========================================================
   INIT
========================================================= */
loadHero();
loadSections();
loadGenreButtons();
renderRecents();
createSearchModal();
