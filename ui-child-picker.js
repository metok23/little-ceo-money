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

    if (!window.AppState || !window.AppState.state || !Array.isArray(window.AppState.state.childProfiles)) {
      return;
    }

    window.AppState.state.childProfiles.forEach((child) => {
      childProfilePicker.appendChild(createChildSelectButton(child, onProfileSelected));
    });
  }

  window.ChildPickerUI = { renderChildPicker };
})();
