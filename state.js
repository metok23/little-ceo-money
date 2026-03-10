(function () {
  const STORAGE_KEY = "little-ceo-money-data-v2";
  const VALID_SCREENS = ["child-picker", "child-home", "celebration"];

  const defaultData = {
    currentScreen: "child-picker",
    activeChildId: null,
    children: [
      { id: "ava", name: "Ava", avatar: "🦄" },
      { id: "leo", name: "Leo", avatar: "🦖" },
    ],
    goals: [
      { id: "goal-ava-bike", childId: "ava", name: "Bike", icon: "🚲", targetAmount: 50, currentAmount: 0, status: "active" },
      { id: "goal-leo-robot", childId: "leo", name: "Robot", icon: "🤖", targetAmount: 40, currentAmount: 0, status: "active" },
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
      Number.isFinite(goal.currentAmount) &&
      (goal.status === "active" || goal.status === "completed")
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
      (transaction.type === "in" || transaction.type === "out") &&
      Number.isFinite(transaction.amount) &&
      transaction.amount > 0 &&
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
      const goals = parsed.goals
        .filter(isValidGoal)
        .filter((goal) => childIds.has(goal.childId))
        .map((goal) => ({
          ...goal,
          currentAmount: Math.max(0, Math.min(goal.currentAmount, goal.targetAmount)),
        }));

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

  function getGoalById(goalId) {
    return state.goals.find((goal) => goal.id === goalId) || null;
  }

  function isGoalActive(goal) {
    return goal && goal.status === "active";
  }

  function getActiveGoalsFromSelected(goalId) {
    const selectedGoal = getGoalById(goalId);
    if (!selectedGoal) return [];

    const childGoals = state.goals.filter((goal) => goal.childId === selectedGoal.childId && isGoalActive(goal));
    const selectedIndex = childGoals.findIndex((goal) => goal.id === goalId);
    if (selectedIndex < 0) return [];

    return childGoals.slice(selectedIndex);
  }

  function pushTransaction(goalId, type, amount) {
    state.transactions.push({
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      goalId,
      type,
      amount,
      date: new Date().toISOString(),
    });
  }

  function getTransactionsForGoal(goalId, type) {
    return state.transactions
      .filter((transaction) => transaction.goalId === goalId && (!type || transaction.type === type))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function getChildSummary(childId) {
    const goals = getGoalsForChild(childId);
    const goalIds = new Set(goals.map((goal) => goal.id));
    const childTransactions = state.transactions.filter((transaction) => goalIds.has(transaction.goalId));

    const totalBalance = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalMoneyIn = childTransactions
      .filter((transaction) => transaction.type === "in")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalMoneyOut = childTransactions
      .filter((transaction) => transaction.type === "out")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      totalBalance,
      totalMoneyIn,
      totalMoneyOut,
      totalNetBalance: totalMoneyIn - totalMoneyOut,
    };
  }

  function addGoalForActiveChild({ name, targetAmount, icon }) {
    const activeChild = getActiveChild();
    if (!activeChild) return null;

    const goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: activeChild.id,
      name,
      targetAmount,
      currentAmount: 0,
      icon: icon || "🎯",
      status: "active",
    };

    state.goals.push(goal);
    saveState();
    return goal;
  }

  function updateGoal(goalId, updates) {
    const goal = getGoalById(goalId);
    if (!goal) return null;

    if (typeof updates.name === "string" && updates.name.trim()) goal.name = updates.name.trim();
    if (Number.isInteger(updates.targetAmount) && updates.targetAmount > 0) {
      goal.targetAmount = updates.targetAmount;
      goal.currentAmount = Math.min(goal.currentAmount, goal.targetAmount);
    }
    if (typeof updates.icon === "string" && updates.icon.trim()) goal.icon = updates.icon.trim();

    if (goal.status === "active" && goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.status = "completed";
    }

    saveState();
    return goal;
  }

  function addMoneyToGoals({ goalId, amount }) {
    const selectedGoal = getGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
    }

    if (!isGoalActive(selectedGoal)) {
      return { ok: false, error: "GOAL_COMPLETED", appliedTransactions: [], overflow: amount, completedGoals: [] };
    }

    let remaining = amount;
    const goalSequence = getActiveGoalsFromSelected(goalId);
    const appliedTransactions = [];
    const completedGoals = [];

    goalSequence.forEach((goal) => {
      if (remaining <= 0) return;

      const space = Math.max(0, goal.targetAmount - goal.currentAmount);
      if (space <= 0) return;

      const applied = Math.min(remaining, space);
      goal.currentAmount += applied;
      remaining -= applied;

      if (applied > 0) {
        pushTransaction(goal.id, "in", applied);
        appliedTransactions.push({ goalId: goal.id, amount: applied });
      }

      if (goal.currentAmount >= goal.targetAmount) {
        goal.currentAmount = goal.targetAmount;
        goal.status = "completed";
        completedGoals.push(goal.id);
      }
    });

    saveState();

    return {
      ok: true,
      appliedTransactions,
      overflow: remaining,
      completedGoals,
    };
  }

  function withdrawMoneyFromGoals({ goalId, amount, allowCrossGoal }) {
    const selectedGoal = getGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT", deductions: [], usedMultipleGoals: false };
    }

    if (!isGoalActive(selectedGoal)) {
      return { ok: false, error: "GOAL_COMPLETED", deductions: [], usedMultipleGoals: false };
    }

    const goalSequence = getActiveGoalsFromSelected(goalId);
    const selectedGoalBalance = selectedGoal.currentAmount;
    const availableTotal = goalSequence.reduce((sum, goal) => sum + goal.currentAmount, 0);

    if (amount > availableTotal) {
      return { ok: false, error: "INSUFFICIENT_FUNDS", availableTotal };
    }

    if (amount > selectedGoalBalance && !allowCrossGoal) {
      return { ok: false, error: "CROSS_GOAL_REQUIRED", selectedGoalBalance, availableTotal };
    }

    let remaining = amount;
    const deductions = [];

    goalSequence.forEach((goal) => {
      if (remaining <= 0) return;

      const deducted = Math.min(goal.currentAmount, remaining);
      if (deducted <= 0) return;

      goal.currentAmount -= deducted;
      remaining -= deducted;

      pushTransaction(goal.id, "out", deducted);
      deductions.push({ goalId: goal.id, amount: deducted });
    });

    saveState();

    return {
      ok: true,
      deductions,
      usedMultipleGoals: deductions.length > 1,
    };
  }

  function addTransaction({ goalId, type, amount }) {
    const selectedGoal = getGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0 || (type !== "in" && type !== "out")) {
      return { ok: false, justCompleted: false };
    }

    const selectedGoalWasCompleted = selectedGoal.currentAmount >= selectedGoal.targetAmount;
    let result;

    if (type === "in") {
      result = addMoneyToGoals({ goalId, amount });
    } else {
      result = withdrawMoneyFromGoals({ goalId, amount, allowCrossGoal: false });
    }

    if (!result.ok) {
      return { ok: false, justCompleted: false, error: result.error };
    }

    const selectedGoalAfter = getGoalById(goalId);
    const child = state.children.find((item) => item.id === selectedGoal.childId);

    return {
      ok: true,
      justCompleted:
        type === "in" &&
        !selectedGoalWasCompleted &&
        selectedGoalAfter &&
        selectedGoalAfter.currentAmount >= selectedGoalAfter.targetAmount,
      childName: child ? child.name : "",
      goalName: selectedGoal.name,
    };
  }

  window.AppState = {
    state,
    setCurrentScreen,
    setActiveChildId,
    getActiveChild,
    getGoalsForChild,
    getGoalById,
    getTransactionsForGoal,
    getChildSummary,
    addGoalForActiveChild,
    updateGoal,
    addMoneyToGoals,
    withdrawMoneyFromGoals,
    addTransaction,
  };
})();
