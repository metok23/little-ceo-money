(function () {
  const screens = {
    "child-picker": document.getElementById("child-picker-screen"),
    "child-home": document.getElementById("child-home-screen"),
    celebration: document.getElementById("celebration-screen"),
  };

  const celebrationMessage = document.getElementById("celebration-message");
  const celebrationDoneButton = document.getElementById("celebration-done");

  function showScreen(screenName) {
    Object.entries(screens).forEach(([name, element]) => {
      element.classList.toggle("active", name === screenName);
    });
  }

  function enforceSafeScreen() {
    if (!window.AppState.getActiveChild() && window.AppState.state.currentScreen !== "child-picker") {
      window.AppState.setCurrentScreen("child-picker");
    }
  }

  function renderApp() {
    enforceSafeScreen();

    window.ChildPickerUI.renderChildPicker(renderApp);

    if (window.AppState.state.currentScreen === "child-home") {
      window.ChildHomeUI.renderChildHome();
    }

    showScreen(window.AppState.state.currentScreen);
  }

  function handleCelebrate(childName, goalName) {
    celebrationMessage.textContent = `Great job, ${childName}! You reached your ${goalName} goal!`;
    window.AppState.setCurrentScreen("celebration");
    renderApp();
  }

  function initApp() {
    try {
      window.ChildHomeUI.initChildHome({
        onStateChange: renderApp,
        onCelebrate: handleCelebrate,
      });
    } catch (error) {
      const debugBox = document.createElement("div");
      debugBox.style.background = "#fff4f4";
      debugBox.style.color = "#7a1122";
      debugBox.style.border = "2px solid #ffb3bf";
      debugBox.style.borderRadius = "12px";
      debugBox.style.padding = "12px";
      debugBox.style.margin = "12px 0";
      debugBox.style.fontWeight = "700";
      debugBox.style.whiteSpace = "pre-line";
      debugBox.textContent = `initChildHome failed\n${error instanceof Error ? error.message : String(error)}`;
      document.body.prepend(debugBox);
      return;
    }

    celebrationDoneButton.addEventListener("click", () => {
      window.AppState.setCurrentScreen("child-home");
      renderApp();
    });

    renderApp();
  }

  initApp();
})();
