const container = document.getElementById('projects-container');

const overlay = document.getElementById('editor-overlay');
const openEditorBtn = document.getElementById('open-editor-btn');
const closeEditorBtn = document.getElementById('close-editor-btn');
const passwordGate = document.getElementById('password-gate');
const passwordInput = document.getElementById('password-input');
const unlockBtn = document.getElementById('unlock-btn');
const editorBody = document.getElementById('editor-body');
const linksList = document.getElementById('links-list');
const editorStatus = document.getElementById('editor-status');
const addLinkForm = document.getElementById('add-link-form');
const newUrlInput = document.getElementById('new-url');
const newNameInput = document.getElementById('new-name');
const fetchMetaBtn = document.getElementById('fetch-meta-btn');
const newPreview = document.getElementById('new-preview');
const saveLinksBtn = document.getElementById('save-links-btn');

let links = [];
let editingPassword = sessionStorage.getItem('edit-password') || '';
let dragSrcIndex = null;

function faviconFor(url) {
    try {
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`;
    } catch {
        return '';
    }
}

function renderProjects() {
    container.innerHTML = '';
    links.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project';
        projectDiv.innerHTML = `<a href="${escapeAttr(project.url)}" class="button" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a>`;
        container.appendChild(projectDiv);
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function escapeAttr(str) {
    return escapeHtml(str);
}

async function loadLinks() {
    try {
        const res = await fetch('/api/links');
        links = await res.json();
    } catch {
        links = [];
    }
    renderProjects();
}

function setStatus(message, isError = false) {
    editorStatus.textContent = message || '';
    editorStatus.classList.toggle('error', Boolean(isError));
}

function renderLinksList() {
    linksList.innerHTML = '';
    links.forEach((link, index) => {
        const row = document.createElement('div');
        row.className = 'link-row';
        row.draggable = true;
        row.innerHTML = `
            <span class="drag-handle" title="גרירה לשינוי סדר">&#9776;</span>
            <img class="favicon" src="${escapeAttr(faviconFor(link.url))}" alt="">
            <div class="link-fields">
                <input class="name-input" type="text" value="${escapeAttr(link.name)}" placeholder="שם">
                <input class="url-input" type="url" value="${escapeAttr(link.url)}" placeholder="כתובת">
            </div>
            <div class="row-actions">
                <div class="move-row">
                    <button type="button" class="move-up" ${index === 0 ? 'disabled' : ''}>&#8593;</button>
                    <button type="button" class="move-down" ${index === links.length - 1 ? 'disabled' : ''}>&#8595;</button>
                </div>
                <button type="button" class="delete-btn">מחיקה</button>
            </div>
        `;

        row.addEventListener('dragstart', e => {
            dragSrcIndex = index;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            dragSrcIndex = null;
        });
        row.addEventListener('dragover', e => {
            e.preventDefault();
            if (dragSrcIndex !== null && dragSrcIndex !== index) row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });
        row.addEventListener('drop', e => {
            e.preventDefault();
            row.classList.remove('drag-over');
            if (dragSrcIndex === null || dragSrcIndex === index) return;
            const [moved] = links.splice(dragSrcIndex, 1);
            links.splice(index, 0, moved);
            renderLinksList();
        });

        row.querySelector('.name-input').addEventListener('input', e => {
            links[index].name = e.target.value;
        });
        row.querySelector('.url-input').addEventListener('input', e => {
            links[index].url = e.target.value;
            row.querySelector('.favicon').src = faviconFor(e.target.value);
        });
        row.querySelector('.move-up').addEventListener('click', () => {
            if (index === 0) return;
            [links[index - 1], links[index]] = [links[index], links[index - 1]];
            renderLinksList();
        });
        row.querySelector('.move-down').addEventListener('click', () => {
            if (index === links.length - 1) return;
            [links[index + 1], links[index]] = [links[index], links[index + 1]];
            renderLinksList();
        });
        row.querySelector('.delete-btn').addEventListener('click', () => {
            links.splice(index, 1);
            renderLinksList();
        });

        linksList.appendChild(row);
    });
}

function openEditor() {
    overlay.hidden = false;
    setStatus('');
    if (editingPassword) {
        showEditorBody();
    } else {
        passwordGate.hidden = false;
        editorBody.hidden = true;
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function closeEditor() {
    overlay.hidden = true;
}

function showEditorBody() {
    passwordGate.hidden = true;
    editorBody.hidden = false;
    renderLinksList();
    newUrlInput.value = '';
    newNameInput.value = '';
    newPreview.innerHTML = '';
}

async function tryUnlock() {
    const candidate = passwordInput.value;
    if (!candidate) return;
    setStatus('בודק סיסמה...');
    try {
        const res = await fetch('/api/check-password', {
            method: 'POST',
            headers: { 'x-edit-password': candidate },
        });
        const data = await res.json();
        if (data.ok) {
            editingPassword = candidate;
            sessionStorage.setItem('edit-password', candidate);
            setStatus('');
            showEditorBody();
        } else {
            setStatus('סיסמה שגויה', true);
        }
    } catch {
        setStatus('שגיאת תקשורת, נסה שוב', true);
    }
}

async function fetchMeta(url) {
    const res = await fetch(`/api/meta?url=${encodeURIComponent(url)}`, {
        headers: { 'x-edit-password': editingPassword },
    });
    if (res.status === 401) {
        editingPassword = '';
        sessionStorage.removeItem('edit-password');
        openEditor();
        throw new Error('unauthorized');
    }
    if (!res.ok) throw new Error('fetch failed');
    return res.json();
}

async function saveLinks() {
    setStatus('שומר...');
    saveLinksBtn.disabled = true;
    try {
        const res = await fetch('/api/links', {
            method: 'PUT',
            headers: {
                'content-type': 'application/json',
                'x-edit-password': editingPassword,
            },
            body: JSON.stringify({ links }),
        });
        if (res.status === 401) {
            editingPassword = '';
            sessionStorage.removeItem('edit-password');
            setStatus('הסיסמה לא תקינה יותר, יש להתחבר מחדש', true);
            openEditor();
            return;
        }
        if (!res.ok) throw new Error('save failed');
        const data = await res.json();
        links = data.links;
        renderProjects();
        renderLinksList();
        setStatus('נשמר בהצלחה');
    } catch {
        setStatus('שמירה נכשלה, נסה שוב', true);
    } finally {
        saveLinksBtn.disabled = false;
    }
}

openEditorBtn.addEventListener('click', openEditor);
closeEditorBtn.addEventListener('click', closeEditor);
overlay.addEventListener('click', e => {
    if (e.target === overlay) closeEditor();
});
unlockBtn.addEventListener('click', tryUnlock);
passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') tryUnlock();
});

fetchMetaBtn.addEventListener('click', async () => {
    const url = newUrlInput.value.trim();
    if (!url) {
        setStatus('יש להזין כתובת קודם', true);
        return;
    }
    setStatus('שואב פרטים...');
    newPreview.innerHTML = '';
    try {
        const meta = await fetchMeta(url);
        newNameInput.value = meta.title || '';
        newPreview.innerHTML = `<img src="${escapeAttr(meta.favicon)}" alt=""><span>${escapeHtml(meta.title || '')}</span>`;
        setStatus('');
    } catch {
        setStatus('לא ניתן לשאוב פרטים, אפשר למלא שם ידנית', true);
    }
});

addLinkForm.addEventListener('submit', e => {
    e.preventDefault();
    const url = newUrlInput.value.trim();
    const name = newNameInput.value.trim();
    if (!url || !name) return;
    links.push({ id: crypto.randomUUID(), name, url });
    newUrlInput.value = '';
    newNameInput.value = '';
    newPreview.innerHTML = '';
    renderLinksList();
    setStatus('הקישור נוסף לרשימה - לא לשכוח לשמור');
});

saveLinksBtn.addEventListener('click', saveLinks);

loadLinks();
