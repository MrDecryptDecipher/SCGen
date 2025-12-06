# API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
All API requests require appropriate API keys to be set in the environment variables:
- `ALCHEMY_API_KEY`: For Ethereum network interactions
- `OPENROUTER_API_KEY`: For AI model access

## Endpoints

### Contract Generation

#### Generate Smart Contract
```http
POST /api/generate
```

Request body:
```json
{
  "entityType": "PRIVATE LIMITED COMPANY",
  "transactionType": "B2B",
  "contractType": "Equity Tokenization",
  "customizations": {
    "tokenName": "CompanyEquity",
    "tokenSymbol": "CEQT",
    "initialSupply": "1000000"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "analysis": "string",
    "code": "string",
    "security": {
      "vulnerabilities": ["string"],
      "recommendations": ["string"]
    },
    "gasAnalysis": [
      {
        "functionName": "string",
        "estimatedGas": "number",
        "recommendations": ["string"]
      }
    ],
    "vulnerabilityScan": [
      {
        "severity": "HIGH|MEDIUM|LOW",
        "description": "string",
        "location": "string",
        "recommendation": "string"
      }
    ]
  },
  "processingTime": "number"
}
```

### Oracle Integration

#### Test Oracle Connection
```http
GET /api/test/oracle/:network
```

Parameters:
- `network`: Network name (sepolia, mainnet, holesky)

Response:
```json
{
  "success": true,
  "data": {
    "network": "string",
    "priceFeed": {
      "address": "string",
      "roundId": "string",
      "price": "string",
      "timestamp": "string"
    }
  }
}
```

### Analytics

#### Get Contract Analytics
```http
GET /api/test/analytics/:contractAddress
```

Parameters:
- `contractAddress`: Deployed contract address
- `network` (query): Network name (default: sepolia)

Response:
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalTransactions": "string",
      "totalVolume": "string",
      "lastActivityTime": "string",
      "todayVolume": "string"
    }
  }
}
```

### Gas Estimation

#### Estimate Contract Gas Usage
```http
POST /api/test/gas-estimation
```

Request body:
```json
{
  "contractCode": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "gasAnalysis": [
      {
        "functionName": "string",
        "estimatedGas": "string",
        "recommendations": ["string"]
      }
    ],
    "securityScan": [
      {
        "severity": "HIGH|MEDIUM|LOW",
        "description": "string",
        "location": "string",
        "recommendation": "string"
      }
    ],
    "deploymentGas": "string"
  }
}
```

### Health Check

#### Check Server Status
```http
GET /health
```

Response:
```json
{
  "status": "healthy"
}
```

## Error Handling

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common error codes:
- `400`: Bad Request
- `401`: Unauthorized (Invalid API key)
- `402`: Payment Required (API credit limit exceeded)
- `429`: Too Many Requests (Rate limit exceeded)
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting with the following defaults:
- 100 requests per 15 minutes per IP
- Burst: 50 requests

## Websocket Events

The system also provides real-time updates through WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle different event types
  switch(data.type) {
    case 'contractGenerated':
      // Handle contract generation
      break;
    case 'oracleUpdate':
      // Handle Oracle data update
      break;
    case 'analyticsUpdate':
      // Handle analytics update
      break;
  }
};
```

## Examples

### Generate a Contract
```javascript
const response = await fetch('http://localhost:3001/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entityType: 'PRIVATE LIMITED COMPANY',
    transactionType: 'B2B',
    contractType: 'Equity Tokenization',
    customizations: {
      tokenName: 'CompanyEquity',
      tokenSymbol: 'CEQT',
      initialSupply: '1000000'
    }
  })
});

const data = await response.json();
console.log(data);
```

### Test Oracle Integration
```javascript
const network = 'sepolia';
const response = await fetch(`http://localhost:3001/api/test/oracle/${network}`);
const data = await response.json();
console.log(data);
```

### Get Contract Analytics
```javascript
const contractAddress = '0x...';
const response = await fetch(`http://localhost:3001/api/test/analytics/${contractAddress}?network=sepolia`);
const data = await response.json();
console.log(data);
``` 