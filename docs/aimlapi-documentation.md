# AIML API Documentation

## Overview

AI/ML API provides a unified platform for accessing various AI models through a clean, standardized interface. The API supports text models (LLMs), image generation, video generation, music generation, and more, allowing developers to integrate powerful AI capabilities into their applications.

## Quickstart

Here's how to get started with the AIML API in your code:

### Generating an AIML API Key

To use the AIML API, you need to create an account and generate an API key:

1. **Create an Account**: Visit the AI/ML API website and create an account.
2. **Generate an API Key**: After logging in, navigate to your account dashboard and generate your API key. Ensure that the key is enabled in the UI.

### Configure Base URL

Depending on your environment and application, you will set the base URL differently. Use the following universal string to access the API:

```
https://api.aimlapi.com
```

The AI/ML API supports both versioned and non-versioned URLs:

* `https://api.aimlapi.com`
* `https://api.aimlapi.com/v1`

It is recommended to use versioned URLs for long-term projects to maintain stability with future API updates.

## Making Your First API Call

Based on your environment, you will call the API differently. Below are examples for NodeJS and Python.

### NodeJS Example

```javascript
const { OpenAI } = require("openai");

const baseURL = "https://api.aimlapi.com/v1";

// Insert your AIML API Key in the quotation marks instead of my_key:
const apiKey = "my_key"; 

const systemPrompt = "You are a travel agent. Be descriptive and helpful";
const userPrompt = "Tell me about San Francisco";

const api = new OpenAI({
  apiKey,
  baseURL,
});

const main = async () => {
  const completion = await api.chat.completions.create({
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 256,
  });

  const response = completion.choices[0].message.content;

  console.log("User:", userPrompt);
  console.log("AI:", response);
};

main();
```

### Python Example

```python
from openai import OpenAI

base_url = "https://api.aimlapi.com/v1"

# Insert your AIML API Key in the quotation marks instead of my_key:
api_key = "my_key" 

system_prompt = "You are a travel agent. Be descriptive and helpful."
user_prompt = "Tell me about San Francisco"

api = OpenAI(api_key=api_key, base_url=base_url)


def main():
    completion = api.chat.completions.create(
        model="mistralai/Mistral-7B-Instruct-v0.2",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=256,
    )

    response = completion.choices[0].message.content

    print("User:", user_prompt)
    print("AI:", response)


if __name__ == "__main__":
    main()
```

## Code Explanation

Both examples use the OpenAI SDK due to AIML API's compatibility with OpenAI APIs:

1. **Imports**: First, we import the OpenAI SDK
2. **Configuration**: Set the base URL and API key
3. **Prompts**: Define the system prompt (instructions) and user prompt (query)
4. **API Instance**: Create an instance of the OpenAI client with our credentials
5. **Request**: Send a request to the chat completions endpoint with:
   - Model: Specifies which AI model to use
   - Messages: Array of role-based prompts (system and user)
   - Temperature: Controls randomness (0.7 is a good balance)
   - Max Tokens: Limits the response length
6. **Response Processing**: Extract the generated content from the response
7. **Output**: Display the original query and AI's response

With the OpenAI SDK, users avoid dealing with repetitive HTTP request code. The most important components are:

- **Model**: The name of the AI model to use (e.g., `mistralai/Mistral-7B-Instruct-v0.2`)
- **Messages**: An array with system prompt and user prompt, each with a specified "role"
- **Parameters**: Settings like temperature and max_tokens to control the generation

## Model Comparison

AIML API allows comparing different models with the same prompt to evaluate their performance. Here's an example:

```javascript
const { OpenAI } = require('openai');
const { Axios } = require('axios');
const main = async () => {
  const BASE_URL = '<baseUrl>';
  const API_KEY = '<YOUR_API_KEY>';
  const axios = new Axios({
    headers: { Authorization: `Bearer ${API_KEY}` },
    baseURL: BASE_URL,
  });
  const openai = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY });
  const vendorByModel = await axios.get('/models').then((res) => JSON.parse(res.data));
  const models = Object.keys(vendorByModel);
  const shuffledModels = [...models].sort(() => Math.round(Math.random()));
  const selectedModels = shuffledModels.slice(0, 2);
  const systemPrompt = `You are an AI assistant that only responds with jokes.`;
  const userPrompt = `Why is the sky blue?`;
  for (const model of selectedModels) {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
    });
    const message = completion.choices[0].message.content;
    console.log(`--- ${model} ---`);
    console.log(`USER: ${userPrompt}`);
    console.log(`AI  : ${message}`);
  }
};
main();
```

