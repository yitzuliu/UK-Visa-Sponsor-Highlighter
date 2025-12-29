# UK Visa Sponsor High-lighter 🇬🇧✨

A Chrome Extension that helps UK job seekers by automatically highlighting companies that are **Licensed Visa Sponsors** on **LinkedIn** and **Indeed**.

![Icon](icons/icon128.png)

## 🚀 Features

*   **Automatic Highlighting**: Displays a green checkmark ✅ next to companies that are on the official UK Home Office Sponsor List.
*   **Real-time Sync**: Fetches the latest data directly from GOV.UK (updates automatically every 30 days).
*   **Smart Matching**: Uses intelligent name normalization to match companies even if the names vary slightly (e.g., "Google UK Ltd" vs "Google").
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

1.  **Data Fetching**: The extension downloads the official "Register of Worker and Temporary Worker licensed sponsors" CSV from the [UK Government website](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).
2.  **Storage**: The list is parsed and stored locally in your browser (`chrome.storage.local`).
3.  **Matching**: When you browse LinkedIn or Indeed, the extension scans for company names and checks them against the local database.

## 🔒 Privacy & Permissions

*   **Storage**: To save the sponsor list locally.
*   **Alarms**: To schedule the monthly data update.
*   **Host Permissions**:
    *   `gov.uk`: To fetch the official CSV.
    *   `linkedin.com` & `indeed.com`: To display the checkmarks on job listings.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](LICENSE)
