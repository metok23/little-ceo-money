(function () {
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    "child-picker": document.getElementById("child-picker-screen"),
    "child-home": document.getElementById("child-home-screen"),
    celebration: document.getElementById("celebration-screen"),
  };

  const celebrationMessage = document.getElementById("celebration-message");
  const celebrationDoneButton = document.getElementById("celebration-done");
  const startBtn = document.getElementById("start-adventure-button");

  function showScreen(screenName) {
    Object.entries(screens).forEach(([name, element]) => {
      if (!element) return;
      element.classList.toggle("active", name === screenName);
    });
  }

  function enforceSafeScreen() {
    if (
      !window.AppState.getActiveChild() &&
      window.AppState.state.currentScreen !== "child-picker" &&
      window.AppState.state.currentScreen !== "welcome"
    ) {
      window.AppState.setCurrentScreen("child-picker");
    }
  }

  function renderApp() {
    enforceSafeScreen();

    if (window.AppState.state.currentScreen === "child-picker") {
      window.ChildPickerUI.renderChildPicker(renderApp);
    }

    if (window.AppState.state.currentScreen === "child-home") {
      window.ChildHomeUI.renderChildHome();
    }

    showScreen(window.AppState.state.currentScreen);
  }

  function handleCelebrate(childName, goalName) {
    if (celebrationMessage) {
      celebrationMessage.textContent = `Great job, ${childName}! You reached your ${goalName} goal!`;
    }
    window.AppState.setCurrentScreen("celebration");
    renderApp();
  }

  function initApp() {
    window.ChildHomeUI.initChildHome({
      onStateChange: renderApp,
      onCelebrate: handleCelebrate,
    });

    if (celebrationDoneButton) {
      celebrationDoneButton.addEventListener("click", () => {
        window.AppState.setCurrentScreen("child-home");
        renderApp();
      });
    }

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        window.AppState.setCurrentScreen("child-picker");
        renderApp();
      });
    }

    renderApp();
  }

  initApp();
})();
