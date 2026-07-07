# Self-Hosting Rat Lab

## Overview

Rat Lab is designed to be self-hostable, giving you complete control over your data and infrastructure. This guide walks you through deploying Rat Lab on your own servers.

## Why Self-Host?

- **Data Sovereignty**: Keep your research data on your infrastructure
- **Privacy**: No third-party access to sensitive market research
- **Customization**: Modify code to match your exact needs
- **Cost Control**: Avoid per-user pricing, pay only for infrastructure
- **Compliance**: Meet GDPR, HIPAA, or other regulatory requirements

## Prerequisites

- Node.js 18+ and npm
- Firebase project (or alternative backend)
- OpenAI API key
- Domain name (optional, for production)

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-org/rat-lab
   cd rat-lab
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Set environment variables in Vercel dashboard**

5. **Configure Firebase**
   - Add your Vercel domain to Firebase authorized domains
   - Update Firestore security rules

### Option 2: Docker

1. **Build Docker image**
   ```bash
   docker build -t rat-lab .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 \
     -e VITE_OPENAI_API_KEY=your-key \
     -e VITE_FIREBASE_API_KEY=your-key \
     rat-lab
   ```

3. **Use Docker Compose for production**
   ```yaml
   version: '3.8'
   services:
     rat-lab:
       build: .
       ports:
         - "3000:3000"
       environment:
         - VITE_OPENAI_API_KEY=${OPENAI_API_KEY}
         - VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}
       restart: unless-stopped
   ```

### Option 3: Traditional Server

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Serve with nginx**
   ```nginx
   server {
       listen 80;
       server_name rat-lab.yourdomain.com;
       
       root /path/to/rat-lab/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Firebase Setup

### Self-Hosted Firebase Alternative

If you want complete data sovereignty, you can replace Firebase with:

1. **Supabase** (PostgreSQL + Auth)
2. **Self-hosted PostgreSQL + Auth service**
3. **Custom backend API**

See `docs/FIREBASE_ALTERNATIVE.md` for migration guide.

## Environment Variables

Required variables:

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Firebase (or alternative)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Optional
VITE_MODEL_PERSONA=gpt-4-turbo-preview
VITE_MODEL_SURVEY=gpt-4-turbo-preview
VITE_MODEL_ANALYSIS=gpt-4-turbo-preview
```

## Security Considerations

1. **API Keys**: Never commit API keys to git
2. **Firestore Rules**: Configure strict security rules
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Backups**: Set up regular database backups

## Scaling

### Horizontal Scaling

- Use load balancer (nginx, Cloudflare)
- Multiple instances behind load balancer
- Shared Firebase/Firestore backend

### Database Scaling

- Firestore scales automatically
- For PostgreSQL: Use read replicas
- Consider caching layer (Redis)

## Monitoring

### Recommended Tools

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry, Rollbar
- **Analytics**: Plausible, PostHog
- **Logs**: Logtail, Datadog

### Health Check Endpoint

```typescript
// Add to your deployment
GET /health
Response: { "status": "ok", "timestamp": "..." }
```

## Backup & Recovery

### Firestore Backup

```bash
# Export data
gcloud firestore export gs://your-bucket/backup

# Import data
gcloud firestore import gs://your-bucket/backup
```

### Manual Backup

1. Export Firestore data via Firebase Console
2. Download user uploads from Storage
3. Store securely (encrypted)

## Updates

### Updating Rat Lab

```bash
git pull origin main
npm install
npm run build
# Restart your server/containers
```

### Database Migrations

Rat Lab uses Firestore which doesn't require migrations. For schema changes:

1. Update TypeScript types
2. Add migration scripts if needed
3. Test thoroughly before deploying

## Support

For self-hosting support:
- GitHub Issues: https://github.com/ratlab/ratlab/issues
- Documentation: https://ratlab.dev/docs
- Community: https://discord.gg/ratlab

## Enterprise Support

Need help with enterprise deployment? Contact: enterprise@ratlab.dev



