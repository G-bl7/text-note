document.addEventListener("DOMContentLoaded", () => {
  loadStatistics();
});

async function loadStatistics() {
  const statisticsResponse = await chrome.runtime.sendMessage({
    action: "GetStatistics",
  });
  const statisticsData = statisticsResponse.data;

  const totalUsers = Object.keys(statisticsData).length;
  const sumStatistics = Object.values(statisticsData).reduce(
    (sum, stat) => sum + stat.count,
    0
  );

  document.getElementById("totalUsers").innerText = totalUsers;
  document.getElementById("sumStatistics").innerText = sumStatistics;

  for (const [key, stat] of Object.entries(statisticsData)) {
    const profileResponse = await chrome.runtime.sendMessage({
      action: "getProfileById",
      id: Number(key),
    });
    const profile = profileResponse.data || { profile_name: "Deleted-Profile" };
    addTableRow(
      profile,
      stat.count,
      profile.default ? "defaultProfileRow" : "profilesList",
      !profileResponse.data && "deletedProfilesList"
    );
  }
}

function addTableRow(profile, count, targetId, deletedTargetId) {
  const target = deletedTargetId
    ? document.getElementById(deletedTargetId)
    : document.getElementById(targetId);
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  const nameLink = document.createElement("a");
  nameLink.href = chrome.runtime.getURL(
    `/text-note/dashboard/text-not-manager.html?id=${profile.id}&&name=${profile.profile_name}`
  );
  nameLink.textContent = profile.profile_name;
  nameCell.appendChild(nameLink);

  const countCell = document.createElement("td");
  countCell.textContent = count;

  row.appendChild(nameCell);
  row.appendChild(countCell);
  target.appendChild(row);
}
