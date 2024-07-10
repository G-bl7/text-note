console.log("Injected JS G-bl7 Assistant start running.");

//  Get text From DB
function main() {
  chrome.runtime.sendMessage({ action: "getDefaultProfile" }, (reponse) => {
    defaultProfile = reponse.data;
    chrome.runtime.sendMessage(
      { action: "getAllTextNote", profileID: defaultProfile.id },
      (reponse) => {
        reponse.data.forEach((item) => {
          let regex = new RegExp(`(${item.text})`, "gi");
          underlineText(document.body, regex, item.note);
        });
      }
    );
  });
}

// Function to underline text
function underlineText(node, regex, note) {
  if (node.nodeType === Node.TEXT_NODE) {
    const matches = node.textContent.match(regex);
    if (matches) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach((match) => {
        const matchIndex = node.textContent.indexOf(match, lastIndex);
        fragment.appendChild(
          document.createTextNode(node.textContent.slice(lastIndex, matchIndex))
        );

        const span = document.createElement("span");
        span.className = "saved-note";
        span.title = note;
        span.textContent = match;
        fragment.appendChild(span);

        lastIndex = matchIndex + match.length;
      });

      fragment.appendChild(
        document.createTextNode(node.textContent.slice(lastIndex))
      );
      node.parentNode.replaceChild(fragment, node);
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.nodeName !== "SCRIPT" &&
    node.nodeName !== "STYLE"
  ) {
    node.childNodes.forEach((child) => underlineText(child, regex, note));
  }
}

main();
