// content.js

let sponsorSet = new Set();
let isDataLoaded = false;

// Load data from storage on start
chrome.storage.local.get(['sponsors'], (result) => {
    if (result.sponsors) {
        sponsorSet = new Set(result.sponsors);
        isDataLoaded = true;
        console.log('Sponsor data loaded in content script:', sponsorSet.size);
        // Initial run
        runCheck();
    } else {
        console.log('No sponsor data found in storage.');
        // Maybe trigger update?
        chrome.runtime.sendMessage({ action: 'forceUpdate' }, (response) => {
            if (response && response.success) {
                chrome.storage.local.get(['sponsors'], (res) => {
                    if (res.sponsors) {
                        sponsorSet = new Set(res.sponsors);
                        isDataLoaded = true;
                        runCheck();
                    }
                });
            }
        });
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.sponsors) {
            sponsorSet = new Set(changes.sponsors.newValue);
            isDataLoaded = true;
            runCheck();
        }
        if (changes.isEnabled) {
            if (changes.isEnabled.newValue) {
                runCheck();
            } else {
                removeCheckmarks();
            }
        }
    }
});

// Listen for toggle message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleState") {
        if (request.isEnabled) {
            runCheck();
        } else {
            removeCheckmarks();
        }
    }
});

function runCheck() {
    if (!isDataLoaded) return;

    // Check if enabled
    chrome.storage.local.get(['isEnabled'], (result) => {
        if (result.isEnabled === false) return; // Default is true

        const hostname = window.location.hostname;
        if (hostname.includes('linkedin.com')) {
            checkLinkedIn();
        } else if (hostname.includes('indeed.com')) {
            checkIndeed();
        }
    });
}

function removeCheckmarks() {
    document.querySelectorAll('.sponsor-checkmark').forEach(el => el.remove());
    document.querySelectorAll('[data-sponsor-checked]').forEach(el => el.removeAttribute('data-sponsor-checked'));
}

// Observer for dynamic content
const observer = new MutationObserver((mutations) => {
    if (!isDataLoaded) return;
    // Debounce or just run? For now just run, but maybe throttle if performance is bad.
    runCheck();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function checkLinkedIn() {
    // LinkedIn Job Cards (Search results)
    // Selectors might change, need to be robust.
    // Common selectors for company names in job cards:
    // .job-card-container__primary-description
    // .artdeco-entity-lockup__subtitle

    const companyElements = document.querySelectorAll('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle, .job-details-jobs-unified-top-card__company-name');

    companyElements.forEach(el => {
        processElement(el);
    });
}

function checkIndeed() {
    // Indeed company names
    // .companyName
    // [data-testid="company-name"]

    const companyElements = document.querySelectorAll('.companyName, [data-testid="company-name"]');

    companyElements.forEach(el => {
        processElement(el);
    });
}

function processElement(el) {
    if (el.hasAttribute('data-sponsor-checked')) return;

    const companyName = el.textContent.trim();
    if (!companyName) return;

    const normalized = normalizeCompanyName(companyName);

    if (sponsorSet.has(normalized)) {
        addCheckmark(el);
    }

    el.setAttribute('data-sponsor-checked', 'true');
}

function addCheckmark(el) {
    // Avoid double injection
    if (el.querySelector('.sponsor-checkmark')) return;

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
