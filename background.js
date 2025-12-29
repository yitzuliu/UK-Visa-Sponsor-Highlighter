importScripts('utils.js');

const DATA_URL = 'https://assets.publishing.service.gov.uk/media/69525e05542c867b685c4036/2025-12-29_-_Worker_and_Temporary_Worker.csv';
const ALARM_NAME = 'updateSponsorList';
const UPDATE_INTERVAL_MINUTES = 60 * 24 * 30; // 30 days

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    // console.log('Extension installed. Fetching initial data...');
    fetchAndStoreData();
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: UPDATE_INTERVAL_MINUTES });
});

// Alarm listener for periodic updates
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        fetchAndStoreData();
    }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkSponsor') {
        // This might be too slow for bulk checking, better to let content script have the data
        // or batch check. For now, let's assume content script loads data.
        // Actually, passing the whole set to content script might be heavy (MBs).
        // But chrome.storage.local.get is async.
        // Let's implement a check here just in case, but primary method will be content script reading storage.
        checkSponsor(request.companyName).then(isSponsor => sendResponse({ isSponsor }));
        return true; // Keep channel open
    } else if (request.action === 'forceUpdate') {
        fetchAndStoreData().then(success => sendResponse({ success }));
        return true;
    }
});

async function fetchAndStoreData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();

        const companies = parseCSV(csvText);
        const lastUpdated = new Date().toISOString();

        await chrome.storage.local.set({
            sponsors: Array.from(companies), // Store as array for JSON serialization
            lastUpdated: lastUpdated,
            totalCount: companies.size
        });

        // console.log(`Stored ${companies.size} companies. Last updated: ${lastUpdated}`);
        return true;
    } catch (error) {
        console.error('Failed to fetch or store data:', error);
        return false;
    }
}

function parseCSV(text) {
    const lines = text.split('\n');
    const companies = new Set();

    // Skip header if present (assuming first line is header)
    const startIndex = 1;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing: take the first column. 
        // Note: This CSV might have quoted fields. For a robust solution we need a better parser,
        // but for now let's assume standard format or split by comma.
        // The GOV.UK list usually has "Organisation Name" as the first column.
        // We need to handle commas inside quotes.

        let name = extractFirstColumn(line);
        if (name) {
            companies.add(normalizeCompanyName(name));
        }
    }
    return companies;
}

function extractFirstColumn(line) {
    // Regex to handle quoted strings or simple comma separation
    // Matches: "Value", ... or Value, ...
    const match = line.match(/^"([^"]+)"|([^,]+)/);
    if (match) {
        return match[1] || match[2]; // match[1] is quoted content, match[2] is unquoted
    }
    return null;
}
