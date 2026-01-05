// Shared utility functions

// Comprehensive Suffix/Prefix/Noise List
// Sorted by length DESC to ensure longest match removal first
const IGNORE_PATTERNS = [
    // Separators & Informational
    ' trading as ', ' t/as ', ' t/a ', // Remove "trading as" and everything after, or just the phrase? 
    // For now, let's treat them as noise to be stripped if they appear. 

    // Legal Entities (Spaced)
    ' public limited company', ' limited', ' limited.', ' ltd.', ' ltd', ' plc', ' p.l.c.',
    ' llp', ' l.l.p.', ' inc.', ' inc', ' incorporated', ' corporation', ' corp.', ' corp',
    ' gmbh', ' s.a.',

    // Structural/Business Units (Spaced)
    ' group', ' holdings', ' holding', ' international', ' global', ' systems', ' services',
    ' solutions', ' technologies', ' labs', ' partners', ' uk', ' (uk)',

    // Banking specific (Spaced)
    ' banking', ' bank', ' national association', ' n.a.', ' trust',

    // --- Attached Variants (No leading space) ---
    // CAUTION: Only add if unique enough to not break real words
    // 'group' -> removal is safe if we strip recursively from end
    'group', 'holdings', 'limited', 'ltd', 'plc', 'llp', 'inc', 'corp', 'bank', 'banking'
];

// Domains to strip
const DOMAINS = ['.com', '.co.uk', '.org.uk', '.net', '.io', '.ai', '.co'];

function normalizeCompanyName(name) {
    if (!name) return '';

    let normalized = name.toLowerCase();

    // 1. Domain Stripping
    // Remove domain extensions anywhere in the string
    for (const domain of DOMAINS) {
        if (normalized.includes(domain)) {
            normalized = normalized.split(domain).join('');
        }
    }

    // 2. Remove Punctuation
    // Keep only letters, numbers, and spaces
    normalized = normalized.replace(/[^\w\s]/g, "");

    // 3. Recursive Suffix Removal
    // We loop until the string stops changing
    let changed = true;
    while (changed) {
        changed = false;
        // Trim before checking suffixes
        normalized = normalized.trim();

        for (const suffix of IGNORE_PATTERNS) {
            // Check if it ends with this suffix
            // We use endsWith, but we must be careful with short suffixes without spaces
            // e.g. "Bank" removal from "Softbank" -> "Soft".

            if (normalized.endsWith(suffix)) {
                // Cut it off
                normalized = normalized.slice(0, -suffix.length);
                changed = true;
                // Restart loop to find next suffix (e.g. was "BankGroup", now "Bank")
                break;
            }
        }
    }

    // 4. Space Annihilation
    // Remove ALL spaces
    normalized = normalized.replace(/\s+/g, '');

    return normalized;
}

// Export for node testing if needed, or just global for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeCompanyName };
}
