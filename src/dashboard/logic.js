import { analyzePrivacyFootprint } from '../shared/services/aiService';

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------
    // SHARED STATE
    // Must be declared FIRST — before any function calls —
    // to avoid Temporal Dead Zone (TDZ) ReferenceErrors.
    // The original code declared cachedData 40+ lines after
    // calling handleHash(), which called generateReport(),
    // which accessed cachedData while it was still in TDZ.
    // That threw a ReferenceError that aborted the entire
    // DOMContentLoaded callback, leaving nav listeners and
    // refreshData() never registered — hence the lock.
    // -------------------------------------------------------
    let cachedData = [];
    let initialNavDone = false;

    // -------------------------------------------------------
    // 1. NAVIGATION
    // -------------------------------------------------------
    function switchTab(tabId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-surface-cardHover', 'text-text-primary', 'shadow-sm');
            btn.classList.add('text-text-muted');
        });

        const targetSection = document.getElementById(tabId);
        if (targetSection) targetSection.classList.remove('hidden');

        const targetBtn = document.querySelector(`.nav-btn[data-target="${tabId}"]`);
        if (targetBtn) {
            targetBtn.classList.remove('text-text-muted');
            targetBtn.classList.add('bg-surface-cardHover', 'text-text-primary', 'shadow-sm');
        }

        if (tabId === 'report') generateReport();
    }

    function handleHash() {
        const hash = window.location.hash.replace('#', '') || 'home';
        switchTab(hash);
    }

    // hashchange fires on back/forward browser navigation
    window.addEventListener('hashchange', handleHash);

    // Nav buttons use replaceState so the browser's back button exits the
    // extension page rather than cycling between dashboard tabs.
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            history.replaceState(null, '', `#${target}`);
            switchTab(target);
        });
    });

    // -------------------------------------------------------
    // 2. DATA ENGINE
    // -------------------------------------------------------
    function updateSystemStatus(isOn) {
        const statusDot  = document.getElementById('system-status-dot');
        const statusText = document.getElementById('system-status-text');
        if (!statusDot || !statusText) return;
        if (isOn) {
            statusText.textContent = 'Active';
            statusDot.className = 'w-3 h-3 rounded-full bg-accent-primary animate-pulse';
        } else {
            statusText.textContent = 'Paused';
            statusDot.className = 'w-3 h-3 rounded-full bg-accent-critical';
        }
    }

    function refreshData() {
        chrome.storage.local.get(['trackersBlocked', 'detectedTrackers', 'isProtectionOn'], (data) => {
            const count = data.trackersBlocked || 0;
            cachedData = data.detectedTrackers || [];
            const isProtectionOn = data.isProtectionOn !== undefined ? data.isProtectionOn : true;

            const homeCount = document.getElementById('home-total-blocked');
            if (homeCount) homeCount.textContent = count.toLocaleString();

            updateSystemStatus(isProtectionOn);

            const timeLabel = document.getElementById('last-updated-time');
            if (timeLabel) timeLabel.textContent = new Date().toLocaleTimeString();

            renderTrafficTable(cachedData);

            if (!initialNavDone) {
                // First data load complete — navigate to the hash-requested tab
                // now that cachedData is populated. Calling handleHash() here
                // (rather than at DOMContentLoaded time) guarantees generateReport()
                // always runs against real data, never against an empty array.
                initialNavDone = true;
                handleHash();
            } else if (window.location.hash.replace('#', '') === 'report') {
                // Subsequent interval refreshes: re-render the report if active
                generateReport();
            }
            // NOTE: generatePersonaFromData() was called here in the original
            // but was never defined — it threw a ReferenceError on every tick.
            // AI persona generation is triggered by the button click instead.
        });
    }

    refreshData();
    setInterval(refreshData, 5000);

    // -------------------------------------------------------
    // 3. TRAFFIC TABLE
    // -------------------------------------------------------
    function renderTrafficTable(list) {
        const tableBody  = document.getElementById('tracker-list-table');
        const emptyState = document.getElementById('empty-state-traffic');

        if (!tableBody) return;

        if (list.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        const grouped = list.reduce((acc, t) => {
            const key = t.company && t.company !== 'Unknown' ? t.company : t.domain;
            if (!acc[key]) acc[key] = { ...t, count: 0, lastSeen: t.timestamp };
            acc[key].count++;
            if (new Date(t.timestamp) > new Date(acc[key].lastSeen)) acc[key].lastSeen = t.timestamp;
            return acc;
        }, {});

        const sorted = Object.values(grouped).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        tableBody.innerHTML = sorted.map(t => {
            const displayOwner = t.company && t.company !== 'Unknown' ? t.company : t.domain;
            const actionBadge = t.action === 'Allowed'
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Bypassed</span>`
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-critical/10 text-accent-critical border border-accent-critical/20">Blocked</span>`;

            return `
            <tr class="hover:bg-surface-cardHover/50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-surface-inset flex items-center justify-center text-xs font-bold text-text-muted border border-border-subtle group-hover:border-accent-primary/50 group-hover:text-accent-primary transition-colors">
                            ${t.domain.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-text-primary">${displayOwner}</div>
                            <div class="text-xs text-text-muted flex items-center gap-1.5">
                                ${actionBadge}
                                <span>${t.count} request${t.count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[10px] font-medium tracking-wide bg-surface-inset text-text-secondary border border-border-subtle">
                        ${t.sourceWebsite && t.sourceWebsite !== 'Unknown' ? t.sourceWebsite : 'Direct request'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right text-xs text-text-muted tabular-nums">
                    ${new Date(t.lastSeen).toLocaleTimeString()}
                </td>
            </tr>`;
        }).join('');
    }

    // -------------------------------------------------------
    // 4. REPORTS ENGINE
    // -------------------------------------------------------
    function generateReport() {
        if (!cachedData || cachedData.length === 0) return;

        const companyMap = {};
        cachedData.forEach(t => {
            const name = (t.company && t.company !== 'Unknown') ? t.company : t.domain;
            if (name) companyMap[name] = (companyMap[name] || 0) + 1;
        });

        const topCompanies = Object.entries(companyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        const companyContainer = document.getElementById('top-companies-chart');
        if (companyContainer && topCompanies.length > 0) {
            const maxVal = topCompanies[0][1];
            companyContainer.innerHTML = topCompanies.map(([name, count]) => {
                const percent = (count / maxVal) * 100;
                return `
                <div class="mb-4">
                    <div class="flex justify-between text-xs font-medium mb-1">
                        <span class="text-text-primary">${name}</span>
                        <span class="text-text-muted">${count}</span>
                    </div>
                    <div class="w-full h-2 bg-surface-inset rounded-full overflow-hidden">
                        <div class="h-full bg-accent-primary rounded-full shadow-[0_0_10px_rgba(77,255,188,0.4)]" style="width: ${percent}%"></div>
                    </div>
                </div>`;
            }).join('');
        }

        const siteMap = {};
        cachedData.forEach(t => {
            const site = t.sourceWebsite;
            if (site && site !== 'Unknown') siteMap[site] = (siteMap[site] || 0) + 1;
        });

        const topWebsites = Object.entries(siteMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        const catContainer = document.getElementById('categories-list');
        if (catContainer) {
            catContainer.innerHTML = topWebsites.length
                ? topWebsites.map(([site, count]) => `
                    <div class="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-surface-inset/20">
                        <span class="text-sm font-medium text-text-secondary">${site}</span>
                        <span class="text-xs font-bold text-text-primary">${count}</span>
                    </div>`).join('')
                : `<p class="text-xs text-text-muted text-center py-4">No source sites recorded yet.</p>`;
        }
    }

    // -------------------------------------------------------
    // 5. AI PERSONA ENGINE
    // -------------------------------------------------------
    const aiBtn       = document.getElementById('ai-generate-btn');
    const aiContainer = document.getElementById('ai-result-container');
    const aiTitle     = document.getElementById('ai-persona-title');
    const aiDesc      = document.getElementById('ai-persona-desc');

    if (aiContainer) aiContainer.classList.remove('hidden');
    if (aiTitle) aiTitle.textContent = 'Your Profile Awaits';
    if (aiDesc)  aiDesc.textContent  = 'Press "Generate Persona" to see how advertising algorithms currently classify you based on your browsing data.';

    if (aiBtn) {
        aiBtn.addEventListener('click', async () => {
            aiBtn.disabled = true;
            aiBtn.textContent = 'Analyzing...';
            if (aiTitle) aiTitle.textContent = 'Processing...';
            if (aiDesc)  aiDesc.textContent  = 'Aggregating tracker data to infer profile...';

            try {
                const companyMap = {};
                cachedData.forEach(t => {
                    const name = (t.company && t.company !== 'Unknown') ? t.company : t.domain;
                    if (name) companyMap[name] = (companyMap[name] || 0) + 1;
                });
                const allCompanies = Object.entries(companyMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => ({ name, count }));

                const siteMap = {};
                const totalEvents = cachedData.length;
                cachedData.forEach(t => {
                    const site = t.sourceWebsite;
                    if (site && site !== 'Unknown') siteMap[site] = (siteMap[site] || 0) + 1;
                });
                const allSites = Object.entries(siteMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, count]) => ({ label, percent: Math.round((count / totalEvents) * 100) }));

                const resultText = await analyzePrivacyFootprint(allCompanies, allSites, []);
                if (aiTitle) aiTitle.textContent = 'Your Digital Profile';
                if (aiDesc)  aiDesc.innerHTML = resultText
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                aiBtn.textContent = 'Regenerate';
                aiBtn.disabled = false;
            } catch (err) {
                console.error(err);
                if (aiTitle) aiTitle.textContent = 'Analysis Failed';
                if (aiDesc)  aiDesc.textContent  = err.message || 'Unknown error.';
                aiBtn.textContent = 'Retry';
                aiBtn.disabled = false;
            }
        });
    }

    // -------------------------------------------------------
    // 6. SETTINGS ACTIONS
    // -------------------------------------------------------
    const adBlockingToggle = document.getElementById('ad-blocking-toggle');
    if (adBlockingToggle) {
        chrome.storage.local.get(['isAdBlockingOn'], data => {
            adBlockingToggle.checked = data.isAdBlockingOn !== false;
        });
        adBlockingToggle.addEventListener('change', e => {
            chrome.storage.local.set({ isAdBlockingOn: e.target.checked }, () => {
                chrome.tabs.query({}, tabs => {
                    tabs.forEach(tab => {
                        if (tab.id && tab.url && !tab.url.startsWith('chrome-extension://'))
                            chrome.tabs.reload(tab.id);
                    });
                });
            });
        });
    }

    const cookieBannerToggle = document.getElementById('cookie-banner-toggle');
    if (cookieBannerToggle) {
        chrome.storage.local.get(['isCookieBannerBlockingOn'], data => {
            cookieBannerToggle.checked = data.isCookieBannerBlockingOn !== false;
        });
        cookieBannerToggle.addEventListener('change', e => {
            chrome.storage.local.set({ isCookieBannerBlockingOn: e.target.checked }, () => {
                chrome.tabs.query({}, tabs => {
                    tabs.forEach(tab => {
                        if (tab.id && tab.url && !tab.url.startsWith('chrome-extension://'))
                            chrome.tabs.reload(tab.id);
                    });
                });
            });
        });
    }

    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(cachedData, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `echo-logs-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    const clearBtn = document.getElementById('clear-cache-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Permanently delete all tracking history?')) {
                chrome.storage.local.set(
                    { detectedTrackers: [], trackersBlocked: 0, trackerMetadata: {} },
                    () => window.location.reload()
                );
            }
        });
    }
});