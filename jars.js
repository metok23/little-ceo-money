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
