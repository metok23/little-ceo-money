(function () {
  const childHomeTitle = document.getElementById("child-home-title");
  const goalName = document.getElementById("goal-name");
  const goalIcon = document.getElementById("goal-icon");
  const savedAmount = document.getElementById("saved-amount");
  const targetAmount = document.getElementById("target-amount");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const transactionsList = document.getElementById("transactions-list");

  const addModal = document.getElementById("add-modal");
  const amountInput = document.getElementById("amount-input");
  const openAddModalButton = document.getElementById("open-add-modal");
  const closeAddModalButton = document.getElementById("close-add-modal");
  const submitAmountButton = document.getElementById("submit-amount");
  const switchProfileButton = document.getElementById("switch-profile");

  function openAddModal() {
    amountInput.value = "";
    addModal.classList.remove("hidden");
    addModal.setAttribute("aria-hidden", "false");
    amountInput.focus();
  }

  function closeAddModal() {
    addModal.classList.add("hidden");
    addModal.setAttribute("aria-hidden", "true");
  }

  function renderGoalForActiveChild() {
    const activeChild = window.AppState.getActiveChild();

    if (!activeChild) {
      childHomeTitle.textContent = "Choose a profile";
      goalName.textContent = "No Child";
      goalIcon.textContent = "🙂";
      savedAmount.textContent = "$0";
      targetAmount.textContent = "$0";
      progressFill.style.width = "0%";
      progressText.textContent = "No profile selected";
      return;
    }

    childHomeTitle.textContent = `${activeChild.avatar || "🙂"} ${activeChild.name}`;

    const goal = window.AppState.getPrimaryGoalForChild(activeChild.id);
    if (!goal) {
      goalName.textContent = "No Goal";
      goalIcon.textContent = "🎯";
      savedAmount.textContent = "$0";
      targetAmount.textContent = "$0";
      progressFill.style.width = "0%";
      progressText.textContent = "0% done";
      return;
    }

    const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

    goalName.textContent = goal.name;
    goalIcon.textContent = goal.icon || "🎯";
    savedAmount.textContent = `$${goal.currentAmount}`;
    targetAmount.textContent = `$${goal.targetAmount}`;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}% done`;
  }

  function renderTransactionsForActiveChild() {
    const activeChild = window.AppState.getActiveChild();
    transactionsList.innerHTML = "";

    if (!activeChild) {
      const item = document.createElement("li");
      item.className = "transaction-empty";
      item.textContent = "No profile selected";
      transactionsList.appendChild(item);
      return;
    }

    const childTransactions = window.AppState.getTransactionsForChild(activeChild.id).slice(0, 5);

    if (childTransactions.length === 0) {
      const item = document.createElement("li");
      item.className = "transaction-empty";
      item.textContent = "No money added yet";
      transactionsList.appendChild(item);
      return;
    }

    childTransactions.forEach((transaction) => {
      const item = document.createElement("li");
      item.className = "transaction-item";
      item.textContent = `+ $${transaction.amount}`;
      transactionsList.appendChild(item);
    });
  }

  function renderChildHome() {
    renderGoalForActiveChild();
    renderTransactionsForActiveChild();
  }

  function initChildHome({ onStateChange, onCelebrate }) {
    openAddModalButton.addEventListener("click", openAddModal);
    closeAddModalButton.addEventListener("click", closeAddModal);
    switchProfileButton.addEventListener("click", () => {
      window.AppState.setActiveChildId(null);
      window.AppState.setCurrentScreen("child-picker");
      onStateChange();
    });

    amountInput.addEventListener("input", () => {
      amountInput.value = amountInput.value.replace(/\D/g, "");
    });

    amountInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitAmountButton.click();
      }
    });

    addModal.addEventListener("click", (event) => {
      if (event.target === addModal) closeAddModal();
    });

    submitAmountButton.addEventListener("click", () => {
      const rawValue = amountInput.value.trim();
      if (!/^\d+$/.test(rawValue)) {
        amountInput.focus();
        return;
      }

      const amount = Number(rawValue);
      if (!Number.isInteger(amount) || amount <= 0) {
        amountInput.focus();
        return;
      }

      const result = window.AppState.addMoneyToActiveGoal(amount);
      closeAddModal();

      if (result.justCompleted) {
        onCelebrate(result.childName, result.goalName);
        return;
      }

      if (result.reason === "no-active-child") {
        window.AppState.setCurrentScreen("child-picker");
      } else {
        window.AppState.setCurrentScreen("child-home");
      }

      onStateChange();
    });
  }

  window.ChildHomeUI = {
    initChildHome,
    renderChildHome,
  };
})();
