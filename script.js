const GITHUB_USER = 'abdeyms';
        const LANG_COLORS = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#3178c6',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Python': '#3572A5',
            'Java': '#b07219',
            'Dart': '#00B4AB',
            'PHP': '#4F5D95',
            'Vue': '#41b883'
        };

        let repositories = [];
        let selectedLang = 'ALL';
        let activeRepo = null;
        let activeRepoFiles = [];

        function showToast(msg, type = 'success') {
            const box = document.getElementById('toast-container');
            const el = document.createElement('div');
            const icon = type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-sky-400';
            el.className = 'toast-item pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs sm:text-sm font-medium';
            el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${msg}</span>`;
            box.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transition = 'opacity 0.25s ease';
                setTimeout(() => el.remove(), 250);
            }, 3000);
        }

        function copyText(text, message) {
            const area = document.createElement('textarea');
            area.value = text;
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            try {
                document.execCommand('copy');
                showToast(message, 'success');
            } catch (e) {
                showToast('Nusxalab bo\'lmadi', 'info');
            }
            document.body.removeChild(area);
        }

        function formatDate(iso) {
            if (!iso) return 'Yaqinda';
            const d = new Date(iso);
            const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }

        async function loadPortfolio(manual = false) {
            const statusEl = document.getElementById('api-status-badge');
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> GitHub yangilanmoqda...`;

            try {
                const ts = Date.now();
                const [uRes, rRes] = await Promise.all([
                    fetch(`https://api.github.com/users/${GITHUB_USER}?_=${ts}`, { cache: 'no-store' }),
                    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100&_=${ts}`, { cache: 'no-store' })
                ]);

                if (!uRes.ok || !rRes.ok) throw new Error('API limit');

                const user = await uRes.json();
                const repos = await rRes.json();

                if (user.avatar_url) document.getElementById('gh-avatar').src = user.avatar_url;
                document.getElementById('gh-name').textContent = 'Abdumalikov Abdulboqiy';
                const bioEl = document.getElementById('gh-bio');
                const cleanBio = typeof user.bio === 'string' ? user.bio.trim() : '';
                if (cleanBio && cleanBio.toLowerCase() !== 'gg') {
                    bioEl.textContent = cleanBio;
                }
                if (user.location) {
                    document.getElementById('gh-location').innerHTML = `<i class="fa-solid fa-location-dot text-emerald-400"></i> ${user.location}`;
                }

                document.getElementById('gh-repos-count').textContent = user.public_repos ?? repos.length;
                document.getElementById('gh-followers').textContent = user.followers ?? 0;
                document.getElementById('gh-following').textContent = user.following ?? 0;

                repositories = Array.isArray(repos) ? repos.filter(r => !r.archived) : [];
                statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> GitHub ulangan (${repositories.length} ta loyiha)`;

                if (manual) showToast('GitHub loyihalari yangilandi!', 'success');

                renderLanguageFilters();
                renderProjectCards();
            } catch (err) {
                statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400"></span> Ulanishda xatolik`;
                repositories = [
                    {
                        name: 'topik-fergana',
                        description: "Topik Fergana — Koreys tili (TOPIK) o'quv platformasi veb-sayti.",
                        language: 'HTML',
                        stargazers_count: 1,
                        forks_count: 0,
                        updated_at: new Date().toISOString(),
                        html_url: `https://github.com/${GITHUB_USER}/topik-fergana`,
                        default_branch: 'main'
                    }
                ];
                renderLanguageFilters();
                renderProjectCards();
            }
        }

        function renderLanguageFilters() {
            const container = document.getElementById('language-filters');
            const langs = new Set();
            repositories.forEach(r => { if (r.language) langs.add(r.language); });

            let html = `
                <button type="button" data-lang="ALL" class="filter-pill px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${selectedLang === 'ALL' ? 'bg-sky-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-sky-400'}">
                    Barchasi (${repositories.length})
                </button>
            `;

            langs.forEach(lang => {
                const count = repositories.filter(r => r.language === lang).length;
                const color = LANG_COLORS[lang] || '#38bdf8';
                const active = selectedLang === lang;
                html += `
                    <button type="button" data-lang="${lang}" class="filter-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${active ? 'bg-sky-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-sky-400'}">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${active ? '#0f172a' : color}"></span>
                        ${lang} (${count})
                    </button>
                `;
            });

            container.innerHTML = html;
            container.querySelectorAll('.filter-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedLang = btn.getAttribute('data-lang');
                    renderLanguageFilters();
                    renderProjectCards();
                });
            });
        }

        function renderProjectCards() {
            const grid = document.getElementById('projects-grid');
            const empty = document.getElementById('empty-state');
            const q = document.getElementById('repo-search').value.trim().toLowerCase();
            const sort = document.getElementById('repo-sort').value;

            let list = [...repositories];

            if (selectedLang !== 'ALL') {
                list = list.filter(r => r.language === selectedLang);
            }
            if (q) {
                list = list.filter(r =>
                    r.name.toLowerCase().includes(q) ||
                    (r.description && r.description.toLowerCase().includes(q))
                );
            }

            list.sort((a, b) => {
                if (sort === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
                if (sort === 'name') return a.name.localeCompare(b.name);
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

            if (list.length === 0) {
                grid.innerHTML = '';
                empty.classList.remove('hidden');
                return;
            }
            empty.classList.add('hidden');

            grid.innerHTML = list.map((repo, idx) => {
                const lang = repo.language || 'Web';
                const color = LANG_COLORS[lang] || '#94a3b8';
                const desc = repo.description || `${repo.name} — Frontend veb-loyiha (@${GITHUB_USER}).`;
                const isLatest = idx === 0 && sort === 'updated' && selectedLang === 'ALL' && !q;
                const previewImage = `https://opengraph.githubassets.com/portfolio-${repo.updated_at}/${GITHUB_USER}/${repo.name}`;
                const liveUrl = repo.homepage?.trim()
                    || (repo.has_pages ? `https://${GITHUB_USER}.github.io/${repo.name}/` : '');

                return `
                    <article class="project-card project-card-rich">
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer"
                           class="project-thumbnail" aria-label="${repo.name} GitHub loyihasi">
                            <img src="${previewImage}" alt="${repo.name} loyihasi" loading="lazy"
                                 referrerpolicy="no-referrer"
                                 onerror="this.closest('.project-thumbnail').classList.add('thumbnail-fallback'); this.remove();">
                            ${isLatest ? '<span class="project-status"><i class="fa-solid fa-bolt"></i> Oxirgi loyiha</span>' : ''}
                            <span class="project-open"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                        </a>

                        <div class="project-card-body">
                            <div class="project-card-heading">
                                <h3>
                                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                                </h3>
                                <div class="project-stats">
                                    <span title="Yulduzlar"><i class="fa-regular fa-star"></i> ${repo.stargazers_count || 0}</span>
                                    <span title="Forklar"><i class="fa-solid fa-code-fork"></i> ${repo.forks_count || 0}</span>
                                </div>
                            </div>

                            <p>${desc}</p>

                            <div class="project-meta">
                                <span class="project-language">
                                    <span style="background-color: ${color}"></span>${lang}
                                </span>
                                <span><i class="fa-regular fa-clock"></i> ${formatDate(repo.updated_at)}</span>
                            </div>

                            <div class="project-actions">
                                ${liveUrl
                                    ? `<a href="${liveUrl}" target="_blank" rel="noopener noreferrer" class="project-live-btn"><i class="fa-solid fa-globe"></i> Saytni ko'rish</a>`
                                    : `<button type="button" onclick="openProjectModal('${repo.name}', 'preview')" class="project-live-btn"><i class="fa-solid fa-globe"></i> Ko'rinishi</button>`
                                }
                                <button type="button" onclick="openProjectModal('${repo.name}', 'code')" class="project-code-btn">
                                    <i class="fa-solid fa-code"></i> Kodni ko'rish
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        }

        function resetFilters() {
            selectedLang = 'ALL';
            document.getElementById('repo-search').value = '';
            document.getElementById('repo-sort').value = 'updated';
            renderLanguageFilters();
            renderProjectCards();
        }

        /* ==================== MODAL: LIVE PREVIEW & CODE VIEWER ==================== */
        async function openProjectModal(repoName, tab = 'preview') {
            const repo = repositories.find(r => r.name === repoName);
            if (!repo) return;
            activeRepo = repo;

            document.getElementById('modal-repo-title').textContent = repo.name;
            document.getElementById('modal-repo-subtitle').textContent = `${GITHUB_USER}/${repo.name} • ${repo.language || 'Web'}`;
            document.getElementById('preview-external-link').href = repo.html_url;
            document.getElementById('preview-url-display').textContent = `${repo.name} — Jonli ko'rinish yuklanmoqda...`;

            const iframe = document.getElementById('project-preview-iframe');
            iframe.removeAttribute('srcdoc');
            iframe.src = 'about:blank';

            const modal = document.getElementById('project-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            switchModalTab(tab);
            await fetchRepoContentsAndRender(repo);
        }

        function closeProjectModal() {
            const modal = document.getElementById('project-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            const iframe = document.getElementById('project-preview-iframe');
            iframe.removeAttribute('srcdoc');
            iframe.src = 'about:blank';
            document.body.style.overflow = '';
        }

        function switchModalTab(tab) {
            const pPane = document.getElementById('modal-preview-pane');
            const cPane = document.getElementById('modal-code-pane');
            const pBtn = document.getElementById('tab-preview-btn');
            const cBtn = document.getElementById('tab-code-btn');

            if (tab === 'preview') {
                pPane.classList.remove('hidden');
                cPane.classList.add('hidden');
                pBtn.className = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 bg-sky-500 text-slate-950';
                cBtn.className = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-300';
            } else {
                pPane.classList.add('hidden');
                cPane.classList.remove('hidden');
                cBtn.className = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 bg-sky-500 text-slate-950';
                pBtn.className = 'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-300';
            }
        }

        async function fetchRepoContentsAndRender(repo) {
            const filesList = document.getElementById('modal-files-list');
            const codeEl = document.getElementById('modal-code-content');
            const fileNameEl = document.getElementById('active-file-name');
            const iframe = document.getElementById('project-preview-iframe');

            filesList.innerHTML = '<span class="text-xs font-mono text-slate-400">Fayllar yuklanmoqda...</span>';
            codeEl.textContent = '// Fayllar yuklanmoqda...';

            const branch = repo.default_branch || 'main';
            const ts = Date.now();

            try {
                let files = [];
                const treeRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${repo.name}/git/trees/${branch}?recursive=1&_=${ts}`, { cache: 'no-store' });

                if (treeRes.ok) {
                    const data = await treeRes.json();
                    files = (data.tree || [])
                        .filter(item => item.type === 'blob')
                        .map(item => ({
                            name: item.path,
                            rawUrl: `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${branch}/${item.path}`,
                            blobUrl: `https://github.com/${GITHUB_USER}/${repo.name}/blob/${branch}/${item.path}`
                        }));
                } else {
                    const rootRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${repo.name}/contents?_=${ts}`, { cache: 'no-store' });
                    if (rootRes.ok) {
                        const list = await rootRes.json();
                        files = Array.isArray(list)
                            ? list.filter(i => i.type === 'file').map(i => ({
                                name: i.path,
                                rawUrl: i.download_url,
                                blobUrl: i.html_url
                            }))
                            : [];
                    }
                }

                const codeExt = /\.(html|css|js|jsx|ts|tsx|json|md|py|java|dart|sql|txt)$/i;
                const priority = ['index.html', 'README.md', 'style.css', 'styles.css', 'script.js', 'main.js', 'app.js'];

                activeRepoFiles = files
                    .filter(f => codeExt.test(f.name) || f.name.toLowerCase().includes('readme'))
                    .sort((a, b) => {
                        const aBase = a.name.split('/').pop();
                        const bBase = b.name.split('/').pop();
                        const ai = priority.indexOf(aBase);
                        const bi = priority.indexOf(bBase);
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return a.name.localeCompare(b.name);
                    })
                    .slice(0, 25);

                // Render Web Preview
                const htmlEntry = activeRepoFiles.find(f => f.name.toLowerCase() === 'index.html')
                    || activeRepoFiles.find(f => f.name.toLowerCase().endsWith('.html'));

                if (repo.homepage && repo.homepage.trim() !== '') {
                    document.getElementById('preview-url-display').textContent = repo.homepage.trim();
                    iframe.src = repo.homepage.trim();
                } else if (htmlEntry) {
                    await buildLiveWebsitePreview(repo, branch, htmlEntry, activeRepoFiles, iframe);
                } else {
                    document.getElementById('preview-url-display').textContent = repo.html_url;
                    iframe.srcdoc = buildFallbackPreviewCard(repo, activeRepoFiles);
                }

                // Render File Pills
                if (activeRepoFiles.length === 0) {
                    filesList.innerHTML = '<span class="text-xs text-slate-400">Fayllar topilmadi.</span>';
                    fileNameEl.textContent = repo.name;
                    codeEl.textContent = `// Fayllar topilmadi. GitHub'da oching: ${repo.html_url}`;
                    return;
                }

                filesList.innerHTML = activeRepoFiles.map((f, i) => `
                    <button type="button" onclick="selectCodeFile(${i})"
                            class="code-file-btn px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${i === 0 ? 'bg-sky-500 text-slate-950 font-semibold' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-400'}">
                        ${f.name}
                    </button>
                `).join('');

                await selectCodeFile(0);

            } catch (e) {
                filesList.innerHTML = '';
                fileNameEl.textContent = 'Xatolik';
                codeEl.textContent = `// Yuklashda xatolik: ${repo.html_url}`;
                iframe.srcdoc = buildFallbackPreviewCard(repo, []);
            }
        }

        async function buildLiveWebsitePreview(repo, branch, htmlEntry, files, iframe) {
            try {
                const htmlRes = await fetch(htmlEntry.rawUrl);
                let html = await htmlRes.text();

                const baseUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${branch}/`;
                if (!/<base\s/i.test(html)) {
                    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
                }

                // Inject CSS files
                const cssFiles = files.filter(f => f.name.toLowerCase().endsWith('.css'));
                if (cssFiles.length > 0) {
                    const cssList = await Promise.all(cssFiles.map(f => fetch(f.rawUrl).then(r => r.ok ? r.text() : '').catch(() => '')));
                    const cssCombined = cssList.filter(Boolean).join('\n');
                    if (cssCombined) {
                        const styleTag = `<style>${cssCombined}</style>`;
                        html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${styleTag}</head>`) : `${styleTag}${html}`;
                    }
                }

                // Inject JS files
                const jsFiles = files.filter(f => f.name.toLowerCase().endsWith('.js'));
                if (jsFiles.length > 0) {
                    const jsList = await Promise.all(jsFiles.map(f => fetch(f.rawUrl).then(r => r.ok ? r.text() : '').catch(() => '')));
                    const jsCombined = jsList.filter(Boolean).join('\n');
                    if (jsCombined) {
                        const escapedJs = jsCombined.replace(/<\/script>/gi, '<\\/script>');
                        const scriptTag = `<script>${escapedJs}<` + `/script>`;
                        html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptTag}</body>`) : `${html}${scriptTag}`;
                    }
                }

                document.getElementById('preview-url-display').textContent = `Jonli Preview • ${repo.name}/${htmlEntry.name}`;
                iframe.srcdoc = html;
            } catch (err) {
                iframe.srcdoc = buildFallbackPreviewCard(repo, files);
            }
        }

        function buildFallbackPreviewCard(repo, files) {
            const tags = files.slice(0, 8).map(f => `<span style="background:#1e293b;color:#38bdf8;padding:4px 10px;border-radius:8px;font-size:12px;">${f.name}</span>`).join(' ');
            return `
                <!DOCTYPE html>
                <html lang="uz">
                <head><meta charset="UTF-8"><style>
                    body { margin:0; font-family: system-ui, sans-serif; background:#090d16; color:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:20px; }
                    .card { max-width:460px; background:#111827; border:1px solid #1f2937; border-radius:16px; padding:28px; }
                    h2 { margin:0 0 10px; font-size:20px; }
                    p { color:#94a3b8; font-size:14px; line-height:1.6; margin:0 0 18px; }
                    .tags { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-bottom:18px; }
                    a { display:inline-block; background:#38bdf8; color:#090d16; font-weight:600; text-decoration:none; padding:10px 18px; border-radius:10px; font-size:13px; }
                </style></head>
                <body>
                    <div class="card">
                        <h2>${repo.name}</h2>
                        <p>${repo.description || "Yuqoridagi «Kodlar» bo'limi orqali ushbu loyihaning barcha fayllarini o'qishingiz mumkin."}</p>
                        <div class="tags">${tags}</div>
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">GitHub'da ochish ↗</a>
                    </div>
                </body>
                </html>
            `;
        }

        async function selectCodeFile(idx) {
            const file = activeRepoFiles[idx];
            if (!file) return;

            document.querySelectorAll('.code-file-btn').forEach((btn, i) => {
                btn.className = i === idx
                    ? 'code-file-btn px-3 py-1.5 rounded-lg text-xs font-mono transition-colors bg-sky-500 text-slate-950 font-semibold'
                    : 'code-file-btn px-3 py-1.5 rounded-lg text-xs font-mono transition-colors bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-400';
            });

            document.getElementById('active-file-name').textContent = file.name;
            document.getElementById('active-file-gh-link').href = file.blobUrl || activeRepo.html_url;
            const codeEl = document.getElementById('modal-code-content');
            codeEl.textContent = '// Fayl yuklanmoqda...';

            try {
                const res = await fetch(file.rawUrl);
                if (!res.ok) throw new Error('Load failed');
                codeEl.textContent = await res.text();
            } catch (e) {
                codeEl.textContent = `// Faylni yuklab bo'lmadi: ${file.blobUrl}`;
            }
        }

        function copyCurrentCode() {
            copyText(document.getElementById('modal-code-content').textContent, 'Kod nusxalandi!');
        }

        /* ==================== INIT ==================== */
        document.addEventListener('DOMContentLoaded', () => {
            const html = document.documentElement;
            const mobBtn = document.getElementById('mobile-menu-btn');
            const mobMenu = document.getElementById('mobile-menu');
            mobBtn.addEventListener('click', () => mobMenu.classList.toggle('hidden'));
            document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => mobMenu.classList.add('hidden')));

            document.getElementById('repo-search').addEventListener('input', renderProjectCards);
            document.getElementById('repo-sort').addEventListener('change', renderProjectCards);

            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProjectModal(); });
            document.getElementById('project-modal').addEventListener('click', e => {
                if (e.target.id === 'project-modal') closeProjectModal();
            });

            loadPortfolio(false);
        });
