import { test, expect, beforeAll, afterAll } from 'bun:test';
import { db, equipment, ingredients, moods } from './db';
import { eq, inArray } from 'drizzle-orm';

const API_URL = 'http://localhost:6174';

// Helper to wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  console.log('⏳ Waiting for server to be ready...');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      await Bun.sleep(1000);
    }
  }
  throw new Error('Server did not start in time');
}

// Test data IDs (will be populated from database)
let testEquipmentIds: number[] = [];
let testIngredientIds: number[] = [];
let testMoodId: number;

// Track inserted test data for cleanup
let insertedTestData = {
  equipmentIds: [] as number[],
  ingredientIds: [] as number[],
  moodIds: [] as number[],
};

beforeAll(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       🧪 MIXR API Integration Test Suite                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Wait for server to be available
  await waitForServer();

  console.log('📊 Populating database with test data...\n');

  try {
    // Insert test equipment
    console.log('🔧 Inserting test equipment...');
    const equipmentResult = await db
      .insert(equipment)
      .values([
        { subcategory: 'essential', name: 'Test Cocktail Shaker', icon: '🍸' },
        { subcategory: 'essential', name: 'Test Bar Spoon', icon: '🥄' },
        { subcategory: 'glassware', name: 'Test Highball Glass', icon: '🍹' },
      ])
      .returning();

    insertedTestData.equipmentIds = equipmentResult.map(e => e.id);
    testEquipmentIds = insertedTestData.equipmentIds;
    console.log(`  ✓ Inserted ${equipmentResult.length} equipment items:`);
    equipmentResult.forEach(e =>
      console.log(`    - ${e.icon} ${e.name} (ID: ${e.id})`)
    );

    // Insert test ingredients
    console.log('\n🥃 Inserting test ingredients...');
    const ingredientResult = await db
      .insert(ingredients)
      .values([
        { subcategory: 'spirit', name: 'Test Vodka', icon: '🍸' },
        { subcategory: 'fruit', name: 'Test Lime', icon: '🍋' },
        { subcategory: 'other', name: 'Test Simple Syrup', icon: '🍯' },
        { subcategory: 'other', name: 'Test Club Soda', icon: '💧' },
        { subcategory: 'spice', name: 'Test Mint', icon: '🌿' },
      ])
      .returning();

    insertedTestData.ingredientIds = ingredientResult.map(i => i.id);
    testIngredientIds = insertedTestData.ingredientIds;
    console.log(`  ✓ Inserted ${ingredientResult.length} ingredients:`);
    ingredientResult.forEach(i =>
      console.log(`    - ${i.icon} ${i.name} (ID: ${i.id})`)
    );

    // Insert test mood
    console.log('\n😊 Inserting test mood...');
    const moodResult = await db
      .insert(moods)
      .values([
        {
          emoji: '🧪',
          name: 'Test Happy Mood',
          description: 'A test mood for integration testing',
          exampleDrinks: 'Test Mojito, Test Margarita',
          imageName: 'test-happy.jpg',
        },
      ])
      .returning();

    insertedTestData.moodIds = moodResult.map(m => m.id);
    testMoodId = moodResult[0].id;
    console.log(
      `  ✓ Inserted mood: ${moodResult[0].emoji} ${moodResult[0].name} (ID: ${moodResult[0].id})`
    );

    console.log('\n✅ Test data population complete!\n');
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );
  } catch (error) {
    console.error('❌ Failed to populate test data:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Clean up test equipment
    if (insertedTestData.equipmentIds.length > 0) {
      console.log(
        `🔧 Removing ${insertedTestData.equipmentIds.length} test equipment items...`
      );
      await db
        .delete(equipment)
        .where(inArray(equipment.id, insertedTestData.equipmentIds));
      console.log('  ✓ Test equipment removed');
    }

    // Clean up test ingredients
    if (insertedTestData.ingredientIds.length > 0) {
      console.log(
        `🥃 Removing ${insertedTestData.ingredientIds.length} test ingredients...`
      );
      await db
        .delete(ingredients)
        .where(inArray(ingredients.id, insertedTestData.ingredientIds));
      console.log('  ✓ Test ingredients removed');
    }

    // Clean up test moods
    if (insertedTestData.moodIds.length > 0) {
      console.log(
        `😊 Removing ${insertedTestData.moodIds.length} test moods...`
      );
      await db.delete(moods).where(inArray(moods.id, insertedTestData.moodIds));
      console.log('  ✓ Test moods removed');
    }

    console.log('\n✅ Test cleanup complete!\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       🎉 All Tests Complete!                             ║');
    console.log(
      '╚══════════════════════════════════════════════════════════╝\n'
    );
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error);
  }
});

