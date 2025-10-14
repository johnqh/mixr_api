# MIXR API

A cocktail recipe generation API powered by OpenAI that helps users create cocktails based on their available equipment, ingredients, and mood.

## Features

- Browse and filter cocktail equipment by category
- Browse and filter cocktail ingredients by category
- Select moods to match your desired drinking experience
- Generate AI-powered cocktail recipes based on your selections
- Save and retrieve recipe history
- RESTful API with comprehensive endpoints

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **AI**: OpenAI GPT-4

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL database
- OpenAI API key

## Installation

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Set up your environment variables:

The project uses a two-tier environment variable system:
- **`.env`** - Contains default/shared configuration (committed to git)
- **`.env.local`** - Contains local overrides (gitignored, for secrets and local settings)

Values are loaded with the following priority:
1. `.env.local` (highest priority - local overrides)
2. `.env` (fallback - team defaults)
3. `process.env` (final fallback - system environment)

To get started, create a `.env.local` file for your local configuration:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mixr_db
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

**Important:** Never commit `.env.local` - it's already in `.gitignore` to protect your secrets.

3. Generate and run database migrations:

```bash
bun run db:generate
bun run db:migrate
```

4. Seed the database with initial data:

```bash
bun run db:seed
```

## Development

Start the development server with hot reload:

```bash
bun run dev
```

The API will be available at `http://localhost:3000`

## Production

Start the production server:

```bash
bun run start
```

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate database migrations from schema
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with initial data
- `bun run db:studio` - Open Drizzle Studio (database GUI)

## API Endpoints

### Health Check

#### `GET /`
Returns API status and version.

**Response:**
```json
{
  "success": true,
  "message": "MIXR API is running",
  "version": "0.0.1"
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Equipment

#### `GET /api/equipment`
Get all equipment or filter by subcategory.

**Query Parameters:**
- `subcategory` (optional): Filter by subcategory (`essential`, `glassware`, `garnish`, `advanced`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subcategory": "essential",
      "name": "Cocktail shaker",
      "icon": "🍸",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 26
}
```

#### `GET /api/equipment/:id`
Get specific equipment by ID.

#### `GET /api/equipment/subcategories`
Get list of all equipment subcategories.

**Response:**
```json
{
  "success": true,
  "data": ["essential", "glassware", "garnish", "advanced"]
}
```

### Ingredients

#### `GET /api/ingredients`
Get all ingredients or filter by subcategory.

**Query Parameters:**
- `subcategory` (optional): Filter by subcategory (`spirit`, `wine`, `other_alcohol`, `fruit`, `spice`, `other`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subcategory": "spirit",
      "name": "Vodka",
      "icon": "🍸",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 92
}
```

#### `GET /api/ingredients/:id`
Get specific ingredient by ID.

#### `GET /api/ingredients/subcategories`
Get list of all ingredient subcategories.

**Response:**
```json
{
  "success": true,
  "data": ["spirit", "wine", "other_alcohol", "fruit", "spice", "other"]
}
```

### Moods

#### `GET /api/moods`
Get all available moods.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "emoji": "😊",
      "name": "Happy",
      "description": "Bright, refreshing cocktails perfect for celebrations",
      "exampleDrinks": "Mojito, Piña Colada, Daiquiri",
      "imageName": "happy.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 8
}
```

#### `GET /api/moods/:id`
Get specific mood by ID.

### Recipes

#### `POST /api/recipes/generate`
Generate a new cocktail recipe based on available equipment, ingredients, and mood.

**Request Body:**
```json
{
  "equipment_ids": [1, 2, 3],
  "ingredient_ids": [1, 5, 10, 15],
  "mood_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sunshine Spritz",
    "description": "A bright and refreshing cocktail perfect for celebrations",
    "moodId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "mood": {
      "id": 1,
      "emoji": "😊",
      "name": "Happy",
      "description": "Bright, refreshing cocktails perfect for celebrations",
      "exampleDrinks": "Mojito, Piña Colada, Daiquiri"
    },
    "ingredients": [
      {
        "id": 1,
        "name": "Vodka",
        "icon": "🍸",
        "amount": "2 oz"
      },
      {
        "id": 5,
        "name": "Lime",
        "icon": "🍋",
        "amount": "1 whole"
      }
    ],
    "steps": [
      "Fill cocktail shaker with ice",
      "Add vodka and freshly squeezed lime juice",
      "Shake vigorously for 15 seconds",
      "Strain into a chilled glass",
      "Garnish with lime wheel"
    ],
    "equipment": [
      {
        "id": 1,
        "name": "Cocktail shaker",
        "icon": "🍸"
      },
      {
        "id": 4,
        "name": "Strainer",
        "icon": "🔍"
      }
    ]
  }
}
```

#### `GET /api/recipes`
Get all generated recipes with pagination.

**Query Parameters:**
- `limit` (optional, default: 10): Number of recipes to return
- `offset` (optional, default: 0): Number of recipes to skip

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### `GET /api/recipes/:id`
Get specific recipe by ID with full details.

## Database Schema

### Equipment
- Categories: Essential, Glassware, Garnish, Advanced
- 26 pre-seeded items

### Ingredients
- Categories: Spirit, Wine, Other Alcohol, Fruit, Spice, Other
- 92 pre-seeded items

### Moods
- 8 pre-seeded moods: Happy, Serious, Lighthearted, Tense, Romantic, Adventurous, Nostalgic, Energetic

### Recipes
- Generated recipes with ingredients, steps, and equipment tracking
- Linked to mood for context

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

## Project Structure

```
mixr_api/
├── src/
│   ├── config/          # Environment configuration
│   ├── db/              # Database schema, migrations, seeds
│   ├── middleware/      # Error handling middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (OpenAI integration)
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main application entry point
├── drizzle/
│   └── migrations/      # SQL migration files
├── .env                 # Default environment variables (committed)
├── .env.local.example   # Local environment template
├── drizzle.config.ts    # Drizzle ORM configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.
