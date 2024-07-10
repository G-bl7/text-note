console.log("Loading and executing /profileManager/js/profileManager.js");

export function initDbProfileManbager(db) {
  if (!db) {
    console.log("DB not available");
    return;
  }
  if (!db.objectStoreNames.contains("profiles")) {
    const profileStore = db.createObjectStore("profiles", {
      keyPath: "id",
      autoIncrement: true,
    });
    profileStore.createIndex("profile_name", "profile_name", { unique: true });
    profileStore.createIndex("default", "default", { unique: false });
    console.log("Profiles schema initialized.");

    profileStore.transaction.oncomplete = () => {
      addNewProfile({ profile_name: "Default", default: 1 }, db);
    };
  }
}

// Add new profile
export function addNewProfile(profileData, db) {
  console.log("Addinig New Profile", profileData);
  if (!db) {
    console.log("DB not available");
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readwrite");
    const profileStore = transaction.objectStore("profiles");
    const addRequest = profileStore.add(profileData);

    addRequest.onsuccess = () => {
      console.log("New profile added successfully: ", profileData.profile_name);
    };

    addRequest.onerror = (event) => {
      console.log("Error adding new profile:", event.target.error);
    };
  } catch (error) {
    console.log("Transaction error:", error);
  }
}

// Get All avalable Profile
export function getAllProfiles(db, callback) {
  if (!db) {
    console.log("DB not available");
    return;
  }

  try {
    console.log("Getting all profiles");
    const transaction = db.transaction(["profiles"], "readonly");
    const profileStore = transaction.objectStore("profiles");
    const getAllRequest = profileStore.getAll();

    getAllRequest.onsuccess = (event) => {
      const profiles = event.target.result;
      callback(profiles);
    };

    getAllRequest.onerror = (event) => {
      console.log("Error getting all profiles:", event.target.error);
      callback([]); // Return an empty array in case of error
    };
  } catch (error) {
    console.log("Transaction error:", error);
    callback([]); // Return an empty array in case of error
  }
}

// Get Profile by Name
export function setDefaultProfileByName(db, oldProfileName, newProfileName) {
  if (!db || oldProfileName === newProfileName) {
    console.log("Set new profile abord.");
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readwrite");
    const profileStore = transaction.objectStore("profiles");
    const index = profileStore.index("profile_name");

    // Change the old profile and set to False default flag
    const getRequestOld = index.get(oldProfileName);
    getRequestOld.onsuccess = (event) => {
      const oldProfile = event.target.result;
      if (oldProfile) {
        oldProfile.default = 0; // Update the 'default' property to false
        const updateRequestOld = profileStore.put(oldProfile);
        updateRequestOld.onsuccess = () => {
          console.log("Old profile updated successfully:", oldProfile);
        };
        updateRequestOld.onerror = (event) => {
          console.log("Error updating old profile:", event.target.error);
        };
      } else {
        console.log("Old profile not found:", oldProfileName);
      }
    };

    // set the new profile default flag to True
    const getRequestNew = index.get(newProfileName);
    getRequestNew.onsuccess = (event) => {
      const newProfile = event.target.result;
      if (newProfile) {
        newProfile.default = 1; // Update the 'default' property to true
        const updateRequestNew = profileStore.put(newProfile);
        updateRequestNew.onsuccess = () => {
          console.log("New default profile updated successfully:", newProfile);
        };
        updateRequestNew.onerror = (event) => {
          console.log(
            "Error updating new default profile:",
            event.target.error
          );
        };
      } else {
        console.log("New default profile not found:", newProfileName);
      }
    };
  } catch (error) {
    console.log("Transaction error:", error);
  }
}

export function updateProfileName(db, oldProfileName, newProfileName) {
  console.log(oldProfileName, newProfileName);
  if (!db || !oldProfileName || oldProfileName === newProfileName) {
    console.log("Update profile name aborted due to invalid input.");
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readwrite");
    const profileStore = transaction.objectStore("profiles");
    const index = profileStore.index("profile_name");

    // Fetch the profile by old name
    const getRequest = index.get(oldProfileName);
    getRequest.onsuccess = (event) => {
      const profile = event.target.result;
      if (profile) {
        // Update the profile name
        profile.profile_name = newProfileName;
        const updateRequest = profileStore.put(profile);
        updateRequest.onsuccess = () => {
          console.log("Profile name updated successfully:", profile);
        };
        updateRequest.onerror = (event) => {
          console.log("Error updating profile name:", event.target.error);
        };
      } else {
        console.log("Profile not found:", oldProfileName);
      }
    };

    getRequest.onerror = (event) => {
      console.log("Error fetching profile:", event.target.error);
    };
  } catch (error) {
    console.log("Transaction error:", error);
  }
}

