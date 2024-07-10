console.log(
  "Popup main.js has been loaded and executed successfully. textNote"
);

document
  .getElementById("textNoteManagerButton")
  .addEventListener("click", loadWithDefaultProfile);

document
  .getElementById("text-note-statistics")
  .addEventListener("click", loadStatistics);

function loadWithDefaultProfile() {
  chrome.runtime.sendMessage({ action: "getDefaultProfile" }, (response) => {
    if (response.data) {
      console.log(response);
      chrome.tabs.create({
        url: chrome.runtime.getURL(
          "/text-note/dashboard/text-not-manager.html?id=" +
            response.data.id +
            "&&name=" +
            response.data.profile_name
        ),
      });
    }
  });
}

function loadStatistics() {
  chrome.tabs.create({
    url: chrome.runtime.getURL(
      "text-note/dashboard/text-note-statistics.html"
    ),
  });
}
