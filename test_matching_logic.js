const { normalizeCompanyName } = require('./utils.js');

const testCases = [
    {
        name: "JPMorgan Chase Match",
        site: "JPMorganChase",
        db: "JPMorgan Chase Bank, National Association",
        expected: true
    },
    {
        name: "Lloyds Bank Match (Attached Bank)",
        site: "lloydsbankGroup",
        db: "Lloyds Bank plc",
        expected: false
        // With word boundary enforcement, 'lloydsbank' !== 'lloyds'.
        // This is the intended trade-off to protect names like 'Softbank'.
    },
    {
        name: "Lloyds Banking Group Match (New Case)",
        site: "Lloyds Banking Group",
        db: "Lloyds Bank plc",
        expected: true
    },
    {
        name: "Expedia Match",
        site: "Expedia Group",
        db: "Expedia.com Ltd",
        expected: true
    },
    {
        name: "Zopa Match",
        site: "Zopa Bank",
        db: "Zopa Group Limited",
        expected: true
    },
    {
        name: "Softbank Accuracy Check",
        site: "Softbank",
        db: "SoftBank Group",
        expected: true
        // Logic Result: 'SoftBank Group' -> 'softbank'. 'Softbank' -> 'softbank'. Match = TRUE.
        // Ensures 'bank' is not mistakenly dropped from inside a word.
    },
    {
        name: "Standard Match",
        site: "Google",
        db: "Google UK Ltd",
        expected: true
    }
];

console.log("Running Matching Tests...\n");

let passed = 0;
let failed = 0;

testCases.forEach(test => {
    const normSite = normalizeCompanyName(test.site);
    const normDb = normalizeCompanyName(test.db);

    // We strictly compare the NORMALIZED versions
    const isMatch = normSite === normDb;

    // For the safety check, we are asserting on the match result
    if (isMatch === test.expected) {
        console.log(`✅ [PASS] ${test.name}`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${test.name}`);
        console.log(`   Site: "${test.site}" -> "${normSite}"`);
        console.log(`   DB:   "${test.db}"   -> "${normDb}"`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
