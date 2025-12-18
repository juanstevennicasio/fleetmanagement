# FleetFlow - Fleet Management & Logistics Monitoring System

A comprehensive web application for managing logistics operations, fleet monitoring, messenger tracking, and route optimization with real-time features and gamification.

## 🚀 Features

### 📊 Dashboard
- Real-time statistics overview
- Active routes monitoring
- System alerts and notifications
- Quick action shortcuts

### 👥 Client Management
- Customer database with location tracking
- Interactive map integration (Leaflet)
- Google Maps link generation
- Visit history tracking

### 🚚 Messenger Management
- Driver profiles with photos
- Document tracking with expiration alerts
- Traffic light status indicators (🟢 🟡 🔴)
- Vehicle assignment system

### 🚗 Fleet Vehicles
- Vehicle inventory management
- Maintenance log tracking
- Service reminders
- Status monitoring

### 🗺️ Routes & Dispatch
- Real-time route tracking
- Multi-destination support
- Live timer for active routes
- Special delivery tracking (Ficha/Envío)

### 🔔 Alerts & Notifications
- Route irregularity detection
- Document expiration warnings
- Maintenance reminders
- Severity-based categorization

### 📈 Reports & Analytics
- Performance metrics
- Messenger efficiency rankings
- Comparative analytics
- Trend visualization

### 🏆 Gamification
- Points-based leaderboard
- Achievement system
- Monthly rankings
- Performance incentives

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Maps**: Leaflet / OpenStreetMap
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (ready)

## 📦 Installation

```bash
# Clone or navigate to the project
cd fleet-management

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the SQL schema in Supabase SQL Editor:

```bash
# The schema is located at:
supabase/schema.sql
```

This creates 11 tables with triggers, indexes, and relationships.

## 🎨 Theme

The application supports both light and dark modes with smooth transitions:
- Click the moon/sun icon in the navigation to toggle themes
- Theme preference is saved to localStorage

## 📱 Responsive Design

Fully responsive layout optimized for:
- Desktop (1920px+)
- Tablet (768px - 1920px)
- Mobile (375px - 768px)

## 🔐 Authentication (To Implement)

The application is ready for Supabase authentication:
1. Enable Auth in your Supabase project
2. Create login/signup pages
3. Implement protected routes
4. Add user role management

## 📋 Next Steps

### Priority 1: Supabase Integration
- [ ] Connect to Supabase database
- [ ] Implement CRUD operations for all modules
- [ ] Set up real-time subscriptions
- [ ] Add authentication

### Priority 2: Advanced Features
- [ ] Leaflet map integration for client locations
- [ ] Document upload to Supabase Storage
- [ ] Real-time route timer
- [ ] Alert auto-generation system
- [ ] Gamification points engine

### Priority 3: Production
- [ ] Add form validation
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Set up deployment (Vercel)
- [ ] Configure custom domain

## 📁 Project Structure

```
fleet-management/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard
│   ├── clients/           # Client module
│   ├── messengers/        # Messenger module
│   ├── vehicles/          # Vehicle module
│   ├── routes/            # Routes module
│   ├── alerts/            # Alerts module
│   ├── reports/           # Reports module
│   └── gamification/      # Gamification module
├── components/            # React components
│   ├── Navigation.tsx     # Sidebar
│   ├── ThemeToggle.tsx    # Theme switcher
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Helper functions
│   └── supabase.ts       # Supabase client
└── supabase/
    └── schema.sql        # Database schema
```

## 🎯 Key Components

### UI Components
- `Button` - 5 variants with loading states
- `Card` - Flexible card with hover effects
- `Modal` - Dialog with backdrop
- `StatusBadge` - Traffic light indicators

### Utility Functions
- Date formatting and relative time
- Duration calculations
- Google Maps link generation
- WhatsApp share links
- Document status logic

## 📊 Database Schema

11 tables with comprehensive relationships:
- `clients` - Customer information
- `messengers` - Driver profiles
- `vehicles` - Fleet inventory
- `documents` - Document tracking
- `maintenance_logs` - Service history
- `routes` - Dispatch records
- `route_stops` - Multi-destination
- `visit_history` - Client visits
- `alerts` - Notifications
- `gamification_rules` - Achievement criteria
- `messenger_points` - Points tracking

## 🤝 Contributing

This is a custom-built application. For modifications:
1. Follow the existing component structure
2. Use TypeScript for type safety
3. Maintain the design system
4. Update documentation

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Built with Next.js and Tailwind CSS
- Icons by Lucide
- Fonts by Google Fonts (Inter)
- Database by Supabase

---

**Project Status**: ✅ Supabase Migration Complete

**Development Server**: `npm run dev` → [http://localhost:3000](http://localhost:3000)
