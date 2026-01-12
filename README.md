# Weaviate Admin UI - TestNeo Internal Tool

A full-stack admin dashboard for monitoring and managing a self-hosted Weaviate vector database. This is an internal tool designed for 2-3 engineers at TestNeo.

## Overview

This application provides a clean, professional interface to:
- Monitor Weaviate health and system statistics
- Browse database schema and classes
- View and search stored objects
- Execute GraphQL queries with syntax highlighting
- Find similar objects using vector search

## Architecture

```
┌─────────────────────────────────────────┐
│  React Admin UI (Port 3000)             │
│  - Material-UI components               │
│  - TypeScript                           │
│  - Monaco Editor for queries            │
└────────────┬────────────────────────────┘
             │ HTTP/REST + JWT
             ▼
┌─────────────────────────────────────────┐
│  FastAPI Backend (Port 8000)            │
│  - JWT authentication                   │
│  - Request validation                   │
│  - Proxy to Weaviate                    │
└────────────┬────────────────────────────┘
             │ Weaviate Python Client
             ▼
┌─────────────────────────────────────────┐
│  Weaviate (Port 8080)                   │
│  - Vector database                      │
│  - Stores requirements, user stories,   │
│    test cases, Figma screens, bugs      │
└─────────────────────────────────────────┘
```

## Project Structure

```
weaviate-testneo/
├── weaviate-admin-api/        # FastAPI backend
│   ├── app/
│   │   ├── api/v1/            # API endpoints
│   │   ├── models/            # Pydantic models
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth middleware
│   │   ├── utils/             # Helpers
│   │   ├── config.py          # Configuration
│   │   └── main.py            # Entry point
│   ├── requirements.txt
│   └── README.md
├── weaviate-admin-ui/         # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API clients
│   │   ├── contexts/          # React contexts
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── README.md
├── docker-compose.yml         # Docker setup (optional)
└── README.md                  # This file
```

## Features

### 1. Authentication
- JWT-based authentication
- Hardcoded test users for MVP
- Token stored in localStorage
- Auto-redirect on 401 errors

### 2. Dashboard
- Real-time health monitoring
- Object counts per class with icons
- Memory usage visualization
- Auto-refresh every 30 seconds
- Version and hostname display

### 3. Schema Viewer
- Browse all Weaviate classes
- View class properties and data types
- See vector configurations
- Search classes by name
- Object count per class

### 4. Data Browser
- Select class from dropdown
- Paginated table view (25/50/100 per page)
- View object details in modal
- Find similar objects using vector search
- Copy object IDs
- Responsive design

### 5. Query Playground
- Monaco editor with GraphQL syntax highlighting
- Execute read-only queries
- Formatted JSON results
- Execution time display
- 5 pre-built example queries
- Copy results to clipboard

## Quick Start

### Prerequisites

- **Backend:**
  - Python 3.10+
  - Weaviate running on localhost:8080

- **Frontend:**
  - Node.js 16+
  - npm or yarn

### 1. Start Backend

```bash
cd weaviate-admin-api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
WEAVIATE_URL=http://localhost:8080
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
EOL

# Run server
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000

### 2. Start Frontend

```bash
cd weaviate-admin-ui

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env

