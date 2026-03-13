# NammaFix Backend - Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are configured
- [ ] Database migrations have been run
- [ ] PostGIS extension is enabled
- [ ] API keys are valid (Groq, Supabase)
- [ ] Tests pass successfully
- [ ] Logging is configured
- [ ] Error handling is tested
- [ ] Rate limiting is configured
- [ ] Security headers are set

## Environment Variables

Create a `.env` file with production values:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key

# AI Service
GROQ_API_KEY=your-production-groq-key

# Server
PORT=3000
NODE_ENV=production
```

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

1. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone and setup**:
```bash
git clone <repository-url>
cd backend
npm install --production
```

3. **Configure environment**:
```bash
cp .env.example .env
nano .env  # Edit with production values
```

4. **Run migrations**:
```bash
psql $DATABASE_URL -f src/database/migrations/001_create_schema.sql
```

5. **Install PM2**:
```bash
sudo npm install -g pm2
```

6. **Start application**:
```bash
pm2 start src/server.js --name nammafix-backend
pm2 save
pm2 startup
```

7. **Configure nginx reverse proxy**:
```nginx
server {
    listen 80;
    server_name api.nammafix.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

8. **Enable HTTPS with Let's Encrypt**:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.nammafix.com
```

### Option 2: Docker Deployment

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

2. **Create docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped
```

3. **Deploy**:
```bash
docker-compose up -d
```

### Option 3: Serverless (Vercel, Railway, Render)

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### Option 4: Kubernetes

1. **Create deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nammafix-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nammafix-backend
  template:
    metadata:
      labels:
        app: nammafix-backend
    spec:
      containers:
      - name: backend
        image: nammafix/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: nammafix-secrets
              key: database-url
```

2. **Deploy**:
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://api.nammafix.com/health

# Test API
curl -X POST https://api.nammafix.com/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test complaint for deployment verification",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

### 2. Monitor Logs

```bash
# PM2
pm2 logs nammafix-backend

# Docker
docker-compose logs -f

# Kubernetes
kubectl logs -f deployment/nammafix-backend
```

### 3. Set Up Monitoring

#### Application Monitoring
- Use PM2 monitoring: `pm2 monitor`
- Or integrate with Datadog, New Relic, or AppDynamics

#### Log Aggregation
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog Logs
- AWS CloudWatch
- Google Cloud Logging

#### Uptime Monitoring
- UptimeRobot
- Pingdom
- StatusCake

### 4. Configure Alerts

Set up alerts for:
- Server downtime
- High error rates
- Database connection failures
- AI service failures
- High response times (> 1s)
- Rate limit violations

### 5. Database Backups

#### Supabase
- Enable automatic backups in Supabase dashboard
- Configure backup retention period
- Test restore procedure

#### Manual Backups
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240115.sql
```

## Security Hardening

### 1. Environment Variables
- Never commit `.env` to version control
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly

### 2. HTTPS
- Always use HTTPS in production
- Configure SSL/TLS certificates
- Enable HSTS headers

### 3. Rate Limiting
- Current: 5 requests/min for complaints
- Adjust based on traffic patterns
- Consider IP whitelisting for trusted clients

### 4. CORS
Add CORS middleware if needed:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://nammafix.com',
  credentials: true
}));
```

### 5. Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 6. Input Validation
- Already implemented with express-validator
- Ensure all endpoints validate input
- Sanitize user input

## Performance Optimization

### 1. Database
- Spatial indexes already configured
- Monitor query performance
- Consider read replicas for high traffic

### 2. Caching
Add Redis caching for:
- Trending issues (cache for 5 minutes)
- Heatmap data (cache for 1 minute)

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache trending data
app.get('/api/trending', async (req, res) => {
  const cached = await client.get('trending');
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from database
  const data = await getTrendingData();
  await client.setex('trending', 300, JSON.stringify(data));
  res.json(data);
});
```

### 3. Load Balancing
Use nginx or cloud load balancer:
```nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

### 4. CDN
- Serve static assets via CDN
- Cache API responses where appropriate

## Scaling Strategy

### Horizontal Scaling
1. Deploy multiple instances
2. Use load balancer
3. Share session state (Redis)
4. Database connection pooling

### Vertical Scaling
1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Add database indexes

### Auto-Scaling
Configure auto-scaling based on:
- CPU usage > 70%
- Memory usage > 80%
- Request rate > threshold

## Rollback Procedure

If deployment fails:

1. **PM2**:
```bash
pm2 stop nammafix-backend
git checkout <previous-commit>
npm install
pm2 restart nammafix-backend
```

2. **Docker**:
```bash
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

3. **Kubernetes**:
```bash
kubectl rollout undo deployment/nammafix-backend
```

## Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check database performance
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and rotate API keys
- [ ] Quarterly: Load testing
- [ ] Quarterly: Security audit

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm test
```

## Troubleshooting

### High Memory Usage
- Check for memory leaks
- Increase Node.js heap size: `node --max-old-space-size=4096 src/server.js`
- Monitor with `pm2 monit`

### Database Connection Issues
- Check connection pool settings
- Verify Supabase project status
- Check network connectivity
- Review connection limits

### AI Service Failures
- Verify Groq API key
- Check API quota/limits
- Implement fallback mechanism
- Cache AI responses

### High Response Times
- Enable query logging
- Check database indexes
- Profile slow endpoints
- Consider caching

## Support and Resources

- Documentation: See README.md, SETUP.md, TESTING.md
- Logs: Check LOGGING.md for log analysis
- Issues: Report bugs via GitHub issues
- Monitoring: Set up alerts and dashboards

## Checklist: Production Ready

- [x] Environment variables configured
- [x] Database migrations run
- [x] PostGIS enabled
- [x] Tests passing
- [x] Logging configured
- [x] Error handling implemented
- [x] Rate limiting active
- [x] Input validation working
- [x] Privacy protection enforced
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Alerts configured
- [ ] Load testing completed
- [ ] Security audit done

Once all items are checked, the application is ready for production deployment!
