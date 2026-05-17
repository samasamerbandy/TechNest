# Tech Nest

## Overview

Tech Nest is a campus issue reporting and maintenance tracking project. It includes:

- `backend/` — Express API with authentication, ticket management, notifications, and Prisma database logic
- `frontend/` — Expo React Native app for members, managers, and workers
- `prisma/` — Prisma schema and database configuration

## Prerequisites

- Node.js 18+ or compatible version
- npm
- Git
- Optional: Expo CLI globally installed with `npm install -g expo-cli`

## Backend setup

1. Open a terminal and go to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in `backend/` with the following values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_secret
CLIENT_URL=http://localhost:19006
PORT=5000
NODE_ENV=development
```

4. Generate the Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the backend server:

```bash
npm run dev
```

The backend should now be available at `http://localhost:5000`.

## Frontend setup

1. Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Update the API settings if needed.

Open `frontend/src/config.js` and set the backend URL:

```js
export const SERVER_URL = 'http://localhost:5000';
export const API_BASE = `${SERVER_URL}/api`;
```

4. Start the Expo app:

```bash
npm start
```

Then follow the Expo prompts to open on a simulator, device, or browser.

## Running the app

Run both backend and frontend at the same time:

- Terminal 1:
  ```bash
  cd backend
  npm run dev
  ```
- Terminal 2:
  ```bash
  cd frontend
  npm start
  ```

## Environment variables

Required backend variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `COOKIE_SECRET`
- `CLIENT_URL`
- `PORT`
- `NODE_ENV`

## Git workflow

If you need to get the latest remote changes:

```bash
git fetch --all --prune
git checkout mariam
git merge origin/main
```

If the `frontend/` folder is missing locally, syncing with `origin/main` should restore it.

## Notes

- Use a configurable frontend API URL so the app works on different machines.
