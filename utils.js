// Shared utility functions

function normalizeCompanyName(name) {
    if (!name) return '';

    let normalized = name.toLowerCase();

    // Remove common suffixes
    // Note: Order matters. "limited" should be removed.
    const suffixes = [
        ' limited', ' ltd.', ' ltd', ' plc', ' p.l.c.', ' llp', ' l.l.p.', ' inc', ' inc.', ' incorporated',
        ' corporation', ' corp', ' corp.', ' group', ' holdings', ' uk', ' (uk)'
    ];

    // Remove punctuation
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    normalized = normalized.replace(/\s{2,}/g, " "); // Replace multiple spaces with single space
    normalized = normalized.trim(); // Trim before checking suffixes

    // Remove suffixes
    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
        }
    }

    return normalized.trim();
}

// Export for node testing if needed, or just global for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeCompanyName };
}
