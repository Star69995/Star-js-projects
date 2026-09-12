const container = document.getElementById('projects-container');

const overlay = document.getElementById('editor-overlay');
const openEditorBtn = document.getElementById('open-editor-btn');
const closeEditorBtn = document.getElementById('close-editor-btn');
const passwordGate = document.getElementById('password-gate');
const passwordInput = document.getElementById('password-input');
const unlockBtn = document.getElementById('unlock-btn');
const editorBody = document.getElementById('editor-body');
const sectionsList = document.getElementById('sections-list');
const editorStatus = document.getElementById('editor-status');
const addSectionForm = document.getElementById('add-section-form');
const newSectionNameInput = document.getElementById('new-section-name');
const newSectionPrivateInput = document.getElementById('new-section-private');
const addLinkForm = document.getElementById('add-link-form');
const newLinkSectionSelect = document.getElementById('new-link-section');
const newUrlInput = document.getElementById('new-url');
const newNameInput = document.getElementById('new-name');
const newDescriptionInput = document.getElementById('new-description');
const fetchMetaBtn = document.getElementById('fetch-meta-btn');
const newPreview = document.getElementById('new-preview');
const saveLinksBtn = document.getElementById('save-links-btn');
const editorPanel = document.getElementById('editor-panel');
const editorScroll = document.getElementById('editor-scroll');
const editorFooter = document.getElementById('editor-footer');

// Sections shown on the public grid - always privacy-filtered (the server never even
// sends private sections to an unauthenticated request, but this stays separate from
// `sections` below so a private section can never leak into the public grid's own state.
let publicSections = [];
// Sections shown/edited in the editor - includes private sections once authorized.
let sections = [];
// What renderProjects() actually draws: publicSections while anonymous, or the full
// (private-included) `sections` once the stored password has been verified.
let displaySections = [];
let editingPassword = sessionStorage.getItem('edit-password') || '';

const TRASH_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;
const REFRESH_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;

// Pointer-based drag-and-drop for reordering sections/links. Native HTML5 drag-and-drop
// (dragstart/dragover/drop) does not fire reliably on touch devices, so reordering must
// go through Pointer Events instead to work on phones, not just with a mouse.
// { type: 'link'|'section', sectionIndex, linkIndex?, pointerId, sourceEl, ghost,
//   offsetX, offsetY, highlightEl, lastTarget, scrollDy, autoScrollRAF } | null
let dragState = null;

function clearDragHighlight() {
    if (dragState?.highlightEl) {
        dragState.highlightEl.classList.remove('drag-over');
        dragState.highlightEl = null;
    }
}

function findDropTarget(clientX, clientY) {
    if (!dragState) return null;
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    if (dragState.type === 'link') {
        const rowEl = el.closest('.link-row');
        if (rowEl && rowEl !== dragState.sourceEl && sectionsList.contains(rowEl)) {
            return {
                type: 'link',
                sectionIndex: Number(rowEl.dataset.sectionIndex),
                linkIndex: Number(rowEl.dataset.linkIndex),
                el: rowEl,
            };
        }
        const block = el.closest('.section-block');
        if (block) {
            return {
                type: 'link-end',
                sectionIndex: Number(block.dataset.sectionIndex),
                el: block.querySelector('.section-links'),
            };
        }
        return null;
    }
    if (dragState.type === 'section') {
        const block = el.closest('.section-block');
        if (block && block !== dragState.sourceEl) {
            return {
                type: 'section',
                sectionIndex: Number(block.dataset.sectionIndex),
                el: block,
            };
        }
        return null;
    }
    return null;
}

function updateDragHighlight(target) {
    if (dragState.highlightEl && dragState.highlightEl !== target?.el) {
        dragState.highlightEl.classList.remove('drag-over');
    }
    if (target?.el) target.el.classList.add('drag-over');
    dragState.highlightEl = target?.el || null;
    dragState.lastTarget = target;
}

function updateAutoScroll(clientY) {
    const rect = editorScroll.getBoundingClientRect();
    const edge = 50;
    if (clientY < rect.top + edge) {
        dragState.scrollDy = -Math.round((rect.top + edge - clientY) / 3) - 2;
    } else if (clientY > rect.bottom - edge) {
        dragState.scrollDy = Math.round((clientY - (rect.bottom - edge)) / 3) + 2;
    } else {
        dragState.scrollDy = 0;
    }
}

