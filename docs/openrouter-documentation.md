# OpenRouter Documentation

## Overview

OpenRouter provides a unified API that gives you access to hundreds of AI models through a single endpoint, while automatically handling fallbacks and selecting the most cost-effective options.

## Quickstart

Get started with OpenRouter using your preferred SDK or framework.

### Using the OpenAI SDK

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '<OPENROUTER_API_KEY>',
  defaultHeaders: {
    'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
  },
});
async function main() {
  const completion = await openai.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the meaning of life?',
      },
    ],
  });
  console.log(completion.choices[0].message);
}
main();
```

### Using the OpenRouter API directly

```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the meaning of life?',
      },
    ],
  }),
});
```

## Core Features

### Provider Routing

OpenRouter routes requests to the best available providers for your model. By default, requests are load balanced across the top providers to maximize uptime.

You can customize how your requests are routed using the provider object:

```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <OPENROUTER_API_KEY>',
    'HTTP-Referer': '<YOUR_SITE_URL>',
    'X-Title': '<YOUR_SITE_NAME>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    'model': 'meta-llama/llama-3.1-70b-instruct',
    'messages': [
      {
        'role': 'user',
        'content': 'Hello'
      }
    ],
    'provider': {
      'sort': 'throughput'
    }
  }),
});
```

#### Provider Options

- `order`: List of provider names to try in order (e.g. ["Anthropic", "OpenAI"])
- `allow_fallbacks`: Whether to allow backup providers when the primary is unavailable (default: true)
- `require_parameters`: Only use providers that support all parameters in your request (default: false)
- `data_collection`: Control whether to use providers that may store data ("allow" or "deny", default: "allow")
- `ignore`: List of provider names to skip for this request
- `quantizations`: List of quantization levels to filter by (e.g. ["int4", "int8"])
- `sort`: Sort providers by "price" or "throughput"

#### Shortcuts

- `:nitro` - Append to model slug as a shortcut to sort by throughput
- `:floor` - Append to model slug as a shortcut to sort by price

Example:
```typescript
{
  'model': 'meta-llama/llama-3.1-70b-instruct:nitro',
}
```

### Model Routing

OpenRouter provides two options for model routing:

1. **Auto Router**: A special model ID that automatically chooses between selected high-quality models
```json
{
  "model": "openrouter/auto"
}
```

2. **The models parameter**: Automatically try other models if the primary model is unavailable
```json
{
  "models": ["anthropic/claude-3.5-sonnet", "gryphe/mythomax-l2-13b"]
}
```

### Free Tier Models

OpenRouter offers free tier models that can be accessed by using models with the `:free` suffix or models that explicitly include "free" in their name.

Recommended free tier models:
- `mistralai/mistral-small-3-free`
- `perplexity/llama-3-8b-instruct`

### Prompt Caching

To save on inference costs, you can enable prompt caching on supported providers and models.

#### OpenAI
- Cache writes: no cost
- Cache reads: charged at 0.5x the price of the original input pricing

#### Anthropic Claude
- Cache writes: charged at 1.25x the price of the original input pricing
- Cache reads: charged at 0.1x the price of the original input pricing

### Structured Outputs

OpenRouter supports structured outputs for compatible models. You can include a `response_format` parameter with `type` set to `json_schema`:

```json
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "weather",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City or location name"
          },
          "temperature": {
            "type": "number",
            "description": "Temperature in Celsius"
          },
          "conditions": {
            "type": "string",
            "description": "Weather conditions description"
          }
        },
        "required": ["location", "temperature", "conditions"],
        "additionalProperties": false
      }
    }
  }
}
```

### Message Transforms

To help with prompts that exceed the maximum context size of a model, OpenRouter supports the `transforms` parameter:

```json
{
  "transforms": ["middle-out"],
  "messages": [...],
  "model": "..." 
}
```

### Web Search

You can incorporate relevant web search results by activating the web plugin or by appending `:online` to the model slug:

```json
{
  "model": "openai/gpt-4o:online"
}
```

## API Reference

### Authentication

OpenRouter uses Bearer tokens for authentication:

```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'Content-Type': 'application/json',
  },
  // ...
});
```

### Parameters

#### Common Parameters

- `temperature` (0.0 to 2.0, default: 1.0): Controls randomness in the output
- `top_p` (0.0 to 1.0, default: 1.0): Limits token choices to a percentage of likely tokens
- `top_k` (0 or above, default: 0): Limits the model's token choices at each step
- `frequency_penalty` (-2.0 to 2.0, default: 0.0): Adjusts token repetition based on frequency
- `presence_penalty` (-2.0 to 2.0, default: 0.0): Adjusts token repetition based on presence
- `repetition_penalty` (0.0 to 2.0, default: 1.0): Helps reduce repetition of tokens
- `max_tokens` (1 or above): Maximum number of tokens to generate
- `stop` (string or string[]): Stop generation when specific tokens are encountered
- `seed` (integer): Makes generation deterministic with the same seed

#### Advanced Parameters

- `min_p` (0.0 to 1.0, default: 0.0): Minimum probability threshold for tokens
- `top_a` (0.0 to 1.0, default: 0.0): Dynamic filter based on the highest probability token
- `logit_bias` (map): Adjusts likelihood of specific tokens
- `logprobs` (boolean): Returns log probabilities of output tokens
- `response_format` (map): Forces specific output format

### Streaming

To enable streaming, you can set the `stream` parameter to true:

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${<OPENROUTER_API_KEY>}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: question }],
    stream: true,
  }),
});

const reader = response.body?.getReader();
// Process stream...
```

