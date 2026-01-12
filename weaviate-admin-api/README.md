# Weaviate Admin API

Backend API for the Weaviate Admin Dashboard - Internal tool for TestNeo.

## Overview

This FastAPI application provides a thin proxy layer between the React frontend and Weaviate, handling:
- JWT authentication
- Organization-scoped data access
- Query validation and execution
- Dashboard metrics and statistics

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Python**: 3.10+
- **Weaviate Client**: weaviate-client 3.25+
- **Auth**: PyJWT for token management

## Setup Instructions

### 1. Prerequisites

- Python 3.10 or higher
- Weaviate running on localhost:8080 (or configured URL)

### 2. Installation

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
WEAVIATE_URL=http://localhost:8080
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGINS=http://localhost:3000
```

### 4. Running the Server

**Development Mode:**

```bash
uvicorn app.main:app --reload --port 8000
```

**Production Mode:**

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login with email/password
- `GET /api/v1/auth/me` - Get current user info (requires auth)

### Dashboard

- `GET /api/v1/dashboard/overview` - Get dashboard overview with health, counts, memory (requires auth)

### Schema

- `GET /api/v1/schema` - Get all classes and their schemas (requires auth)
- `GET /api/v1/schema/{className}` - Get specific class details (requires auth)

### Data

- `GET /api/v1/data/{className}/objects` - List objects with pagination (requires auth)
- `GET /api/v1/data/{className}/objects/{objectId}` - Get object details (requires auth)
- `POST /api/v1/data/{className}/similar` - Find similar objects (requires auth)

### Query

- `POST /api/v1/query/execute` - Execute GraphQL query (requires auth)

## Authentication

The API uses JWT tokens for authentication. After logging in, include the token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

### Test Users

For MVP, two test users are hardcoded:

- Email: `engineer1@testneo.ai`, Password: `admin123`
- Email: `engineer2@testneo.ai`, Password: `admin123`

## Project Structure

```
weaviate-admin-api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration settings
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py         # Authentication endpoints
│   │       ├── dashboard.py    # Dashboard endpoints
│   │       ├── schema.py       # Schema endpoints
│   │       ├── data.py         # Data browser endpoints
│   │       └── query.py        # Query playground endpoints
│   ├── services/
│   │   ├── auth_service.py     # Auth logic
│   │   └── weaviate_service.py # Weaviate client wrapper
│   ├── middleware/
│   │   └── auth.py             # JWT validation
│   ├── models/
│   │   ├── auth.py             # Auth Pydantic models
│   │   ├── dashboard.py        # Dashboard models
│   │   ├── schema.py           # Schema models
│   │   ├── data.py             # Data models
│   │   └── query.py            # Query models
│   └── utils/
│       ├── weaviate_helpers.py # Weaviate helper functions
│       └── query_validator.py  # Query validation
├── requirements.txt
├── .env.example
└── README.md
```

## Deployment

### EC2 Deployment with Systemd

1. **Create systemd service file** (`/etc/systemd/system/weaviate-admin-api.service`):

```ini
[Unit]
Description=Weaviate Admin API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/weaviate-admin-api
Environment="PATH=/home/ubuntu/weaviate-admin-api/venv/bin"
ExecStart=/home/ubuntu/weaviate-admin-api/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

2. **Start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable weaviate-admin-api
sudo systemctl start weaviate-admin-api
sudo systemctl status weaviate-admin-api
```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name api.weaviate-admin.testneo.ai;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Development

### Testing the API

Use the interactive docs at http://localhost:8000/docs to test endpoints, or use curl:

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "engineer1@testneo.ai", "password": "admin123"}'

# Get dashboard (with token)
curl -X GET http://localhost:8000/api/v1/dashboard/overview \
  -H "Authorization: Bearer <your-token>"
```

## Future Enhancements

- SQLite integration for query history and audit logs
- User management interface
- Custom saved queries
- Advanced query analytics

## License

Internal tool for TestNeo - Not for external distribution.

