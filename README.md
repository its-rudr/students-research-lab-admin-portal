# Research Hub Admin

Admin portal for the Student Research Lab.

## Tech Stack
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Docker

Run the production build in Docker:

```bash
docker build -t srl-admin-portal .
docker run -p 8080:80 srl-admin-portal
```

Or use Docker Compose:

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.
