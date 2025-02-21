"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomContract = generateCustomContract;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
async function generateCustomContract(entityType, transactionType, contractType, customizations) {
    try {
        const basePrompt = `
            Generate a smart contract with the following specifications:
            Entity Type: ${entityType}
            Transaction Type: ${transactionType}
            Contract Type: ${contractType}
            Additional Customizations: ${JSON.stringify(customizations || {})}
            
            Please analyze the requirements, generate the code, and provide security recommendations.
        `;
        // Sequential processing through personas
        const analysis = await processWithPersona(basePrompt, 'nanjunda');
        const code = await processWithPersona(analysis, 'achyutha');
        const security = await processWithPersona(code, 'sandeep');
        return {
            analysis,
            code,
            security: {
                vulnerabilities: extractVulnerabilities(security),
                recommendations: extractRecommendations(security)
            }
        };
    }
    catch (error) {
        console.error('AI Service Error:', error);
        throw new Error('Failed to generate contract using AI');
    }
}
async function processWithPersona(prompt, persona) {
    const personaPrompts = {
        nanjunda: 'As Nanjunda, analyze the contract requirements and provide detailed insights: ',
        achyutha: 'As Achyutha, optimize and generate the smart contract code with best practices: ',
        sandeep: 'As Sandeep, perform security analysis and ensure compliance: '
    };
    const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'deepseek/deepseek-chat',
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
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data.choices[0].message.content;
}
function extractVulnerabilities(securityAnalysis) {
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('risk'))
        .map(line => line.trim());
}
function extractRecommendations(securityAnalysis) {
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest'))
        .map(line => line.trim());
}
