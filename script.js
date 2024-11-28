const projects = [
    { name: "האתר של סטאר", url: "https://star69995.github.io/star-site/" },
    { name: "קריפטוגרמה", url: "cryptogram/" },
    { name: "שעון עצר", url: "timer/" },
    { name: "מנהל משימות", url: "task_manager/"},
    { name: "משחק מתמטי", url: "mathGame/"},
    {name: "מזג אוויר", url: "weather/"},
    {name: "בונה דפים", url: "pageBuilder/"},
];

const container = document.getElementById('projects-container');

projects.forEach(project => {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project';
    projectDiv.innerHTML = `<a href="${project.url}" class="button">${project.name}</a>`;
    container.appendChild(projectDiv);
});
