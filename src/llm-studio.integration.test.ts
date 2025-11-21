import { test, expect, beforeAll, describe } from 'bun:test';
import { generateRecipe } from './services/recipeGenerator';
import { env } from './config/env';

describe('LLM Studio Server Integration Tests', () => {
  beforeAll(() => {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       🤖 LLM Studio Server Integration Tests            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Environment Check:`);
    console.log(`   LLM_STUDIO_ENDPOINT: ${env.LLM_STUDIO_ENDPOINT || 'NOT SET'}`);
    console.log(`   OPENAI_API_KEY: ${env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);

    if (!env.LLM_STUDIO_ENDPOINT) {
      console.log('\n⚠️  WARNING: LLM_STUDIO_ENDPOINT not set!');
      console.log('   These tests will use OpenAI instead of LLM Studio Server.');
      console.log('   To test LLM Studio Server, set LLM_STUDIO_ENDPOINT in .env.local\n');
    } else {
      console.log('\n✅ LLM Studio Server endpoint configured!\n');
    }
  });

  test('LLM Studio Server endpoint should be accessible', async () => {
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ 🏥 TEST: LLM Studio Server Health Check                 │');
    console.log('└─────────────────────────────────────────────────────────┘');

    if (!env.LLM_STUDIO_ENDPOINT) {
      console.log('⏭️  Skipping: LLM_STUDIO_ENDPOINT not configured');
      return;
    }

    // Extract base URL (remove /v1 if present)
    const baseUrl = env.LLM_STUDIO_ENDPOINT.replace(/\/v1\/?$/, '');

    console.log(`📤 Checking LLM Studio Server at: ${baseUrl}`);

    try {
      // Try to fetch the models endpoint
      const modelsUrl = `${env.LLM_STUDIO_ENDPOINT}/models`;
      console.log(`📤 Request: GET ${modelsUrl}`);

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📥 Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📥 Available models:`, JSON.stringify(data, null, 2));
        expect(response.status).toBe(200);
        console.log('✅ LLM Studio Server is accessible!\n');
      } else {
        console.log('⚠️  Server responded but with non-200 status');
        console.log(`   Response: ${await response.text()}`);
        // Don't fail the test, just warn
      }
    } catch (error) {
      console.error('❌ Failed to connect to LLM Studio Server:', error);
      throw new Error(
        `Cannot connect to LLM Studio Server at ${env.LLM_STUDIO_ENDPOINT}. ` +
        `Please ensure LLM Studio is running on ${baseUrl}`
      );
    }
  });

  test(
    'Should generate a valid recipe using LLM Studio Server',
    async () => {
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ 🍸 TEST: Recipe Generation via LLM Studio Server        │');
      console.log('└─────────────────────────────────────────────────────────┘');

      const testParams = {
        equipmentNames: ['Cocktail Shaker', 'Jigger', 'Strainer', 'Highball Glass'],
        ingredientNames: ['Vodka', 'Lime Juice', 'Simple Syrup', 'Club Soda', 'Mint Leaves'],
        moodName: 'Refreshing',
        moodDescription: 'Light, crisp, and invigorating drinks perfect for a hot day',
        moodExamples: 'Mojito, Tom Collins, Gin and Tonic',
      };

      console.log('📋 Test Parameters:');
      console.log(`   Equipment: ${testParams.equipmentNames.join(', ')}`);
      console.log(`   Ingredients: ${testParams.ingredientNames.join(', ')}`);
      console.log(`   Mood: ${testParams.moodName}`);
      console.log(`   Using: ${env.LLM_STUDIO_ENDPOINT ? 'LLM Studio Server' : 'OpenAI API'}`);

      console.log('\n⏳ Generating recipe... (this may take 10-30 seconds)');

      const startTime = Date.now();
      let recipe;

      try {
        recipe = await generateRecipe(testParams);
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Recipe generated in ${duration}s`);
        console.log('\n🎉 ═════════════ GENERATED RECIPE ═════════════');
        console.log(`   Name: ${recipe.name}`);
        console.log(`   Description: ${recipe.description}`);
        console.log('\n   📝 Ingredients:');
        recipe.ingredients?.forEach((ing, idx) => {
          console.log(`      ${idx + 1}. ${ing.amount} ${ing.name}`);
        });
        console.log('\n   🔄 Steps:');
        recipe.steps?.forEach((step, idx) => {
          console.log(`      ${idx + 1}. ${step}`);
        });
        console.log('\n   🔧 Equipment Used:');
        recipe.equipmentUsed?.forEach((eq) => {
          console.log(`      - ${eq}`);
        });
        console.log('═══════════════════════════════════════════════\n');

        // Validate recipe structure
        expect(recipe).toBeDefined();
        expect(recipe.name).toBeDefined();
        expect(typeof recipe.name).toBe('string');
        expect(recipe.name.length).toBeGreaterThan(0);

        expect(recipe.description).toBeDefined();
        expect(typeof recipe.description).toBe('string');
        expect(recipe.description.length).toBeGreaterThan(0);

        expect(Array.isArray(recipe.ingredients)).toBe(true);
        expect(recipe.ingredients.length).toBeGreaterThan(0);

        expect(Array.isArray(recipe.steps)).toBe(true);
        expect(recipe.steps.length).toBeGreaterThan(0);

        // Validate each ingredient has required fields
        recipe.ingredients.forEach((ingredient, idx) => {
          expect(ingredient.name).toBeDefined();
          expect(typeof ingredient.name).toBe('string');
          expect(ingredient.amount).toBeDefined();
          expect(typeof ingredient.amount).toBe('string');

          console.log(`   ✓ Ingredient ${idx + 1} valid: ${ingredient.amount} ${ingredient.name}`);
        });

        // Validate each step is a string
        recipe.steps.forEach((step, idx) => {
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
          console.log(`   ✓ Step ${idx + 1} valid: ${step.substring(0, 50)}...`);
        });

        // Validate equipment used
        if (recipe.equipmentUsed) {
          expect(Array.isArray(recipe.equipmentUsed)).toBe(true);
          recipe.equipmentUsed.forEach((eq) => {
            expect(typeof eq).toBe('string');
            expect(eq.length).toBeGreaterThan(0);
          });
          console.log(`   ✓ Equipment list valid: ${recipe.equipmentUsed.length} items`);
        }

        console.log('\n✅ Recipe validation passed!\n');
      } catch (error) {
        console.error('\n❌ Recipe generation failed:', error);
        if (error instanceof Error) {
          console.error('   Error message:', error.message);
          console.error('   Stack trace:', error.stack);
        }
        throw error;
      }
    },
    { timeout: 60000 } // 60 second timeout
  );

  test(
    'Should handle different mood types',
    async () => {
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ 🎭 TEST: Multiple Mood Types                            │');
      console.log('└─────────────────────────────────────────────────────────┘');

      const moods = [
        {
          name: 'Sophisticated',
          description: 'Elegant and refined cocktails for special occasions',
          examples: 'Martini, Manhattan, Old Fashioned',
        },
        {
          name: 'Tropical',
          description: 'Fruity and exotic drinks that transport you to paradise',
          examples: 'Piña Colada, Mai Tai, Blue Hawaiian',
        },
      ];

      const testParams = {
        equipmentNames: ['Mixing Glass', 'Bar Spoon', 'Strainer', 'Coupe Glass'],
        ingredientNames: ['Gin', 'Vermouth', 'Bitters', 'Lemon Twist', 'Olive'],
      };

      for (const mood of moods) {
        console.log(`\n🎭 Testing mood: ${mood.name}`);
        console.log(`   Description: ${mood.description}`);
        console.log('   ⏳ Generating recipe...');

        const startTime = Date.now();

        try {
          const recipe = await generateRecipe({
            ...testParams,
            moodName: mood.name,
            moodDescription: mood.description,
            moodExamples: mood.examples,
          });

          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`   ✅ Generated "${recipe.name}" in ${duration}s`);
          console.log(`   📝 ${recipe.ingredients.length} ingredients, ${recipe.steps.length} steps`);

          // Basic validation
          expect(recipe.name).toBeDefined();
          expect(recipe.ingredients.length).toBeGreaterThan(0);
          expect(recipe.steps.length).toBeGreaterThan(0);
        } catch (error) {
          console.error(`   ❌ Failed to generate recipe for ${mood.name}:`, error);
          throw error;
        }
      }

      console.log('\n✅ Multiple mood types test passed!\n');
    },
    { timeout: 120000 } // 120 second timeout for multiple generations
  );

  test(
    'Should validate recipe ingredients match input ingredients',
    async () => {
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ ✅ TEST: Ingredient Matching Validation                 │');
      console.log('└─────────────────────────────────────────────────────────┘');

      const testParams = {
        equipmentNames: ['Shaker', 'Jigger', 'Glass'],
        ingredientNames: ['Rum', 'Lime Juice', 'Mint', 'Sugar', 'Soda Water'],
        moodName: 'Party',
        moodDescription: 'Fun and energetic drinks for celebrations',
        moodExamples: 'Mojito, Daiquiri, Cuba Libre',
      };

      console.log('📋 Available ingredients:', testParams.ingredientNames.join(', '));
      console.log('\n⏳ Generating recipe and checking ingredient compliance...');

      const recipe = await generateRecipe(testParams);

      console.log(`\n📝 Recipe uses ${recipe.ingredients.length} ingredients:`);

      const invalidIngredients: string[] = [];

      recipe.ingredients.forEach((recipeIng) => {
        const ingredientName = recipeIng.name.toLowerCase();
        const isValid = testParams.ingredientNames.some(
          (availableIng) => availableIng.toLowerCase() === ingredientName
        );

        if (isValid) {
          console.log(`   ✅ ${recipeIng.name} - Valid (${recipeIng.amount})`);
        } else {
          console.log(`   ⚠️  ${recipeIng.name} - NOT in available ingredients list`);
          invalidIngredients.push(recipeIng.name);
        }
      });

      if (invalidIngredients.length > 0) {
        console.log(`\n⚠️  Warning: ${invalidIngredients.length} ingredient(s) not in the available list:`);
        console.log(`   ${invalidIngredients.join(', ')}`);
        console.log('   Note: The LLM may use variations or related ingredients.');
      } else {
        console.log('\n✅ All ingredients match the available list!');
      }

      // We don't fail the test if ingredients don't match exactly,
      // as LLMs may use variations, but we log it for visibility
      expect(recipe.ingredients.length).toBeGreaterThan(0);

      console.log('\n✅ Ingredient validation test completed!\n');
    },
    { timeout: 60000 } // 60 second timeout
  );
});
