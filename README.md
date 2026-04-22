# Health Tracker v2

A modern health and fitness tracking application built with Next.js 14, focusing on HYROX training and general fitness progress tracking for multiple users.

## Features

- **Multi-user tracking**: Track progress for Blaine (blue) and Varsha (pink)
- **HYROX training metrics**: All 8 HYROX exercises plus running splits and overall times
- **Weight training**: Track reps and weights for various exercises
- **General health**: Track body weight and other metrics
- **Dual view modes**:
  - **Table View**: Spreadsheet-like interface with color-coded user data
  - **Charts View**: Interactive visualizations with time series, bar charts, and volume tracking
- **Responsive design**: Works on desktop and mobile devices
- **Dark theme**: Modern, clean interface

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: Vercel Postgres with Drizzle ORM
- **Charts**: Recharts for interactive visualizations
- **Package Manager**: pnpm

## Database Schema

### Users
- `id` (serial, primary key)
- `name` (text)
- `color` (text) - hex color for UI display

### Health Factor Groups
- `id` (serial, primary key)
- `name` (text)
- `owner_user_id` (int, nullable) - for user-specific groups

### Health Factors
- `id` (serial, primary key)
- `group_id` (int, foreign key)
- `name` (text)
- `unit` (enum: 'time', 'lbs', 'reps_weight')
- `description` (text, nullable)
- `sort_order` (int, default 0)

### Entries
- `id` (serial, primary key)
- `date` (text, YYYY-MM-DD format)
- `raw_text` (text, nullable) - original input text
- `scores` (jsonb) - nested object with user_id -> factor_id -> value
- `created_at` (timestamp)

## Data Format

The `scores` field uses this format:
```json
{
  "1": {
    "1": "4:20",        // time format (mm:ss)
    "12": "185",        // weight in lbs
    "13": "10x185"      // reps_weight format (reps x weight)
  },
  "2": {
    "1": "4:50"
  }
}
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Vercel Postgres database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd health-tracker-v2
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Postgres connection string
```

4. Generate and run database migrations:
```bash
pnpm db:generate
pnpm db:push
```

5. Seed the database with initial data:
```bash
pnpm db:seed
```

6. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## API Endpoints

### Entries
- `GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD` - Get entries with optional date range
- `POST /api/entries` - Create new entry
- `PUT /api/entries/[id]` - Update entry
- `DELETE /api/entries/[id]` - Delete entry

### Users
- `GET /api/users` - Get all users

### Health Factors
- `GET /api/health-factors` - Get all health factors
- `POST /api/health-factors` - Create new health factor

### Health Factor Groups
- `GET /api/health-factor-groups` - Get all groups
- `POST /api/health-factor-groups` - Create new group

## Usage

### Adding Data
Use the API endpoints to add entries. Example POST to `/api/entries`:
```json
{
  "date": "2024-04-22",
  "scores": {
    "1": {
      "1": "4:20",
      "5": "3:45",
      "13": "8x185"
    },
    "2": {
      "1": "4:50"
    }
  }
}
```

### Table View
- Rows grouped by health factor categories
- Columns represent dates
- Color-coded entries per user
- Sticky first column for easy navigation
- Auto-formatted values based on unit type

### Charts View
- **Time factors**: Line charts with lower-is-better time formatting
- **Weight factors**: Line charts for tracking weight over time  
- **Reps/Weight factors**: 
  - Separate bar charts for reps and weight
  - Combined volume line chart (reps × weight)

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `POSTGRES_URL` - Your Vercel Postgres connection string
3. Deploy!

The app will automatically:
- Build the Next.js application
- Run database migrations on deploy
- Serve the application with edge runtime optimization

### Manual Deployment

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes directly
- `pnpm db:seed` - Seed database with initial data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license here]