Output example:
```
--- zero-one-ai/Yi-34B-Chat ---
USER: Why is the sky blue?
AI  : Why is the sky blue? Because it's full of blueberries!
--- allenai/OLMo-7B-Instruct ---
USER: Why is the sky blue?
AI  : Because the white sun beams enter the blue Earth's atmosphere and get dispersed, resulting in the beautiful color we call "sky blue." It's like looking at paint being blown on a canvas by the wind! Just a joke, but the real answer is physics. 😎
```

## Available Models

You can get a list of all available models through the API:

```javascript
const response = await fetch('https://api.aimlapi.com/models', {
    method: 'GET',
});

const data = await response.json();
```

Available model types include:
- Chat
- AI Web Search
- Code
- Music Generation
- Video
- Image Generation
- 3D Generation
- Embedding
- Voice
- Moderation
- Genomic Models

## Parameters

When working with LLMs, you can use various parameters to control the model's behavior:

### Frequency Penalty
Controls repetition by penalizing tokens based on how frequently they appear.
```
"frequency_penalty": 0.75  # Applies a penalty for frequently used tokens. 
```

### Log Probs
Returns log probabilities of top predicted tokens.
```
"logprobs": 4  # Returns log probabilities for the 4 most likely tokens
```

### Logit Bias
Modifies the likelihood of specified tokens appearing in the completion.

### Maximum Tokens
Limits the response length.
```
max_tokens = 50  # Limit the model to generate up to 50 tokens.
```

### Messages
List of messages comprising the conversation.
```
messages=[{"role": "system", "content": "You are a helpful assistant."},
{"role": "user", "content": "Hello!"}
]
```

### Presence Penalty
Adjusts the likelihood of including tokens that have already appeared.
```
"presence_penalty": 0.8  # Discourages token reusing
```

### Repetition Penalty
Discourages repeating the same phrases.
```
"repetition_penalty" = 1.2  # Discourages repetition
```

### Stop Sequences
Strings that signal the model to stop generating.
```
stop = ["\n"]  # Stops generation at newline character
```

### Stream
Controls whether responses are delivered token by token in real time.
```
stream = True  # Enable streaming
```

### Temperature
Controls randomness (0 = deterministic, 1 = more random).
```
temperature = 0.5  # Balance between randomness and determinism
```

### Tool Choice
Specifies how external tools are used.
```
tool_choice = "any"  # Forces tool use
```

### Tools
List of tools the model may call.

### Top P (Nucleus Sampling)
Filters token choices by cumulative probability.
```
top_p = 0.9  # Consider tokens in top 90% cumulative probability
```

### Top K (Top-K Sampling)
Limits choices to K most likely tokens.
```
top_k = 40  # Consider only top 40 most probable tokens
```

## Chat Completion

The primary way to interact with language models is through the chat completions API:

```javascript
const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "microsoft/WizardLM-2-8x22B",
      "messages": [
        {
          "role": "system",
          "content": "You are a helpful assistant."
        },
        {
          "role": "user",
          "content": "Hello!"
        }
      ],
      "temperature": 0.7,
      "max_tokens": 512
    })
});

const data = await response.json();
```

Python example:
```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.aimlapi.com/v1",
    api_key="<YOUR_API_KEY>",  
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": "You are an AI assistant who knows everything.",
        },
        {
            "role": "user",
            "content": "Why do the seasons change?"
        },
    ],
)

message = response.choices[0].message.content
print(f"Assistant: {message}")
```

## Completion vs Chat Models

### What is a Completion
At a basic level, a text model predicts the next token or character. For example, given the prompt "A long time ago, there were three princesses in a distant kingdom:", the model completes it with additional text.

