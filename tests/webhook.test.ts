describe("Webhook Signature Verification", () => {
  const crypto = require("crypto");

  // Simulate the verifyWebhookSignature function from monnify.ts
  function verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
    const hash = crypto.createHmac("sha512", secretKey).update(payload).digest("hex");
    return hash === signature;
  }

  const testSecret = "test-monnify-secret-key";

  it("should verify a valid HMAC-SHA512 signature", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION","data":{"amount":5000}}';
    const signature = crypto.createHmac("sha512", testSecret).update(payload).digest("hex");

    expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION","data":{"amount":5000}}';
    const invalidSignature = "a".repeat(128); // Wrong hash

    expect(verifyWebhookSignature(payload, invalidSignature, testSecret)).toBe(false);
  });

  it("should reject signature from different secret", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION"}';
    const signature = crypto.createHmac("sha512", "different-secret").update(payload).digest("hex");

    expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(false);
  });

  it("should reject empty signature", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION"}';
    expect(verifyWebhookSignature(payload, "", testSecret)).toBe(false);
  });

  it("should produce consistent signatures for same input", () => {
    const payload = '{"event":"PAYMENT","ref":"MRN-123"}';
    const sig1 = crypto.createHmac("sha512", testSecret).update(payload).digest("hex");
    const sig2 = crypto.createHmac("sha512", testSecret).update(payload).digest("hex");
    expect(sig1).toBe(sig2);
  });

  it("should produce different signatures for different payloads", () => {
    const payload1 = '{"event":"PAYMENT","amount":1000}';
    const payload2 = '{"event":"PAYMENT","amount":2000}';
    const sig1 = crypto.createHmac("sha512", testSecret).update(payload1).digest("hex");
    const sig2 = crypto.createHmac("sha512", testSecret).update(payload2).digest("hex");
    expect(sig1).not.toBe(sig2);
  });

  it("should use SHA-512 (128 hex characters)", () => {
    const payload = "test";
    const signature = crypto.createHmac("sha512", testSecret).update(payload).digest("hex");
    expect(signature).toHaveLength(128);
  });
});
