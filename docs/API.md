# Rat Lab API Documentation

## Overview

Rat Lab provides a comprehensive API for programmatic access to all features. This enables integration with your existing tools, automation, and custom workflows.

## Authentication

All API requests require authentication via Firebase Auth token.

```typescript
// Get auth token
import { auth } from './services/firebase';
const token = await auth.currentUser?.getIdToken();
```

## Base URL

```
https://your-firebase-project.firebaseapp.com/api
```

## Endpoints

### Personas

#### Create Persona
```http
POST /personas
Content-Type: application/json
Authorization: Bearer {token}

{
  "segmentId": "string",
  "name": "string",
  "age": number,
  "occupation": "string",
  "location": "string",
  "traits": {
    "riskAversion": number,
    "lossAversion": number,
    "priceSensitivity": number,
    "cognitiveReflection": number,
    "socialConformity": number,
    "noveltySeeking": number
  }
}
```

#### List Personas
```http
GET /personas?segmentId={segmentId}
Authorization: Bearer {token}
```

#### Get Persona
```http
GET /personas/{personaId}
Authorization: Bearer {token}
```

### Segments

#### Create Segment
```http
POST /segments
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "string",
  "description": "string",
  "count": number,
  "traits": { ... },
  "grounding": { ... }
}
```

### Simulations

#### Run Simulation
```http
POST /simulations
Content-Type: application/json
Authorization: Bearer {token}

{
  "personaIds": ["string"],
  "questions": [{ ... }],
  "context": "string",
  "assets": [{ ... }]
}
```

#### Get Simulation Results
```http
GET /simulations/{simulationId}/results
Authorization: Bearer {token}
```

### Analysis

#### Generate Analysis Report
```http
POST /analysis
Content-Type: application/json
Authorization: Bearer {token}

{
  "resultIds": ["string"],
  "segments": ["string"]
}
```

## Webhooks

Configure webhooks to receive notifications when simulations complete or analysis is ready.

```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://your-app.com/webhook",
  "events": ["simulation.complete", "analysis.ready"]
}
```

## Rate Limits

- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Unlimited

## SDK Examples

### JavaScript/TypeScript

```typescript
import { RatLabClient } from '@ratlab/sdk';

const client = new RatLabClient({
  apiKey: 'your-api-key',
  projectId: 'your-project-id'
});

// Create personas
const personas = await client.personas.create({
  segmentId: 'seg-123',
  count: 10
});

// Run simulation
const results = await client.simulations.run({
  personaIds: personas.map(p => p.id),
  questions: [...],
  context: 'Product launch test'
});

// Get analysis
const analysis = await client.analysis.generate({
  resultIds: results.map(r => r.id)
});
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common error codes:
- `AUTH_REQUIRED`: Authentication token missing or invalid
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## SDKs

- JavaScript/TypeScript: `@ratlab/sdk`
- Python: `ratlab-python` (coming soon)
- Ruby: `ratlab-ruby` (coming soon)

## Support

For API support, visit: https://github.com/ratlab/ratlab/issues



