(function () {
  const STORAGE_KEY = "little-ceo-money-data-v1";
  const VALID_SCREENS = ["child-picker", "child-home", "celebration"];

  const defaultData = {
    currentScreen: "child-picker",
    activeChildId: null,
    children: [
      { id: "ava", name: "Ava", avatar: "🦄" },
      { id: "leo", name: "Leo", avatar: "🦖" },
    ],
    goals: [
      { id: "goal-ava-bike", childId: "ava", name: "Bike", icon: "🚲", targetAmount: 50, currentAmount: 12 },
      { id: "goal-leo-robot", childId: "leo", name: "Robot", icon: "🤖", targetAmount: 40, currentAmount: 9 },
    ],
    transactions: [],
  };

  function isValidChild(child) {
    return child && typeof child === "object" && typeof child.id === "string" && child.id && typeof child.name === "string" && child.name;
  }

  function isValidGoal(goal) {
    return (
      goal &&
      typeof goal === "object" &&
      typeof goal.id === "string" &&
      goal.id &&
      typeof goal.childId === "string" &&
      goal.childId &&
      typeof goal.name === "string" &&
      goal.name &&
      Number.isFinite(goal.targetAmount) &&
      Number.isFinite(goal.currentAmount)
    );
  }

  function isValidTransaction(transaction) {
    return (
      transaction &&
      typeof transaction === "object" &&
      typeof transaction.id === "string" &&
      transaction.id &&
      typeof transaction.goalId === "string" &&
      transaction.goalId &&
      Number.isFinite(transaction.amount) &&
      typeof transaction.date === "string" &&
      transaction.date
    );
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.children) || !Array.isArray(parsed.goals) || !Array.isArray(parsed.transactions)) {
        return structuredClone(defaultData);
      }

      const children = parsed.children.filter(isValidChild);
      if (children.length === 0) return structuredClone(defaultData);

      const childIds = new Set(children.map((child) => child.id));
      const goals = parsed.goals.filter(isValidGoal).filter((goal) => childIds.has(goal.childId));
      const goalIds = new Set(goals.map((goal) => goal.id));
      const transactions = parsed.transactions.filter(isValidTransaction).filter((txn) => goalIds.has(txn.goalId));

      const activeChildId = children.some((child) => child.id === parsed.activeChildId) ? parsed.activeChildId : null;
      const requestedScreen = VALID_SCREENS.includes(parsed.currentScreen) ? parsed.currentScreen : "child-picker";

      return {
        currentScreen: activeChildId ? requestedScreen : "child-picker",
        activeChildId,
        children,
        goals,
        transactions,
      };
    } catch {
      return structuredClone(defaultData);
    }
  }

  const state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setCurrentScreen(screenName) {
    state.currentScreen = VALID_SCREENS.includes(screenName) ? screenName : "child-picker";
    saveState();
  }

  function setActiveChildId(childId) {
    state.activeChildId = state.children.some((child) => child.id === childId) ? childId : null;
    saveState();
  }

  function getActiveChild() {
    return state.children.find((child) => child.id === state.activeChildId) || null;
  }

  function getGoalsForChild(childId) {
    return state.goals.filter((goal) => goal.childId === childId);
  }

  function getPrimaryGoalForChild(childId) {
    return getGoalsForChild(childId)[0] || null;
  }

  function getTransactionsForChild(childId) {
    const goalIds = new Set(getGoalsForChild(childId).map((goal) => goal.id));
    return state.transactions
      .filter((transaction) => goalIds.has(transaction.goalId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function addMoneyToActiveGoal(amount) {
    const activeChild = getActiveChild();
    if (!activeChild) return { added: false, reason: "no-active-child", justCompleted: false };

    const goal = getPrimaryGoalForChild(activeChild.id);
    if (!goal) return { added: false, reason: "no-goal", justCompleted: false };

    const wasCompleted = goal.currentAmount >= goal.targetAmount;
    goal.currentAmount += amount;
    const isCompleted = goal.currentAmount >= goal.targetAmount;

    state.transactions.push({
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      goalId: goal.id,
      amount,
      date: new Date().toISOString(),
    });

    saveState();

    return {
      added: true,
      reason: null,
      justCompleted: !wasCompleted && isCompleted,
      childName: activeChild.name,
      goalName: goal.name,
    };
  }

  window.AppState = {
    state,
    setCurrentScreen,
    setActiveChildId,
    getActiveChild,
    getGoalsForChild,
    getPrimaryGoalForChild,
    getTransactionsForChild,
    addMoneyToActiveGoal,
  };
})();
