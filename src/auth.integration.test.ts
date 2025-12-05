import { test, expect, beforeAll, afterAll, describe } from 'bun:test';
import { db, users, userPreferences, recipes, recipeRatings, userFavorites } from './db';
import { eq, inArray } from 'drizzle-orm';

const API_URL = 'http://localhost:6174';

/**
 * IMPORTANT: To run these tests, you need to:
 * 1. Have a Firebase project set up with valid credentials in .env
 * 2. Generate a test Firebase ID token using Firebase Auth
 * 3. Set the token in the TEST_FIREBASE_TOKEN environment variable
 *
 * To generate a test token, you can:
 * - Use Firebase Admin SDK to create a custom token
 * - Or sign in a test user and get their ID token
 * - Or use the Firebase Auth Emulator for testing
 *
 * Example to create a custom token:
 * ```
 * import admin from 'firebase-admin';
 * const customToken = await admin.auth().createCustomToken('test-user-id');
 * // Then exchange this for an ID token
 * ```
 */

const TEST_TOKEN = process.env.TEST_FIREBASE_TOKEN;
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_USER_EMAIL = `test-${Date.now()}@example.com`;

// Skip tests if no token is provided
const skipTests = !TEST_TOKEN;

if (skipTests) {
  console.log('\n⚠️  Skipping auth integration tests - TEST_FIREBASE_TOKEN not set\n');
}

// Helper to wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      await Bun.sleep(1000);
    }
  }
  throw new Error('Server did not start in time');
}

// Test data
let testRecipeId: number;
let testRatingId: number;

beforeAll(async () => {
  if (skipTests) return;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   🔐 MIXR API Authenticated Integration Test Suite      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await waitForServer();
});

afterAll(async () => {
  if (skipTests) return;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Clean up test user's data (cascades will handle related data)
    await db
      .delete(users)
      .where(eq(users.id, TEST_USER_ID));

    console.log('✅ Test cleanup complete!\n');
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error);
  }
});

describe('User Management', () => {
  test('GET /api/users/me - should create and return user on first request', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.id).toBeDefined();
    expect(data.data.email).toBeDefined();
  });

  test('PUT /api/users/me - should update user profile', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        display_name: 'Test User Updated',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.display_name).toBe('Test User Updated');
  });

  test('GET /api/users/me - should fail without auth token', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me`);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

describe('User Preferences', () => {
  test('GET /api/users/me/preferences - should return empty preferences initially', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/preferences`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.equipment_ids)).toBe(true);
    expect(Array.isArray(data.data.ingredient_ids)).toBe(true);
  });

  test('PUT /api/users/me/preferences - should update preferences', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipment_ids: [1, 2, 3],
        ingredient_ids: [10, 15, 20],
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.equipment_ids).toEqual([1, 2, 3]);
    expect(data.data.ingredient_ids).toEqual([10, 15, 20]);
  });

  test('GET /api/users/me/preferences - should return updated preferences', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/preferences`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.equipment_ids).toEqual([1, 2, 3]);
    expect(data.data.ingredient_ids).toEqual([10, 15, 20]);
  });
});

describe('Recipe Ratings', () => {
  // First, create a test recipe
  beforeAll(async () => {
    if (skipTests) return;

    // Create a test recipe directly in the database for rating tests
    const [recipe] = await db
      .insert(recipes)
      .values({
        name: 'Test Recipe for Ratings',
        description: 'A test recipe',
        moodId: 1,
      })
      .returning();

    testRecipeId = recipe.id;
  });

  test('POST /api/recipes/:id/ratings - should submit a rating', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/recipes/${testRecipeId}/ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stars: 5,
        review: 'Amazing cocktail! Love it.',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.stars).toBe(5);
    expect(data.data.review).toBe('Amazing cocktail! Love it.');

    testRatingId = data.data.id;
  });

  test('POST /api/recipes/:id/ratings - should update existing rating', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/recipes/${testRecipeId}/ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stars: 4,
        review: 'Updated review',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.stars).toBe(4);
    expect(data.data.review).toBe('Updated review');
  });

  test('POST /api/recipes/:id/ratings - should validate stars range', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/recipes/${testRecipeId}/ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stars: 6,
        review: 'Invalid rating',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('GET /api/recipes/:id/ratings - should get all ratings', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/recipes/${testRecipeId}/ratings`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.count).toBeGreaterThan(0);
  });

  test('GET /api/recipes/:id/ratings/aggregate - should get aggregate stats', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/recipes/${testRecipeId}/ratings/aggregate`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.recipe_id).toBe(testRecipeId);
    expect(data.data.total_ratings).toBeGreaterThan(0);
    expect(data.data.average_rating).toBeGreaterThan(0);
    expect(data.data.rating_distribution).toBeDefined();
  });

  test('DELETE /api/recipes/:recipeId/ratings/:ratingId - should delete own rating', async () => {
    if (skipTests) return;

    const response = await fetch(
      `${API_URL}/api/recipes/${testRecipeId}/ratings/${testRatingId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // Clean up test recipe
  afterAll(async () => {
    if (skipTests) return;

    await db
      .delete(recipes)
      .where(eq(recipes.id, testRecipeId));
  });
});

describe('User Favorites', () => {
  let favRecipeId: number;

  beforeAll(async () => {
    if (skipTests) return;

    // Create a test recipe for favorites
    const [recipe] = await db
      .insert(recipes)
      .values({
        name: 'Test Recipe for Favorites',
        description: 'A test recipe',
        moodId: 1,
      })
      .returning();

    favRecipeId = recipe.id;
  });

  test('POST /api/users/me/favorites - should add recipe to favorites', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe_id: favRecipeId,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/users/me/favorites - should get user favorites', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/favorites`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('DELETE /api/users/me/favorites/:recipeId - should remove from favorites', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/favorites/${favRecipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  afterAll(async () => {
    if (skipTests) return;

    await db
      .delete(recipes)
      .where(eq(recipes.id, favRecipeId));
  });
});

describe('User Recipes', () => {
  test('GET /api/users/me/recipes - should get user recipes (empty initially)', async () => {
    if (skipTests) return;

    const response = await fetch(`${API_URL}/api/users/me/recipes`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
