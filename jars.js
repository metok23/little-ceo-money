(function () {
  class BaseJar {
    constructor(stateApi, childProfileId, bucketType) {
      this.stateApi = stateApi;
      this.childProfileId = childProfileId;
      this.bucketType = bucketType;
    }

    getBucket() {
      if (!this.stateApi || typeof this.stateApi.getRawBucketByType !== "function") {
        return null;
      }
      return this.stateApi.getRawBucketByType(this.childProfileId, this.bucketType);
    }

    getBalance() {
      const bucket = this.getBucket();
      if (!bucket || !Number.isFinite(bucket.balance)) return 0;
      return bucket.balance;
    }

    validateAmount(amount) {
      return Number.isInteger(amount) && amount > 0;
    }

    deposit(amount) {
      if (!this.validateAmount(amount)) {
        return { ok: false, error: "INVALID_AMOUNT" };
      }

      const bucket = this.getBucket();
      if (!bucket) {
        return { ok: false, error: "BUCKET_NOT_FOUND" };
      }

      bucket.balance += amount;
      return { ok: true, balance: bucket.balance };
    }

    withdraw(amount) {
      if (!this.validateAmount(amount)) {
        return { ok: false, error: "INVALID_AMOUNT" };
      }

      const bucket = this.getBucket();
      if (!bucket) {
        return { ok: false, error: "BUCKET_NOT_FOUND" };
      }

      if (bucket.balance < amount) {
        return { ok: false, error: "INSUFFICIENT_FUNDS" };
      }

      bucket.balance -= amount;
      return { ok: true, balance: bucket.balance };
    }
  }

  class SpendJar extends BaseJar {
    constructor(stateApi, childProfileId) {
      super(stateApi, childProfileId, "spend");
    }
  }

  class SaveJar extends BaseJar {
    constructor(stateApi, childProfileId) {
      super(stateApi, childProfileId, "save");
    }

    depositFromPool(amount) {
      return this.deposit(amount);
    }

    distributeToGoals(startingGoalId, amountToDistribute) {
      const saveBucket = this.getBucket();
      const selectedGoal = this.stateApi.getRawGoalById(startingGoalId);

      if (
        !saveBucket ||
        !selectedGoal ||
        selectedGoal.childProfileId !== this.childProfileId ||
        !this.validateAmount(amountToDistribute)
      ) {
        return { ok: false, error: "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
      }

      if (selectedGoal.status !== "active") {
        return { ok: false, error: "GOAL_COMPLETED", appliedTransactions: [], overflow: amountToDistribute, completedGoals: [] };
      }

      let remaining = amountToDistribute;
      const goalSequence = this.stateApi.getActiveGoalsFromSelected(startingGoalId);
      const appliedTransactions = [];
      const completedGoals = [];

      goalSequence.forEach((goal) => {
        if (remaining <= 0) return;

        const allocatedAmount = this.stateApi.getGoalAllocatedAmount(goal);
        const space = Math.max(0, goal.targetAmount - allocatedAmount);
        if (space <= 0) return;

        const applied = Math.min(remaining, space);
        goal.allocatedAmount = allocatedAmount + applied;
        goal.currentAmount = goal.allocatedAmount;
        saveBucket.balance -= applied;
        remaining -= applied;

        if (applied > 0) {
          this.stateApi.pushTransaction({
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

    allocateFromPoolToGoal(amount, goalId) {
      const depositResult = this.depositFromPool(amount);
      if (!depositResult.ok) {
        return { ok: false, error: depositResult.error || "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
      }

      const distributionResult = this.distributeToGoals(goalId, amount);
      if (!distributionResult.ok) {
        this.withdraw(amount);
        return distributionResult;
      }

      return distributionResult;
    }

    useExistingSaveForGoal(goalId, amount) {
      if (!this.validateAmount(amount)) {
        return { ok: false, error: "INVALID_INPUT", appliedTransactions: [], overflow: 0, completedGoals: [] };
      }

      if (amount > this.getBalance()) {
        return { ok: false, error: "INSUFFICIENT_SAVE_FUNDS" };
      }

      return this.distributeToGoals(goalId, amount);
    }
  }

  class InvestJar extends BaseJar {
    constructor(stateApi, childProfileId) {
      super(stateApi, childProfileId, "invest");
    }
  }

  class DonateJar extends BaseJar {
    constructor(stateApi, childProfileId) {
      super(stateApi, childProfileId, "donate");
    }
  }

  function createJar(stateApi, childProfileId, bucketType) {
    if (bucketType === "spend") return new SpendJar(stateApi, childProfileId);
    if (bucketType === "save") return new SaveJar(stateApi, childProfileId);
    if (bucketType === "invest") return new InvestJar(stateApi, childProfileId);
    if (bucketType === "donate") return new DonateJar(stateApi, childProfileId);

    throw new Error(`Unknown jar bucket type: ${bucketType}`);
  }

  window.JarsEngine = {
    BaseJar,
    SpendJar,
    SaveJar,
    InvestJar,
    DonateJar,
    createJar,
  };
})();
