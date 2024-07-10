console.log("loading profiles Module.");
document.getElementById('ProfilesManager').addEventListener('click', function () {
    chrome.tabs.create({url: chrome.runtime.getURL('profileManager/profilesManager/index.html')});
});