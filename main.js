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
    window.ChildHomeUI.renderChildHome();
    showScreen(window.AppState.state.currentScreen);
  }

  function handleCelebrate(childName, goalName) {
    celebrationMessage.textContent = `Great job, ${childName}! You reached your ${goalName} goal!`;
    window.AppState.setCurrentScreen("celebration");
    renderApp();
  }

  function initApp() {
    window.ChildHomeUI.initChildHome({
      onStateChange: renderApp,
      onCelebrate: handleCelebrate,
    });

    celebrationDoneButton.addEventListener("click", () => {
      window.AppState.setCurrentScreen("child-home");
      renderApp();
    });

    renderApp();
  }

  initApp();
})();