function autoScrollStep() {
    if (!dragState) return;
    if (dragState.scrollDy) editorScroll.scrollTop += dragState.scrollDy;
    dragState.autoScrollRAF = requestAnimationFrame(autoScrollStep);
}

function positionGhost(clientX, clientY) {
    dragState.ghost.style.left = `${clientX - dragState.offsetX}px`;
    dragState.ghost.style.top = `${clientY - dragState.offsetY}px`;
}

function onDragMove(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    e.preventDefault();
    positionGhost(e.clientX, e.clientY);
    updateDragHighlight(findDropTarget(e.clientX, e.clientY));
    updateAutoScroll(e.clientY);
}

function commitDrag() {
    const target = dragState.lastTarget;
    if (!target) return;
    if (dragState.type === 'section' && target.type === 'section') {
        const from = dragState.sectionIndex;
        let to = target.sectionIndex;
        if (to === from) return;
        const [moved] = sections.splice(from, 1);
        if (to > from) to -= 1;
        sections.splice(to, 0, moved);
        renderSections();
    } else if (dragState.type === 'link') {
        const fromSection = dragState.sectionIndex;
        const fromIndex = dragState.linkIndex;
        if (target.type === 'link') {
            const toSection = target.sectionIndex;
            let toIndex = target.linkIndex;
            if (toSection === fromSection && toIndex === fromIndex) return;
            const [moved] = sections[fromSection].links.splice(fromIndex, 1);
            if (toSection === fromSection && toIndex > fromIndex) toIndex -= 1;
            sections[toSection].links.splice(toIndex, 0, moved);
            renderSections();
        } else if (target.type === 'link-end') {
            const toSection = target.sectionIndex;
            const [moved] = sections[fromSection].links.splice(fromIndex, 1);
            sections[toSection].links.push(moved);
            renderSections();
        }
    }
}

function finishDrag() {
    if (!dragState) return;
    if (dragState.autoScrollRAF) cancelAnimationFrame(dragState.autoScrollRAF);
    dragState.ghost.remove();
    dragState.sourceEl.classList.remove('dragging');
    clearDragHighlight();
    document.body.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragCancel);
    dragState = null;
}

function onDragEnd(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    commitDrag();
    finishDrag();
}

function onDragCancel(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    finishDrag();
}

// Starts a drag from a pointerdown on a .drag-handle. `labelText` is shown on the
// floating ghost that follows the pointer; `payload` carries the source indices.
function beginDrag(e, type, payload, sourceEl, labelText) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = sourceEl.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = labelText || '';
    ghost.style.width = `${Math.min(rect.width, 260)}px`;
    document.body.appendChild(ghost);

    sourceEl.classList.add('dragging');
    document.body.classList.add('is-dragging');

    dragState = {
        type,
        ...payload,
        pointerId: e.pointerId,
        sourceEl,
        ghost,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        highlightEl: null,
        lastTarget: null,
        scrollDy: 0,
        autoScrollRAF: null,
    };
    positionGhost(e.clientX, e.clientY);
    dragState.autoScrollRAF = requestAnimationFrame(autoScrollStep);

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragCancel);
}

