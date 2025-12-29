document.addEventListener('DOMContentLoaded', () => {
    updateStatus();

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
                    document.getElementById('search-result').innerHTML = '<span class="is-sponsor">✓ Licensed Sponsor</span>';
                } else {
                    document.getElementById('search-result').innerHTML = '<span class="not-sponsor">✗ Not found in list</span>';
                }
            }
        });
    });
});

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