test('GET /health - should return healthy status', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🏥 TEST: Health Endpoint                                │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log(`📤 Request: GET ${API_URL}/health`);

  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();

  console.log(`📥 Response Status: ${response.status}`);
  console.log(`📥 Response Body:`, JSON.stringify(data, null, 2));

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.status).toBe('healthy');

  console.log('✅ Health check passed!\n');
});

test('GET /api/equipment - should return equipment list', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🔧 TEST: Equipment List Endpoint                        │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log(`📤 Request: GET ${API_URL}/api/equipment`);

  const response = await fetch(`${API_URL}/api/equipment`);
  const data = await response.json();

  console.log(`📥 Response Status: ${response.status}`);
  console.log(`📥 Found ${data.data?.length || 0} total equipment items`);
  console.log(`📥 Our test equipment IDs: [${testEquipmentIds.join(', ')}]`);

  const ourTestItems = data.data.filter((item: any) =>
    testEquipmentIds.includes(item.id)
  );
  console.log(
    `📥 Found ${ourTestItems.length} of our test equipment items in response`
  );
  ourTestItems.forEach((item: any) => {
    console.log(`    - ${item.icon} ${item.name} (ID: ${item.id})`);
  });

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);

  console.log('✅ Equipment endpoint passed!\n');
});

test('GET /api/ingredients - should return ingredients list', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🥃 TEST: Ingredients List Endpoint                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log(`📤 Request: GET ${API_URL}/api/ingredients`);

  const response = await fetch(`${API_URL}/api/ingredients`);
  const data = await response.json();

  console.log(`📥 Response Status: ${response.status}`);
  console.log(`📥 Found ${data.data?.length || 0} total ingredients`);
  console.log(`📥 Our test ingredient IDs: [${testIngredientIds.join(', ')}]`);

  const ourTestItems = data.data.filter((item: any) =>
    testIngredientIds.includes(item.id)
  );
  console.log(
    `📥 Found ${ourTestItems.length} of our test ingredients in response`
  );
  ourTestItems.forEach((item: any) => {
    console.log(`    - ${item.icon} ${item.name} (ID: ${item.id})`);
  });

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);

  console.log('✅ Ingredients endpoint passed!\n');
});

test('GET /api/moods - should return moods list', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 😊 TEST: Moods List Endpoint                            │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log(`📤 Request: GET ${API_URL}/api/moods`);

  const response = await fetch(`${API_URL}/api/moods`);
  const data = await response.json();

  console.log(`📥 Response Status: ${response.status}`);
  console.log(`📥 Found ${data.data?.length || 0} total moods`);
  console.log(`📥 Our test mood ID: ${testMoodId}`);

  const ourTestMood = data.data.find((item: any) => item.id === testMoodId);
  if (ourTestMood) {
    console.log(
      `📥 Found our test mood: ${ourTestMood.emoji} ${ourTestMood.name} (ID: ${ourTestMood.id})`
    );
  }

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);

  console.log('✅ Moods endpoint passed!\n');
});