// Keeps the full-screen editor panel's own size/position in sync with the visible
// (keyboard-excluded) area, via window.visualViewport - iOS Safari shrinks/offsets the
// visual viewport without touching the layout viewport when the keyboard opens, and
// doesn't fire visualViewport events continuously during its own open/close animation,
// so a plain 100dvh panel can end up with its bottom (the save button) under the
// keyboard. Polling with requestAnimationFrame while a field is focused keeps the panel
// - and everything sticky inside it - tracking the keyboard's animation smoothly.
function initViewportTracking(shell) {
    if (!window.visualViewport) return;
    let rafId = null;
    const update = () => {
        const vv = window.visualViewport;
        shell.style.setProperty('--vv-top', `${vv.offsetTop}px`);
        shell.style.setProperty('--vv-height', `${vv.height}px`);
    };
    const loop = () => {
        update();
        rafId = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        update();
    };
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    shell.addEventListener('focusin', e => {
        if (!e.target.matches('input, textarea, select')) return;
        if (!rafId) loop();
        // Scroll the field into view as soon as it's focused, not only once the user
        // starts typing - it may already be hidden under the keyboard the instant it opens.
        e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    shell.addEventListener('focusout', e => {
        if (e.target.matches('input, textarea, select')) stopLoop();
    });
    update();
}

function faviconCandidates(url) {
    try {
        const parsed = new URL(url);
        return [
            `${parsed.origin}/favicon.ico`,
            `/api/favicon?url=${encodeURIComponent(parsed.href)}`,
            `https://icons.duckduckgo.com/ip3/${encodeURIComponent(parsed.hostname)}.ico`,
        ];
    } catch {
        return [];
    }
}

// Tries each favicon source in order, falling back to the next one on load failure.
function setFavicon(imgEl, url) {
    const candidates = faviconCandidates(url);
    let i = 0;
    const tryNext = () => {
        if (i >= candidates.length) {
            imgEl.removeEventListener('error', tryNext);
            return;
        }
        imgEl.src = candidates[i++];
    };
    imgEl.addEventListener('error', tryNext);
    tryNext();
}

// Loads the thumbnail async (the worker returns JSON, not the image directly).
function loadThumbnail(imgEl, url) {
    try {
        new URL(url);
    } catch {
        return;
    }
    fetch(`/api/thumbnail?url=${encodeURIComponent(url)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (!data) return;
            imgEl.src = data.url;
        })
        .catch(() => {});
}

function buildProjectCard(project) {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = project.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'project-thumb-wrap';

    const thumb = document.createElement('img');
    thumb.className = 'project-thumb';
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.addEventListener('error', () => { thumb.style.display = 'none'; }, { once: true });
    loadThumbnail(thumb, project.url);
    thumbWrap.appendChild(thumb);

    const info = document.createElement('div');
    info.className = 'project-info';

    const favicon = document.createElement('img');
    favicon.className = 'project-favicon';
    favicon.alt = '';
    setFavicon(favicon, project.url);

    const name = document.createElement('span');
    name.className = 'project-name';
    name.textContent = project.name;

    info.append(favicon, name);
    card.append(thumbWrap, info);

    if (project.description) {
        const descToggle = document.createElement('button');
        descToggle.type = 'button';
        descToggle.className = 'project-desc-toggle';
        descToggle.textContent = 'ⓘ';
        descToggle.title = 'הצג תיאור';
        descToggle.setAttribute('aria-expanded', 'false');
        info.appendChild(descToggle);

        const desc = document.createElement('p');
        desc.className = 'project-description';
        desc.textContent = project.description;
        desc.hidden = true;
        card.appendChild(desc);

        descToggle.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            desc.hidden = !desc.hidden;
            descToggle.classList.toggle('is-open', !desc.hidden);
            descToggle.setAttribute('aria-expanded', String(!desc.hidden));
        });
    }

    return card;
}

function renderProjects() {
    container.innerHTML = '';
    displaySections.forEach(section => {
        if (!section.links.length) return;

        const title = document.createElement('h2');
        title.className = 'section-title' + (section.private ? ' is-private' : '');
        title.textContent = section.name;
        if (section.private) {
            const badge = document.createElement('span');
            badge.className = 'private-badge';
            badge.textContent = 'אישי';
            title.appendChild(badge);
        }
        container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'project-grid';
        section.links.forEach(project => grid.appendChild(buildProjectCard(project)));
        container.appendChild(grid);
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
        const data = await res.json();
        publicSections = data.sections ?? [];
    } catch {
        publicSections = [];
    }
    displaySections = publicSections;

    // A password from an earlier session is still stored - re-verify it and, if it's
    // still valid, show private sections on the grid too instead of only in the editor.
    if (editingPassword) {
        try {
            await loadEditorSections();
            displaySections = sections;
        } catch {
            // stored password no longer valid; loadEditorSections() already cleared it
        }
    }
    renderProjects();
}

// Fetches the full section list (private sections included) for the editor. Separate
// from loadLinks() because that one is anonymous and only ever receives public data.
async function loadEditorSections() {
    // no-store: the same URL was very likely already fetched anonymously (by loadLinks)
    // and cached by the browser as a public, 24h-cacheable response. Without this, the
    // browser can silently reuse that cached response here - the x-edit-password header
    // isn't in the server's Vary list, so it doesn't affect the browser's cache match -
    // and this authenticated request would come back with stale, private-sections-free data.
    const res = await fetch('/api/links', { headers: { 'x-edit-password': editingPassword }, cache: 'no-store' });
    if (res.status === 401) {
        editingPassword = '';
        sessionStorage.removeItem('edit-password');
        displaySections = publicSections;
        throw new Error('unauthorized');
    }
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    sections = data.sections ?? [];
}

function setStatus(message, isError = false) {
    editorStatus.textContent = message || '';
    editorStatus.classList.toggle('error', Boolean(isError));
}

function buildLinkRow(section, sectionIndex, link, linkIndex) {
    const row = document.createElement('div');
    row.className = 'link-row';
    row.dataset.sectionIndex = String(sectionIndex);
    row.dataset.linkIndex = String(linkIndex);
    row.innerHTML = `
        <span class="drag-handle" title="גרירה לשינוי סדר">&#9776;</span>
        <img class="favicon" alt="">
        <div class="link-fields">
            <input class="name-input" type="text" value="${escapeAttr(link.name)}" placeholder="שם">
            <input class="url-input" type="url" value="${escapeAttr(link.url)}" placeholder="כתובת">
            <textarea class="description-input" placeholder="תיאור (אופציונלי)" rows="2">${escapeHtml(link.description || '')}</textarea>
        </div>
        <div class="row-actions">
            <button type="button" class="refresh-btn" title="שאיבת פרטים מחדש" aria-label="שאיבת פרטים מחדש">${REFRESH_ICON}</button>
            <button type="button" class="delete-btn" title="מחיקה" aria-label="מחיקה">${TRASH_ICON}</button>
        </div>
    `;

    setFavicon(row.querySelector('.favicon'), link.url);

    row.querySelector('.drag-handle').addEventListener('pointerdown', e => {
        beginDrag(e, 'link', { sectionIndex, linkIndex }, row, link.name || link.url);
    });

    row.querySelector('.name-input').addEventListener('input', e => {
        link.name = e.target.value;
    });
    row.querySelector('.url-input').addEventListener('input', e => {
        link.url = e.target.value;
        setFavicon(row.querySelector('.favicon'), e.target.value);
    });
    row.querySelector('.description-input').addEventListener('input', e => {
        link.description = e.target.value;
    });
    row.querySelector('.refresh-btn').addEventListener('click', async () => {
        const url = link.url.trim();
        if (!url) {
            setStatus('אין כתובת לשאוב ממנה', true);
            return;
        }
        setStatus('שואב פרטים...');
        try {
            const meta = await fetchMeta(url);
            if (meta.title) {
                link.name = meta.title;
                row.querySelector('.name-input').value = meta.title;
            }
            if (meta.description) {
                link.description = meta.description;
                row.querySelector('.description-input').value = meta.description;
            }
            setFavicon(row.querySelector('.favicon'), url);
            setStatus('הפרטים עודכנו - לא לשכוח לשמור');
        } catch {
            setStatus('לא ניתן לשאוב פרטים', true);
        }
    });
    row.querySelector('.delete-btn').addEventListener('click', () => {
        section.links.splice(linkIndex, 1);
        renderSections();
    });

    return row;
}

function refreshLinkSectionOptions() {
    const previousValue = newLinkSectionSelect.value;
    newLinkSectionSelect.innerHTML = '';
    sections.forEach((section, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = section.name || '(ללא שם)';
        newLinkSectionSelect.appendChild(option);
    });
    if (previousValue && Number(previousValue) < sections.length) {
        newLinkSectionSelect.value = previousValue;
    }
}

function renderSections() {
    sectionsList.innerHTML = '';
    sections.forEach((section, sectionIndex) => {
        const block = document.createElement('div');
        block.className = 'section-block' + (section.private ? ' is-private' : '');
        block.dataset.sectionIndex = String(sectionIndex);

        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <span class="drag-handle" title="גרירה לשינוי סדר">&#9776;</span>
            <input class="section-name-input" type="text" value="${escapeAttr(section.name)}" placeholder="שם המקטע">
            <label class="private-toggle">
                <input type="checkbox" class="section-private-input" ${section.private ? 'checked' : ''}>
                אישי
            </label>
            <button type="button" class="delete-section-btn" title="מחיקת מקטע" aria-label="מחיקת מקטע">${TRASH_ICON}</button>
        `;

        const linksContainer = document.createElement('div');
        linksContainer.className = 'section-links';
        section.links.forEach((link, linkIndex) => {
            linksContainer.appendChild(buildLinkRow(section, sectionIndex, link, linkIndex));
        });

        header.querySelector('.drag-handle').addEventListener('pointerdown', e => {
            beginDrag(e, 'section', { sectionIndex }, block, section.name || '(ללא שם)');
        });

        header.querySelector('.section-name-input').addEventListener('input', e => {
            section.name = e.target.value;
            refreshLinkSectionOptions();
        });
        header.querySelector('.section-private-input').addEventListener('change', e => {
            section.private = e.target.checked;
            block.classList.toggle('is-private', section.private);
        });
        header.querySelector('.delete-section-btn').addEventListener('click', () => {
            if (section.links.length > 0 && !confirm(`למחוק את המקטע "${section.name}" ואת ${section.links.length} הקישורים בו?`)) return;
            sections.splice(sectionIndex, 1);
            renderSections();
        });

        block.append(header, linksContainer);
        sectionsList.appendChild(block);
    });
    refreshLinkSectionOptions();
}

async function openEditor() {
    overlay.hidden = false;
    setStatus('');
    if (editingPassword) {
        await showEditorBody();
    } else {
        passwordGate.hidden = false;
        editorBody.hidden = true;
        editorFooter.hidden = true;
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function closeEditor() {
    overlay.hidden = true;
}

async function showEditorBody() {
    setStatus('טוען...');
    try {
        await loadEditorSections();
    } catch {
        renderProjects();
        setStatus('הסיסמה לא תקינה יותר, יש להתחבר מחדש', true);
        passwordGate.hidden = false;
        editorBody.hidden = true;
        editorFooter.hidden = true;
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    setStatus('');
    passwordGate.hidden = true;
    editorBody.hidden = false;
    editorFooter.hidden = false;
    displaySections = sections;
    renderProjects();
    renderSections();
    newSectionNameInput.value = '';
    newSectionPrivateInput.checked = false;
    newUrlInput.value = '';
    newNameInput.value = '';
    newDescriptionInput.value = '';
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
            await showEditorBody();
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
            body: JSON.stringify({ sections }),
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
        sections = data.sections;
        publicSections = sections.filter(s => !s.private);
        displaySections = sections;
        renderProjects();
        renderSections();
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
        if (!newDescriptionInput.value.trim() && meta.description) {
            newDescriptionInput.value = meta.description;
        }
        newPreview.innerHTML = `<img src="${escapeAttr(meta.favicon)}" alt=""><span>${escapeHtml(meta.title || '')}</span>`;
        setStatus('');
    } catch {
        setStatus('לא ניתן לשאוב פרטים, אפשר למלא שם ידנית', true);
    }
});

addSectionForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = newSectionNameInput.value.trim();
    if (!name) return;
    sections.push({ id: crypto.randomUUID(), name, private: newSectionPrivateInput.checked, links: [] });
    newSectionNameInput.value = '';
    newSectionPrivateInput.checked = false;
    renderSections();
    setStatus('המקטע נוסף - לא לשכוח לשמור');
});

addLinkForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!sections.length) {
        setStatus('יש ליצור מקטע קודם', true);
        return;
    }
    const url = newUrlInput.value.trim();
    const name = newNameInput.value.trim();
    const description = newDescriptionInput.value.trim();
    if (!url || !name) return;
    const sectionIndex = Number(newLinkSectionSelect.value) || 0;
    sections[sectionIndex].links.push({ id: crypto.randomUUID(), name, url, description });
    newUrlInput.value = '';
    newNameInput.value = '';
    newDescriptionInput.value = '';
    newPreview.innerHTML = '';
    renderSections();
    setStatus('הקישור נוסף לרשימה - לא לשכוח לשמור');
});

saveLinksBtn.addEventListener('click', saveLinks);

initViewportTracking(editorPanel);
loadLinks();
