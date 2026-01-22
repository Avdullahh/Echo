document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. NAVIGATION LOGIC ---
    function switchTab(tabId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-accent-primary', 'text-text-onAccent'); 
            btn.classList.add('text-text-muted'); // Reset to dim
        });

        const targetSection = document.getElementById(tabId);
        if (targetSection) targetSection.classList.remove('hidden');

        const targetBtn = document.querySelector(`.nav-btn[data-target="${tabId}"]`);
        if (targetBtn) {
            targetBtn.classList.remove('text-text-muted');
            targetBtn.classList.add('bg-accent-primary', 'text-text-onAccent'); // Active Green
        }
    }

    // Hash Handling (Deep Linking)
    const handleHash = () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        switchTab(hash);
    };
    
    // Listen for hash changes (back button support)
    window.addEventListener('hashchange', handleHash);
    // Initial Load
    handleHash();

    // Button Clicks
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            history.pushState(null, null, `#${target}`);
            switchTab(target);
        });
    });

    // --- 2. DATA POPULATION ---
    chrome.storage.local.get(['trackersBlocked', 'detectedTrackers'], (data) => {
        const count = data.trackersBlocked || 0;
        const list = data.detectedTrackers || [];

        // A. Populate HOME (Summary)
        const homeCount = document.getElementById('home-blocked-count');
        if(homeCount) homeCount.textContent = count;
        
        // Mocking "Total Sites Visited" for the summary text
        const totalSites = document.getElementById('home-total-sites');
        if(totalSites) totalSites.textContent = Math.floor(count * 1.5) + 3; 

        // B. Populate OVERVIEW (Detailed List)
        const listContainer = document.getElementById('tracker-list');
        if (listContainer) {
            if (list.length === 0) {
                listContainer.innerHTML = `
                    <div class="p-8 text-center border border-dashed border-border-strong rounded-lg">
                        <p class="text-small text-text-muted">No threats detected yet.</p>
                    </div>`;
            } else {
                listContainer.innerHTML = list.map(t => `
                    <div class="flex items-center justify-between p-4 bg-surface-cardAlt rounded-lg border border-border-subtle mb-2 hover:border-border-strong transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-surface-inset flex items-center justify-center text-accent-primary border border-border-subtle font-bold text-xs">
                                ${t.host.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="text-body font-bold text-text-primary">${t.host}</div>
                                <div class="text-small text-text-muted">${t.category} • ${new Date(t.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                        <span class="px-3 py-1 bg-surface-inset rounded-full text-[10px] font-bold text-accent-primary border border-border-subtle">
                            BLOCKED
                        </span>
                    </div>
                `).join('');
            }
        }
    });

    // --- 3. UTILITIES ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
             chrome.storage.local.remove('userSession', () => {
                 window.location.href = '/onboarding.html';
             });
        });
    }

    const clearBtn = document.getElementById('clear-cache-btn');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            chrome.storage.local.clear(() => {
                alert('System Cache Cleared');
                window.location.reload();
            });
        });
    }
});