### What is a Chat Completion
Chat models are trained to return data in a specific format, typically with different roles (system, user, assistant) to create a conversational experience. The API handles the parsing of this information into a format that can be easily used in code.

## Function Calling

Function calling allows models to interact with external tools and APIs:

```python
import os
import json
import openai

client = openai.OpenAI(
    base_url="https://api.aimlapi.com/v1",
    api_key='AI_ML_API',
)

tools = [
  {
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
        }
      }
    }
  }
]

messages = [
    {"role": "system", "content": "You are a helpful assistant that can access external functions. The responses from these function calls will be appended to this dialogue. Please provide responses based on the information from these function calls."},
    {"role": "user", "content": "What is the current temperature of New York, San Francisco, and Chicago?"}
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)

print(json.dumps(response.choices[0].message.model_dump()['tool_calls'], indent=2))
```

### Anthropic Claude Models Function Calling

Anthropic Claude models also support function calling with a slightly different format:

```javascript
const response = await fetch('https://api.aimlapi.com/messages', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "claude-3-5-sonnet-20240620",
      "max_tokens": 1024,
      "tools": [
        {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "input_schema": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              }
            }
          }
        }
      ],
      "messages": [
        {
          "role": "user",
          "content": "What is the weather like in San Francisco?"
        }
      ],
      "stream": false
    })
});
```

## Assistants and Threads API

The Assistants and Threads API provides a way to manage conversational history and state:

### Creating an Assistant

```javascript
const assistant = await api.beta.assistants.create({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      name: 'Funny assistant',
      description: 'Replies only with jokes',
      instructions: 'Reply to user only with jokes',
});
```

### Creating and Using Threads

```javascript
// Empty thread
const thread = await api.beta.threads.create({ messages: [] });
await api.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: text,
      metadata: {
        userId: 'example-1',
      },
 });
await api.beta.threads.runs.createAndPoll(thread.id, { assistant_id: assistantId });
const messages = await api.beta.threads.messages.list(thread.id, { order: 'desc', limit: 1 });
const msg = messages.data[0].content.find((item) => item.type === 'text').text.value;
console.log(`Assistant: ${msg}`);
```

### API Reference for Assistants

```javascript
// Create an assistant
const response = await fetch('https://api.aimlapi.com/assistants', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "name": "My Assistant",
      "description": "A helpful assistant",
      "instructions": "Be concise and friendly",
      "model": "mistralai/Mistral-7B-Instruct-v0.1"
    })
});

// Get assistants
const response = await fetch('https://api.aimlapi.com/assistants', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    }
});

// Get a specific assistant
const response = await fetch('https://api.aimlapi.com/assistants/{assistantId}', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    }
});

// Update an assistant
const response = await fetch('https://api.aimlapi.com/assistants/{assistantId}', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "name": "Updated Assistant Name",
      "description": "Updated description",
      "instructions": "New instructions",
      "model": "mistralai/Mistral-7B-Instruct-v0.1"
    })
});

// Delete an assistant
const response = await fetch('https://api.aimlapi.com/assistants/{assistantId}', {
    method: 'DELETE',
    headers: {
      "Authorization": "Bearer JWT"
    }
});
```

### API Reference for Threads

```javascript
// Create a thread
const response = await fetch('https://api.aimlapi.com/threads', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "metadata": {},
      "messages": [
        {
          "content": "Hello, how can you help me?",
          "role": "user",
          "metadata": {}
        }
      ]
    })
});

// Get a thread
const response = await fetch('https://api.aimlapi.com/threads/{threadId}', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    }
});

// Update a thread
const response = await fetch('https://api.aimlapi.com/threads/{threadId}', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "metadata": {}
    })
});

// Delete a thread
const response = await fetch('https://api.aimlapi.com/threads/{threadId}', {
    method: 'DELETE',
    headers: {
      "Authorization": "Bearer JWT"
    }
});
```

### Runs API

