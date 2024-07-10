console.log("Loading and executing text-note/background/main.js");

// Init DB for Text -> Note relation.
export function initDbTextNoteManager(db) {
  if (!db) {
    console.log("DB not available");
    return;
  }
  if (!db.objectStoreNames.contains("textNote")) {
    const textNote = db.createObjectStore("textNote", {
      keyPath: "id",
      autoIncrement: true,
    });
    textNote.createIndex("profileID", "profileID", { unique: false });

    textNote.createIndex("text", "text", { unique: false });
    textNote.createIndex("note", "note", { unique: false });
    textNote.createIndex("timestamp", "timestamp", { unique: false });
    console.log("Text schema initialized.");
  }
}

export function getAllTextNote(db, profileID, callback) {
  if (!db) {
    console.log("DB not available");
    return;
  }
  console.log("calling for profileID:", profileID);
  const transaction = db.transaction(["textNote"], "readonly");
  const objectStore = transaction.objectStore("textNote");
  const index = objectStore.index("profileID");
  let request;
  if (profileID) {
    request = index.getAll(IDBKeyRange.only(profileID)); // Ensure we are querying with profileID
  } else {
    request = index.getAll(); // Ensure we are querying with profileID
  }

  request.onsuccess = function (event) {
    const result = event.target.result;
    console.log("Request succeeded:");
    callback(result);
  };

  request.onerror = function (event) {
    console.error("Error fetching text notes:", event.target.error);
    callback([]);
  };
}

export function addNewTextNote(db, textNote) {
  if (!db) {
    console.log("DB not available");
    return;
  }
  console.log("Adding new TextNote:", textNote);

  const transaction = db.transaction(["textNote"], "readwrite");
  const objectStore = transaction.objectStore("textNote");
  const request = objectStore.add(textNote);

  request.onsuccess = function (event) {
    console.log("Text note added:", event.target.result);
  };

  request.onerror = function (event) {
    console.error("Error adding text note:", event.target.error);
  };
}

export function deleteTextNote(db, textNoteId) {
  if (!db) {
    console.log("DB not available");
    return;
  }
  const transaction = db.transaction(["textNote"], "readwrite");
  const objectStore = transaction.objectStore("textNote");
  const request = objectStore.delete(textNoteId);

  request.onsuccess = function (event) {
    console.log("Text note deleted:", textNoteId);
  };

  request.onerror = function (event) {
    console.error("Error deleting text note:", event.target.error);
  };
}

export function updateTextNote(db, textNoteID, field, newValue) {
  if (!db) {
    console.log("DB not available");
    return;
  }

  const transaction = db.transaction(["textNote"], "readwrite");
  const objectStore = transaction.objectStore("textNote");
  const request = objectStore.get(textNoteID);

  request.onsuccess = function (event) {
    const textNote = event.target.result;
    if (textNote) {
      if (field === "text") {
        textNote.text = newValue;
      } else if (field === "note") {
        textNote.note = newValue;
      } else {
        console.error("Invalid field:", field);
        return;
      }

      const updateRequest = objectStore.put(textNote);

      updateRequest.onsuccess = function (event) {};

      updateRequest.onerror = function (event) {
        console.error(
          `Error updating ${field} for text note ID ${textNoteID}:`,
          event.target.error
        );
      };
    } else {
      console.error("Text note not found:", textNoteID);
    }
  };

  request.onerror = function (event) {
    console.error("Error fetching text note:", event.target.error);
  };
}

// EVET
export function textNoteOnMessageHandler(db, request, sendResponse) {
  if (!db) {
    console.log("DB not available");
    sendResponse({ data: 0 });
    return false;
  }

  if (request.action === "getAllTextNote") {
    getAllTextNote(db, request.profileID, (textNotes) => {
      sendResponse({ data: textNotes });
    });
    return true;
  } else if (request.action === "addNewTextNote") {
    addNewTextNote(db, request.textNote);
    sendResponse({ data: 1 });
    return true;
  } else if (request.action === "updateTextNote") {
    updateTextNote(db, request.textNoteID, request.field, request.newValue);
    sendResponse({ data: 1 });
    return true;
  } else if (request.action === "deleteTextNote") {
    deleteTextNote(db, request.textNoteID);
    sendResponse({ data: 1 });
    return true;
  } else if (request.action == "GetStatistics") {
    getStatistics(db, (statistics) => {
      sendResponse({ data: statistics });
    });
    return true;
  }
}

// note context menu

export function creatTextNoteContextMenu() {
  console.log("Createing TextNote selection Opt menu");
  chrome.contextMenus.create(
    {
      id: "textNoteContextMenu",
      title: "Note",
      contexts: ["selection"],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.log("Error creating context menu:", chrome.runtime.lastError);
      }
    }
  );
}

export function loadTextNoteOptBeahavor(db, funcGetDefaultProfile) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "textNoteContextMenu") {
      funcGetDefaultProfile(db, (defaultProfile) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text, defaultProfile) => {
            let note = prompt("Note");
            if (note !== null) {
              // Check if note is not null (user didn't cancel)
              let textNoteObj = {
                text: text,
                note: note,
                timestamp: new Date().getTime(), // Timestamp in milliseconds since epoch
                profileID: defaultProfile.id,
              };
              // add New textNote to DB
              chrome.runtime.sendMessage(
                { action: "addNewTextNote", textNote: textNoteObj },
                (response) => {}
              );
            } else {
              console.log("Note was not provided or canceled.");
            }
          },
          args: [info.selectionText, defaultProfile],
        });
      });
    }
  });
}

export function getStatistics(db, callback) {
  if (!db) {
    console.log("DB not available");
    return;
  }

  const transaction = db.transaction(["textNote"], "readonly");
  const objectStore = transaction.objectStore("textNote");

  const request = objectStore.getAll();
  request.onsuccess = function (event) {
    const notes = event.target.result;
    const profileStats = {};

    notes.forEach((note) => {
      const profileID = note.profileID;
      if (!profileStats[profileID]) {
        profileStats[profileID] = {
          count: 0,
        };
      }
      profileStats[profileID].count++;
    });
    callback(profileStats);
  };

  request.onerror = function (event) {
    console.log("Error retrieving data:", event.target.errorCode);
    callback({});
  };
}
