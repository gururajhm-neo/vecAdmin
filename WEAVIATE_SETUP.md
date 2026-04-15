# Weaviate Setup Guide

This admin UI requires Weaviate to be running. Here are your options:

## Check if Weaviate is Running

```bash
curl http://localhost:8080/v1/.well-known/ready
```

If you get a response, Weaviate is running! If not, see options below.

---

## Option 1: Use Docker (Easiest)

### Start Weaviate with Docker:

```bash
docker run -d \
  --name weaviate \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  semitechnologies/weaviate:latest
```

### Check it's running:
```bash
docker ps | grep weaviate
curl http://localhost:8080/v1/.well-known/ready
```

### Stop Weaviate:
```bash
docker stop weaviate
docker rm weaviate
```

---

## Option 2: Use Docker Compose (Recommended)

We've included a `docker-compose.yml` file in the root directory.

### Start Weaviate:
```bash
cd /path/to/your/weaviate-admin-repo
docker-compose up -d weaviate
```

### Check status:
```bash
docker-compose ps
```

### View logs:
```bash
docker-compose logs -f weaviate
```

### Stop Weaviate:
```bash
docker-compose down
```

---

## Option 3: Development Mode (No Weaviate)

The admin UI can now start **without** Weaviate running! 

You'll see:
- ✅ Login page works
- ✅ UI loads properly
- ❌ Dashboard will show "Weaviate not connected" errors
- ❌ Data operations will fail

This is useful for:
- Frontend development
- UI testing
- When you don't have Weaviate data yet

---

## Recommended Workflow

### For Development:
1. Start the admin UI first (no Weaviate needed)
2. Work on UI/frontend
3. Start Weaviate when you need to test data operations

```bash
# Start UI (works without Weaviate)
./start-dev.sh

# Later, start Weaviate in another terminal
docker run -d -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  semitechnologies/weaviate:latest

# Refresh the dashboard page - it will now connect!
```

### For Production:
1. Start Weaviate first
2. Then start the admin UI
3. Everything works together

---

## Quick Test

After starting Weaviate, test the connection:

```bash
# Health check
curl http://localhost:8080/v1/.well-known/ready

# Get schema (should return empty initially)
curl http://localhost:8080/v1/schema

# Test from admin UI backend
curl http://localhost:8000/api/v1/dashboard/overview \
  -H "Authorization: Bearer <your-token>"
```

---

## Common Issues

### "Connection refused" on port 8080
- Weaviate is not running
- Start it with Docker (see options above)

### "Port 8080 already in use"
- Something else is using port 8080
- Find and stop it: `lsof -ti:8080 | xargs kill -9`
- Or change the port in backend `.env`: `WEAVIATE_URL=http://localhost:8081`

### Docker not installed
```bash
# On macOS
brew install docker

# Then start Docker Desktop
```

---

## What Happens Without Weaviate?

The admin UI will:
1. ✅ Start successfully (no crash)
2. ✅ Show login page
3. ✅ Allow authentication
4. ❌ Dashboard shows "Weaviate not connected"
5. ❌ Schema viewer shows error
6. ❌ Data browser shows error
7. ❌ Query playground shows error

This is intentional - you can develop the UI without needing Weaviate!

