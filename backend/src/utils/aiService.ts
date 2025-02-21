import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface AIResponse {
    analysis: string;
    code: string;
    security: {
        vulnerabilities: string[];
        recommendations: string[];
    };
}

export async function generateCustomContract(
    entityType: string,
    transactionType: string,
    contractType: string,
    customizations?: Record<string, any>
): Promise<AIResponse> {
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
    } catch (error) {
        console.error('AI Service Error:', error);
        throw new Error('Failed to generate contract using AI');
    }
}

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
            model: 'deepseek/deepseek-chat',
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
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

function extractVulnerabilities(securityAnalysis: string): string[] {
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('risk'))
        .map(line => line.trim());
}

function extractRecommendations(securityAnalysis: string): string[] {
    return securityAnalysis.split('\n')
        .filter(line => line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest'))
        .map(line => line.trim());
} 