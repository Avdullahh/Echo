import { analyzePrivacyFootprint } from '../shared/services/aiService';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. NAVIGATION & TABS ---
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

    const handleHash = () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        switchTab(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            history.pushState(null, null, `#${target}`);
            switchTab(target);
        });
    });

    // --- 2. DATA ENGINE ---
    let cachedData = [];

    function refreshData() {
        chrome.storage.local.get(['trackersBlocked', 'detectedTrackers', 'isProtectionOn'], (data) => {
            const count = data.trackersBlocked || 0;
            cachedData = data.detectedTrackers || [];
            const isProtectionOn = data.isProtectionOn !== undefined ? data.isProtectionOn : true;

            // A. Update Home Counter
            const homeCount = document.getElementById('home-total-blocked');
            if(homeCount) homeCount.textContent = count.toLocaleString();

            // B. Update System Status
            updateSystemStatus(isProtectionOn);

            // C. Update Timestamp
            const timeLabel = document.getElementById('last-updated-time');
            if (timeLabel) timeLabel.textContent = new Date().toLocaleTimeString();

            // D. Render Table
            renderTrafficTable(cachedData);

            // E. Refresh Reports if active
            if (window.location.hash === '#report') {
                generateReport();
            }
        });
    }
    
    function updateSystemStatus(isOn) {
        const statusDot = document.getElementById('system-status-dot');
        const statusText = document.getElementById('system-status-text');
        
        if (statusDot && statusText) {
            if (isOn) {
                statusText.textContent = "Active";
                statusDot.className = "w-3 h-3 rounded-full bg-accent-primary animate-pulse";
            } else {
                statusText.textContent = "Paused";
                statusDot.className = "w-3 h-3 rounded-full bg-accent-critical"; 
            }
        }
    }
    
    refreshData();
    setInterval(refreshData, 5000);

    // --- 3. TRAFFIC TABLE ---
    function renderTrafficTable(list) {
        const tableBody = document.getElementById('tracker-list-table');
        const emptyState = document.getElementById('empty-state-traffic');
        
        if (!tableBody) return;

        if (list.length === 0) {
            tableBody.innerHTML = '';
            if(emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if(emptyState) emptyState.classList.add('hidden');

        // CHANGE: Group by Domain/Company
        const grouped = list.reduce((acc, t) => {
            const key = t.company && t.company !== 'Unknown' ? t.company : t.domain;
            if (!acc[key]) {
                acc[key] = { ...t, count: 0, lastSeen: t.timestamp };
            }
            acc[key].count++;
            // Keep most recent timestamp
            if (new Date(t.timestamp) > new Date(acc[key].lastSeen)) {
                acc[key].lastSeen = t.timestamp;
            }
            return acc;
        }, {});

        const sorted = Object.values(grouped).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        tableBody.innerHTML = sorted.map(t => {
            const displayOwner = t.company && t.company !== 'Unknown' ? t.company : t.domain;
            
            return `
            <tr class="hover:bg-surface-cardHover/50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-surface-inset flex items-center justify-center text-xs font-bold text-text-muted border border-border-subtle group-hover:border-accent-primary/50 group-hover:text-accent-primary transition-colors">
                            ${t.domain.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-text-primary">${displayOwner}</div>
                            <div class="text-xs text-text-muted">${t.count} attempts blocked</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-inset text-text-secondary border border-border-subtle">
                        ${t.category}
                    </span>
                </td>
                <td class="px-6 py-4 text-right text-xs text-text-muted tabular-nums">
                    ${new Date(t.lastSeen).toLocaleTimeString()}
                </td>
            </tr>
        `}).join('');
    }

    // --- 4. REPORTS ENGINE ---
    function generateReport() {
        if (!cachedData || cachedData.length === 0) return;

        const companyCounts = {};
        cachedData.forEach(t => {
            const name = (t.company && t.company !== 'Unknown') ? t.company : t.domain;
            companyCounts[name] = (companyCounts[name] || 0) + 1;
        });

        const topCompanies = Object.entries(companyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        const companyContainer = document.getElementById('top-companies-chart');
        if (companyContainer) {
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

        const catCounts = {};
        cachedData.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
        const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        
        const catContainer = document.getElementById('categories-list');
        if (catContainer) {
            catContainer.innerHTML = topCats.map(([cat, count]) => `
                <div class="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-surface-inset/20">
                    <span class="capitalize text-sm font-medium text-text-secondary">${cat}</span>
                    <span class="text-xs font-bold text-text-primary">${count}</span>
                </div>
            `).join('');
        }
    }

    // --- 5. AI PERSONA ENGINE ---
    const aiBtn = document.getElementById('ai-generate-btn');
    const aiContainer = document.getElementById('ai-result-container');
    const aiTitle = document.getElementById('ai-persona-title');
    const aiDesc = document.getElementById('ai-persona-desc');

    if (aiBtn) {
        aiBtn.addEventListener('click', async () => {
            aiBtn.disabled = true;
            aiBtn.textContent = "Analyzing...";
            aiContainer.classList.remove('hidden');
            aiTitle.textContent = "Processing...";
            aiDesc.textContent = "Aggregating tracker data to infer profile...";

            // Prepare Data for AI
            const companyCounts = {};
            cachedData.forEach(t => {
                const name = t.company || t.domain;
                companyCounts[name] = (companyCounts[name] || 0) + 1;
            });
            const topCos = Object.entries(companyCounts).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name, count]) => ({ name, count }));

            const catCounts = {};
            cachedData.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
            const categories = Object.entries(catCounts).map(([label, count]) => ({ label, percent: Math.round((count/cachedData.length)*100) }));

            const recent = cachedData.slice(0,5).map(t => ({ site: t.domain, status: 'Blocked' }));

            try {
                const resultText = await analyzePrivacyFootprint(topCos, categories, recent);
                aiTitle.textContent = "Digital Persona Generated";
                aiDesc.innerHTML = resultText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                aiBtn.textContent = "Regenerate";
                aiBtn.disabled = false;
            } catch (err) {
                console.error(err);
                aiTitle.textContent = "Analysis Failed";
                aiDesc.textContent = "Could not connect to AI service.";
                aiBtn.disabled = false;
                aiBtn.textContent = "Retry";
            }
        });
    }

    // --- 6. SETTINGS ACTIONS ---
    // Ad Blocking Toggle
    const adBlockingToggle = document.getElementById('ad-blocking-toggle');
    if (adBlockingToggle) {
        // Load current state
        chrome.storage.local.get(['isAdBlockingOn'], (data) => {
            adBlockingToggle.checked = data.isAdBlockingOn !== false; // Default true
        });

        // Handle toggle change
        adBlockingToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            chrome.storage.local.set({ isAdBlockingOn: isEnabled }, () => {
                console.log(`Ad blocking ${isEnabled ? 'enabled' : 'disabled'}`);
            });
        });
    }

    // Cookie Banner Blocking Toggle
    const cookieBannerToggle = document.getElementById('cookie-banner-toggle');
    if (cookieBannerToggle) {
        // Load current state
        chrome.storage.local.get(['isCookieBannerBlockingOn'], (data) => {
            cookieBannerToggle.checked = data.isCookieBannerBlockingOn !== false; // Default true
        });

        // Handle toggle change
        cookieBannerToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            chrome.storage.local.set({ isCookieBannerBlockingOn: isEnabled }, () => {
                console.log(`Cookie banner blocking ${isEnabled ? 'enabled' : 'disabled'}`);
            });
        });
    }

    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(cachedData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `echo-logs-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const clearBtn = document.getElementById('clear-cache-btn');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm("Permanently delete all tracking history?")) {
                chrome.storage.local.clear(() => window.location.reload());
            }
        });
    }
});