test('POST /api/recipes/generate - should generate a cocktail recipe', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🍸 TEST: Recipe Generation (AI Integration)             │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('📋 Using test data:');
  console.log(`  - Equipment IDs: [${testEquipmentIds.join(', ')}]`);
  console.log(`  - Ingredient IDs: [${testIngredientIds.join(', ')}]`);
  console.log(`  - Mood ID: ${testMoodId}`);

  const requestBody = {
    equipment_ids: testEquipmentIds,
    ingredient_ids: testIngredientIds,
    mood_id: testMoodId,
  };

  console.log(`\n📤 Request: POST ${API_URL}/api/recipes/generate`);
  console.log(`📤 Body: ${JSON.stringify(requestBody, null, 2)}`);
  console.log(
    '\n⏳ Sending request to OpenAI API... (this may take a few seconds)'
  );

  const startTime = Date.now();
  const response = await fetch(`${API_URL}/api/recipes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const endTime = Date.now();

  const data = await response.json();

  console.log(`\n📥 Response received in ${endTime - startTime}ms`);
  console.log(`📥 Response Status: ${response.status}`);

  if (!data.success) {
    console.error('❌ Error:', data.error);
  }

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.data).toBeDefined();

  const recipe = data.data;

  console.log('\n🎉 ═════════════ GENERATED RECIPE ═════════════');
  console.log(`   Name: ${recipe.name}`);
  console.log(`   Description: ${recipe.description}`);
  console.log(
    `   Mood: ${recipe.mood?.name || 'N/A'} ${recipe.mood?.emoji || ''}`
  );
  console.log('\n   📝 Ingredients:');
  recipe.ingredients?.forEach((ing: any, idx: number) => {
    console.log(`      ${idx + 1}. ${ing.amount} ${ing.name}`);
  });
  console.log('\n   🔄 Steps:');
  recipe.steps?.forEach((step: string, idx: number) => {
    console.log(`      ${idx + 1}. ${step}`);
  });
  console.log('\n   🔧 Equipment:');
  recipe.equipment?.forEach((eq: any) => {
    console.log(`      - ${eq.name}`);
  });
  console.log('═══════════════════════════════════════════════\n');

  // Validate recipe structure
  expect(recipe.name).toBeDefined();
  expect(typeof recipe.name).toBe('string');
  expect(recipe.description).toBeDefined();
  expect(Array.isArray(recipe.ingredients)).toBe(true);
  expect(recipe.ingredients.length).toBeGreaterThan(0);
  expect(Array.isArray(recipe.steps)).toBe(true);
  expect(recipe.steps.length).toBeGreaterThan(0);

  // Validate ingredients have amounts
  recipe.ingredients.forEach((ing: any) => {
    expect(ing.name).toBeDefined();
    expect(ing.amount).toBeDefined();
  });

  console.log('✅ Recipe generation test passed!\n');
});

test('GET /api/recipes - should return recipes list', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 📚 TEST: Recipes List Endpoint                          │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log(`📤 Request: GET ${API_URL}/api/recipes`);

  const response = await fetch(`${API_URL}/api/recipes`);
  const data = await response.json();

  console.log(`📥 Response Status: ${response.status}`);
  console.log(`📥 Found ${data.count || 0} total recipes`);

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.data)).toBe(true);

  if (data.data.length > 0) {
    console.log(`📥 Latest recipe: "${data.data[0].name}"`);
    console.log(
      `   - Description: ${data.data[0].description?.substring(0, 80)}...`
    );
    console.log(`   - Mood: ${data.data[0].mood?.name || 'N/A'}`);
  }

  console.log('✅ Recipes list endpoint passed!\n');
});

test('POST /api/recipes/generate - should handle invalid input', async () => {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ ⚠️  TEST: Error Handling (Invalid Input)                │');
  console.log('└─────────────────────────────────────────────────────────┘');

  const invalidBody = {
    equipment_ids: [],
    ingredient_ids: [],
    mood_id: 999999,
  };

  console.log(`📤 Request: POST ${API_URL}/api/recipes/generate`);
  console.log(`📤 Body (invalid): ${JSON.stringify(invalidBody, null, 2)}`);

  const response = await fetch(`${API_URL}/api/recipes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invalidBody),
  });

  const data = await response.json();

  console.log(`📥 Response Status: ${response.status} (expected 400)`);
  console.log(`📥 Error message: "${data.error}"`);

  expect(response.status).toBe(400);
  expect(data.success).toBe(false);
  expect(data.error).toBeDefined();

  console.log('✅ Error handling test passed!\n');
});
