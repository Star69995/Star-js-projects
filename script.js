const projects = [
    { name: "קריפטוגרמה", url: "cryptogram/index.html" },
    { name: "שעון עצר", url: "timer/index.html" },
];

const container = document.getElementById('projects-container');

projects.forEach(project => {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project';
    projectDiv.innerHTML = `<a href="${project.url}" class="button">${project.name}</a>`;
    container.appendChild(projectDiv);
});
