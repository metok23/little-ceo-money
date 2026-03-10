(function () {
  const childHomeTitle = document.getElementById("child-home-title");
  const goalsList = document.getElementById("goals-list");
  const moneyInList = document.getElementById("money-in-list");
  const moneyOutList = document.getElementById("money-out-list");
  const coinsTotal = document.getElementById("coins-total");
  const parentNet = document.getElementById("parent-net");
  const parentIn = document.getElementById("parent-in");
  const parentOut = document.getElementById("parent-out");

  const switchProfileButton = document.getElementById("switch-profile");
  const openAddGoalModalButton = document.getElementById("open-add-goal-modal");
  const openMoneyInModalButton = document.getElementById("open-money-in-modal");
  const openMoneyOutModalButton = document.getElementById("open-money-out-modal");

  const transactionModal = document.getElementById("transaction-modal");
  const transactionModalTitle = document.getElementById("transaction-modal-title");
  const transactionAmountInput = document.getElementById("transaction-amount-input");
  const submitTransactionButton = document.getElementById("submit-transaction");
  const closeTransactionModalButton = document.getElementById("close-transaction-modal");
  const crossGoalConfirmModal = document.getElementById("cross-goal-confirm-modal");
  const confirmCrossGoalYesButton = document.getElementById("confirm-cross-goal-yes");
  const confirmCrossGoalNoButton = document.getElementById("confirm-cross-goal-no");
  const insufficientFundsModal = document.getElementById("insufficient-funds-modal");
  const closeInsufficientFundsModalButton = document.getElementById("close-insufficient-funds-modal");
  const insufficientFundsModalTitle = insufficientFundsModal.querySelector("h2");
  const insufficientFundsModalMessage = insufficientFundsModal.querySelector(".helper");

  const goalModal = document.getElementById("goal-modal");
  const goalModalTitle = document.getElementById("goal-modal-title");
  const goalNameInput = document.getElementById("goal-name-input");
  const goalTargetInput = document.getElementById("goal-target-input");
  const goalIconInput = document.getElementById("goal-icon-input");
  const submitGoalButton = document.getElementById("submit-goal");
  const closeGoalModalButton = document.getElementById("close-goal-modal");

  let selectedGoalId = null;
  let transactionMode = "in";
  let goalModalMode = "add";
  let editingGoalId = null;
  let pendingCrossGoalWithdrawal = null;

  function sanitizeIntegerInput(input) {
    input.value = input.value.replace(/\D/g, "");
  }

  function openTransactionModal(type) {
    const activeChild = window.AppState.getActiveChild();
    if (!activeChild) return;

    const goals = window.AppState.getGoalsForChild(activeChild.id);
    if (goals.length === 0) return;

    transactionMode = type;
    selectedGoalId = selectedGoalId && goals.some((goal) => goal.id === selectedGoalId) ? selectedGoalId : goals[0].id;
    transactionModalTitle.textContent = type === "in" ? "Add Money In" : "Add Money Out";
    transactionAmountInput.value = "";
    transactionModal.classList.remove("hidden");
    transactionModal.setAttribute("aria-hidden", "false");
    transactionAmountInput.focus();
  }

  function closeTransactionModal() {
    transactionModal.classList.add("hidden");
    transactionModal.setAttribute("aria-hidden", "true");
    pendingCrossGoalWithdrawal = null;
    closeCrossGoalConfirmModal();
  }

  function openCrossGoalConfirmModal(goalId, amount) {
    pendingCrossGoalWithdrawal = { goalId, amount };
    crossGoalConfirmModal.classList.remove("hidden");
    crossGoalConfirmModal.setAttribute("aria-hidden", "false");
    confirmCrossGoalYesButton.focus();
  }

  function closeCrossGoalConfirmModal() {
    crossGoalConfirmModal.classList.add("hidden");
    crossGoalConfirmModal.setAttribute("aria-hidden", "true");
  }

  function openInfoModal(title, message) {
    insufficientFundsModalTitle.textContent = title;
    insufficientFundsModalMessage.textContent = message;
    insufficientFundsModal.classList.remove("hidden");
    insufficientFundsModal.setAttribute("aria-hidden", "false");
    closeInsufficientFundsModalButton.focus();
  }

  function closeInsufficientFundsModal() {
    insufficientFundsModal.classList.add("hidden");
    insufficientFundsModal.setAttribute("aria-hidden", "true");
  }

  function openGoalModalForAdd() {
    goalModalMode = "add";
    editingGoalId = null;
    goalModalTitle.textContent = "Add Goal";
    goalNameInput.value = "";
    goalTargetInput.value = "";
    goalIconInput.value = "🎯";
    goalModal.classList.remove("hidden");
    goalModal.setAttribute("aria-hidden", "false");
    goalNameInput.focus();
  }

  function openGoalModalForEdit(goalId) {
    const goal = window.AppState.getGoalById(goalId);
    if (!goal) return;

    goalModalMode = "edit";
    editingGoalId = goalId;
    goalModalTitle.textContent = "Edit Goal";
    goalNameInput.value = goal.name;
    goalTargetInput.value = String(goal.targetAmount);
    goalIconInput.value = goal.icon || "🎯";
    goalModal.classList.remove("hidden");
    goalModal.setAttribute("aria-hidden", "false");
    goalNameInput.focus();
  }

  function closeGoalModal() {
    goalModal.classList.add("hidden");
    goalModal.setAttribute("aria-hidden", "true");
  }


  function renderBalancesForActiveChild() {
    const activeChild = window.AppState.getActiveChild();
    if (!activeChild) {
      coinsTotal.textContent = "$0";
      parentNet.textContent = "$0";
      parentIn.textContent = "$0";
      parentOut.textContent = "$0";
      return;
    }

    const summary = window.AppState.getChildSummary(activeChild.id);
    coinsTotal.textContent = `$${summary.totalBalance}`;
    parentNet.textContent = `$${summary.totalNetBalance}`;
    parentIn.textContent = `$${summary.totalMoneyIn}`;
    parentOut.textContent = `$${summary.totalMoneyOut}`;
  }

  function renderGoalsForActiveChild() {
    const activeChild = window.AppState.getActiveChild();
    goalsList.innerHTML = "";

    if (!activeChild) {
      childHomeTitle.textContent = "Choose a profile";
      goalsList.innerHTML = '<p class="empty-hint">No profile selected</p>';
      return;
    }

    childHomeTitle.textContent = `${activeChild.avatar || "🙂"} ${activeChild.name}`;
    const goals = window.AppState.getGoalsForChild(activeChild.id);

    if (goals.length === 0) {
      goalsList.innerHTML = '<p class="empty-hint">No goals yet. Tap Add Goal.</p>';
      selectedGoalId = null;
      return;
    }

    if (!selectedGoalId || !goals.some((goal) => goal.id === selectedGoalId)) {
      selectedGoalId = goals[0].id;
    }

    goals.forEach((goal) => {
      const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
      const card = document.createElement("article");
      card.className = `goal-card ${goal.id === selectedGoalId ? "selected" : ""}`;

      card.innerHTML = `
        <div class="goal-title-row">
          <button class="goal-select" data-goal-id="${goal.id}">
            <span>${goal.icon || "🎯"}</span>
            <strong>${goal.name}</strong>
          </button>
          <details class="goal-menu">
            <summary>⋯</summary>
            <button type="button" class="goal-edit-btn" data-goal-id="${goal.id}">Edit goal</button>
          </details>
        </div>
        <p class="money-line">$${goal.currentAmount} / $${goal.targetAmount}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        <p class="progress-text">${Math.round(percent)}% done</p>
      `;

      goalsList.appendChild(card);
    });

    goalsList.querySelectorAll(".goal-select").forEach((button) => {
      button.addEventListener("click", () => {
        selectedGoalId = button.dataset.goalId;
        renderChildHome();
      });
    });

    goalsList.querySelectorAll(".goal-edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        openGoalModalForEdit(button.dataset.goalId);
      });
    });
  }

  function renderTransactionsForSelectedGoal() {
    moneyInList.innerHTML = "";
    moneyOutList.innerHTML = "";

    if (!selectedGoalId) {
      moneyInList.innerHTML = '<li class="transaction-empty">Pick a goal</li>';
      moneyOutList.innerHTML = '<li class="transaction-empty">Pick a goal</li>';
      return;
    }

    const moneyIn = window.AppState.getTransactionsForGoal(selectedGoalId, "in").slice(0, 5);
    const moneyOut = window.AppState.getTransactionsForGoal(selectedGoalId, "out").slice(0, 5);

    if (moneyIn.length === 0) {
      moneyInList.innerHTML = '<li class="transaction-empty">No money in yet</li>';
    } else {
      moneyIn.forEach((transaction) => {
        const item = document.createElement("li");
        item.className = "transaction-item transaction-in";
        item.textContent = `+ $${transaction.amount}`;
        moneyInList.appendChild(item);
      });
    }

    if (moneyOut.length === 0) {
      moneyOutList.innerHTML = '<li class="transaction-empty">No money out yet</li>';
    } else {
      moneyOut.forEach((transaction) => {
        const item = document.createElement("li");
        item.className = "transaction-item transaction-out";
        item.textContent = `- $${transaction.amount}`;
        moneyOutList.appendChild(item);
      });
    }
  }

  function renderChildHome() {
    renderBalancesForActiveChild();
    renderGoalsForActiveChild();
    renderTransactionsForSelectedGoal();
  }

  function initChildHome({ onStateChange, onCelebrate }) {
    switchProfileButton.addEventListener("click", () => {
      window.AppState.setActiveChildId(null);
      window.AppState.setCurrentScreen("child-picker");
      onStateChange();
    });

    openAddGoalModalButton.addEventListener("click", openGoalModalForAdd);
    openMoneyInModalButton.addEventListener("click", () => openTransactionModal("in"));
    openMoneyOutModalButton.addEventListener("click", () => openTransactionModal("out"));

    transactionAmountInput.addEventListener("input", () => sanitizeIntegerInput(transactionAmountInput));
    goalTargetInput.addEventListener("input", () => sanitizeIntegerInput(goalTargetInput));

    closeTransactionModalButton.addEventListener("click", closeTransactionModal);
    closeGoalModalButton.addEventListener("click", closeGoalModal);

    transactionModal.addEventListener("click", (event) => {
      if (event.target === transactionModal) closeTransactionModal();
    });

    goalModal.addEventListener("click", (event) => {
      if (event.target === goalModal) closeGoalModal();
    });

    crossGoalConfirmModal.addEventListener("click", (event) => {
      if (event.target === crossGoalConfirmModal) {
        closeCrossGoalConfirmModal();
        transactionAmountInput.focus();
      }
    });

    confirmCrossGoalNoButton.addEventListener("click", () => {
      closeCrossGoalConfirmModal();
      transactionAmountInput.focus();
    });

    insufficientFundsModal.addEventListener("click", (event) => {
      if (event.target === insufficientFundsModal) {
        closeInsufficientFundsModal();
        transactionAmountInput.focus();
      }
    });

    closeInsufficientFundsModalButton.addEventListener("click", () => {
      closeInsufficientFundsModal();
      transactionAmountInput.focus();
    });

    confirmCrossGoalYesButton.addEventListener("click", () => {
      if (!pendingCrossGoalWithdrawal) {
        closeCrossGoalConfirmModal();
        alert("Something went wrong.");
        return;
      }

      const crossGoalResult = window.AppState.withdrawMoneyFromGoals({
        goalId: pendingCrossGoalWithdrawal.goalId,
        amount: pendingCrossGoalWithdrawal.amount,
        allowCrossGoal: true,
      });

      if (!crossGoalResult.ok) {
        alert("Something went wrong.");
        closeCrossGoalConfirmModal();
        transactionAmountInput.focus();
        return;
      }

      pendingCrossGoalWithdrawal = null;
      closeCrossGoalConfirmModal();
      closeTransactionModal();
      onStateChange();
    });

    submitTransactionButton.addEventListener("click", () => {
      const raw = transactionAmountInput.value.trim();
      if (!/^\d+$/.test(raw)) return;

      const amount = Number(raw);
      if (!Number.isInteger(amount) || amount <= 0 || !selectedGoalId) return;

      const result = window.AppState.addTransaction({ goalId: selectedGoalId, type: transactionMode, amount });

      if (!result.ok) {
        if (result.error === "INSUFFICIENT_FUNDS") {
          openInfoModal("Not enough money", "You don’t have enough money in your goals.");
          return;
        }

        if (result.error === "CROSS_GOAL_REQUIRED") {
          openCrossGoalConfirmModal(selectedGoalId, amount);
          return;
        }

        if (result.error === "GOAL_COMPLETED") {
          openInfoModal("Goal already completed", "This goal is already completed. You can't take money from it.");
          return;
        }

        alert("Something went wrong.");
        return;
      }

      closeTransactionModal();

      if (result.justCompleted) {
        onCelebrate(result.childName, result.goalName);
        return;
      }

      onStateChange();
    });

    submitGoalButton.addEventListener("click", () => {
      const name = goalNameInput.value.trim();
      const targetRaw = goalTargetInput.value.trim();
      const icon = goalIconInput.value.trim() || "🎯";

      if (!name || !/^\d+$/.test(targetRaw)) return;
      const targetAmount = Number(targetRaw);
      if (!Number.isInteger(targetAmount) || targetAmount <= 0) return;

      if (goalModalMode === "add") {
        const goal = window.AppState.addGoalForActiveChild({ name, targetAmount, icon });
        if (goal) selectedGoalId = goal.id;
      } else if (editingGoalId) {
        window.AppState.updateGoal(editingGoalId, { name, targetAmount, icon });
      }

      closeGoalModal();
      onStateChange();
    });
  }

  window.ChildHomeUI = {
    initChildHome,
    renderChildHome,
  };
})();
