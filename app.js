const STORAGE_KEY = "little-ceo-money-data-v1";

const defaultData = {
  activeChildId: "ava",
  children: [
    { id: "ava", name: "Ava", avatar: "🦄" },
    { id: "leo", name: "Leo", avatar: "🦖" },
  ],
  goals: [
    {
      id: "goal-ava-bike",
      childId: "ava",
      name: "Bike",
      icon: "🚲",
      targetAmount: 50,
      currentAmount: 12,
    },
    {
      id: "goal-leo-robot",
      childId: "leo",
      name: "Robot",
      icon: "🤖",
      targetAmount: 40,
      currentAmount: 9,
    },
  ],
  transactions: [],
};

let state = loadState();

const screens = {
  goals: document.getElementById("goals-screen"),
  celebration: document.getElementById("celebration-screen"),
};

const childPicker = document.querySelector(".child-picker");
const goalName = document.getElementById("goal-name");
const goalIcon = document.getElementById("goal-icon");
const savedAmount = document.getElementById("saved-amount");
const targetAmount = document.getElementById("target-amount");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const celebrationMessage = document.getElementById("celebration-message");
const addModal = document.getElementById("add-modal");
const amountInput = document.getElementById("amount-input");

const openAddModalButton = document.getElementById("open-add-modal");
const closeAddModalButton = document.getElementById("close-add-modal");
const submitAmountButton = document.getElementById("submit-amount");
const celebrationDoneButton = document.getElementById("celebration-done");

openAddModalButton.addEventListener("click", openAddModal);
closeAddModalButton.addEventListener("click", closeAddModal);
submitAmountButton.addEventListener("click", handleAmountSubmit);
celebrationDoneButton.addEventListener("click", () => showScreen("goals"));

amountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleAmountSubmit();
  }
});

addModal.addEventListener("click", (event) => {
  if (event.target === addModal) {
    closeAddModal();
  }
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultData);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.children) || !Array.isArray(parsed.goals) || !Array.isArray(parsed.transactions)) {
      return structuredClone(defaultData);
    }

    return {
      activeChildId: parsed.activeChildId || defaultData.activeChildId,
      children: parsed.children,
      goals: parsed.goals,
      transactions: parsed.transactions,
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveChild() {
  return state.children.find((child) => child.id === state.activeChildId) || state.children[0];
}

function getGoalForChild(childId) {
  return state.goals.find((goal) => goal.childId === childId);
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, element]) => {
    element.classList.toggle("active", name === screenName);
  });
}

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

function handleAmountSubmit() {
  const amount = Number(amountInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    amountInput.focus();
    return;
  }

  addMoneyToActiveGoal(Math.floor(amount));
}

function renderChildPicker() {
  childPicker.innerHTML = "";

  state.children.forEach((child) => {
    const button = document.createElement("button");
    button.className = "profile-btn";
    button.textContent = `${child.avatar || "🙂"} ${child.name}`;

    if (child.id === state.activeChildId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.activeChildId = child.id;
      saveState();
      renderChildPicker();
      renderGoal();
      showScreen("goals");
    });

    childPicker.appendChild(button);
  });
}

function renderGoal() {
  const activeChild = getActiveChild();
  const goal = getGoalForChild(activeChild.id);

  if (!goal) {
    goalName.textContent = "No Goal";
    goalIcon.textContent = "🎯";
    savedAmount.textContent = "$0";
    targetAmount.textContent = "$0";
    progressFill.style.width = "0%";
    progressText.textContent = "0% done";
    return;
  }

  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  goalName.textContent = goal.name;
  goalIcon.textContent = goal.icon || "🎯";
  savedAmount.textContent = `$${goal.currentAmount}`;
  targetAmount.textContent = `$${goal.targetAmount}`;
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${Math.round(percent)}% done`;
}

function addMoneyToActiveGoal(amount) {
  const activeChild = getActiveChild();
  const goal = getGoalForChild(activeChild.id);
  if (!goal) {
    return;
  }

  goal.currentAmount += amount;

  state.transactions.push({
    id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    goalId: goal.id,
    amount,
    date: new Date().toISOString(),
  });

  saveState();
  renderGoal();
  closeAddModal();

  if (goal.currentAmount >= goal.targetAmount) {
    celebrationMessage.textContent = `Great job, ${activeChild.name}! You reached your ${goal.name} goal!`;
    showScreen("celebration");
    return;
  }

  showScreen("goals");
}

renderChildPicker();
renderGoal();
showScreen("goals");
