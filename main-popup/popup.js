document.addEventListener("DOMContentLoaded", function () {
  main();
});

function main() {
  load_subExtention("profileManager/popup", "ProfileManager");
  load_subExtention("text-note/popup", "text-note-container");
}

function load_subExtention(path, divTag) {
  fetch(chrome.runtime.getURL(path + "/index.html"))
    .then((response) => response.text())
    .then((data) => {
      // Insert the fetched HTML content
      const container = document.getElementById(divTag);
      container.innerHTML = data;

      // Create a new document fragment to safely extract scripts
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = data;

      // Extract and execute external scripts
      const externalScripts = tempDiv.querySelectorAll("script[src]");
      externalScripts.forEach((script) => {
        const newScript = document.createElement("script");

        // Convert relative path to absolute path
        const absoluteSrc = chrome.runtime.getURL(
          path + "/" + script.getAttribute("src")
        );
        newScript.src = absoluteSrc;
        newScript.defer = true;
        document.body.appendChild(newScript);
      });

      // Extract and execute inline scripts
      const inlineScripts = tempDiv.querySelectorAll("script:not([src])");
      inlineScripts.forEach((script) => {
        const inlineScript = document.createElement("script");
        inlineScript.textContent = script.textContent;
        document.body.appendChild(inlineScript);
      });
    })
    .catch((error) => console.error("Error loading index.html:", error));
}
