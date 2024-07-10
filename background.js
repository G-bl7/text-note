// background.js
import {
  profilesOnMessageHandler,
  initDbProfileManbager,
  getAllProfiles,
  getDefaultProfile,
  setDefaultProfileByName,
} from "./profileManager/background/profileManager.js";

import {
  initDbTextNoteManager,
  creatTextNoteContextMenu,
  loadTextNoteOptBeahavor,
  textNoteOnMessageHandler,
} from "./text-note/background/main.js";

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Welcome to G-bl7 Assistant 1.1");
  }
});

//***********-DB Managment-*************/

let db;

console.log("Background start on run");

// Open the IndexedDB
const request = indexedDB.open("Suise_knife_GE", 1);

request.onerror = (event) => {
  console.log("IndexedDB error:", event.target.errorCode);
};

request.onsuccess = (event) => {
  console.log("IndexedDB on success.");
  db = event.target.result;
  // Load submenu profiles after the database is successfully opened
  loadSubMenuProfilesPoc();
  loadTextNoteOptBeahavor(db, getDefaultProfile);
};

request.onupgradeneeded = (event) => {
  console.log("IndexedDB on upgrade needed.");
  db = event.target.result;

  initDbProfileManbager(db);

  initDbTextNoteManager(db);
};

//***********-CONTEXT MENU MANAGEMENT-*************/

// Create the Main context menu
function createContextMenu() {
  console.log("Create Main context menu.");
  chrome.contextMenus.create(
    {
      id: "profileManager",
      title: "Profiles",
      contexts: ["page"],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.log("Error creating context menu:", chrome.runtime.lastError);
      }
    }
  );
}

// Create new profile map
let profilesMap = new Map();

// set sub menu with profiles
function loadSubMenuProfilesPoc() {
  // Remove any existing submenu items
  chrome.contextMenus.removeAll(() => {
    // Create the main context menu again
    createContextMenu();
    creatTextNoteContextMenu();
    // Create new Profile map
    profilesMap = new Map();
    // Get all profiles and create submenu items
    getAllProfiles(db, (profiles) => {
      if (profiles.length === 0) {
        console.log("No profiles found");
        chrome.contextMenus.create(
          {
            id: "noProfiles",
            parentId: "profileManager",
            title: "No profiles available",
            contexts: ["all"],
          },
          () => {
            if (chrome.runtime.lastError) {
              console.log(
                "Error creating context menu item:",
                chrome.runtime.lastError
              );
            }
          }
        );
      } else {
        profiles.forEach((profile) => {
          let title = profile.default
            ? `> ${profile.profile_name}`
            : profile.profile_name;
          chrome.contextMenus.create(
            {
              id: `${profile.id}`,
              parentId: "profileManager",
              title: title,
              contexts: ["all"],
            },
            () => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Error creating context menu item:",
                  chrome.runtime.lastError
                );
              }
            }
          );
          // add profile user to map
          profilesMap.set(`${profile.id}`, profile);
        });
      }
    });
  });
}

// Edit Sub context menu
function loadProfiles2SubMenu() {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "profileManager") {
      loadSubMenuProfilesPoc();
    } else if (profilesMap.has(info.menuItemId)) {
      // Set new Default profile.
      console.log("Set new Default profile.");
      let newProfile = profilesMap.get(info.menuItemId);
      getDefaultProfile(db, (defaultProfile) => {
        setDefaultProfileByName(
          db,
          defaultProfile.profile_name,
          newProfile.profile_name
        );
        // Reload the submenu profiles after setting the new default profile
        loadSubMenuProfilesPoc();
      });
    }
  });
}

//***********-EVENT Handler-*************/

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Get request:", request.action);

  profilesOnMessageHandler(request, db, sendResponse);
  textNoteOnMessageHandler(db, request, sendResponse);

  if (request.action === "loadSubMenuProfilesPoc") {
    loadSubMenuProfilesPoc();
    return true;
  }
  return true;
});

//***********-INIT-*************/

// Initialize context menu and submenu
createContextMenu();
loadProfiles2SubMenu();

creatTextNoteContextMenu();
