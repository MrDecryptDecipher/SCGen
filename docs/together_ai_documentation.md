# Together AI Documentation

## Introduction

Together AI is a powerful platform that enables running and fine-tuning leading open-source models with minimal code. The platform offers several key services:

- **Serverless Models**: Run dozens of models via API or playground with pay-as-you-go pricing
- **Fine-Tuning**: Fine-tune models on custom data in 5 minutes
- **Dedicated Endpoints**: Private GPU access with minimum 1-month commitment
- **GPU Clusters**: State-of-the-art clusters with H100 GPUs for private use

### Example Applications

Together AI has built several production-ready, open-source example apps with over 500k users & 10k GitHub stars combined:

- **LlamaCoder** ([GitHub](https://github.com/together-ai/llamacoder)): OSS Claude artifacts for generating full React apps from a single prompt using Llama 3.1 405B
- **BlinkShot** ([GitHub](https://github.com/together-ai/blinkshot)): Realtime AI image generator using Flux Schnell
- **TurboSeek** ([GitHub](https://github.com/together-ai/turboseek)): AI search engine inspired by Perplexity using Serper and Mixtral
- **Napkins.dev** ([GitHub](https://github.com/together-ai/napkins)): Wireframe to app tool using Llama 3.2 vision and Llama 3.1 405B
- **PDFToChat** ([GitHub](https://github.com/together-ai/pdftochat)): Chat with PDFs using RAG with Together embeddings and Llama 3
- **LlamaTutor** ([GitHub](https://github.com/together-ai/llamatutor)): Personal tutor using search API with Llama 3.1
- **NotesGPT** ([GitHub](https://github.com/together-ai/notesgpt)): AI note taker for voice notes using Mixtral with JSON mode
- **CareerExplorer** ([GitHub](https://github.com/together-ai/careerexplorer)): Career path suggestion tool using Llama 3

## Available Models

### Chat Models

Together AI hosts numerous chat models with different capabilities and configurations:

#### Featured Models:
- **Llama 3.3 70B Turbo** (Recommended): `meta-llama/Llama-3.3-70B-Instruct-Turbo`
  - Context length: 131072
  - Quantization: FP8
  
- **DeepSeek-R1**: `deepseek-ai/DeepSeek-R1`
  - Context length: 128000
  - Quantization: FP8
  
- **Mixtral-8x7B Instruct**: `mistralai/Mixtral-8x7B-Instruct-v0.1`
  - Context length: 32768
  - Quantization: FP16

#### Additional Chat Models:
- **Meta Models**:
  - Llama 3.1 Series (8B, 70B, 405B)
  - Llama 3.2 Series
  - Llama 3 Series with Lite (INT4) versions
- **DeepSeek Models**:
  - DeepSeek-R1 Distill variants (Llama 70B, Qwen 1.5B, 14B)
  - DeepSeek-V3
- **Mistral Models**:
  - Mistral Small 3 Instruct (24B)
  - Mistral (7B) Instruct v0.1-v0.3
  - Mixtral-8x22B Instruct (141B)
- **Qwen Models**:
  - Qwen 2.5 Series (7B, 72B)
  - Qwen 2 VL Series

### Vision Models

For vision-related tasks, Together AI offers:

- **Free Tier**: `meta-llama/Llama-Vision-Free`
- **Premium Models**:
  - Llama 3.2 11B Vision Instruct Turbo (Recommended)
  - Llama 3.2 90B Vision Instruct Turbo
  - Qwen2 Vision Language 72B Instruct

### Image Models

Together AI supports various image generation models:

#### Flux Models:
- **Flux.1 [schnell]**: 
  - Free version (with reduced rate limits)
  - Turbo version (4 default steps)
  - Dev version (28 default steps)
  - Pro version
- **Specialized Flux Models**:
  - Flux.1 Canny
  - Flux.1 Depth
  - Flux.1 Redux
- **Stability AI**:
  - Stable Diffusion XL 1.0

#### FLUX Pricing Structure:
- Based on image size (megapixels) and steps used
- Cost = MP × Price per MP × (Steps ÷ Default Steps)
- MP = (Width × Height ÷ 1,000,000)

### Audio Models

- **Cartesia/Sonic**: Available through the Audio endpoint

### Code Models

Available through the Completions endpoint:
- **Qwen 2.5 Coder 32B Instruct**
- **Code Llama** series:
  - Python variants (7B, 13B, 34B, 70B)
  - Standard variants (7B, 13B, 34B, 70B)
- **Specialized Code Models**:
  - NSQL LLaMA-2
  - Phind Code LLaMA variants
  - WizardCoder Python

### Embedding Models

Comprehensive range of embedding models:

- **M2-BERT Series**:
  - 2K Retrieval (768 dimensions)
  - 8K Retrieval (768 dimensions)
  - 32K Retrieval (768 dimensions)
- **UAE-Large-v1**: 1024 dimensions
- **BGE Models**:
  - Large-EN-v1.5 (1024 dimensions)
  - Base-EN-v1.5 (768 dimensions)

### Rerank Models

- **Salesforce/Llama-Rank-v1**:
  - Max Doc Size: 8192 tokens
  - Max Docs: 1024

### Moderation Models

- **Llama Guard Series**:
  - Meta Llama Guard 3 8B
  - Meta Llama Guard 2 8B
  - Meta Llama Guard 3 11B Vision Turbo
  - Llama Guard (7B)

## API Usage

### Basic Chat Example

```python
from together import Together

together = Together()

response = together.chat.completions.create(
    model="meta-llama/Meta-Llama-3-8B-Instruct-Turbo",
    messages=[{"role": "user", "content": "What are some fun things to do in New York?"}]
)

print(response.choices[0].message.content)
```

### Long-Running Conversations

```python
response = together.chat.completions.create(
    model="meta-llama/Meta-Llama-3-8B-Instruct-Turbo",
    messages=[
        {"role": "system", "content": "You are a helpful travel guide."},
        {"role": "user", "content": "What are some fun things to do in New York?"},
        {"role": "assistant", "content": "You could go to the Empire State Building!"},
        {"role": "user", "content": "That sounds fun! Where is it?"},
    ]
)
```

### Streaming Responses

```python
stream = together.chat.completions.create(
    model="meta-llama/Llama-3-8b-chat-hf",
    messages=[{"role": "user", "content": "What are some fun things to do in New York?"}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")
```

### Async Support

```python
from together import AsyncTogether
import asyncio

async_client = AsyncTogether()

async def async_chat_completion(messages):
    tasks = [
        async_client.chat.completions.create(
            model="mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages=[{"role": "user", "content": message}]
        )
        for message in messages
    ]
    responses = await asyncio.gather(*tasks)
    return responses
```

### OpenAI Compatibility

Together's API is compatible with OpenAI's libraries:

```python
import openai

client = openai.OpenAI(
    api_key="your-together-api-key",
    base_url="https://api.together.xyz/v1"
)

response = client.chat.completions.create(
    model="meta-llama/Llama-3-8b-chat-hf",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## Special Features

### DeepSeek-R1 Reasoning Model

DeepSeek-R1 is a specialized model for complex reasoning tasks:

#### Best Practices:
- Temperature: 0.5-0.7 (recommended: 0.6)
- No system prompts needed
- Avoid few-shot prompting
- Use clear, specific prompts
- Structure prompts with clear markers (XML tags, markdown)
- For math tasks, include directive: "Please reason step by step, and put your final answer within \boxed{}"

#### Ideal Use Cases:
- LLM output evaluation
- Code analysis and review
- Strategic planning
- Document analysis
- Information extraction
- Ambiguity resolution
- Complex reasoning tasks

#### Limitations:
- Not optimized for:
  - Function calling
  - Multi-turn conversation
  - Complex role-playing
  - JSON output

### JSON Mode

Available for select models like Llama 3.1, JSON mode ensures structured outputs conforming to provided schemas:

```python
response = together.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    messages=[...],
    response_format={"type": "json_object"}
)
```

## Together Reasoning Clusters

For high-performance compute requirements:

- Speeds up to 110 tokens/sec with no rate limits
- Custom optimizations for traffic profiles
- Predictable pricing for scaling
- Enterprise SLAs (99.9% uptime)
- Secure deployments with full data control

## Rate Limits and Pricing

### Standard Rate Limits:
- Free and Tier 1 users: 1.2-3 RPM for specific models
- Build Tier 1+ users: 240 RPM
- Custom limits for BT 5/Enterprise/Scale

### FLUX Image Generation Pricing:
- Based on megapixels and steps used
- Default steps pricing with proportional increase for additional steps
- No cost reduction for fewer steps

## Security and Privacy

- Models hosted on secure, North America-based data centers
- No data sharing with model providers
- Full opt-out privacy controls
- Enterprise SLAs with 99.9% uptime
- No data sent to China or external providers

## Getting Started

1. Register for an account (includes $1 credit)
2. Set API key as environment variable: `export TOGETHER_API_KEY=xxxxx`
3. Install preferred library:
   - Python: `pip install together-ai`
   - TypeScript: `npm install together-ai`
   - Or use HTTP API directly

## Resources

- [Discord Community](https://discord.gg/together)
- [Together Cookbook](https://github.com/together-ai/cookbook)
- [API Documentation](https://docs.together.ai)
- [Pricing Information](https://www.together.ai/pricing)
- [Example Applications](https://github.com/together-ai)
- [Together AI Playground](https://play.together.ai)
