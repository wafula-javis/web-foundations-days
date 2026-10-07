// users.js
 
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");
 
const USERS_URL = "https://jsonplaceholder.typicode.com/users";
 
let users = []; // the full, unfiltered list currently held in memory
 
// Builds one user's <li> using createElement/textContent only, never
// innerHTML, so nothing from the API response can be interpreted as HTML.
function createUserElement(user) {
  const li = document.createElement("li");
 
  const nameEl = document.createElement("strong");
  nameEl.textContent = user.name;
  li.appendChild(nameEl);
 
  const details = document.createElement("p");
  details.textContent = `${user.email} - ${user.address.city} - ${user.company.name}`;
  li.appendChild(details);
 
  return li;
}
 
// Draws any array of users passed to it - used both for the full list
// and for a filtered subset, so there's one rendering path either way.
function renderUsers(list) {
  usersList.textContent = ""; // clear existing <li> elements
 
  if (list.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No users match your filter.";
    usersList.appendChild(emptyItem);
    return;
  }
 
  list.forEach((user) => {
    usersList.appendChild(createUserElement(user));
  });
}
 
async function loadUsers() {
  loadBtn.disabled = true;
  status.textContent = "Loading users...";
 
  try {
    const response = await fetch(USERS_URL);
 
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
 
    users = await response.json();
    renderUsers(users);
    status.textContent = `Loaded ${users.length} users.`;
  } catch (error) {
    status.textContent = "Could not load users. Please try again.";
    console.error("loadUsers error:", error);
  } finally {
    loadBtn.disabled = false;
  }
}
 
// Filters the already-loaded array client-side - no new request is made,
// matching the requirement that filtering shouldn't re-fetch.
function applyFilter() {
  const term = filterInput.value.trim().toLowerCase();
  const filtered = term
    ? users.filter((user) => user.name.toLowerCase().includes(term))
    : users;
  renderUsers(filtered);
}
 
loadBtn.addEventListener("click", loadUsers);
filterInput.addEventListener("input", applyFilter);
 