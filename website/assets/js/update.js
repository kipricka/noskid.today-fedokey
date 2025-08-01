//Update.js | Check for updates and notify the user

async function checkForUpdates() {
    try {
        const storedVersion = localStorage.lastest || localStorage?.getItem?.('lastest');

        const response = await fetch('/api/latest/'); //its latest, not lastest, needs to be fixed

        if (!response.ok) {
            log(`Error while checking for updates: ${response.statusText}`, 'error');
            return;
        }

        const latestVersion = await response.text();

        if (storedVersion === undefined || storedVersion === null || storedVersion === '') {
            localStorage.lastest = latestVersion;
            log(`Initialized version to ${latestVersion}`, 'success');
        } else if (storedVersion !== latestVersion) {
            log('New version: ' + latestVersion, 'warning');
            localStorage.lastest = latestVersion;
            showNotification(`Noskid updated to version <strong>${latestVersion}</strong>`);
        } else {
            log(`We are up to date ! (${latestVersion})`, 'success');
        }

    } catch (error) {
        log(`Error while checking for updates: ${error}`, 'error');
    }
}

checkForUpdates();