```javascript
// List runs
const response = await fetch('https://api.aimlapi.com/threads/{threadId}/runs', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    }
});

// Create a run
const response = await fetch('https://api.aimlapi.com/threads/{threadId}/runs', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
      "stream": true,
      "metadata": {}
    })
});

// Get a specific run
const response = await fetch('https://api.aimlapi.com/threads/{threadId}/runs/{runId}', {
    method: 'GET',
    headers: {
      "Authorization": "Bearer JWT"
    }
});

// Update a run
const response = await fetch('https://api.aimlapi.com/threads/{threadId}/runs/{runId}', {
    method: 'POST',
    headers: {
      "Authorization": "Bearer JWT",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "metadata": {}
    })
});
```

## Embeddings

AIML API offers embeddings to quantify similarity between text strings, useful for search, clustering, recommendations, and more:

```javascript
curl https://api.aimlapi.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AIMLAPI_API_KEY" \
  -d '{
    "input": "Your text string goes here",
    "model": "text-embedding-3-small"
  }'
```

Response:
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.006929283495992422,
        -0.005336422007530928,
        // ...(omitted for spacing)
        -4.547132266452536e-05,
        -0.024047505110502243
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 5,
    "total_tokens": 5
  }
}
```

Python example:
```python
import os
import json
import openai

# Initialize the API client
client = openai.OpenAI(
    base_url="https://api.aimlapi.com/v1",
    api_key=os.getenv("AIMLAPI_API_KEY"),
)

# Define the text for which to generate an embedding
text = "Your text string goes here"

# Request the embedding
response = client.embeddings.create(
    input=text,
    model="text-embedding-3-small"
)

# Extract the embedding from the response
embedding = response['data'][0]['embedding']

# Print the embedding
print(json.dumps(embedding, indent=2))
```

### Available Embedding Models

| Model | ~ Pages per Dollar | Performance on MTEB Eval | Max Input Tokens |
|-------|-------------------|--------------------------|------------------|
| text-embedding-3-small | 62,500 | 62.3% | 8191 |
| text-embedding-3-large | 9,615 | 64.6% | 8191 |
| text-embedding-ada-002 | 12,500 | 61.0% | 8191 |

## Available Models

AIML API offers a wide range of models across different categories:

### Code Models
- Qwen 2.5 Coder 32B Instruct
- Mistral Codestral-2501
- Code Llama (70B)
- Replit-Code-v1 (3B)
- CodeGen2 (16B)
- CodeGen2 (7B)
- StarCoder (16B)
- SQLCoder (15B)
- Phind Code LLaMA v2 (34B)
- WizardCoder Python v1.0 (34B)
- Code Llama Instruct (34B)
- Code Llama Instruct (7B)
- Code Llama Python (13B)
- Code Llama Instruct (13B)
- Code Llama Python (34B)
- Code Llama Python (7B)
- Deepseek Coder Instruct (33B)
- Code Llama Python (70B)
- Code Llama Instruct (70B)

### Chat Models
Various models from providers including:
- Bagoodex
- Alibaba Cloud
- Meta
- Google
- Qwen
- OpenAI
- Hailuo AI
- Kuaishou Technology
- DeepSeek
- Mistral AI
- Stability AI
- Microsoft
- Runway
- Black Forest Labs
- Anthropic
- AI21 Labs
- NVIDIA
- Anthracite
- NeverSleep
- Cohere
- EVA-UNIT-01
- xAI
- RecraftAI
- Haotian Liu
- Snowflake
- Together
- NousResearch
- Gradient
- Luma AI
- Voyage AI
- Deepgram
- Replit
- University of Washington NLP
- Mosaic ML
- Salesforce
- lmsys
- BAIR

### Context Window Sizes
Models are available with various context window sizes:
- 32K
- 4K
- 64K
- 8K
- 16K
- 2K
- 512
- 3K
- 32
- 77
- 256
- 1M
- 131K
- 128K
- 200K

### Model Sizes
Models range from small to extremely large:
- 1.2B
- 6B
- 7B
- 0.11B
- 0.34B
- 13B
- 70B
- 34B
- 16B
- 132B
- 671B
- 33B
- 67B
- 46.7B
- 12B
- 3B
- 14B
- 40B
- 20B
- 2B
- 27B
- 9B
- 65B
- 52B
- 8B
- 405B
- 11B
- 90B
- 0.08B
- 30B
- 72B
- 2.78B
- 456B 