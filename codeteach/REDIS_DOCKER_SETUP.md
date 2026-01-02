# 🐳 Redis Setup with Docker (Windows/Linux/Mac)

## Prerequisites
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Make sure Docker is running

## Quick Start - Using Docker Compose (Recommended)

### Option 1: Start Redis with Docker Compose
```bash
# Start Redis container
docker-compose up -d

# Check if Redis is running
docker ps

# Test Redis connection
docker exec -it codeteach-redis redis-cli ping
# Should return: PONG
```

### Option 2: Start Redis with Single Docker Command
```bash
# Start Redis container
docker run -d \
  --name codeteach-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes

# Check if running
docker ps

# Test connection
docker exec -it codeteach-redis redis-cli ping
```

## 🎯 Step-by-Step Instructions

### 1. **Install Docker Desktop (Windows)**
   - Download:   - Install and start Docker Desktop
   - Wait for Docker to be fully running (whale icon in system tray)

### 2. **Start Redis Container**

#### Using the docker-compose.yml file (in this folder):
```bash
cd /home/jatin/Downloads/codeteach
docker-compose up -d
```

#### Or using direct command:
```bash
docker run -d --name codeteach-redis -p 6379:6379 redis:7-alpine
```

### 3. **Verify Redis is Running**
```bash
# Check container status
docker ps

# You should see something like:
# CONTAINER ID   IMAGE           PORTS                    NAMES
# abc123def456   redis:7-alpine  0.0.0.0:6379->6379/tcp   codeteach-redis

# Test Redis connection
docker exec -it codeteach-redis redis-cli ping
# Output: PONG
```

### 4. **Start Your Backend**
```bash
cd code-teach-backend-main
npm start
```

You should see:
```
✅ Redis connected successfully
✅ Redis ready to accept commands
```

## 📋 Docker Commands Cheat Sheet

### Start/Stop Redis
```bash
# Start Redis (if stopped)
docker start codeteach-redis

# Stop Redis
docker stop codeteach-redis

# Restart Redis
docker restart codeteach-redis

# Remove Redis container
docker rm -f codeteach-redis
```

### View Redis Logs
```bash
# View logs
docker logs codeteach-redis

# Follow logs (live)
docker logs -f codeteach-redis
```

### Access Redis CLI
```bash
# Open Redis CLI
docker exec -it codeteach-redis redis-cli

# Inside Redis CLI, you can run:
PING           # Test connection
KEYS *         # List all keys
GET key_name   # Get a value
FLUSHALL       # Clear all data
INFO           # Show Redis info
EXIT           # Exit CLI
```

### Check Redis Data
```bash
# See what's cached
docker exec -it codeteach-redis redis-cli KEYS "cache:*"

# View specific cached value
docker exec -it codeteach-redis redis-cli GET "cache:/api/courses"

# Clear all cache
docker exec -it codeteach-redis redis-cli FLUSHALL
```

## 🔧 Troubleshooting

### Port 6379 Already in Use
```bash
# Check what's using port 6379
netstat -ano | findstr :6379  # Windows
lsof -i :6379                 # Linux/Mac

# Stop the process or use different port:
docker run -d --name codeteach-redis -p 6380:6379 redis:7-alpine

# Update .env file:
REDIS_URL=redis://localhost:6380
```

### Docker Not Running
```bash
# Windows: Start Docker Desktop from Start Menu
# Linux: 
sudo systemctl start docker
```

### Cannot Connect to Redis
```bash
# Restart Redis container
docker restart codeteach-redis

# Check Redis is healthy
docker exec -it codeteach-redis redis-cli ping

# Check backend can connect
cd code-teach-backend-main
npm start
```

## 🎯 Using Docker Compose (Recommended)

The `docker-compose.yml` file in this folder includes:
- Redis with persistence (data saved to volume)
- Auto-restart on failures
- Health checks
- Port mapping to 6379

### Start everything:
```bash
docker-compose up -d
```

### Stop everything:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f redis
```

## 📊 Redis Configuration

Your backend is configured to connect to:
```
REDIS_URL=redis://localhost:6379
```

This works automatically with Docker because:
- Docker maps container port 6379 to localhost:6379
- Your backend connects to localhost:6379
- Everything works seamlessly!

## 🚀 Production Tips

### Keep Data When Restarting
The docker-compose.yml uses a volume (`redis-data`) to persist data.

### Backup Redis Data
```bash
# Backup
docker exec codeteach-redis redis-cli SAVE
docker cp codeteach-redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp ./redis-backup.rdb codeteach-redis:/data/dump.rdb
docker restart codeteach-redis
```

### Monitor Redis
```bash
# Real-time stats
docker exec -it codeteach-redis redis-cli --stat

# Memory usage
docker exec -it codeteach-redis redis-cli INFO memory
```

## ✅ Summary

1. **Install Docker Desktop**
2. **Run**: `docker-compose up -d` (or `docker run -d --name codeteach-redis -p 6379:6379 redis:7-alpine`)
3. **Verify**: `docker exec -it codeteach-redis redis-cli ping`
4. **Start Backend**: `cd code-teach-backend-main && npm start`
5. **Done!** ✨

Your Redis is now running in Docker and your backend can connect to it!
