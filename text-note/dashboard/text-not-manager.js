document.addEventListener("DOMContentLoaded", () => {
  const defaultProfile = getUrlParams(window.location.href);

  document.getElementById("profleName").textContent =
    defaultProfile.profile_name;
  document.getElementById("profileId").textContent = defaultProfile.id;

  loadTextNote();
  selectAllEvent();

  document
    .getElementById("deleteSelectedButton")
    .addEventListener("click", multiDeleteTextNote);
  document
    .getElementById("exportButton")
    .addEventListener("click", exportSelectedTextNotes);
  document
    .getElementById("importButton")
    .addEventListener("click", () =>
      document.getElementById("importFile").click()
    );
  document
    .getElementById("importFile")
    .addEventListener("change", importTextNotes);
});

let textNotes = [];
let SelectedRow = 0;

function loadTextNote() {
  showLoader();
  document.getElementById("SelectedRow").textContent = 0;
  document.getElementById("searchText").value = "";
  document.getElementById("searchNote").value = "";

  const profileID = Number(document.getElementById("profileId").textContent);

  chrome.runtime.sendMessage(
    { action: "getAllTextNote", profileID },
    (response) => {
      textNotes = response.data || [];
      displayTextNote(textNotes);
      document.getElementById("totalRows").textContent = textNotes.length;
    }
  );
}

function displayTextNote(textNotes) {
  const tableBody = document.getElementById("TextNoteTbody");
  tableBody.innerHTML = "";
  document.getElementById("selectAll").checked = false;

  textNotes.forEach((item, index) => {
    const row = document.createElement("tr");

    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.itemID = item.id;
    checkbox.type = "checkbox";
    checkbox.classList.add("select-row");
    checkbox.dataset.index = index;
    selectCell.appendChild(checkbox);

    checkbox.addEventListener("change", function () {
      SelectedRow += this.checked ? 1 : -1;
      document.getElementById("SelectedRow").textContent = SelectedRow;
    });

    const textCell = document.createElement("td");
    textCell.contentEditable = true;
    textCell.textContent = item.text || "";
    textCell.addEventListener("blur", () =>
      updateTextNote(item.id, "text", textCell.textContent)
    );

    const noteCell = document.createElement("td");
    noteCell.contentEditable = true;
    noteCell.textContent = item.note || "";
    noteCell.addEventListener("blur", () =>
      updateTextNote(item.id, "note", noteCell.textContent)
    );

    const timestampCell = document.createElement("td");
    timestampCell.textContent = formatTimestamp(item.timestamp);

    const actionsCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTextNoteItem(item.id));
    actionsCell.appendChild(deleteButton);

    row.appendChild(selectCell);
    row.appendChild(textCell);
    row.appendChild(noteCell);
    row.appendChild(timestampCell);
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });

  ["searchText", "searchNote"].forEach((id) =>
    document.getElementById(id).addEventListener("input", filterTextNotes)
  );
  hideLoader();
}

function updateTextNote(textNoteID, field, newValue) {
  chrome.runtime.sendMessage(
    { action: "updateTextNote", textNoteID, field, newValue },
    (response) => {
      if (!response.data) {
        console.error(
          `Failed to update ${field} for text note ID ${textNoteID}`
        );
      }
    }
  );
}

function deleteTextNoteItem(textNoteID) {
  showLoader();
  chrome.runtime.sendMessage(
    { action: "deleteTextNote", textNoteID },
    (response) => {
      if (response.data) {
        loadTextNote();
      } else {
        console.error(`Failed to delete text note ID ${textNoteID}`);
      }
    }
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp || "2024-01-01 00:00:00");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getUTCFullYear();
  return `${hours}:${minutes} (${day}/${month}/${year})`;
}

function filterTextNotes() {
  const searchTextValue = document
    .getElementById("searchText")
    .value.toLowerCase();
  const searchNoteValue = document
    .getElementById("searchNote")
    .value.toLowerCase();
  const filteredData = textNotes.filter(
    (item) =>
      item.text.toLowerCase().includes(searchTextValue) &&
      item.note.toLowerCase().includes(searchNoteValue)
  );
  document.getElementById("filteredResults").textContent = filteredData.length;
  displayTextNote(filteredData);
}

