// content.js
let isEnabled = true;

// --- Platform Configurations (OCP & SRP) ---
// By moving selectors out of the main logic, we make it easy to add new platforms
// without modifying the core matching and UI injection logic.
const PlatformStrategies = {
    'linkedin.com': [
        '.job-card-container__primary-description',
        '.artdeco-entity-lockup__subtitle',
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name:not(:has(a))',
        '.job-card-list__company-name',
        '.app-aware-link'
    ],
    'indeed.com': [
        '.companyName',
        '[data-testid="company-name"]'
    ]
};

// --- Initialization ---
chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled !== undefined) {
        isEnabled = result.isEnabled;
    }
    if (isEnabled) runCheck();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isEnabled) {
        isEnabled = changes.isEnabled.newValue;
        if (isEnabled) {
            runCheck();
        } else {
            removeCheckmarks();
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleState") {
        isEnabled = request.isEnabled;
        if (isEnabled) {
            runCheck();
        } else {
            removeCheckmarks();
        }
    }
});

// --- Observers ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const observer = new MutationObserver(debounce((mutations) => {
    if (!isEnabled) return;
    runCheck();
}, 250));

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// --- Core Logic ---
function getPlatformSelectors() {
    const hostname = window.location.hostname;
    for (const [domain, selectors] of Object.entries(PlatformStrategies)) {
        if (hostname.includes(domain)) {
            return selectors.join(', ');
        }
    }
    return null;
}

function runCheck() {
    if (!isEnabled) return;

    const selectorStr = getPlatformSelectors();
    if (!selectorStr) return;

    const companyElements = Array.from(document.querySelectorAll(selectorStr));
    if (companyElements.length === 0) return;

    const nameMap = new Map();
    const uniqueNamesToFetch = [];

    companyElements.forEach(el => {
        const cleanName = el.textContent.trim();
        if (!cleanName) return;

        if (!nameMap.has(cleanName)) {
            nameMap.set(cleanName, []);
            uniqueNamesToFetch.push(cleanName);
        }
        nameMap.get(cleanName).push(el);
    });

    if (uniqueNamesToFetch.length === 0) return;

    chrome.runtime.sendMessage({ action: 'checkBatchSponsors', companies: uniqueNamesToFetch }, (response) => {
        if (!response || !response.results) return;

        for (const [name, isSponsor] of Object.entries(response.results)) {
            const elements = nameMap.get(name);
            if (!elements) continue;

            elements.forEach(el => updateElementUI(el, isSponsor));
        }
    });
}

// --- UI Manipulation (SRP) ---
function updateElementUI(el, isSponsor) {
    const existingBadge = el.querySelector('.sponsor-checkmark');
    
    if (isSponsor) {
        if (!existingBadge) addCheckmark(el);
        if (el.getAttribute('data-sponsor-checked') !== 'true') {
            el.setAttribute('data-sponsor-checked', 'true');
        }
    } else {
        if (existingBadge) existingBadge.remove();
        if (el.hasAttribute('data-sponsor-checked')) {
            el.removeAttribute('data-sponsor-checked');
        }
    }
}

function addCheckmark(el) {
    const span = document.createElement('span');
    span.className = 'sponsor-checkmark';
    span.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-left: 4px;">
            <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
            <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    span.title = 'Licensed Sponsor confirmed by GOV.UK';
    el.appendChild(span);
}

function removeCheckmarks() {
    document.querySelectorAll('.sponsor-checkmark').forEach(el => el.remove());
    document.querySelectorAll('[data-sponsor-checked]').forEach(el => el.removeAttribute('data-sponsor-checked'));
}
