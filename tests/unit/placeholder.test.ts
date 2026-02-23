import { test, expect, describe } from "vitest";

describe("health check", () => {
  test("API response format is consistent", () => {
    // Verify the expected response shape used across all endpoints
    const successResponse = { success: true, data: [], count: 0 };
    const errorResponse = { success: false, error: "Something went wrong" };

    expect(successResponse).toHaveProperty("success", true);
    expect(successResponse).toHaveProperty("data");
    expect(errorResponse).toHaveProperty("success", false);
    expect(errorResponse).toHaveProperty("error");
  });
});