# Start development server
npm start
```

Application will open at http://localhost:3000

### 3. Login

Use test credentials:
- **Email:** engineer1@testneo.ai
- **Password:** admin123

Or:
- **Email:** engineer2@testneo.ai
- **Password:** admin123

## Deployment

### Production Build

**Frontend:**
```bash
cd weaviate-admin-ui
npm run build
```

**Backend:**
```bash
cd weaviate-admin-api
pip install -r requirements.txt
```

### EC2 Deployment

#### 1. Backend with Systemd

Create `/etc/systemd/system/weaviate-admin-api.service`:

```ini
[Unit]
Description=Weaviate Admin API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/weaviate-testneo/weaviate-admin-api
Environment="PATH=/home/ubuntu/weaviate-testneo/weaviate-admin-api/venv/bin"
EnvironmentFile=/home/ubuntu/weaviate-testneo/weaviate-admin-api/.env
ExecStart=/home/ubuntu/weaviate-testneo/weaviate-admin-api/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable weaviate-admin-api
sudo systemctl start weaviate-admin-api
```

#### 2. Frontend with Nginx

Create `/etc/nginx/sites-available/weaviate-admin`:

```nginx
server {
    listen 80;
    server_name weaviate-admin.testneo.ai;
    root /var/www/weaviate-admin;
    index index.html;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Deploy frontend:
```bash
sudo mkdir -p /var/www/weaviate-admin
sudo cp -r weaviate-admin-ui/build/* /var/www/weaviate-admin/
sudo ln -s /etc/nginx/sites-available/weaviate-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Docker Compose (Optional)

```yaml
version: '3.8'

services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
    volumes:
      - weaviate_data:/var/lib/weaviate

  backend:
    build: ./weaviate-admin-api
    ports:
      - "8000:8000"
    environment:
      - WEAVIATE_URL=http://weaviate:8080
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - weaviate

  frontend:
    build: ./weaviate-admin-ui
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  weaviate_data:
```

## Development

### Backend Development

```bash
cd weaviate-admin-api

# Install dev dependencies
pip install pytest pytest-cov black flake8

# Run tests
pytest

# Format code
black app/

# Lint
flake8 app/
```

### Frontend Development

```bash
cd weaviate-admin-ui

# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## API Documentation

Interactive API documentation available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Main Endpoints

- `POST /api/v1/auth/login` - Authenticate user
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/dashboard/overview` - Dashboard data
- `GET /api/v1/schema` - Get all classes
- `GET /api/v1/data/{className}/objects` - List objects
- `POST /api/v1/query/execute` - Execute GraphQL query

## Security

### Authentication
- JWT tokens with 24-hour expiration
- HS256 algorithm
- Token stored in localStorage (frontend)
- Bearer token in Authorization header

### API Security
- CORS configured for specific origins
- Read-only GraphQL queries enforced
- Query validation and timeout (30s)
- Input sanitization

### Production Recommendations
1. Change JWT_SECRET to a strong random value
2. Use HTTPS in production
3. Set up proper firewall rules
4. Regular security updates
5. Monitor API access logs

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Dashboard loads and shows data
- [ ] Dashboard auto-refreshes
- [ ] Schema viewer shows all classes
- [ ] Schema properties display correctly
- [ ] Data browser loads objects
- [ ] Pagination works
- [ ] Object detail modal shows data
- [ ] Find similar returns results
- [ ] Query playground executes queries
- [ ] Example queries load
- [ ] Logout clears token and redirects
- [ ] Unauthorized requests redirect to login
- [ ] Mobile responsive design works

## Troubleshooting

### Backend Issues

**Connection to Weaviate fails:**
```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/.well-known/ready

# Check backend logs
journalctl -u weaviate-admin-api -f
```

**JWT token errors:**
- Verify JWT_SECRET is set correctly
- Check token expiration time
- Clear localStorage in browser

### Frontend Issues

**API connection fails:**
- Check REACT_APP_API_URL in .env
- Verify backend is running on port 8000
- Check browser console for CORS errors

**Build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

## Future Enhancements

- [ ] SQLite database for query history
- [ ] User management interface
- [ ] Custom saved queries
- [ ] Export data to CSV/JSON
- [ ] Advanced filtering options
- [ ] Real-time updates via WebSocket
- [ ] Audit logs
- [ ] Role-based access control

## Technology Stack

### Frontend
- React 18
- TypeScript
- Material-UI (MUI) v5
- React Router v6
- Axios
- Monaco Editor

### Backend
- FastAPI
- Python 3.10+
- Weaviate Python Client
- PyJWT
- Pydantic

## License

Internal tool for TestNeo - Not for external distribution.

## Support

For issues or questions, contact the TestNeo engineering team.

## Contributors

Internal TestNeo Engineering Team

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-12
