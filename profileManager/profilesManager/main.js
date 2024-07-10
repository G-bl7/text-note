
//***********-Buttun Event-*************/
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();

    document.getElementById('addProfileButton').addEventListener('click', () => {
        showModal('Add New Profile');
    });

    document.querySelector('.close').addEventListener('click', closeModal);

    document.getElementById('profileForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const profileName = document.getElementById('profileName').value;
        if (profileName) {
            addNewProfile({ profile_name: profileName });
            closeModal();
        }
    });
});

//***********-Function management-*************/

// Load Profiles of to table
function loadProfiles() {
    chrome.runtime.sendMessage({ action: 'getAllProfiles' }, (response) => {
        const profiles = response.data;
        const defaultProfileRow = document.getElementById('defaultProfileRow');
        const profilesList = document.getElementById('profilesList');

        // Clear existing rows
        defaultProfileRow.innerHTML = '';
        profilesList.innerHTML = '';

        // Separate default profile from others
        let defaultProfile = null;
        profiles.forEach(profile => {
            if (profile.default) {
                // Add default profile row if it exists
                defaultProfile = profile;
                const tr = document.createElement('tr');
                tr.style = 'background-color: #ffffe0; /* Light Yellow */color: #000; /* Black text */';
                tr.innerHTML = `
                    <td contenteditable="true"  class="editCNT" oldValue='${profile.profile_name}' >${defaultProfile.profile_name}</td>
                    <td>
                        <button disabled>Set Default</button>
                        <button disabled>Delete</button>
                    </td>
                `;
                defaultProfileRow.appendChild(tr);
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td contenteditable="true" class="editCNT"  oldValue='${profile.profile_name}'>${profile.profile_name}</td>
                    <td>
                        <button class="setDefaultBTM">Set Default</button>
                        <button class="deleteBTM">Delete</button>
                    </td>
                `;
                profilesList.appendChild(tr);
            }
        });

        // Add Event listener for Set Default button
        const setDefaultButtons = document.querySelectorAll('.setDefaultBTM');
        setDefaultButtons.forEach(button => {
            button.addEventListener('click', function () {
                const profileName = this.parentNode.parentNode.querySelector('td').innerText;
                setDefaultProfile(profileName);
            });
        });

        // Add Event listener for Delete button
        const deleteButtons = document.querySelectorAll('.deleteBTM');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const profileName = this.parentNode.parentNode.querySelector('td').innerText;
                deleteProfile(profileName);
            });
        });
        // Add Event Listner for edit
        const editCNT = document.querySelectorAll('.editCNT');
        editCNT.forEach(cell => {
            cell.addEventListener('blur', function () {
                console.log(cell.oldValue);
                updateProfileName(cell.getAttribute('oldValue'), cell.textContent);
            });
        });
    });
}

function addNewProfile(profileData) {
    chrome.runtime.sendMessage({ action: 'addNewProfile', profileData: profileData }, () => {
        loadProfiles();
    });
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });
}

function updateProfileName(oldProfileName, newProfileName) {
    chrome.runtime.sendMessage({ action: 'updateProfileName', oldProfileName: oldProfileName, newProfileName: newProfileName }, () => {
        loadProfiles();
    });
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });

}

function setDefaultProfile(profileName) {
    chrome.runtime.sendMessage({ action: 'setDefaultProfile', profileName: profileName }, () => {
        loadProfiles();
    });
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });
}

function deleteProfile(profileName) {
    chrome.runtime.sendMessage({ action: 'deleteProfile', profileName: profileName }, () => {
        loadProfiles();
    });
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });
}

function showModal(title) {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'block';
    document.getElementById('modalTitle').innerText = title;
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });
}

function closeModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    document.getElementById('profileForm').reset();
    chrome.runtime.sendMessage({ action: 'loadSubMenuProfilesPoc'}, () => {
    });
}