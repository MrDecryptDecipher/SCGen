"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3002;
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'http://13.126.230.108:3000',
        'http://localhost:3000',
        'http://172.26.6.21:3000'
    ],
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// AI Processing Pipeline
async function processWithPersona(prompt, persona) {
    const personaPrompts = {
        nanjunda: 'As Nanjunda, analyze the contract requirements and provide detailed insights: ',
        achyutha: 'As Achyutha, optimize and generate the smart contract code with best practices: ',
        sandeep: 'As Sandeep, perform security analysis and ensure compliance: '
    };
    const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'anthropic/claude-2',
        messages: [
            {
                role: 'system',
                content: `You are ${persona}, an expert in smart contract ${persona === 'nanjunda' ? 'analysis' :
                    persona === 'achyutha' ? 'development' :
                        'security'}.`
            },
            {
                role: 'user',
                content: personaPrompts[persona] + prompt
            }
        ]
    }, {
        headers: {
            'Authorization': `Bearer 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`,
            'Content-Type': 'application/json'
        }
    });
    return response.data.choices[0].message.content;
}
// Contract generation endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { entityType, transactionType, contractType, customizations } = req.body;
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
        const result = {
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
    }
    catch (error) {
        console.error('Contract generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate contract'
        });
    }
});
function extractVulnerabilities(securityAnalysis) {
    // Implementation to extract vulnerabilities from security analysis
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('risk'))
        .map(line => line.trim());
}
function extractRecommendations(securityAnalysis) {
    // Implementation to extract recommendations from security analysis
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest'))
        .map(line => line.trim());
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access via:`);
    console.log(`- Local: http://localhost:${port}`);
    console.log(`- Public: http://13.126.230.108:${port}`);
});
