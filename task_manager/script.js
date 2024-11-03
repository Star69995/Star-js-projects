// script.js

const listInput = document.getElementById("listInput");
const addListButton = document.getElementById("addListButton");
const listsArea = document.querySelector(".listsArea");

// Load lists from local storage on page load
document.addEventListener("DOMContentLoaded", loadLists);

addListButton.addEventListener("click", addList);

function addList() {
    const listValue = listInput.value.trim();
    if (listValue === "") return;

    const listDiv = createListDiv(listValue);
    listsArea.appendChild(listDiv);

    // Save to local storage
    saveListToLocalStorage(listValue);
    listInput.value = ""; // Clear list input
}

function createListDiv(listValue) {
    const listDiv = document.createElement("div");
    listDiv.classList.add("list");
    listDiv.innerHTML = `<h2>${listValue}</h2><div class="tasks"></div>`;

    // Create input field for adding tasks to this list
    const taskInput = document.createElement("input");
    taskInput.type = "text";
    taskInput.placeholder = "הוסף משימה לרשימה זו";
    listDiv.appendChild(taskInput);

    // Create button to add tasks to this list
    const taskButton = document.createElement("button");
    taskButton.textContent = "הוסף משימה";
    taskButton.onclick = () => {
        const taskValue = taskInput.value.trim();
        if (taskValue) {
            addTaskToList(listDiv.querySelector(".tasks"), { name: taskValue, completed: false });
            saveTaskToLocalStorage(listValue, { name: taskValue, completed: false });
            taskInput.value = ""; // Clear task input after adding
        }
    };

    listDiv.appendChild(taskButton);

    // Create delete button for the list
    const deleteListButton = document.createElement("button");
    deleteListButton.innerHTML = "X"; // Using HTML entity for a black cross
    deleteListButton.classList.add("delete-button"); // Add a class for styling
    deleteListButton.onclick = () => confirmDeleteList(listDiv, listValue);
    listDiv.appendChild(deleteListButton);


    return listDiv;
}

function confirmDeleteList(listDiv, listValue) {
    const deleteListButton = listDiv.querySelector('.delete-button');
    if (!deleteListButton.classList.contains('red')) {
        deleteListButton.classList.add('red'); // Add red class on first click
        setTimeout(() => {
            deleteListButton.classList.remove('red'); // Reset after 5 seconds
        }, 5000);
    } else {
        listsArea.removeChild(listDiv); // Remove the list from the DOM
        deleteListFromLocalStorage(listValue); // Remove the list from local storage
    }
}

function confirmDeleteTask(taskDiv, taskName, tasksContainer) {
    const deleteTaskButton = taskDiv.querySelector('.delete-button');
    if (!deleteTaskButton.classList.contains('red')) {
        deleteTaskButton.classList.add('red'); // Add red class on first click
        setTimeout(() => {
            deleteTaskButton.classList.remove('red'); // Reset after 5 seconds
        }, 5000);
    } else {
        tasksContainer.removeChild(taskDiv); // Remove the task from the DOM
        deleteTaskFromLocalStorage(taskName); // Remove the task from local storage
    }
}


function deleteListFromLocalStorage(listValue) {
    let lists = JSON.parse(localStorage.getItem("lists")) || [];
    lists = lists.filter(list => list !== listValue);
    localStorage.setItem("lists", JSON.stringify(lists));

    // Remove associated tasks
    let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    delete tasks[listValue];
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTaskToList(tasksContainer, task) {
    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task-row");

    // Create a container for the checkbox and label
    const taskContent = document.createElement("div");
    taskContent.classList.add("task-content"); // add class for styling

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed; // Set the checkbox state
    checkbox.onchange = () => {
        task.completed = checkbox.checked; // Update task completion status
        saveTasksToLocalStorage(); // Save all tasks when a task is checked/unchecked
    };

    const label = document.createElement("label");
    label.textContent = task.name;

    // Append checkbox and label to the content container
    taskContent.appendChild(checkbox);
    taskContent.appendChild(label);

    // Create delete button for the task
    const deleteTaskButton = document.createElement("button");
    deleteTaskButton.innerHTML = "X"; // Using HTML entity for a black cross
    deleteTaskButton.classList.add("delete-button"); // Add a class for styling
    deleteTaskButton.onclick = () => confirmDeleteTask(taskDiv, task.name, tasksContainer);

    // Append the task content and delete button to the taskDiv
    taskDiv.appendChild(taskContent);
    taskDiv.appendChild(deleteTaskButton);

    tasksContainer.appendChild(taskDiv);
}


let deleteConfirmationActive = false; // Global flag to track delete confirmation

function confirmDeleteTask(taskDiv, taskName, tasksContainer) {
    const deleteTaskButton = taskDiv.querySelector('button:last-child');

    if (!deleteConfirmationActive) {
        deleteConfirmationActive = true; // Set the flag
        // deleteTaskButton.textContent = "לחץ שוב כדי לאשר";
        deleteTaskButton.classList.add("red"); // Add red class for confirmation styling

        // Reset confirmation state after 5 seconds
        setTimeout(() => {
            deleteTaskButton.classList.remove("red"); // Remove red class
            deleteConfirmationActive = false; // Reset the flag
        }, 5000);
    } else {
        tasksContainer.removeChild(taskDiv); // Remove the task from the DOM
        deleteTaskFromLocalStorage(taskName); // Remove the task from local storage
        deleteConfirmationActive = false; // Reset the flag after deletion
    }
}

// Add an event listener to the document to cancel the confirmation on outside clicks
document.addEventListener('click', (event) => {
    if (deleteConfirmationActive && !event.target.closest('.delete-button')) {
        const allDeleteButtons = document.querySelectorAll('.delete-button');
        allDeleteButtons.forEach(button => {
            deleteTaskButton.classList.remove("red"); // Remove red class
        });
        deleteConfirmationActive = false; // Reset the flag
    }
});


function deleteTaskFromLocalStorage(taskName) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    for (const list in tasks) {
        tasks[list] = tasks[list].filter(task => task.name !== taskName);
    }
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveListToLocalStorage(list) {
    let lists = JSON.parse(localStorage.getItem("lists")) || [];
    if (!lists.includes(list)) {
        lists.push(list);
        localStorage.setItem("lists", JSON.stringify(lists));
    }
}

function saveTaskToLocalStorage(list, task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    tasks[list] = tasks[list] || [];
    tasks[list].push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadLists() {
    const lists = JSON.parse(localStorage.getItem("lists")) || [];
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {};

    lists.forEach(list => {
        const listDiv = createListDiv(list);
        listsArea.appendChild(listDiv);

        // Load existing tasks for this list
        const tasksContainer = listDiv.querySelector(".tasks");
        if (tasks[list]) {
            tasks[list].forEach(task => {
                addTaskToList(tasksContainer, task);
            });
        }
    });
}

// Save all tasks to local storage whenever a task is updated
function saveTasksToLocalStorage() {
    const allTasks = {};
    const lists = JSON.parse(localStorage.getItem("lists")) || [];

    lists.forEach(list => {
        const tasks = [];
        const tasksContainer = document.querySelector(`.list:nth-child(${lists.indexOf(list) + 1}) .tasks`);
        tasksContainer.querySelectorAll('.task').forEach(taskDiv => {
            const checkbox = taskDiv.querySelector('input[type="checkbox"]');
            const label = taskDiv.querySelector('label');
            tasks.push({ name: label.textContent, completed: checkbox.checked });
        });
        allTasks[list] = tasks;
    });

    localStorage.setItem("tasks", JSON.stringify(allTasks));
}
