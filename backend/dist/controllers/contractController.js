"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractTemplate = getContractTemplate;
exports.generateCustomizedContract = generateCustomizedContract;
exports.getContractOptions = getContractOptions;
const contractTemplates_1 = require("../models/contractTemplates");
const aiService_1 = require("../utils/aiService");
async function getContractTemplate(req, res) {
    var _a;
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
        const entityTransactions = contractTemplates_1.contractMap[entityType];
        if (!entityTransactions || !((_a = entityTransactions[transactionType]) === null || _a === void 0 ? void 0 : _a.includes(contractType))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contract combination'
            });
        }
        // Get template
        const template = contractTemplates_1.templateMap[contractType];
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
    }
    catch (error) {
        console.error('Contract template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get contract template'
        });
    }
}
async function generateCustomizedContract(req, res) {
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
        const result = await (0, aiService_1.generateCustomContract)(entityType.toString(), transactionType, contractType, customizations);
        return res.json({
            success: true,
            result
        });
    }
    catch (error) {
        console.error('Contract generation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate contract'
        });
    }
}
async function getContractOptions(req, res) {
    try {
        const { entityType, transactionType } = req.query;
        if (entityType && transactionType) {
            // Return contract types for the given entity and transaction type
            const entityTransactions = contractTemplates_1.contractMap[entityType];
            const contractTypes = (entityTransactions === null || entityTransactions === void 0 ? void 0 : entityTransactions[transactionType]) || [];
            return res.json({
                success: true,
                options: contractTypes
            });
        }
        else if (entityType) {
            // Return transaction types for the given entity
            const entityTransactions = contractTemplates_1.contractMap[entityType];
            const transactionTypes = entityTransactions ? Object.keys(entityTransactions) : [];
            return res.json({
                success: true,
                options: transactionTypes
            });
        }
        else {
            // Return entity types
            const entityTypes = Object.keys(contractTemplates_1.contractMap);
            return res.json({
                success: true,
                options: entityTypes
            });
        }
    }
    catch (error) {
        console.error('Contract options error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get contract options'
        });
    }
}
