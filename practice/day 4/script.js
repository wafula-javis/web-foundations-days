 day4/script.js
 
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");
 
const DRAFT_KEY = "day4-note-draft";
const THEME_KEY = "day4-theme";
const CHAR_LIMIT = 200;
const WARNING_THRESHOLD = 180;
 
// Counts words by splitting on whitespace. Trims first and explicitly
// returns 0 for an empty/whitespace-only textarea, so an empty box
// doesn't incorrectly count as "1 word" (splitting "" on whitespace
// would otherwise give [""], which has length 1).
function countWords(text) {
  const trimmed = text.trim();
  if (trimmed === "") {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}
 
// Updates both counter <p> elements and the warning/over classes on the
// character counter, based on the textarea's current content.
function updateCounts() {
  const text = noteText.value;
  const charLength = text.length;
  const wordTotal = countWords(text);
 
  charCount.textContent = `${charLength} / ${CHAR_LIMIT} characters`;
  wordCount.textContent = `${wordTotal} words`;
 
  // Remove both classes first, then add back only the one that applies -
  // this keeps them mutually exclusive and clears the class correctly
  // if the user deletes text back under a threshold.
  charCount.classList.remove("warning", "over");
 
  if (charLength > CHAR_LIMIT) {
    charCount.classList.add("over");
  } else if (charLength > WARNING_THRESHOLD) {
    charCount.classList.add("warning");
  }
}
 
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}
 
// Shared by both the Clear button and the Escape key, so the two stay
// in sync automatically instead of duplicating this logic twice.
function clearAll() {
  noteText.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
}
 
// Toggles the dark class on <body>, updates the toggle button's own
// label to describe what clicking it will do NEXT (so in light mode it
// reads "Dark mode", inviting you to switch to dark - and vice versa).
function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}
 
function toggleTheme() {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}
 
// --- Event listeners -------------------------------------------------
 
noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});
 
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearAll();
  }
});
 
clearBtn.addEventListener("click", clearAll);
themeToggle.addEventListener("click", toggleTheme);
 
// --- Restore saved state on page load ---------------------------------
 
const savedDraft = localStorage.getItem(DRAFT_KEY);
if (savedDraft !== null) {
  noteText.value = savedDraft;
}
 
const savedTheme = localStorage.getItem(THEME_KEY);
applyTheme(savedTheme === "dark");
 
updateCounts();
 