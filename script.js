const projects = [
    { name: "האתר של סטאר", url: "https://star69995.github.io/star-site/" },
    { name: "תשחץ", url: "https://star69995.github.io/star-crossword/" },
    { name: "קריפטוגרמה", url: "https://star69995.github.io/star-site/js-projects/cryptogram/" },
    { name: "שעון עצר", url: "https://star69995.github.io/star-site/js-projects/timer/" },
    { name: "מנהל משימות", url: "https://star69995.github.io/star-site/js-projects/task_manager/"},
    { name: "משחק מתמטי", url: "https://star69995.github.io/star-site/js-projects/mathGame/"},
    { name: "מזג אוויר", url: "https://star69995.github.io/star-site/js-projects/weather/"},
    { name: "מחשבון קרשים", url: "https://star69995.github.io/star-site/js-projects/wood-calc/"},
];

const container = document.getElementById('projects-container');

projects.forEach(project => {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project';
    projectDiv.innerHTML = `<a href="${project.url}" class="button">${project.name}</a>`;
    container.appendChild(projectDiv);
});
