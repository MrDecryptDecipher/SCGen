import { Request, Response } from 'express';
import { ContractTypes, TemplateTypes, contractMap, templateMap } from '../models/contractTemplates';
import { generateCustomContract } from '../utils/aiService';
import fs from 'fs';
import path from 'path';

// Define the cache directory
const CACHE_DIR = path.join(__dirname, '../../cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`Created cache directory at ${CACHE_DIR}`);
}

interface ContractRequest {
    entityType: keyof ContractTypes;
    transactionType: string;
    contractType: string;
    customizations?: Record<string, any>;
}

interface CachedContract {
    analysis: string;
    code: string;
    security: {
        vulnerabilities: string[];
        recommendations: string[];
    };
    timestamp: number;
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

/**
 * Generate a cache key for a contract request
 * @param entityType The entity type
 * @param transactionType The transaction type
 * @param contractType The contract type
 * @param customizations Optional customizations
 * @returns A unique cache key
 */
function generateCacheKey(
    entityType: string,
    transactionType: string,
    contractType: string,
    customizations?: Record<string, any>
): string {
    // Create a deterministic string representation of the customizations
    const customizationsStr = customizations
        ? Object.entries(customizations)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
            .join('_')
        : 'none';

    // Create a cache key
    return `${entityType}_${transactionType}_${contractType}_${customizationsStr}`.replace(/\s+/g, '_').toLowerCase();
}

/**
 * Check if a contract is cached
 * @param cacheKey The cache key
 * @returns The cached contract or null if not found
 */
function getFromCache(cacheKey: string): CachedContract | null {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

    if (fs.existsSync(cachePath)) {
        try {
            const cacheData = fs.readFileSync(cachePath, 'utf8');
            const cachedContract = JSON.parse(cacheData) as CachedContract;

            // Log cache hit
            console.log(`Cache hit for key: ${cacheKey}`);

            return cachedContract;
        } catch (error) {
            console.error(`Error reading cache for key ${cacheKey}:`, error);
            return null;
        }
    }

    return null;
}

/**
 * Save a contract to the cache
 * @param cacheKey The cache key
 * @param contract The contract data to cache
 */
function saveToCache(cacheKey: string, contract: CachedContract): void {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

    try {
        fs.writeFileSync(cachePath, JSON.stringify(contract, null, 2), 'utf8');
        console.log(`Cached contract with key: ${cacheKey}`);
    } catch (error) {
        console.error(`Error caching contract with key ${cacheKey}:`, error);
    }
}

export async function generateCustomizedContract(req: Request<{}, {}, ContractRequest>, res: Response) {
    try {
        const { entityType, transactionType, contractType, customizations } = req.body;
        const io = req.app.get('io'); // Get Socket.IO instance

        // Validate inputs
        if (!entityType || !transactionType || !contractType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        console.log(`Generating contract: ${entityType} / ${transactionType} / ${contractType}`);
        console.log('Customizations:', customizations);

        // Generate a cache key
        const cacheKey = generateCacheKey(
            entityType.toString(),
            transactionType,
            contractType,
            customizations
        );

        // Emit progress event (10%)
        if (io) {
            const room = `contract:${entityType}:${transactionType}:${contractType}`;
            io.to(room).emit('contract-generation-progress', {
                progress: 10,
                message: 'Checking cache for existing contract...'
            });
        }

        // Check if the contract is cached
        const cachedContract = getFromCache(cacheKey);

        if (cachedContract) {
            console.log(`Using cached contract for ${entityType}/${transactionType}/${contractType}`);

            // Emit progress event (100% - from cache)
            if (io) {
                const room = `contract:${entityType}:${transactionType}:${contractType}`;
                io.to(room).emit('contract-generation-progress', {
                    progress: 100,
                    message: 'Retrieved contract from cache'
                });
            }

            // Return the cached contract
            return res.json({
                success: true,
                data: {
                    analysis: cachedContract.analysis,
                    code: cachedContract.code,
                    security: cachedContract.security
                },
                cached: true,
                cachedAt: new Date(cachedContract.timestamp).toISOString(),
                processingTime: Date.now() - (req as any).startTime || 0
            });
        }

        // If not cached, generate using AI
        console.log(`No cache found, generating contract using AI...`);

        // Emit progress event (30%)
        if (io) {
            const room = `contract:${entityType}:${transactionType}:${contractType}`;
            io.to(room).emit('contract-generation-progress', {
                progress: 30,
                message: 'Generating contract using AI...'
            });
        }

        const result = await generateCustomContract(
            entityType.toString(),
            transactionType,
            contractType,
            customizations
        );

        // Emit progress event (70%)
        if (io) {
            const room = `contract:${entityType}:${transactionType}:${contractType}`;
            io.to(room).emit('contract-generation-progress', {
                progress: 70,
                message: 'Contract generated, analyzing and caching...'
            });
        }

        // Cache the result
        const contractToCache: CachedContract = {
            analysis: result.analysis,
            code: result.code,
            security: result.security,
            timestamp: Date.now()
        };

        saveToCache(cacheKey, contractToCache);

        // Emit progress event (100%)
        if (io) {
            const room = `contract:${entityType}:${transactionType}:${contractType}`;
            io.to(room).emit('contract-generation-progress', {
                progress: 100,
                message: 'Contract generation complete'
            });
        }

        return res.json({
            success: true,
            data: {
                analysis: result.analysis,
                code: result.code,
                security: result.security
            },
            cached: false,
            processingTime: Date.now() - (req as any).startTime || 0
        });
    } catch (error) {
        console.error('Contract generation error:', error);

        // Emit error event
        const io = req.app.get('io');
        if (io && req.body.entityType && req.body.transactionType && req.body.contractType) {
            const room = `contract:${req.body.entityType}:${req.body.transactionType}:${req.body.contractType}`;
            io.to(room).emit('contract-generation-error', {
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to generate contract',
            details: error instanceof Error ? error.message : 'Unknown error'
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

/**
 * Get cache statistics
 */
export async function getCacheStats(req: Request, res: Response) {
    try {
        // Get all cache files
        const cacheFiles = fs.readdirSync(CACHE_DIR).filter(file => file.endsWith('.json'));

        // Calculate cache size
        let totalSize = 0;
        const cacheStats = cacheFiles.map(file => {
            const filePath = path.join(CACHE_DIR, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;

            // Read cache file to get metadata
            const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as CachedContract;

            return {
                key: file.replace('.json', ''),
                size: stats.size,
                createdAt: new Date(cacheData.timestamp).toISOString(),
                age: Math.floor((Date.now() - cacheData.timestamp) / (1000 * 60 * 60 * 24)) // Age in days
            };
        });

        return res.json({
            success: true,
            stats: {
                totalContracts: cacheFiles.length,
                totalSize: totalSize,
                sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
                contracts: cacheStats
            }
        });
    } catch (error) {
        console.error('Cache stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get cache statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Clear the contract cache
 */
export async function clearCache(req: Request, res: Response) {
    try {
        // Get all cache files
        const cacheFiles = fs.readdirSync(CACHE_DIR).filter(file => file.endsWith('.json'));

        // Delete each file
        let deletedCount = 0;
        for (const file of cacheFiles) {
            const filePath = path.join(CACHE_DIR, file);
            fs.unlinkSync(filePath);
            deletedCount++;
        }

        return res.json({
            success: true,
            message: `Cache cleared successfully. Deleted ${deletedCount} cached contracts.`
        });
    } catch (error) {
        console.error('Cache clear error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to clear cache',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}