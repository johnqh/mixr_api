We want to have a set of endpoints to help people to mix cocktails. The idea is that the user would provide a list of equipments and ingredients, and we will provide a recipe using what he already have.
1. We need a global table of equipment. Each equipment has an id, subcategory, name, and icon.
2. First equpment category is "essential", such as "Cocktail Shaker", or "Muddler".
3. Second equipment category is "glassware", such as "Beer mug", "Wine glass".
4. Third equipment cateogry is "garnish", such as "Sharp knife", or "Vegetable peeler"
5. Fourth equipment category is "advanced", such as "Ice crusher", or "Citrus juicer"
User then pick ingredients. 
1. That means we need a global table to provide a list of ingredients. Each ingredient has an id,subcategory, name and icon
2. First ingredient subcategory is "spirit", such as "Jin" or "Brandy".
3. Second ingredient subcategory is "wine", such as "Red Wine" or "Champagne".
4. Third ingredient subcategory is "other_alcohol", such as "Beer" or "Sake".
5. Fourth ingredient subcategory is "fruit", such as "Line" or "Orange".
6. Fifth ingredient subcategory is "spice", such as "Mint" or "Basil".
7. Sixth ingredient subcategory is "other", such as "Apple Juice" or "Ice"
User then pick a mood. 
1. That means we need a global table to provide a list of moods. Each mood has an id, name and a image name
2. Mood examples are "Happy" or "Serious".
Finally, the user would call a endpoint to get cocktail recipe. He would provide a list of equipment id, list of ingredient id, and a mood id. The output is a recipe, which contains
1. List of ingredient id, and amount (in text)
2. List of steps to make the cocktail

Seed data:
##Equipment:##
essential:
Cocktail shaker
Jigger (measuring tool)
Bar spoon
Strainer
Muddler

glassware:
Rocks glass (old fashioned)
Highball glass
Martini glass
Coupe glass
Wine glass
Shot glass
Beer mug
Champagne flute

garmish:
Sharp knife
Cutting board
Vegetable peeler
Cocktail picks
Zester/grater

advanced:
Fine mesh strainer
Citrus juicer
Mortar and pestle
Ice crusher
Bottle opener
Corkscrew
Mixing glass
Bar towel

##Ingredient##
spirits:
Vodka
Gin
Rum (White)
Rum (Dark)
Rum (Spiced)
Whiskey
Bourbon
Scotch
Tequila (Blanco)
Tequila (Reposado)
Brandy
Cognac
Mezcal
Rye Whiskey

wine:
White Wine
Red Wine
Rosé Wine
Champagne
Prosecco
Sparkling Wine
Port Wine
Sherry
Vermouth (Dry)
Vermouth (Sweet)

other_alcohol:
Beer (ight)
Beer (IPA)
Beer (Stout)
Sake
Absinthe
Amaretto
Baileys
Kahlúa
Grand Marnier
Cointreau
Triple Sec
Sambuca
Jägermeister

fruit:
Lemon
Lime
Orange
Grapefruit
Cranberry
Pineapple
Apple
Pear
Strawberry
Blackberry
Raspberry
Blueberry
Cherry
Peach
Watermelon
Mango
Coconut

spice:
Mint
Basil
Rosemary
Thyme
Cilantro
Cinnamon
Nutmeg
Vanilla
Ginger
Cardamom
Star Anise
Cloves
Black Pepper
Salt
Sugar

other:
Simple Syrup
Grenadine
Angostura Bitters
Orange Bitters
Worcestershire Sauce
Tabasco
Tomato Juice
Cranberry Juice
Orange Juice
Apple Juice
Pineapple Juice
Ginger Beer
Club Soda
Tonic Water
Sprite/7UP
Cola
Ice
Honey
Maple Syrup
Agave Nectar
Egg White
Heavy Cream

##Mood##
😊
Happy
Bright, refreshing cocktails perfect for celebrations
Example drinks:
Mojito, Piña Colada, Daiquiri

🧐
Serious
Strong, sophisticated drinks for focused moments
Example drinks:
Manhattan, Old Fashioned, Whiskey Neat

🎉
Lighthearted
Fun, colorful cocktails that bring smiles
Example drinks:
Cosmopolitan, Sex on the Beach, Blue Hawaiian

😤
Tense
Calming, smooth drinks to help you unwind
Example drinks:
Whiskey Sour, Dark 'n' Stormy, Negroni

💕
Romantic
Elegant, intimate cocktails perfect for two
Example drinks:
French 75, Champagne Cocktail, Rose Martini

🌟
Adventurous
Bold, experimental drinks with unique flavors
Example drinks:
Mezcal Margarita, Smoky Manhattan, Spiced Rum Punch

📸
Nostalgic
Classic cocktails with timeless appeal
Example drinks:
Mint Julep, Sidecar, Aviation

⚡
Energetic
Caffeinated or stimulating drinks for energy
Example drinks:
Espresso Martini, Irish Coffee, Red Bull Cocktail