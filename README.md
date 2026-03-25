# UK Visa Sponsor High-lighter 🇬🇧✨

A Chrome Extension that helps UK job seekers by automatically highlighting companies that are **Licensed Visa Sponsors** on **LinkedIn** and **Indeed**.

![Icon](icons/icon128.png)

## 🚀 Features

*   **Automatic Highlighting**: Displays a green checkmark ✅ next to companies that are on the official UK Home Office Sponsor List.
*   **Real-time Sync**: Dynamically fetches the latest data directly from GOV.UK (updates automatically every 7 days).
*   **Smart Matching**: Uses intelligent regex-based name normalization with word boundaries to match companies with high accuracy (e.g., "Google UK Ltd" vs "Google").
*   **Performance Optimized**: Uses background service worker caching to ensure fast page loads with minimal memory footprint.
*   **Popup Dashboard**:
    *   View total number of licensed sponsors.
    *   Check when the data was last updated.
    *   **Search**: Manually check if a specific company is a sponsor.
*   **Privacy First**: All data processing happens locally on your device. No browsing history is sent to any server.

## 📥 Installation

### From Source (Developer Mode)

1.  Clone this repository:
    ```bash
    git clone https://github.com/yitzuliu/UK-Visa-Sponsor-Highlighter.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder where you cloned this repository.

## 🛠️ How it Works

1.  **Data Fetching**: The extension dynamically locates and downloads the official "Register of Worker and Temporary Worker licensed sponsors" CSV from the [UK Government website](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).
2.  **Storage & Cache**: The parsed list is stored in `chrome.storage.local` and cached in the Background Service Worker's memory. This prevents individual web pages from bloating your browser's RAM.
3.  **Matching**: When you browse LinkedIn or Indeed, the extension collects visible company names and queries the background script to check them against the official list without slowing down the page rendering.

## 🔒 Privacy & Permissions

*   **Storage**: To save the sponsor list locally.
*   **Alarms**: To schedule the monthly data update.
*   **Host Permissions**:
    *   `gov.uk`: To fetch the official CSV.
    *   `linkedin.com` & `indeed.com`: To display the checkmarks on job listings.

## 🌟 Sponsorship & Recommendations

The extension features a **Native Recommendation Slot** at the bottom of the popup. This space is designed to be:
*   **Non-intrusive**: It looks like a natural part of the UI.
*   **Safe**: No external scripts or tracking pixels by default.
*   **Useful**: Intended for high-quality recommendations relevant to job seekers (e.g., CV review services, interview coaching).

### Default State
By default, this slot displays information about the **Open Source** nature of this project, linking to the GitHub repository and the author's profile.

### For Developers & Maintainers
As the extension owner, you can utilize this slot to feature:
*   **Premium Services**: CV reviews, visa consultation.
*   **Sponsors**: Partners who support the project.
*   **Community**: Links to Discord or other communities.

*Note: This content is static and controlled by the extension update. End-users cannot modify this slot.*

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](LICENSE)