### Tool Calls

Tool calls allow you to give an LLM access to external tools:

```json
{
  "messages": [{
    "role": "user",
    "content": "What is the weather like in Boston?"
  }],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": [
              "celsius",
              "fahrenheit"
            ]
          }
        },
        "required": [
          "location"
        ]
      }
    }
  }]
}
```

### Rate Limits

Rate limits are a function of the number of credits remaining on the key or account. For the credits available on your API key, you can make 1 request per credit per second up to the surge limit (typically 500 requests per second).

For example:
- 0.5 credits → 1 req/s (minimum)
- 5 credits → 5 req/s
- 10 credits → 10 req/s
- 500 credits → 500 req/s

Free limit: If you are using a free model variant (with an ID ending in `:free`), then you will be limited to 20 requests per minute and 200 requests per day.

### Error Handling

For errors, OpenRouter returns a JSON response with the following shape:

```typescript
type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};
```

Common error codes:
- 400: Bad Request (invalid or missing params, CORS)
- 401: Invalid credentials (OAuth session expired, disabled/invalid API key)
- 402: Your account or API key has insufficient credits
- 403: Your chosen model requires moderation and your input was flagged
- 408: Your request timed out
- 429: You are being rate limited
- 502: Your chosen model is down or we received an invalid response from it
- 503: There is no available model provider that meets your routing requirements

## Endpoints

### Chat Completions
`POST https://openrouter.ai/api/v1/chat/completions`

### Text Completions
`POST https://openrouter.ai/api/v1/completions`

### Get Generation Details
`GET https://openrouter.ai/api/v1/generation?id={generation_id}`

### List Available Models
`GET https://openrouter.ai/api/v1/models`

### List Endpoints for a Model
`GET https://openrouter.ai/api/v1/models/:author/:slug/endpoints`

## Implementation Best Practices

### API Key Format
- OpenRouter API keys always start with `sk-or-v1-`
- Example: `sk-or-v1-abc123...`

### Handling Authentication Errors
When you receive a 401 error:
1. Verify your API key starts with `sk-or-v1-`
2. Check that your account is properly set up
3. Ensure your API key hasn't expired or been revoked

### Using Free Tier Models Effectively
- Always specify a free tier model explicitly
- Recommended models: `mistralai/mistral-small-3-free` or `perplexity/llama-3-8b-instruct`
- Set longer timeouts (3-5 minutes) for free tier requests
- Implement proper retry logic with incremental backoff

### Rate Limit Handling
- Implement exponential backoff for 429 errors
- Track daily usage to stay under the 200 requests per day limit for free tier
- Consider caching responses for identical prompts

### Security Considerations
- Never expose your API key in client-side code
- Use server-side proxies for all OpenRouter API calls
- Implement proper input validation and sanitization

## Troubleshooting Common Issues

### Authentication Problems
- **Error 401**: Make sure your API key starts with `sk-or-v1-`
- **No API Response**: Verify your account is properly set up and activated

### Rate Limiting
- **Error 429**: You're exceeding the rate limits. Implement backoff strategy.
- **Error 402**: Your account has insufficient credits

### Model Availability
- **Error 503**: No provider is available that meets your routing requirements
- **Error 502**: The selected model is currently down

### Response Format Issues
- Check that your `response_format` is compatible with the selected model
- Not all models support structured JSON output equally well

## Additional Resources

### OpenRouter Dashboard
- Manage your API keys: https://openrouter.ai/keys
- Check usage and billing: https://openrouter.ai/activity
- Browse available models: https://openrouter.ai/models

### Community and Support
- Discord: https://discord.gg/openrouter
- Documentation: https://openrouter.ai/docs
- GitHub: https://github.com/openrouter-dev/openrouter

### Reference Implementations
- Node.js: https://github.com/openrouter-dev/openrouter-node
- Python: https://github.com/openrouter-dev/openrouter-python 