document.addEventListener('DOMContentLoaded', () => {
    updateStatus();

    const toggle = document.getElementById('enable-toggle');
    const toggleLabel = document.getElementById('toggle-label');

    // Load initial state
    chrome.storage.local.get(['isEnabled'], (result) => {
        // Default to true if undefined
        const isEnabled = result.isEnabled !== false;
        toggle.checked = isEnabled;
        updateToggleLabel(isEnabled);
    });

    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ isEnabled: isEnabled }, () => {
            updateToggleLabel(isEnabled);
            // Notify content script to reload or update
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleState", isEnabled: isEnabled });
                }
            });
        });
    });

    function updateToggleLabel(enabled) {
        toggleLabel.textContent = enabled ? 'Extension Enabled' : 'Extension Disabled';
        toggleLabel.style.color = enabled ? '#4CAF50' : '#666';
    }

    document.getElementById('update-btn').addEventListener('click', () => {
        const btn = document.getElementById('update-btn');
        btn.textContent = 'Updating...';
        btn.disabled = true;

        chrome.runtime.sendMessage({ action: 'forceUpdate' }, (response) => {
            if (response && response.success) {
                updateStatus();
                btn.textContent = 'Update Complete!';
                setTimeout(() => {
                    btn.textContent = 'Force Update Now';
                    btn.disabled = false;
                }, 2000);
            } else {
                btn.textContent = 'Failed';
                setTimeout(() => {
                    btn.textContent = 'Force Update Now';
                    btn.disabled = false;
                }, 2000);
            }
        });
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            document.getElementById('search-result').textContent = '';
            return;
        }

        // We need to access the data. 
        // Since popup is separate, we can read storage directly.
        chrome.storage.local.get(['sponsors'], (result) => {
            if (result.sponsors) {
                const normalizedQuery = normalizeCompanyName(query);
                // Exact match on normalized name for now, or check if set has it.
                // The set contains normalized names.
                const sponsorSet = new Set(result.sponsors);

                if (sponsorSet.has(normalizedQuery)) {
                    // Since we only store normalized names in the set, we can't easily retrieve the original name 
                    // unless we store a map. But for now, let's just show the query the user typed (or title case it).
                    // Ideally we would store Map<Normalized, Original> but that doubles memory.
                    // Let's just show the user's query with the checkmark.
                    document.getElementById('search-result').innerHTML = `<span class="is-sponsor">✓ <b>${escapeHtml(query)}</b> is a Licensed Sponsor</span>`;
                } else {
                    document.getElementById('search-result').innerHTML = '<span class="not-sponsor">✗ Not found in list</span>';
                }
            }
        });
    });

    // Fetch Remote Ads
    fetchAd();
});

const ADS_URL = 'https://raw.githubusercontent.com/yitzuliu/UK-Visa-Sponsor-Highlighter/main/ads.json';

function fetchAd() {
    fetch(ADS_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data && data.enabled) {
                renderAd(data);
            }
        })
        .catch(error => {
            console.log('Failed to fetch ad, using default.', error);
            // Default is already in HTML, so do nothing.
        });
}

function renderAd(ad) {
    const container = document.querySelector('.ad-container');
    if (!container) return;

    // Update Header
    const adText = container.querySelector('.ad-text');
    if (adText) adText.textContent = ad.text;

    // Update Content
    const adContent = container.querySelector('.ad-content');
    if (adContent) {
        adContent.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <!-- Icon -->
                <img src="${escapeHtml(ad.icon)}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" alt="Ad Icon">
                
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <a href="${escapeHtml(ad.link)}" target="_blank" style="color: #333; font-weight: bold; text-decoration: none;">
                        ${escapeHtml(ad.title)}
                    </a>
                    <span style="font-size: 11px; color: #666;">
                        ${ad.footer ? escapeHtml(ad.footer) : ''}
                        ${ad.footerLink ? `<a href="${escapeHtml(ad.footerLink)}" target="_blank" style="color: #0077b5; text-decoration: none;">🔗</a>` : ''}
                    </span>
                </div>
            </div>
        `;
    }
}

function updateStatus() {
    chrome.storage.local.get(['lastUpdated', 'totalCount'], (result) => {
        if (result.lastUpdated) {
            const date = new Date(result.lastUpdated);
            document.getElementById('last-updated').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } else {
            document.getElementById('last-updated').textContent = 'Never';
        }

        if (result.totalCount) {
            document.getElementById('total-count').textContent = result.totalCount.toLocaleString();
        } else {
            document.getElementById('total-count').textContent = '0';
        }
    });
}

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
