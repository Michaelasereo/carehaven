# Pusher Real-Time Notifications Setup

## Overview

Pusher will be used for real-time in-app notifications to replace/complement Supabase Realtime.

## Installation

```bash
npm install pusher pusher-js
npm install --save-dev @types/pusher-js
```

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
PUSHER_APP_ID=your_app_id
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=us2
```

Add to Netlify environment variables (production).

## Pusher Dashboard Setup

1. **Create Pusher Account**
   - Go to https://pusher.com
   - Sign up for a free account

2. **Create New App**
   - Dashboard → "Create app"
   - Name: `carehaven`
   - Cluster: Choose closest to your users (e.g., `us2`, `eu`, `ap-southeast-1`)
   - Front-end tech: React
   - Back-end tech: Node.js

3. **Get Credentials**
   - Copy `App ID`
   - Copy `Key`
   - Copy `Secret`
   - Copy `Cluster`

## Implementation Plan

### 1. Create Pusher Server Client (`lib/pusher/server.ts`)
- Initialize Pusher server instance
- Use for sending notifications from API routes

### 2. Create Pusher Client Hook (`lib/pusher/client.ts`)
- Initialize Pusher client instance
- Use in React components

### 3. Update Notification API (`app/api/notifications/create/route.ts`)
- Trigger Pusher event after creating notification in database

### 4. Update Notification Bell Component
- Subscribe to Pusher channel for real-time updates
- Replace/enhance Supabase Realtime subscription

### 5. Notification Service
- Centralize notification sending logic
- Handle both database and Pusher events

## Migration from Supabase Realtime

The current implementation uses Supabase Realtime. We'll:
1. Keep Supabase for database storage
2. Use Pusher for real-time delivery
3. Create notification in database → Trigger Pusher event → Client receives update
