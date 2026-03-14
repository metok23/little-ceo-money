(function () {
  const STORAGE_KEY = "little-ceo-money-data-v2";
  const VALID_SCREENS = ["welcome", "child-picker", "child-home", "celebration"];
  const VALID_BUCKET_TYPES = ["pool", "spend", "save", "invest", "donate"];
  const WALLET_BUCKET_TYPES = ["spend", "save", "invest", "donate"];

  function createDefaultWalletBuckets(childProfiles) {
    return childProfiles.flatMap((childProfile) =>
      WALLET_BUCKET_TYPES.map((bucketType) => ({
        id: `bucket-${childProfile.id}-${bucketType}`,
        childProfileId: childProfile.id,
        bucketType,
        balance: 0,
      }))
    );
  }

  function ensureWalletBuckets(childProfiles, walletBuckets) {
    const childProfileIds = new Set(childProfiles.map((childProfile) => childProfile.id));
    const normalizedBuckets = Array.isArray(walletBuckets) ? walletBuckets.filter((bucket) => isValidWalletBucket(bucket)) : [];
    const byKey = new Map();

    normalizedBuckets.forEach((bucket) => {
      if (!childProfileIds.has(bucket.childProfileId)) return;
      const key = `${bucket.childProfileId}::${bucket.bucketType}`;
      if (byKey.has(key)) return;
      byKey.set(key, {
        id: bucket.id,
        childProfileId: bucket.childProfileId,
        bucketType: bucket.bucketType,
        balance: bucket.balance,
      });
    });

    childProfiles.forEach((childProfile) => {
      WALLET_BUCKET_TYPES.forEach((bucketType) => {
        const key = `${childProfile.id}::${bucketType}`;
        if (!byKey.has(key)) {
          byKey.set(key, {
            id: `bucket-${childProfile.id}-${bucketType}`,
            childProfileId: childProfile.id,
            bucketType,
            balance: 0,
          });
        }
      });
    });

    return childProfiles.flatMap((childProfile) =>
      WALLET_BUCKET_TYPES.map((bucketType) => byKey.get(`${childProfile.id}::${bucketType}`))
    );
  }

  const defaultData = {
    users: [
      {
        id: "user-parent-1",
        name: "Parent",
        email: "parent@example.com",
        role: "parent",
      },
    ],
    childProfiles: [
      {
        id: "ava",
        userId: "user-parent-1",
        childName: "Ava",
        avatar: "🦄",
        birthDate: "2018-01-01",
        createdAt: "2024-01-01T00:00:00.000Z",
        unassignedMoney: 0,
      },
      {
        id: "leo",
        userId: "user-parent-1",
        childName: "Leo",
        avatar: "🦖",
        birthDate: "2018-06-01",
        createdAt: "2024-01-01T00:00:00.000Z",
        unassignedMoney: 0,
      },
    ],
    goals: [
      {
        id: "goal-ava-bike",
        childProfileId: "ava",
        goalName: "Bike",
        targetAmount: 50,
        currentAmount: 0,
        allocatedAmount: 0,
        status: "active",
        goalImage: "🚲",
        startDate: "2024-01-01",
        endDate: "",
      },
      {
        id: "goal-leo-robot",
        childProfileId: "leo",
        goalName: "Robot",
        targetAmount: 40,
        currentAmount: 0,
        allocatedAmount: 0,
        status: "active",
        goalImage: "🤖",
        startDate: "2024-01-01",
        endDate: "",
      },
    ],
    transactions: [],
    walletBuckets: createDefaultWalletBuckets([
      { id: "ava" },
      { id: "leo" },
    ]),
    currentScreen: "welcome",
    activeChildProfileId: null,
  };

  function isValidUser(user) {
    return (
      user &&
      typeof user === "object" &&
      typeof user.id === "string" &&
      user.id &&
      typeof user.name === "string" &&
      user.name &&
      typeof user.email === "string" &&
      typeof user.role === "string" &&
      user.role
    );
  }

  function isValidChildProfile(childProfile) {
    return (
      childProfile &&
      typeof childProfile === "object" &&
      typeof childProfile.id === "string" &&
      childProfile.id &&
      typeof childProfile.userId === "string" &&
      childProfile.userId &&
      typeof childProfile.childName === "string" &&
      childProfile.childName &&
      typeof childProfile.avatar === "string" &&
      typeof childProfile.birthDate === "string" &&
      typeof childProfile.createdAt === "string" &&
      Number.isFinite(childProfile.unassignedMoney) &&
      childProfile.unassignedMoney >= 0
    );
  }

  function isValidGoal(goal) {
    return (
      goal &&
      typeof goal === "object" &&
      typeof goal.id === "string" &&
      goal.id &&
      typeof goal.childProfileId === "string" &&
      goal.childProfileId &&
      typeof goal.goalName === "string" &&
      goal.goalName &&
      Number.isFinite(goal.targetAmount) &&
      (Number.isFinite(goal.allocatedAmount) || Number.isFinite(goal.currentAmount)) &&
      (goal.status === "active" || goal.status === "completed") &&
      typeof goal.goalImage === "string" &&
      typeof goal.startDate === "string" &&
      typeof goal.endDate === "string"
    );
  }

  function isValidWalletBucket(bucket) {
    return (
      bucket &&
      typeof bucket === "object" &&
      typeof bucket.id === "string" &&
      bucket.id &&
      typeof bucket.childProfileId === "string" &&
      bucket.childProfileId &&
      WALLET_BUCKET_TYPES.includes(bucket.bucketType) &&
      Number.isFinite(bucket.balance) &&
      bucket.balance >= 0
    );
  }

  function isValidTransaction(transaction) {
    const createdAt = typeof transaction?.createdAt === "string" ? transaction.createdAt : transaction?.transactionDate;
    const goalIdValid = transaction?.goalId === null || typeof transaction?.goalId === "string";
    const bucketTypeValid =
      transaction?.bucketType === null ||
      typeof transaction?.bucketType === "undefined" ||
      VALID_BUCKET_TYPES.includes(transaction?.bucketType);

    return (
      transaction &&
      typeof transaction === "object" &&
      typeof transaction.id === "string" &&
      transaction.id &&
      typeof transaction.childProfileId === "string" &&
      transaction.childProfileId &&
      goalIdValid &&
      bucketTypeValid &&
      typeof createdAt === "string" &&
      Number.isFinite(transaction.amount) &&
      transaction.amount > 0 &&
      typeof transaction.type === "string" &&
      transaction.type &&
      (typeof transaction.label === "string" || typeof transaction.label === "undefined" || transaction.label === null) &&
      (typeof transaction.source === "string" || typeof transaction.source === "undefined") &&
      (typeof transaction.category === "string" || typeof transaction.category === "undefined") &&
      (typeof transaction.note === "string" || typeof transaction.note === "undefined")
    );
  }

  function migrateFromLegacyData(parsed) {
    const now = new Date().toISOString();
    const parentUser = {
      id: "user-parent-1",
      name: "Parent",
      email: "parent@example.com",
      role: "parent",
    };

    const childProfiles = (Array.isArray(parsed.children) ? parsed.children : [])
      .filter((child) => child && typeof child.id === "string" && child.id && typeof child.name === "string" && child.name)
      .map((child) => ({
        id: child.id,
        userId: parentUser.id,
        childName: child.name,
        avatar: typeof child.avatar === "string" ? child.avatar : "🙂",
        birthDate: "",
        createdAt: now,
        unassignedMoney: 0,
      }));

    if (childProfiles.length === 0) {
      return structuredClone(defaultData);
    }

    const childProfileIds = new Set(childProfiles.map((profile) => profile.id));

    const goals = (Array.isArray(parsed.goals) ? parsed.goals : [])
      .filter((goal) => goal && typeof goal.id === "string" && goal.id && childProfileIds.has(goal.childId))
      .map((goal) => {
        const targetAmount = Number.isFinite(goal.targetAmount) && goal.targetAmount > 0 ? goal.targetAmount : 1;
        const allocatedAmount = Number.isFinite(goal.currentAmount) ? Math.max(0, Math.min(goal.currentAmount, targetAmount)) : 0;
        const status = goal.status === "completed" || allocatedAmount >= targetAmount ? "completed" : "active";
        return {
          id: goal.id,
          childProfileId: goal.childId,
          goalName: typeof goal.name === "string" && goal.name ? goal.name : "Goal",
          targetAmount,
          allocatedAmount,
          currentAmount: allocatedAmount,
          status,
          goalImage: typeof goal.icon === "string" ? goal.icon : "🎯",
          startDate: "",
          endDate: "",
        };
      });

    const goalIds = new Set(goals.map((goal) => goal.id));
    const goalChildMap = new Map(goals.map((goal) => [goal.id, goal.childProfileId]));

    const transactions = (Array.isArray(parsed.transactions) ? parsed.transactions : [])
      .filter((transaction) => transaction && typeof transaction.goalId === "string" && goalIds.has(transaction.goalId))
      .map((transaction) => ({
        id: typeof transaction.id === "string" && transaction.id ? transaction.id : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        childProfileId: goalChildMap.get(transaction.goalId),
        goalId: transaction.goalId,
        bucketType: null,
        createdAt: typeof transaction.date === "string" && transaction.date ? transaction.date : now,
        transactionDate: typeof transaction.date === "string" && transaction.date ? transaction.date : now,
        amount: Number.isFinite(transaction.amount) && transaction.amount > 0 ? transaction.amount : 0,
        type: transaction.type === "out" ? "out" : "in",
        label: "Legacy import",
        source: "manual",
        category: "general",
        note: "",
      }))
      .filter((transaction) => transaction.amount > 0);

    const requestedScreen = VALID_SCREENS.includes(parsed.currentScreen) ? parsed.currentScreen : "child-picker";
    const activeChildProfileId = childProfiles.some((profile) => profile.id === parsed.activeChildId) ? parsed.activeChildId : null;

    return {
      users: [parentUser],
      childProfiles,
      goals,
      transactions,
      walletBuckets: ensureWalletBuckets(childProfiles, []),
      currentScreen: activeChildProfileId ? requestedScreen : "child-picker",
      activeChildProfileId,
    };
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.children) && Array.isArray(parsed.goals) && Array.isArray(parsed.transactions)) {
        return migrateFromLegacyData(parsed);
      }

      if (
        !Array.isArray(parsed.users) ||
        !Array.isArray(parsed.childProfiles) ||
        !Array.isArray(parsed.goals) ||
        !Array.isArray(parsed.transactions)
      ) {
        return structuredClone(defaultData);
      }

      const users = parsed.users.filter(isValidUser);
      if (users.length === 0) return structuredClone(defaultData);

      const userIds = new Set(users.map((user) => user.id));
      const childProfiles = parsed.childProfiles
        .map((childProfile) => ({
          ...childProfile,
          unassignedMoney: Number.isFinite(childProfile.unassignedMoney) && childProfile.unassignedMoney >= 0 ? childProfile.unassignedMoney : 0,
        }))
        .filter(isValidChildProfile)
        .filter((childProfile) => userIds.has(childProfile.userId));
      if (childProfiles.length === 0) return structuredClone(defaultData);

      const childProfileIds = new Set(childProfiles.map((childProfile) => childProfile.id));
      const goals = parsed.goals
        .filter(isValidGoal)
        .filter((goal) => childProfileIds.has(goal.childProfileId))
        .map((goal) => {
          const rawAllocatedAmount = Number.isFinite(goal.allocatedAmount)
            ? goal.allocatedAmount
            : Number.isFinite(goal.currentAmount)
              ? goal.currentAmount
              : 0;
          const allocatedAmount = Math.max(0, Math.min(rawAllocatedAmount, goal.targetAmount));
          return {
            ...goal,
            allocatedAmount,
            currentAmount: allocatedAmount,
          };
        });

      const goalIds = new Set(goals.map((goal) => goal.id));
      const goalChildMap = new Map(goals.map((goal) => [goal.id, goal.childProfileId]));
      const transactions = parsed.transactions
        .filter(isValidTransaction)
        .map((transaction) => ({
          ...transaction,
          goalId: typeof transaction.goalId === "undefined" ? null : transaction.goalId,
          bucketType: typeof transaction.bucketType === "undefined" ? null : transaction.bucketType,
          createdAt:
            typeof transaction.createdAt === "string" && transaction.createdAt
              ? transaction.createdAt
              : typeof transaction.transactionDate === "string" && transaction.transactionDate
                ? transaction.transactionDate
                : new Date().toISOString(),
          label: typeof transaction.label === "string" ? transaction.label : "",
          transactionDate:
            typeof transaction.transactionDate === "string" && transaction.transactionDate
              ? transaction.transactionDate
              : typeof transaction.createdAt === "string" && transaction.createdAt
                ? transaction.createdAt
                : new Date().toISOString(),
          source: typeof transaction.source === "string" ? transaction.source : "manual",
          category: typeof transaction.category === "string" ? transaction.category : "general",
          note: typeof transaction.note === "string" ? transaction.note : "",
        }))
        .filter((transaction) => transaction.goalId === null || goalIds.has(transaction.goalId))
        .filter((transaction) =>
          transaction.goalId === null
            ? childProfileIds.has(transaction.childProfileId)
            : goalChildMap.get(transaction.goalId) === transaction.childProfileId
        );

      const walletBuckets = ensureWalletBuckets(childProfiles, parsed.walletBuckets);

      const requestedScreen = VALID_SCREENS.includes(parsed.currentScreen) ? parsed.currentScreen : "child-picker";
      const activeChildProfileId = childProfiles.some((profile) => profile.id === parsed.activeChildProfileId)
        ? parsed.activeChildProfileId
        : null;

      return {
        users,
        childProfiles,
        goals,
        transactions,
        walletBuckets,
        currentScreen: activeChildProfileId ? requestedScreen : "child-picker",
        activeChildProfileId,
      };
    } catch {
      return structuredClone(defaultData);
    }
  }

  const state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeChildProfileForUI(childProfile) {
    return {
      id: childProfile.id,
      name: childProfile.childName,
      childName: childProfile.childName,
      avatar: childProfile.avatar,
      birthDate: childProfile.birthDate,
      createdAt: childProfile.createdAt,
      userId: childProfile.userId,
      unassignedMoney: childProfile.unassignedMoney,
    };
  }

  function normalizeGoalForUI(goal) {
    return {
      id: goal.id,
      childId: goal.childProfileId,
      childProfileId: goal.childProfileId,
      name: goal.goalName,
      goalName: goal.goalName,
      icon: goal.goalImage,
      goalImage: goal.goalImage,
      targetAmount: goal.targetAmount,
      allocatedAmount: getGoalAllocatedAmount(goal),
      currentAmount: getGoalAllocatedAmount(goal),
      status: goal.status,
      startDate: goal.startDate,
      endDate: goal.endDate,
    };
  }

  function normalizeTransactionForUI(transaction) {
    const createdAt = transaction.createdAt || transaction.transactionDate;
    return {
      id: transaction.id,
      childProfileId: transaction.childProfileId,
      goalId: transaction.goalId ?? null,
      bucketType: transaction.bucketType ?? null,
      date: createdAt,
      createdAt,
      transactionDate: createdAt,
      amount: transaction.amount,
      type: transaction.type,
      label: transaction.label || "",
      source: transaction.source,
      category: transaction.category,
      note: transaction.note,
    };
  }

  function getSerializableState() {
    return structuredClone(state);
  }

  function setCurrentScreen(screenName) {
    state.currentScreen = VALID_SCREENS.includes(screenName) ? screenName : "child-picker";
    saveState();
  }

  function setActiveChildId(childProfileId) {
    state.activeChildProfileId = state.childProfiles.some((childProfile) => childProfile.id === childProfileId) ? childProfileId : null;
    saveState();
  }

  function getActiveChild() {
    const profile = state.childProfiles.find((childProfile) => childProfile.id === state.activeChildProfileId) || null;
    return profile ? normalizeChildProfileForUI(profile) : null;
  }

  function getGoalsForChild(childProfileId) {
    return state.goals.filter((goal) => goal.childProfileId === childProfileId).map(normalizeGoalForUI);
  }

  function getGoalById(goalId) {
    const goal = state.goals.find((item) => item.id === goalId) || null;
    return goal ? normalizeGoalForUI(goal) : null;
  }

  function getRawGoalById(goalId) {
    return state.goals.find((goal) => goal.id === goalId) || null;
  }

  function getRawChildProfileById(childProfileId) {
    return state.childProfiles.find((childProfile) => childProfile.id === childProfileId) || null;
  }

  function getRawBucketByType(childProfileId, bucketType) {
    return (
      state.walletBuckets.find(
        (bucket) => bucket.childProfileId === childProfileId && bucket.bucketType === bucketType
      ) || null
    );
  }

  function getBucketsForChild(childProfileId) {
    return state.walletBuckets
      .filter((bucket) => bucket.childProfileId === childProfileId)
      .sort((a, b) => WALLET_BUCKET_TYPES.indexOf(a.bucketType) - WALLET_BUCKET_TYPES.indexOf(b.bucketType))
      .map((bucket) => ({ ...bucket }));
  }

  function getBucketByType(childProfileId, bucketType) {
    const bucket = getRawBucketByType(childProfileId, bucketType);
    return bucket ? { ...bucket } : null;
  }

  function isGoalActive(goal) {
    return goal && goal.status === "active";
  }

  function getGoalAllocatedAmount(goal) {
    if (!goal) return 0;
    if (Number.isFinite(goal.allocatedAmount)) return Math.max(0, goal.allocatedAmount);
    if (Number.isFinite(goal.currentAmount)) return Math.max(0, goal.currentAmount);
    return 0;
  }

  function getActiveGoalsFromSelected(goalId) {
    const selectedGoal = getRawGoalById(goalId);
    if (!selectedGoal || !isGoalActive(selectedGoal)) return [];

    const childGoals = state.goals.filter((goal) => goal.childProfileId === selectedGoal.childProfileId && isGoalActive(goal));
    return [selectedGoal, ...childGoals.filter((goal) => goal.id !== selectedGoal.id)];
  }

  function getActiveGoalsForWithdrawal(goalId) {
    const selectedGoal = getRawGoalById(goalId);
    if (!selectedGoal || !isGoalActive(selectedGoal)) return [];

    const childGoals = state.goals.filter((goal) => goal.childProfileId === selectedGoal.childProfileId && isGoalActive(goal));
    return [selectedGoal, ...childGoals.filter((goal) => goal.id !== selectedGoal.id)];
  }

  function pushTransaction({ childProfileId, goalId = null, bucketType = null, type, amount, label = "" }) {
    const createdAt = new Date().toISOString();
    state.transactions.push({
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childProfileId,
      goalId,
      bucketType,
      createdAt,
      transactionDate: createdAt,
      amount,
      type,
      label,
      source: "manual",
      category: "general",
      note: "",
    });
  }

  function getTransactionsForGoal(goalId, type) {
    return state.transactions
      .filter((transaction) => transaction.goalId === goalId && (!type || transaction.type === type))
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .map(normalizeTransactionForUI);
  }

  function getChildMoneyWorld(childProfileId) {
    const childProfile = getRawChildProfileById(childProfileId);
    const poolMoney = childProfile && Number.isFinite(childProfile.unassignedMoney) ? childProfile.unassignedMoney : 0;

    const bucketsForChild = getBucketsForChild(childProfileId);
    const buckets = {
      spend: 0,
      save: 0,
      invest: 0,
      donate: 0,
    };

    bucketsForChild.forEach((bucket) => {
      buckets[bucket.bucketType] = bucket.balance;
    });

    const goalsBalance = state.goals
      .filter((goal) => goal.childProfileId === childProfileId)
      .reduce((sum, goal) => sum + getGoalAllocatedAmount(goal), 0);

    const totalBalance = poolMoney + buckets.spend + buckets.save + buckets.invest + buckets.donate;

    return {
      poolMoney,
      totalBalance,
      buckets,
      goalsBalance,
      spendBucketBalance: buckets.spend,
      saveBucketBalance: buckets.save,
      investBucketBalance: buckets.invest,
      donateBucketBalance: buckets.donate,
    };
  }

  function getChildSummary(childProfileId) {
    const moneyWorld = getChildMoneyWorld(childProfileId);
    const childTransactions = state.transactions.filter((transaction) => transaction.childProfileId === childProfileId);

    const totalMoneyIn = childTransactions
      .filter((transaction) => transaction.type === "in")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalMoneyOut = childTransactions
      .filter((transaction) => transaction.type === "out")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      totalBalance: moneyWorld.totalBalance,
      activeBalance: moneyWorld.poolMoney,
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
      childProfileId: activeChild.id,
      goalName: name,
      targetAmount,
      allocatedAmount: 0,
      currentAmount: 0,
      status: "active",
      goalImage: icon || "🎯",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    };

    state.goals.push(goal);
    saveState();
    return normalizeGoalForUI(goal);
  }

  function updateGoal(goalId, updates) {
    const goal = getRawGoalById(goalId);
    if (!goal) return null;

    if (typeof updates.name === "string" && updates.name.trim()) goal.goalName = updates.name.trim();
    if (Number.isInteger(updates.targetAmount) && updates.targetAmount > 0) {
      goal.targetAmount = updates.targetAmount;
      const allocatedAmount = getGoalAllocatedAmount(goal);
      goal.allocatedAmount = Math.min(allocatedAmount, goal.targetAmount);
      goal.currentAmount = goal.allocatedAmount;
    }
    if (typeof updates.icon === "string" && updates.icon.trim()) goal.goalImage = updates.icon.trim();

    if (goal.status === "active" && getGoalAllocatedAmount(goal) >= goal.targetAmount) {
      goal.allocatedAmount = goal.targetAmount;
      goal.currentAmount = goal.allocatedAmount;
      goal.status = "completed";
    }

    saveState();
    return normalizeGoalForUI(goal);
  }


  function getChildUnassignedMoney(childProfileId) {
    const childProfile = getRawChildProfileById(childProfileId);
    if (!childProfile || !Number.isFinite(childProfile.unassignedMoney)) return 0;
    return Math.max(0, childProfile.unassignedMoney);
  }

  function addMoneyToPool(childProfileId, amount, label = "Money In") {
    const childProfile = getRawChildProfileById(childProfileId);
    if (!childProfile || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT" };
    }

    childProfile.unassignedMoney += amount;
    pushTransaction({
      childProfileId,
      goalId: null,
      bucketType: "pool",
      type: "in",
      amount,
      label,
    });

    saveState();
    return { ok: true, childProfile: normalizeChildProfileForUI(childProfile) };
  }

  function allocatePoolMoneyToBucket(childProfileId, bucketType, amount, options = {}) {
    const childProfile = getRawChildProfileById(childProfileId);
    const bucket = getRawBucketByType(childProfileId, bucketType);

    if (!childProfile || !bucket || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT" };
    }

    const poolMoney = getChildUnassignedMoney(childProfileId);
    if (amount > poolMoney) {
      return { ok: false, error: "INSUFFICIENT_POOL_FUNDS" };
    }

    childProfile.unassignedMoney -= amount;
    bucket.balance += amount;

    pushTransaction({
      childProfileId,
      goalId: null,
      bucketType,
      type: "allocate",
      amount,
      label: "Bucket allocation",
    });

    if (bucketType === "save" && options.goalId) {
      const distributionResult = distributeSaveBucketToGoals(childProfileId, options.goalId, amount);
      if (!distributionResult.ok) {
        childProfile.unassignedMoney += amount;
        bucket.balance -= amount;
        state.transactions.pop();
        return distributionResult;
      }

      saveState();
      return {
        ok: true,
        completedGoals: distributionResult.completedGoals,
        appliedTransactions: distributionResult.appliedTransactions,
        overflow: distributionResult.overflow,
      };
    }

    saveState();
    return { ok: true, completedGoals: [], appliedTransactions: [], overflow: 0 };
  }

  function distributeSaveBucketToGoals(childProfileId, startingGoalId, amountToDistribute) {
    const saveBucket = getRawBucketByType(childProfileId, "save");
    const selectedGoal = getRawGoalById(startingGoalId);

    if (
      !saveBucket ||
      !selectedGoal ||
      selectedGoal.childProfileId !== childProfileId ||
      !Number.isInteger(amountToDistribute) ||
      amountToDistribute <= 0
    ) {
      return { ok: false, error: "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
    }

    if (!isGoalActive(selectedGoal)) {
      return { ok: false, error: "GOAL_COMPLETED", appliedTransactions: [], overflow: amountToDistribute, completedGoals: [] };
    }

    let remaining = amountToDistribute;
    const goalSequence = getActiveGoalsFromSelected(startingGoalId);
    const appliedTransactions = [];
    const completedGoals = [];

    goalSequence.forEach((goal) => {
      if (remaining <= 0) return;

      const allocatedAmount = getGoalAllocatedAmount(goal);
      const space = Math.max(0, goal.targetAmount - allocatedAmount);
      if (space <= 0) return;

      const applied = Math.min(remaining, space);
      goal.allocatedAmount = allocatedAmount + applied;
      goal.currentAmount = goal.allocatedAmount;
      remaining -= applied;
      saveBucket.balance -= applied;

      if (applied > 0) {
        pushTransaction({
          childProfileId: goal.childProfileId,
          goalId: goal.id,
          bucketType: "save",
          type: "allocate",
          amount: applied,
          label: "Save goal funding",
        });
        appliedTransactions.push({ goalId: goal.id, amount: applied });
      }

      if (goal.allocatedAmount >= goal.targetAmount) {
        goal.allocatedAmount = goal.targetAmount;
        goal.currentAmount = goal.allocatedAmount;
        goal.status = "completed";
        completedGoals.push(goal.id);
      }
    });

    return {
      ok: true,
      appliedTransactions,
      overflow: remaining,
      completedGoals,
    };
  }


  function useSaveBucketForGoal(childProfileId, goalId, amount) {
    const saveBucket = getRawBucketByType(childProfileId, "save");
    const goal = getRawGoalById(goalId);

    if (
      !saveBucket ||
      !goal ||
      goal.childProfileId !== childProfileId ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return { ok: false, error: "INVALID_INPUT" };
    }

    if (!isGoalActive(goal)) {
      return { ok: false, error: "GOAL_COMPLETED" };
    }

    if (amount > saveBucket.balance) {
      return { ok: false, error: "INSUFFICIENT_SAVE_FUNDS" };
    }

    const result = distributeSaveBucketToGoals(childProfileId, goalId, amount);
    if (result.ok) {
      saveState();
    }
    return result;
  }

  function allocatePoolMoneyToGoal(childProfileId, goalId, amount) {
    // Legacy/deprecated wrapper: prefer allocatePoolMoneyToBucket(childProfileId, "save", amount, { goalId }).
    return allocatePoolMoneyToBucket(childProfileId, "save", amount, { goalId });
  }

  function addMoneyToGoals({ goalId, amount }) {
    // Legacy/deprecated: prefer addMoneyToPool + allocatePoolMoneyToGoal.
    const selectedGoal = getRawGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
    }

    const poolResult = addMoneyToPool(selectedGoal.childProfileId, amount, "Money In");
    if (!poolResult.ok) {
      return { ok: false, error: poolResult.error || "INVALID_INPUT", appliedTransactions: [], overflow: amount, completedGoals: [] };
    }

    return allocatePoolMoneyToGoal(selectedGoal.childProfileId, goalId, amount);
  }

  function withdrawMoneyFromGoals({ goalId, amount, allowCrossGoal }) {
    const selectedGoal = getRawGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0) {
      return { ok: false, error: "INVALID_INPUT", deductions: [], usedMultipleGoals: false };
    }

    if (!isGoalActive(selectedGoal)) {
      return { ok: false, error: "GOAL_COMPLETED", deductions: [], usedMultipleGoals: false };
    }

    const goalSequence = getActiveGoalsForWithdrawal(goalId);
    const selectedGoalBalance = getGoalAllocatedAmount(selectedGoal);
    const availableTotal = goalSequence.reduce((sum, goal) => sum + getGoalAllocatedAmount(goal), 0);

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

      const deducted = Math.min(getGoalAllocatedAmount(goal), remaining);
      if (deducted <= 0) return;

      goal.allocatedAmount = Math.max(0, getGoalAllocatedAmount(goal) - deducted);
      goal.currentAmount = goal.allocatedAmount;
      if (goal.allocatedAmount < goal.targetAmount && goal.status === "completed") {
        goal.status = "active";
      }
      remaining -= deducted;

      pushTransaction({ childProfileId: goal.childProfileId, goalId: goal.id, bucketType: "save", type: "out", amount: deducted, label: "Money Out" });
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
    const selectedGoal = getRawGoalById(goalId);
    if (!selectedGoal || !Number.isInteger(amount) || amount <= 0 || (type !== "in" && type !== "out")) {
      return { ok: false, justCompleted: false };
    }

    const selectedGoalWasCompleted = getGoalAllocatedAmount(selectedGoal) >= selectedGoal.targetAmount;
    let result;

    if (type === "in") {
      result = addMoneyToGoals({ goalId, amount });
    } else {
      result = withdrawMoneyFromGoals({ goalId, amount, allowCrossGoal: false });
    }

    if (!result.ok) {
      return { ok: false, justCompleted: false, error: result.error };
    }

    const selectedGoalAfter = getRawGoalById(goalId);
    const childProfile = state.childProfiles.find((profile) => profile.id === selectedGoal.childProfileId);

    return {
      ok: true,
      justCompleted:
        type === "in" &&
        !selectedGoalWasCompleted &&
        selectedGoalAfter &&
        getGoalAllocatedAmount(selectedGoalAfter) >= selectedGoalAfter.targetAmount,
      childName: childProfile ? childProfile.childName : "",
      goalName: selectedGoal.goalName,
    };
  }

  window.AppState = {
    state,
    getSerializableState,
    setCurrentScreen,
    setActiveChildId,
    getActiveChild,
    getGoalsForChild,
    getGoalById,
    getTransactionsForGoal,
    getChildSummary,
    getChildMoneyWorld,
    getChildUnassignedMoney,
    getBucketsForChild,
    getBucketByType,
    addMoneyToPool,
    allocatePoolMoneyToBucket,
    distributeSaveBucketToGoals,
    useSaveBucketForGoal,
    allocatePoolMoneyToGoal,
    addGoalForActiveChild,
    updateGoal,
    addMoneyToGoals,
    withdrawMoneyFromGoals,
    addTransaction,
  };
})();
