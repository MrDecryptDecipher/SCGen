import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3002;

// Middleware
app.use(cors({
  origin: [
    'http://13.126.230.108:3000',
    'http://localhost:3000',
    'http://172.26.6.21:3000'
  ],
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Types
interface ContractRequest {
  entityType: string;
  transactionType: string;
  contractType: string;
  customizations?: Record<string, any>;
}

interface AIResponse {
  analysis: string;
  code: string;
  security: {
    vulnerabilities: string[];
    recommendations: string[];
  };
}

// AI Processing Pipeline
async function processWithPersona(
  prompt: string,
  persona: 'nanjunda' | 'achyutha' | 'sandeep'
): Promise<string> {
  const personaPrompts = {
    nanjunda: 'As Nanjunda, analyze the contract requirements and provide detailed insights: ',
    achyutha: 'As Achyutha, optimize and generate the smart contract code with best practices: ',
    sandeep: 'As Sandeep, perform security analysis and ensure compliance: '
  };

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'anthropic/claude-2',
      messages: [
        {
          role: 'system',
          content: `You are ${persona}, an expert in smart contract ${
            persona === 'nanjunda' ? 'analysis' : 
            persona === 'achyutha' ? 'development' : 
            'security'
          }.`
        },
        {
          role: 'user',
          content: personaPrompts[persona] + prompt
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

// Contract generation endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { entityType, transactionType, contractType, customizations } = req.body as ContractRequest;
    
    const basePrompt = `
      Entity Type: ${entityType}
      Transaction Type: ${transactionType}
      Contract Type: ${contractType}
      Additional Customizations: ${JSON.stringify(customizations)}
    `;

    // Sequential processing through personas
    const analysis = await processWithPersona(basePrompt, 'nanjunda');
    const code = await processWithPersona(analysis, 'achyutha');
    const security = await processWithPersona(code, 'sandeep');

    const result: AIResponse = {
      analysis,
      code,
      security: {
        vulnerabilities: extractVulnerabilities(security),
        recommendations: extractRecommendations(security)
      }
    };

    res.json({
      success: true,
      contract: code, // Send just the contract code for now
      result // Include full result for debugging
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate contract'
    });
  }
});

function extractVulnerabilities(securityAnalysis: string): string[] {
  // Implementation to extract vulnerabilities from security analysis
  return securityAnalysis.split('\n')
    .filter(line => line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('risk'))
    .map(line => line.trim());
}

function extractRecommendations(securityAnalysis: string): string[] {
  // Implementation to extract recommendations from security analysis
  return securityAnalysis.split('\n')
    .filter(line => line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest'))
    .map(line => line.trim());
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Access via:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Public: http://13.126.230.108:${port}`);
});