// Delete Profile by Name
export function deleteProfileByName(db, profileName) {
  if (!db) {
    console.log("DB not available");
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readwrite");
    const profileStore = transaction.objectStore("profiles");
    const index = profileStore.index("profile_name");

    // Fetch the profile by name to delete it
    const getRequest = index.get(profileName);
    getRequest.onsuccess = (event) => {
      const profile = event.target.result;
      if (profile) {
        const deleteRequest = profileStore.delete(profile.id);
        deleteRequest.onsuccess = () => {
          console.log("Profile deleted successfully:", profileName);
        };
        deleteRequest.onerror = (event) => {
          console.log("Error deleting profile:", event.target.error);
        };
      } else {
        console.log("Profile not found:", profileName);
      }
    };

    getRequest.onerror = (event) => {
      console.log("Error fetching profile:", event.target.error);
    };
  } catch (error) {
    console.log("Transaction error:", error);
  }
}

// Get Default Profile
export function getDefaultProfile(db, callback) {
  if (!db) {
    console.log("DB not available");
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readonly");
    const profileStore = transaction.objectStore("profiles");
    const index = profileStore.index("default");

    const getRequest = index.openCursor(IDBKeyRange.only(1)); // Use openCursor to iterate over matching records
    getRequest.onsuccess = (event) => {
      console.log("get default profile on succes.");
      const cursor = event.target.result;

      if (cursor) {
        // Found a default profile
        callback(cursor.value); // Pass the profile to the callback
      } else {
        console.log("No default profiles found");
        callback(null); // Return null if no default profile is found
      }
    };

    getRequest.onerror = (event) => {
      console.log("Error getting default profile:", event.target.error);
      callback(null); // Return null in case of error
    };
  } catch (error) {
    console.log("Transaction error:", error);
    callback(null); // Return null in case of error
  }
}

// EVE?
export function profilesOnMessageHandler(request, db, sendResponse) {
  if (request.action === "getAllProfiles") {
    getAllProfiles(db, (profiles) => {
      sendResponse({ data: profiles });
    });
    return true;
  } else if (request.action === "addNewProfile") {
    addNewProfile(request.profileData, db);
    sendResponse({ data: 1 });
    return true;
  } else if (request.action === "updateProfileName") {
    updateProfileName(db, request.oldProfileName, request.newProfileName);
    sendResponse({ data: 1 });
    return true;
  } else if (request.action === "setDefaultProfile") {
    getDefaultProfile(db, (defaultProfile) => {
      setDefaultProfileByName(
        db,
        defaultProfile.profile_name,
        request.profileName
      );
      sendResponse({ data: 1 });
    });
    return true;
  } else if (request.action === "deleteProfile") {
    getDefaultProfile(db, (profile) => {
      if (profile.profile_name === request.profileName) {
        console.log("can't delete default profile.");
        sendResponse({ data: 1 });
      } else {
        deleteProfileByName(db, request.profileName);
        sendResponse({ data: 2 });
      }
    });
    return true;
  } else if (request.action === "getDefaultProfile") {
    getDefaultProfile(db, (profile) => {
      sendResponse({ data: profile });
    });
    return true;
  } else if (request.action === "getProfileById") {
    console.log(request);
    getProfileById(db, request.id, (profile) => {
      sendResponse({ data: profile });
    });
    return true;
  }
}

// Get Profile by ID
export function getProfileById(db, id, callback) {
  if (!db || !id) {
    console.log("Invalid input for fetching profile by ID.");
    callback(null);
    return;
  }

  try {
    const transaction = db.transaction(["profiles"], "readonly");
    const profileStore = transaction.objectStore("profiles");

    const getRequest = profileStore.get(id);
    getRequest.onsuccess = (event) => {
      const profile = event.target.result;
      if (profile) {
        callback(profile);
      } else {
        console.log(`Profile with id ${id} not found.`);
        callback(null);
      }
    };

    getRequest.onerror = (event) => {
      console.log(`Error fetching profile with id ${id}:`, event.target.error);
      callback(null);
    };
  } catch (error) {
    console.log("Transaction error:", error);
    callback(null);
  }
}
