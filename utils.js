// Shared utility functions

const DOMAINS = ['.com', '.co.uk', '.org.uk', '.net', '.io', '.ai', '.co'];

// Build a regex pattern: match word boundary + suffix + word boundary at the end of string
const END_SUFFIX_REGEX = new RegExp('\\b(' + [
    'public limited company', 'limited', 'ltd', 'plc', 'p l c', 'l l p', 'llp',
    'inc', 'incorporated', 'corporation', 'corp', 'gmbh', 's a',
    'group', 'holdings', 'holding', 'international', 'global', 'systems', 'services',
    'solutions', 'technologies', 'labs', 'partners', 'uk',
    'banking', 'bank', 'national association', 'n a', 'trust'
].join('|') + ')\\s*$', 'gi');

function normalizeCompanyName(name) {
    if (!name) return '';

    let normalized = name.toLowerCase();

    // 1. Remove "trading as" noise early
    normalized = normalized.split(/\b(trading as|t\/as|t\/a)\b/)[0];

    // 2. Domain Stripping
    for (const domain of DOMAINS) {
        if (normalized.includes(domain)) {
            normalized = normalized.split(domain).join('');
        }
    }

    // 3. Remove Punctuation (replace with space to keep words distinct for boundary checks)
    normalized = normalized.replace(/[^\w\s]/g, " ");

    // 4. Recursive Suffix Removal (from the end)
    let changed = true;
    while (changed) {
        let prev = normalized;
        normalized = normalized.replace(END_SUFFIX_REGEX, '').trim();
        changed = (prev !== normalized);
    }

    // 5. Space Annihilation
    // Remove ALL spaces for the final strict match
    normalized = normalized.replace(/\s+/g, '');

    return normalized;
}

// Export for node testing if needed, or just global for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeCompanyName };
}
