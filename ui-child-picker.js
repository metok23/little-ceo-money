(function () {
  const childProfilePicker = document.getElementById("child-profile-picker");

  function createChildSelectButton(child, onProfileSelected) {
    const button = document.createElement("button");
    button.className = "profile-btn";
    button.textContent = `${child.avatar || "🙂"} ${child.childName}`;

    button.addEventListener("click", () => {
      window.AppState.setActiveChildId(child.id);
      window.AppState.setCurrentScreen("child-home");
      onProfileSelected();
    });

    return button;
  }

  function renderChildPicker(onProfileSelected) {
    childProfilePicker.innerHTML = "";

    const hasAppState = typeof window.AppState === "object" && window.AppState !== null;
    const hasState = hasAppState && typeof window.AppState.state === "object" && window.AppState.state !== null;
    const childProfiles = hasState ? window.AppState.state.childProfiles : undefined;
    const isChildProfilesArray = Array.isArray(childProfiles);
    const childProfilesCount = isChildProfilesArray ? childProfiles.length : 0;

    const debugInfo = document.createElement("pre");
    debugInfo.className = "debug-info";
    debugInfo.textContent = [
      `AppState: ${hasAppState ? "yes" : "no"}`,
      `state: ${hasState ? "yes" : "no"}`,
      `childProfiles array: ${isChildProfilesArray ? "yes" : "no"}`,
      `childProfiles count: ${childProfilesCount}`,
    ].join("\n");
    childProfilePicker.appendChild(debugInfo);

    if (!isChildProfilesArray) {
      return;
    }

    childProfiles.forEach((child) => {
      childProfilePicker.appendChild(createChildSelectButton(child, onProfileSelected));
    });
  }

  window.ChildPickerUI = { renderChildPicker };
})();
