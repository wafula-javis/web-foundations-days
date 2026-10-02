// day3/script.js - Notes Toolkit Functions
 
// Starting data, exactly as given in the assignment.
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
 
// Fixed category order - used both to validate addNote() and to control
// the order categories appear in getSummary(), so the sentence reads the
// same way every time regardless of which order notes happen to be in.
const CATEGORIES = ["personal", "work", "study"];
 
// --- Functions ---------------------------------------------------------
 
// Returns an array of notes whose text contains `word`, ignoring case.
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(lowerWord));
}
 
// Returns the note object with the most characters, or null if notes is empty.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  return notes.reduce((longest, note) =>
    note.text.length > longest.text.length ? note : longest
  );
}
 
// Returns an object counting notes per category, e.g. { personal: 2, study: 2, work: 1 }.
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}
 
// Returns a sentence like "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";
 
  // Handle the empty-notes case separately, so the sentence doesn't end
  // up with an awkward trailing ": ." when there's nothing to list.
  if (total === 0) {
    return `0 ${noteWord}.`;
  }
 
  const counts = countByCategory();
  const parts = CATEGORIES.filter((category) => counts[category] > 0).map(
    (category) => `${counts[category]} ${category}`
  );
 
  return `${total} ${noteWord}: ${parts.join(", ")}.`;
}
 
// Returns true if a note with the same text already exists, ignoring
// case and leading/trailing spaces.
function isDuplicate(text) {
  const normalized = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === normalized);
}
 
// Adds a note only if it's 1-200 characters (after trimming), not a
// duplicate, and the category is valid. Returns true when added, false
// otherwise - logging the specific reason for any rejection.
function addNote(text, category) {
  const trimmedLength = text.trim().length;
 
  if (trimmedLength < 1 || trimmedLength > 200) {
    console.log(
      `addNote rejected: text must be 1-200 characters (was ${trimmedLength}).`
    );
    return false;
  }
 
  if (isDuplicate(text)) {
    console.log(`addNote rejected: a note with this text already exists.`);
    return false;
  }
 
  if (!CATEGORIES.includes(category)) {
    console.log(`addNote rejected: "${category}" is not a valid category.`);
    return false;
  }
 
  const newId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: newId, text, category });
  return true;
}
 
// --- Tests ---------------------------------------------------------------
// Each function gets at least one normal case and one edge case.
 
console.log("-- searchNotes --");
console.log(searchNotes("milk"));
// Expected: [ { id: 1, text: "Buy milk and bread", category: "personal" } ]
 
console.log(searchNotes("ASSIGNMENT"));
// Expected: [ { id: 2, text: "Finish the Day 3 assignment", category: "study" } ]
// (shows matching is case-insensitive)
 
console.log(searchNotes("zzz"));
// Expected: [] (no note contains "zzz")
 
console.log("-- longestNote --");
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
 
const savedNotesA = notes;
notes = [];
console.log(longestNote());
// Expected: null (edge case: empty notes array)
notes = savedNotesA;
 
console.log("-- countByCategory --");
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }
 
const savedNotesB = notes;
notes = [];
console.log(countByCategory());
// Expected: {} (edge case: empty notes array)
notes = savedNotesB;
 
console.log("-- getSummary --");
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."
 
const savedNotesC = notes;
notes = [];
console.log(getSummary());
// Expected: "0 notes." (edge case: empty notes array)
notes = savedNotesC;
 
console.log("-- isDuplicate --");
console.log(isDuplicate("Call mum"));
// Expected: true
 
console.log(isDuplicate("  CALL MUM  "));
// Expected: true (ignores case and extra spaces)
 
console.log(isDuplicate("Buy groceries"));
// Expected: false
 
console.log("-- addNote --");
console.log(addNote("Pay electricity bill", "personal"));
// Expected: true
 
console.log(addNote("Call mum", "personal"));
// Expected: false (logs: a note with this text already exists)
 
console.log(addNote("Plan the office party", "fun"));
// Expected: false (logs: "fun" is not a valid category)
 
console.log(addNote("", "personal"));
// Expected: false (logs: text must be 1-200 characters, was 0)
 