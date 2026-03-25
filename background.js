importScripts('utils.js');

const ALARM_NAME = 'updateSponsorList';
const UPDATE_INTERVAL_MINUTES = 60 * 24 * 7; // Update every 7 days instead of 30 for freshness

let sponsorCache = null; // In-memory cache

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    fetchAndStoreData();
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: UPDATE_INTERVAL_MINUTES });
});

// Alarm listener for periodic updates
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        fetchAndStoreData();
    }
});

async function ensureCache() {
    if (sponsorCache !== null) return;
    
    const result = await chrome.storage.local.get(['sponsors']);
    if (result.sponsors) {
        sponsorCache = new Set(result.sponsors);
    } else {
        sponsorCache = new Set();
        // If empty, try to fetch, but don't block forever
        fetchAndStoreData(); 
    }
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkBatchSponsors') {
        ensureCache().then(() => {
            const results = {};
            for (const name of request.companies) {
                const normalized = normalizeCompanyName(name);
                results[name] = sponsorCache.has(normalized);
            }
            sendResponse({ results });
        });
        return true; // Keep channel open
    } else if (request.action === 'checkSponsor') {
        ensureCache().then(() => {
            const normalized = normalizeCompanyName(request.companyName);
            sendResponse({ isSponsor: sponsorCache.has(normalized) });
        });
        return true;
    } else if (request.action === 'forceUpdate') {
        fetchAndStoreData().then(success => sendResponse({ success }));
        return true;
    }
});

async function fetchAndStoreData() {
    try {
        // 1. Dynamically fetch the latest CSV URL from the gov.uk landing page
        const pageRes = await fetch('https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers');
        const html = await pageRes.text();
        
        // Find the first CSV link (usually the Worker and Temporary Worker list)
        const match = html.match(/https:\/\/[^\s"'<>]+\.csv/i);
        if (!match) throw new Error("Could not find CSV URL on GOV.UK");
        const csvUrl = match[0];

        // 2. Fetch the CSV
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();

        // 3. Parse and cache
        const companies = parseCSV(csvText);
        const lastUpdated = new Date().toISOString();

        sponsorCache = companies; // Update in-memory cache immediately

        await chrome.storage.local.set({
            sponsors: Array.from(companies), // Store as array for JSON serialization
            lastUpdated: lastUpdated,
            totalCount: companies.size
        });

        return true;
    } catch (error) {
        console.error('Failed to fetch or store data:', error);
        return false;
    }
}

function parseCSV(text) {
    const lines = text.split('\n');
    const companies = new Set();

    // Skip header
    const startIndex = 1;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let name = extractFirstColumn(line);
        if (name) {
            companies.add(normalizeCompanyName(name));
        }
    }
    return companies;
}

function extractFirstColumn(line) {
    const match = line.match(/^"([^"]+)"|([^,]+)/);
    if (match) {
        return match[1] || match[2];
    }
    return null;
}
