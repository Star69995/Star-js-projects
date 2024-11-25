let counter;
const div = document.getElementById("increaseNumber");
if (localStorage.getItem("counter")) {
  div.innerText = localStorage.getItem("counter");
} else {
  counter = 0;
  localStorage.setItem("counter", counter);
  div.innerText = counter;
}

function increase() {
  localStorage.setItem("counter", counter++);

  div.innerText = localStorage.getItem("counter");
}

let inputEntry = document.querySelector("input");
let inputParagraph = document.getElementById("inputEntryFromLocalStorage");

if (localStorage.getItem("input")) {
  inputParagraph.innerText = localStorage.getItem("input");
}
function saveData() {
  localStorage.setItem("input", inputEntry.value);
  inputParagraph.innerText = localStorage.getItem("input");
}
