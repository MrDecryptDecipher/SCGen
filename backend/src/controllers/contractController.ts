import { Request, Response } from 'express';
import { ContractTypes, TemplateTypes, contractMap, templateMap } from '../models/contractTemplates';
import { generateCustomContract } from '../utils/aiService';

interface ContractRequest {
    entityType: keyof ContractTypes;
    transactionType: string;
    contractType: string;
    customizations?: Record<string, any>;
}

export async function getContractTemplate(req: Request<{}, {}, ContractRequest>, res: Response) {
    try {
        const { entityType, transactionType, contractType } = req.body;

        // Validate inputs
        if (!entityType || !transactionType || !contractType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Check if the combination exists
        const entityTransactions = contractMap[entityType as keyof typeof contractMap];
        if (!entityTransactions || !entityTransactions[transactionType]?.includes(contractType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contract combination'
            });
        }

        // Get template
        const template = templateMap[contractType as keyof typeof templateMap];
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }

        return res.json({
            success: true,
            contract: template
        });
    } catch (error) {
        console.error('Contract template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get contract template'
        });
    }
}

export async function generateCustomizedContract(req: Request<{}, {}, ContractRequest>, res: Response) {
    try {
        const { entityType, transactionType, contractType, customizations } = req.body;

        // Validate inputs
        if (!entityType || !transactionType || !contractType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Generate using AI
        const result = await generateCustomContract(
            entityType.toString(),
            transactionType,
            contractType,
            customizations
        );

        return res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Contract generation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate contract'
        });
    }
}

interface ContractOptionsQuery {
    entityType?: keyof ContractTypes;
    transactionType?: string;
}

export async function getContractOptions(req: Request<{}, {}, {}, ContractOptionsQuery>, res: Response) {
    try {
        const { entityType, transactionType } = req.query;

        if (entityType && transactionType) {
            // Return contract types for the given entity and transaction type
            const entityTransactions = contractMap[entityType];
            const contractTypes = entityTransactions?.[transactionType] || [];
            return res.json({
                success: true,
                options: contractTypes
            });
        } else if (entityType) {
            // Return transaction types for the given entity
            const entityTransactions = contractMap[entityType];
            const transactionTypes = entityTransactions ? Object.keys(entityTransactions) : [];
            return res.json({
                success: true,
                options: transactionTypes
            });
        } else {
            // Return entity types
            const entityTypes = Object.keys(contractMap);
            return res.json({
                success: true,
                options: entityTypes
            });
        }
    } catch (error) {
        console.error('Contract options error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get contract options'
        });
    }
} 