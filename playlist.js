const recents = JSON.parse(localStorage.getItem("animezone_recents")) || [];
const myList = JSON.parse(localStorage.getItem("animezone_mylist")) || [];

const recentGrid = document.getElementById("recentGrid");
const myListGrid = document.getElementById("myListGrid");

/* -------- RENDER -------- */

function renderGrid(list, grid, removable = false) {
  if (!list.length) {
    grid.innerHTML = `<p class="muted">Nothing here yet.</p>`;
    return;
  }

  grid.innerHTML = list.map(a => `
    <div class="card">
      <img src="${a.images?.jpg?.image_url || ""}">
      <div class="title">${a.title || ""}</div>
      ${removable ? `<button class="delete-btn" data-id="${a.mal_id}">Remove</button>` : ""}
    </div>
  `).join("");
}



/* -------- INIT -------- */

renderGrid(recents, recentGrid);
renderGrid(myList, myListGrid, true);

/* -------- REMOVE FROM MY LIST -------- */

myListGrid.onclick = e => {
  if (!e.target.classList.contains("delete-btn")) return;
  const id = +e.target.dataset.id;
  const updated = myList.filter(a => a.mal_id !== id);
  localStorage.setItem("animezone_mylist", JSON.stringify(updated));
  location.reload();
};
