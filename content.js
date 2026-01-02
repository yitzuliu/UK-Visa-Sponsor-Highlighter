// content.js

let sponsorSet = new Set();
let isDataLoaded = false;
let isEnabled = true; // Cache enabled state

// Load data from storage on start
chrome.storage.local.get(['sponsors', 'isEnabled'], (result) => {
    // Set enabled state immediately
    if (result.isEnabled !== undefined) {
        isEnabled = result.isEnabled;
    }

    if (result.sponsors) {
        sponsorSet = new Set(result.sponsors);
        isDataLoaded = true;
        // Initial run
        runCheck();
    } else {
        console.log('No sponsor data found in storage.');
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
            isEnabled = changes.isEnabled.newValue;
            if (isEnabled) {
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
        isEnabled = request.isEnabled;
        if (isEnabled) {
            runCheck();
        } else {
            removeCheckmarks();
        }
    }
});

function runCheck() {
    // Synchronous checks first for performance
    if (!isDataLoaded) return;
    if (!isEnabled) return;

    const hostname = window.location.hostname;
    if (hostname.includes('linkedin.com')) {
        checkLinkedIn();
    } else if (hostname.includes('indeed.com')) {
        checkIndeed();
    }
}

function removeCheckmarks() {
    document.querySelectorAll('.sponsor-checkmark').forEach(el => el.remove());
    document.querySelectorAll('[data-sponsor-checked]').forEach(el => el.removeAttribute('data-sponsor-checked'));
}

// Observer for dynamic content
const observer = new MutationObserver((mutations) => {
    if (!isDataLoaded || !isEnabled) return;
    // Removed throttling to ensure responsiveness. 
    // The performance bottleneck was the storage call, which is now fixed via caching.
    runCheck();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function checkLinkedIn() {
    // LinkedIn Job Cards (Search results & Details)
    const selectors = [
        '.job-card-container__primary-description', // Legacy/Mobile
        '.artdeco-entity-lockup__subtitle', // Main list (Left sidebar)
        '.job-details-jobs-unified-top-card__company-name', // Job Details (Right sidebar)
        '.job-card-list__company-name', // Alternative list view
        '.app-aware-link' // Sometimes company name is just a link
    ];

    const companyElements = document.querySelectorAll(selectors.join(', '));

    companyElements.forEach(el => {
        processElement(el);
    });
}

function checkIndeed() {
    // Indeed company names
    const companyElements = document.querySelectorAll('.companyName, [data-testid="company-name"]');

    companyElements.forEach(el => {
        processElement(el);
    });
}

function processElement(el) {
    // Get text content, excluding our own badge if it exists
    const companyName = el.textContent.trim();
    if (!companyName) return;

    const normalized = normalizeCompanyName(companyName);
    const isSponsor = sponsorSet.has(normalized);
    const existingBadge = el.querySelector('.sponsor-checkmark');

    if (isSponsor) {
        if (!existingBadge) {
            addCheckmark(el);
        }
        if (el.getAttribute('data-sponsor-checked') !== 'true') {
            el.setAttribute('data-sponsor-checked', 'true');
        }
    } else {
        // Handle reused nodes (Virtualization)
        if (existingBadge) {
            existingBadge.remove();
        }
        if (el.hasAttribute('data-sponsor-checked')) {
            el.removeAttribute('data-sponsor-checked');
        }
    }
}

function addCheckmark(el) {
    // Avoid double injection
    if (el.querySelector('.sponsor-checkmark')) return;

    const span = document.createElement('span');
    span.className = 'sponsor-checkmark';
    // Reverted to innerHTML for simplicity and reliability. 
    // The SVG string is hardcoded and safe.
    span.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-left: 4px;">
            <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
            <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    span.title = 'Licensed Sponsor confirmed by GOV.UK';
    el.appendChild(span);
}
