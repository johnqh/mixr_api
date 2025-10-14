import { db } from './index';
import { equipment, ingredients, moods } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed Equipment
    console.log('📦 Seeding equipment...');
    await db.insert(equipment).values([
      // Essential
      { subcategory: 'essential', name: 'Cocktail shaker', icon: '🍸' },
      { subcategory: 'essential', name: 'Jigger (measuring tool)', icon: '📏' },
      { subcategory: 'essential', name: 'Bar spoon', icon: '🥄' },
      { subcategory: 'essential', name: 'Strainer', icon: '🔍' },
      { subcategory: 'essential', name: 'Muddler', icon: '🔨' },

      // Glassware
      { subcategory: 'glassware', name: 'Rocks glass (old fashioned)', icon: '🥃' },
      { subcategory: 'glassware', name: 'Highball glass', icon: '🍹' },
      { subcategory: 'glassware', name: 'Martini glass', icon: '🍸' },
      { subcategory: 'glassware', name: 'Coupe glass', icon: '🥂' },
      { subcategory: 'glassware', name: 'Wine glass', icon: '🍷' },
      { subcategory: 'glassware', name: 'Shot glass', icon: '🥃' },
      { subcategory: 'glassware', name: 'Beer mug', icon: '🍺' },
      { subcategory: 'glassware', name: 'Champagne flute', icon: '🥂' },

      // Garnish
      { subcategory: 'garnish', name: 'Sharp knife', icon: '🔪' },
      { subcategory: 'garnish', name: 'Cutting board', icon: '📋' },
      { subcategory: 'garnish', name: 'Vegetable peeler', icon: '🥕' },
      { subcategory: 'garnish', name: 'Cocktail picks', icon: '🗡️' },
      { subcategory: 'garnish', name: 'Zester/grater', icon: '🧀' },

      // Advanced
      { subcategory: 'advanced', name: 'Fine mesh strainer', icon: '🔍' },
      { subcategory: 'advanced', name: 'Citrus juicer', icon: '🍋' },
      { subcategory: 'advanced', name: 'Mortar and pestle', icon: '🥣' },
      { subcategory: 'advanced', name: 'Ice crusher', icon: '🧊' },
      { subcategory: 'advanced', name: 'Bottle opener', icon: '🍾' },
      { subcategory: 'advanced', name: 'Corkscrew', icon: '🍷' },
      { subcategory: 'advanced', name: 'Mixing glass', icon: '🥃' },
      { subcategory: 'advanced', name: 'Bar towel', icon: '🧻' },
    ]);
    console.log('✅ Equipment seeded');

    // Seed Ingredients
    console.log('🥃 Seeding ingredients...');
    await db.insert(ingredients).values([
      // Spirits
      { subcategory: 'spirit', name: 'Vodka', icon: '🍸' },
      { subcategory: 'spirit', name: 'Gin', icon: '🍸' },
      { subcategory: 'spirit', name: 'Rum (White)', icon: '🥃' },
      { subcategory: 'spirit', name: 'Rum (Dark)', icon: '🥃' },
      { subcategory: 'spirit', name: 'Rum (Spiced)', icon: '🥃' },
      { subcategory: 'spirit', name: 'Whiskey', icon: '🥃' },
      { subcategory: 'spirit', name: 'Bourbon', icon: '🥃' },
      { subcategory: 'spirit', name: 'Scotch', icon: '🥃' },
      { subcategory: 'spirit', name: 'Tequila (Blanco)', icon: '🍹' },
      { subcategory: 'spirit', name: 'Tequila (Reposado)', icon: '🍹' },
      { subcategory: 'spirit', name: 'Brandy', icon: '🥃' },
      { subcategory: 'spirit', name: 'Cognac', icon: '🥃' },
      { subcategory: 'spirit', name: 'Mezcal', icon: '🍹' },
      { subcategory: 'spirit', name: 'Rye Whiskey', icon: '🥃' },

      // Wine
      { subcategory: 'wine', name: 'White Wine', icon: '🍷' },
      { subcategory: 'wine', name: 'Red Wine', icon: '🍷' },
      { subcategory: 'wine', name: 'Rosé Wine', icon: '🍷' },
      { subcategory: 'wine', name: 'Champagne', icon: '🥂' },
      { subcategory: 'wine', name: 'Prosecco', icon: '🥂' },
      { subcategory: 'wine', name: 'Sparkling Wine', icon: '🥂' },
      { subcategory: 'wine', name: 'Port Wine', icon: '🍷' },
      { subcategory: 'wine', name: 'Sherry', icon: '🍷' },
      { subcategory: 'wine', name: 'Vermouth (Dry)', icon: '🍷' },
      { subcategory: 'wine', name: 'Vermouth (Sweet)', icon: '🍷' },

      // Other Alcohol
      { subcategory: 'other_alcohol', name: 'Beer (Light)', icon: '🍺' },
      { subcategory: 'other_alcohol', name: 'Beer (IPA)', icon: '🍺' },
      { subcategory: 'other_alcohol', name: 'Beer (Stout)', icon: '🍺' },
      { subcategory: 'other_alcohol', name: 'Sake', icon: '🍶' },
      { subcategory: 'other_alcohol', name: 'Absinthe', icon: '🍸' },
      { subcategory: 'other_alcohol', name: 'Amaretto', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Baileys', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Kahlúa', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Grand Marnier', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Cointreau', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Triple Sec', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Sambuca', icon: '🥃' },
      { subcategory: 'other_alcohol', name: 'Jägermeister', icon: '🥃' },

      // Fruit
      { subcategory: 'fruit', name: 'Lemon', icon: '🍋' },
      { subcategory: 'fruit', name: 'Lime', icon: '🍋' },
      { subcategory: 'fruit', name: 'Orange', icon: '🍊' },
      { subcategory: 'fruit', name: 'Grapefruit', icon: '🍊' },
      { subcategory: 'fruit', name: 'Cranberry', icon: '🫐' },
      { subcategory: 'fruit', name: 'Pineapple', icon: '🍍' },
      { subcategory: 'fruit', name: 'Apple', icon: '🍎' },
      { subcategory: 'fruit', name: 'Pear', icon: '🍐' },
      { subcategory: 'fruit', name: 'Strawberry', icon: '🍓' },
      { subcategory: 'fruit', name: 'Blackberry', icon: '🫐' },
      { subcategory: 'fruit', name: 'Raspberry', icon: '🫐' },
      { subcategory: 'fruit', name: 'Blueberry', icon: '🫐' },
      { subcategory: 'fruit', name: 'Cherry', icon: '🍒' },
      { subcategory: 'fruit', name: 'Peach', icon: '🍑' },
      { subcategory: 'fruit', name: 'Watermelon', icon: '🍉' },
      { subcategory: 'fruit', name: 'Mango', icon: '🥭' },
      { subcategory: 'fruit', name: 'Coconut', icon: '🥥' },

      // Spice
      { subcategory: 'spice', name: 'Mint', icon: '🌿' },
      { subcategory: 'spice', name: 'Basil', icon: '🌿' },
      { subcategory: 'spice', name: 'Rosemary', icon: '🌿' },
      { subcategory: 'spice', name: 'Thyme', icon: '🌿' },
      { subcategory: 'spice', name: 'Cilantro', icon: '🌿' },
      { subcategory: 'spice', name: 'Cinnamon', icon: '🌰' },
      { subcategory: 'spice', name: 'Nutmeg', icon: '🌰' },
      { subcategory: 'spice', name: 'Vanilla', icon: '🌰' },
      { subcategory: 'spice', name: 'Ginger', icon: '🫚' },
      { subcategory: 'spice', name: 'Cardamom', icon: '🌰' },
      { subcategory: 'spice', name: 'Star Anise', icon: '⭐' },
      { subcategory: 'spice', name: 'Cloves', icon: '🌰' },
      { subcategory: 'spice', name: 'Black Pepper', icon: '🌰' },
      { subcategory: 'spice', name: 'Salt', icon: '🧂' },
      { subcategory: 'spice', name: 'Sugar', icon: '🍬' },

      // Other
      { subcategory: 'other', name: 'Simple Syrup', icon: '🍯' },
      { subcategory: 'other', name: 'Grenadine', icon: '🍷' },
      { subcategory: 'other', name: 'Angostura Bitters', icon: '💧' },
      { subcategory: 'other', name: 'Orange Bitters', icon: '💧' },
      { subcategory: 'other', name: 'Worcestershire Sauce', icon: '🧴' },
      { subcategory: 'other', name: 'Tabasco', icon: '🌶️' },
      { subcategory: 'other', name: 'Tomato Juice', icon: '🍅' },
      { subcategory: 'other', name: 'Cranberry Juice', icon: '🧃' },
      { subcategory: 'other', name: 'Orange Juice', icon: '🧃' },
      { subcategory: 'other', name: 'Apple Juice', icon: '🧃' },
      { subcategory: 'other', name: 'Pineapple Juice', icon: '🧃' },
      { subcategory: 'other', name: 'Ginger Beer', icon: '🍺' },
      { subcategory: 'other', name: 'Club Soda', icon: '💧' },
      { subcategory: 'other', name: 'Tonic Water', icon: '💧' },
      { subcategory: 'other', name: 'Sprite/7UP', icon: '🥤' },
      { subcategory: 'other', name: 'Cola', icon: '🥤' },
      { subcategory: 'other', name: 'Ice', icon: '🧊' },
      { subcategory: 'other', name: 'Honey', icon: '🍯' },
      { subcategory: 'other', name: 'Maple Syrup', icon: '🍯' },
      { subcategory: 'other', name: 'Agave Nectar', icon: '🍯' },
      { subcategory: 'other', name: 'Egg White', icon: '🥚' },
      { subcategory: 'other', name: 'Heavy Cream', icon: '🥛' },
    ]);
    console.log('✅ Ingredients seeded');

    // Seed Moods
    console.log('😊 Seeding moods...');
    await db.insert(moods).values([
      {
        emoji: '😊',
        name: 'Happy',
        description: 'Bright, refreshing cocktails perfect for celebrations',
        exampleDrinks: 'Mojito, Piña Colada, Daiquiri',
        imageName: 'happy.jpg',
      },
      {
        emoji: '🧐',
        name: 'Serious',
        description: 'Strong, sophisticated drinks for focused moments',
        exampleDrinks: 'Manhattan, Old Fashioned, Whiskey Neat',
        imageName: 'serious.jpg',
      },
      {
        emoji: '🎉',
        name: 'Lighthearted',
        description: 'Fun, colorful cocktails that bring smiles',
        exampleDrinks: 'Cosmopolitan, Sex on the Beach, Blue Hawaiian',
        imageName: 'lighthearted.jpg',
      },
      {
        emoji: '😤',
        name: 'Tense',
        description: 'Calming, smooth drinks to help you unwind',
        exampleDrinks: 'Whiskey Sour, Dark \'n\' Stormy, Negroni',
        imageName: 'tense.jpg',
      },
      {
        emoji: '💕',
        name: 'Romantic',
        description: 'Elegant, intimate cocktails perfect for two',
        exampleDrinks: 'French 75, Champagne Cocktail, Rose Martini',
        imageName: 'romantic.jpg',
      },
      {
        emoji: '🌟',
        name: 'Adventurous',
        description: 'Bold, experimental drinks with unique flavors',
        exampleDrinks: 'Mezcal Margarita, Smoky Manhattan, Spiced Rum Punch',
        imageName: 'adventurous.jpg',
      },
      {
        emoji: '📸',
        name: 'Nostalgic',
        description: 'Classic cocktails with timeless appeal',
        exampleDrinks: 'Mint Julep, Sidecar, Aviation',
        imageName: 'nostalgic.jpg',
      },
      {
        emoji: '⚡',
        name: 'Energetic',
        description: 'Caffeinated or stimulating drinks for energy',
        exampleDrinks: 'Espresso Martini, Irish Coffee, Red Bull Cocktail',
        imageName: 'energetic.jpg',
      },
    ]);
    console.log('✅ Moods seeded');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
