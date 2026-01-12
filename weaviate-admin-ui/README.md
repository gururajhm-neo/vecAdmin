# Weaviate Admin UI

Frontend dashboard for managing and monitoring Weaviate vector database - Internal tool for TestNeo.

## Overview

This React application provides an intuitive interface for:
- Monitoring Weaviate health and statistics
- Browsing database schema and classes
- Searching and viewing stored objects
- Executing GraphQL queries

## Tech Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Code Editor**: Monaco Editor (for GraphQL queries)
- **State Management**: React Context + Hooks

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:8000 (or configured URL)

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### 4. Running the Application

**Development Mode:**

```bash
npm start
```

The app will open at http://localhost:3000

**Production Build:**

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Application Structure

```
weaviate-admin-ui/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout/          # App layout, sidebar, topbar
│   │   ├── Common/          # Shared components (spinners, errors)
│   │   ├── Dashboard/       # Dashboard-specific components
│   │   ├── Schema/          # Schema viewer components
│   │   ├── Data/            # Data browser components
│   │   └── Query/           # Query playground components
│   ├── pages/               # Main page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Schema.tsx
│   │   ├── DataBrowser.tsx
│   │   └── QueryPlayground.tsx
│   ├── api/                 # API client and endpoints
│   │   ├── client.ts        # Axios instance
│   │   ├── auth.ts          # Auth API calls
│   │   ├── dashboard.ts
│   │   ├── schema.ts
│   │   ├── data.ts
│   │   └── query.ts
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── constants.ts
│   │   └── formatters.ts
│   ├── App.tsx              # Root component with routing
│   └── index.tsx            # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### 1. Login
- Simple email/password authentication
- JWT token management
- Test credentials:
  - engineer1@testneo.ai / admin123
  - engineer2@testneo.ai / admin123

### 2. Dashboard
- Real-time Weaviate health status
- Object counts by class
- Memory usage visualization
- Auto-refresh every 30 seconds

### 3. Schema Viewer
- Browse all database classes
- View class properties and types
- See vector configurations
- Object count per class

### 4. Data Browser
- Select and browse objects by class
- Paginated table view (50 items per page)
- View detailed object information
- Find similar objects using vector search

### 5. Query Playground
- Monaco editor with GraphQL syntax highlighting
- Execute custom queries
- View formatted results
- Pre-built example queries
- Read-only query validation

## Authentication

The app uses JWT tokens for authentication:
- Token stored in `localStorage`
- Automatically included in API requests via Axios interceptor
- Redirects to login on 401 errors
- Token expires after 24 hours

## Development

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run tests

### Adding New Features

1. Create components in appropriate `components/` subdirectory
2. Add page component in `pages/` if needed
3. Create API functions in `api/` directory
4. Add route in `App.tsx`
5. Update types in `types/index.ts`

## Deployment

### Production Build

```bash
npm run build
```

### Deploy to EC2 with Nginx

1. Build the application:
```bash
npm run build
```

2. Copy build files to server:
```bash
scp -r build/* user@server:/var/www/weaviate-admin/
```

3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name weaviate-admin.testneo.ai;
    root /var/www/weaviate-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. Restart Nginx:
```bash
sudo systemctl restart nginx
```

## Design System

### Colors
- **Primary**: #1976d2 (blue)
- **Success**: #4caf50 (green)
- **Warning**: #ff9800 (orange)
- **Error**: #f44336 (red)
- **Background**: #fafafa (light gray)

### Typography
- **Font Family**: Roboto
- **Headings**: 24px (h4), 20px (h5), 16px (h6)
- **Body**: 14px
- **Caption**: 12px

### Spacing
- Consistent 8px grid
- Card padding: 16px
- Section margins: 24px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues

If you can't connect to the backend:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check REACT_APP_API_URL in `.env`
3. Verify CORS settings in backend

### Authentication Issues

If login fails:
1. Check test user credentials
2. Verify JWT_SECRET matches between frontend/backend
3. Clear localStorage and try again

## License

Internal tool for TestNeo - Not for external distribution.