function selectAllEvent() {
  const selectAllCheckbox = document.getElementById("selectAll");
  selectAllCheckbox.addEventListener("change", function () {
    const checkboxes = document.querySelectorAll(".select-row");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = this.checked;
      checkbox.dispatchEvent(new Event("change"));
    });
  });
}

function multiDeleteTextNote() {
  showLoader();
  const checkboxes = document.querySelectorAll(".select-row:checked");
  const deletePromises = Array.from(checkboxes).map(
    (checkbox) =>
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "deleteTextNote", textNoteID: checkbox.itemID },
          (response) => {
            if (response.data) {
              resolve();
            } else {
              console.error(`Failed to delete text note ID ${checkbox.itemID}`);
              reject();
            }
          }
        );
      })
  );

  Promise.all(deletePromises).then(() => {
    loadTextNote();
  });
}

function exportSelectedTextNotes() {
  const selectedNotes = [];
  const checkboxes = document.querySelectorAll(".select-row:checked");
  if (checkboxes.length === 0) {
    // If no checkboxes are checked, export all text notes
    textNotes.forEach(({ profileID, id, ...noteWithoutID }) => {
      selectedNotes.push(noteWithoutID);
    });
  } else {
    checkboxes.forEach((checkbox) => {
      const index = checkbox.dataset.index;
      const { profileID, id, ...noteWithoutID } = textNotes[index]; // Exclude profileID, id, and timestamp
      selectedNotes.push(noteWithoutID);
    });
  }
  const json = JSON.stringify(selectedNotes, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "selected_text_notes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importTextNotes(event) {
  showLoader();
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    const fileExtension = file.name.split(".").pop().toLowerCase();

    reader.onload = function (e) {
      const fileContent = e.target.result;
      if (fileExtension === "json") {
        processJSON(fileContent);
      } else {
        const lines = fileContent.split(/\r?\n/);
        processLines(lines);
      }
    };

    reader.readAsText(file);

    async function processLines(lines) {
      const defaultProfile = await getDefaultProfile();

      for (let line of lines) {
        line = line.trim();
        if (line === "") continue;
        item = {
          text: line,
          note: "/",
          profileID: null,
          timestamp: new Date().getTime(),
        };

        item.profileID = defaultProfile.id;

        chrome.runtime.sendMessage({
          action: "addNewTextNote",
          textNote: item,
        });
      }

      loadTextNote();
      document.getElementById("totalRows").textContent = textNotes.length;
    }

    async function processJSON(jsonContent) {
      let jsonArray;
      try {
        jsonArray = JSON.parse(jsonContent);
      } catch (error) {
        console.error("Invalid JSON content:", error);
        hideLoader(); // Hide loader if there's an error
        return;
      }
      const defaultProfile = await getDefaultProfile();

      for (let item of jsonArray) {
        item.profileID = defaultProfile.id;

        chrome.runtime.sendMessage({
          action: "addNewTextNote",
          textNote: item,
        });
      }
      console.log("Done");
      loadTextNote();
      document.getElementById("totalRows").textContent = textNotes.length;
    }

    function getDefaultProfile() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getDefaultProfile" },
          (response) => {
            if (response.data) {
              resolve(response.data);
            } else {
              console.error("Failed to fetch default profile");
              hideLoader(); // Hide loader if there's an error
            }
          }
        );
      });
    }
  }
}

function getUrlParams(url) {
  const params = new URLSearchParams(url.split("?")[1]);

  return {
    id: params.get("id"),
    profile_name: params.get("name"),
  };
}

function showLoader() {
  toggleTableInteraction(true);

  document.getElementById("multi-line-loader").style.display = "block";
}

function hideLoader() {
  document.getElementById("multi-line-loader").style.display = "none";
  toggleTableInteraction(false);
}

function toggleTableInteraction(disable) {
  const tableContainer = document.querySelector(".table-container");

  if (disable) {
    tableContainer.classList.add("disabled");
  } else {
    tableContainer.classList.remove("disabled");
  }
}
