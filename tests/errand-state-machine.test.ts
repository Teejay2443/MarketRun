describe("Errand State Machine", () => {
  // Valid state transitions based on the errand lifecycle
  const validTransitions: Record<string, string[]> = {
    OPEN: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["FUNDED", "CANCELLED"],
    FUNDED: ["SHOPPING", "CANCELLED"],
    SHOPPING: ["PRICE_REVIEW", "DELIVERED"],
    PRICE_REVIEW: ["SHOPPING"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    REFUNDED: [],
  };

  const invalidStatuses = ["PENDING", "UNKNOWN", "", "active"];

  describe("Valid transitions", () => {
    it("OPEN -> ACCEPTED should be valid", () => {
      expect(validTransitions.OPEN).toContain("ACCEPTED");
    });

    it("OPEN -> CANCELLED should be valid", () => {
      expect(validTransitions.OPEN).toContain("CANCELLED");
    });

    it("ACCEPTED -> FUNDED should be valid", () => {
      expect(validTransitions.ACCEPTED).toContain("FUNDED");
    });

    it("ACCEPTED -> CANCELLED should be valid", () => {
      expect(validTransitions.ACCEPTED).toContain("CANCELLED");
    });

    it("FUNDED -> SHOPPING should be valid", () => {
      expect(validTransitions.FUNDED).toContain("SHOPPING");
    });

    it("FUNDED -> CANCELLED should be valid", () => {
      expect(validTransitions.FUNDED).toContain("CANCELLED");
    });

    it("SHOPPING -> PRICE_REVIEW should be valid", () => {
      expect(validTransitions.SHOPPING).toContain("PRICE_REVIEW");
    });

    it("SHOPPING -> DELIVERED should be valid", () => {
      expect(validTransitions.SHOPPING).toContain("DELIVERED");
    });

    it("PRICE_REVIEW -> SHOPPING should be valid (after approval/rejection)", () => {
      expect(validTransitions.PRICE_REVIEW).toContain("SHOPPING");
    });

    it("DELIVERED -> COMPLETED should be valid", () => {
      expect(validTransitions.DELIVERED).toContain("COMPLETED");
    });
  });

  describe("Invalid transitions", () => {
    it("COMPLETED -> any should be invalid", () => {
      expect(validTransitions.COMPLETED).toHaveLength(0);
    });

    it("CANCELLED -> any should be invalid", () => {
      expect(validTransitions.CANCELLED).toHaveLength(0);
    });

    it("OPEN -> DELIVERED should be invalid", () => {
      expect(validTransitions.OPEN).not.toContain("DELIVERED");
    });

    it("OPEN -> COMPLETED should be invalid", () => {
      expect(validTransitions.OPEN).not.toContain("COMPLETED");
    });

    it("SHOPPING -> FUNDED should be invalid (can't go back)", () => {
      expect(validTransitions.SHOPPING).not.toContain("FUNDED");
    });

    it("DELIVERED -> SHOPPING should be invalid (can't go back)", () => {
      expect(validTransitions.DELIVERED).not.toContain("SHOPPING");
    });
  });

  describe("Invalid statuses", () => {
    invalidStatuses.forEach((status) => {
      it(`"${status}" should not be a valid status`, () => {
        expect(validTransitions).not.toHaveProperty(status);
      });
    });
  });

  describe("Full happy path", () => {
    it("should support complete errand lifecycle: OPEN -> ACCEPTED -> FUNDED -> SHOPPING -> DELIVERED -> COMPLETED", () => {
      let currentStatus = "OPEN";

      // Step 1: Shopper accepts
      expect(validTransitions[currentStatus]).toContain("ACCEPTED");
      currentStatus = "ACCEPTED";

      // Step 2: Requester funds
      expect(validTransitions[currentStatus]).toContain("FUNDED");
      currentStatus = "FUNDED";

      // Step 3: Shopper goes shopping
      expect(validTransitions[currentStatus]).toContain("SHOPPING");
      currentStatus = "SHOPPING";

      // Step 4: Shopper delivers
      expect(validTransitions[currentStatus]).toContain("DELIVERED");
      currentStatus = "DELIVERED";

      // Step 5: Requester confirms
      expect(validTransitions[currentStatus]).toContain("COMPLETED");
      currentStatus = "COMPLETED";

      expect(currentStatus).toBe("COMPLETED");
    });
  });

  describe("Price review flow", () => {
    it("should support SHOPPING -> PRICE_REVIEW -> SHOPPING cycle", () => {
      let currentStatus = "SHOPPING";

      // Shopper reports price issue
      expect(validTransitions[currentStatus]).toContain("PRICE_REVIEW");
      currentStatus = "PRICE_REVIEW";

      // Requester approves/rejects, back to shopping
      expect(validTransitions[currentStatus]).toContain("SHOPPING");
      currentStatus = "SHOPPING";

      expect(currentStatus).toBe("SHOPPING");
    });
  });

  describe("Cancellation flow", () => {
    it("should support cancellation from OPEN", () => {
      expect(validTransitions.OPEN).toContain("CANCELLED");
    });

    it("should support cancellation from ACCEPTED", () => {
      expect(validTransitions.ACCEPTED).toContain("CANCELLED");
    });

    it("should support cancellation from FUNDED", () => {
      expect(validTransitions.FUNDED).toContain("CANCELLED");
    });

    it("should NOT support cancellation from SHOPPING", () => {
      expect(validTransitions.SHOPPING).not.toContain("CANCELLED");
    });

    it("should NOT support cancellation from DELIVERED", () => {
      expect(validTransitions.DELIVERED).not.toContain("CANCELLED");
    });
  });
});
