import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AIML_API_KEY = process.env.AIML_API_KEY;

interface AIResponse {
    analysis: string;
    code: string;
    security: {
        vulnerabilities: string[];
        recommendations: string[];
    };
}

/**
 * Generate a custom contract using AI
 * @param entityType The type of entity (e.g., PRIVATE LIMITED COMPANY)
 * @param transactionType The type of transaction (e.g., B2B)
 * @param contractType The type of contract (e.g., Equity Tokenization)
 * @param customizations Optional customizations for the contract
 * @returns Promise containing the analysis, code, and security recommendations
 */
export async function generateCustomContract(
    entityType: string,
    transactionType: string,
    contractType: string,
    customizations?: Record<string, any>
): Promise<AIResponse> {
    try {
        // Prepare prompt for a complete smart contract
        const basePrompt = `
            Generate a complete, production-ready Solidity smart contract with the following specifications:
            
            Entity Type: ${entityType}
            Transaction Type: ${transactionType}
            Contract Type: ${contractType}
            Customizations: ${JSON.stringify(customizations || {})}
            
            IMPORTANT REQUIREMENTS:
            1. The contract must be fully implemented with NO placeholder comments like "..." or "// implementation".
            2. Include SPDX license and pragma statement at the top.
            3. Include all necessary OpenZeppelin imports.
            4. Implement all functions completely, including proper error handling.
            5. Use the latest solidity best practices (version 0.8.x).
            6. Add detailed NatSpec comments.
            7. Implement proper access control and security features.
            8. Include events for all important state changes.

            The contract should be properly structured and immediately deployable without any modifications.
        `;

        // Track which provider is successfully used for logging
        let successfulProvider = '';

        // First attempt with Together AI (primary provider with credits)
        try {
            console.log('Attempting to generate contract with Together AI...');
            
            const togetherResponse = await axios.post(
                'https://api.together.xyz/v1/chat/completions',
                {
                    model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
                    messages: [
                        {
                            role: "user",
                            content: basePrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 8000 // Request a large token limit for complete contracts
                },
                {
                    headers: {
                        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 2 minute timeout
                }
            );
            
            if (togetherResponse.data?.choices?.[0]?.message?.content) {
                const contractCode = extractContractCode(togetherResponse.data.choices[0].message.content);
                
                // Perform a basic validation of the contract code
                if (validateContractCode(contractCode)) {
                    successfulProvider = 'Together AI';
                    console.log('Successfully generated contract using Together AI');
                    return {
                        analysis: `Contract analysis completed by Nanjunda for ${entityType} with ${transactionType} transactions.`,
                        code: contractCode,
                        security: {
                            vulnerabilities: [],
                            recommendations: [
                                'Consider adding more specific access controls',
                                'Implement explicit error messages with custom errors',
                                'Add reentrancy guards where appropriate'
                            ]
                        }
                    };
                } else {
                    console.log('Together AI response validation failed, trying fallback...');
                }
            }
        } catch (error) {
            console.error('Together AI generation error:', error instanceof Error ? error.message : String(error));
            console.log('Falling back to OpenRouter due to Together AI error');
        }

        // Fallback to OpenRouter (secondary provider - free tier)
        try {
            console.log('Falling back to OpenRouter (Gemini free tier)...');
            
            const openRouterResponse = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: "google/gemini-exp-1206:free",
                    messages: [
                        {
                            role: "user",
                            content: basePrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                        'X-Title': 'SCGen'
                    },
                    timeout: 120000
                }
            );
            
            if (openRouterResponse.data?.choices?.[0]?.message?.content) {
                const contractCode = extractContractCode(openRouterResponse.data.choices[0].message.content);
                
                if (validateContractCode(contractCode)) {
                    successfulProvider = 'OpenRouter';
                    console.log('Successfully generated contract using OpenRouter');
                    return {
                        analysis: `Contract analysis completed by Nanjunda for ${entityType} with ${transactionType} transactions.`,
                        code: contractCode,
                        security: {
                            vulnerabilities: [],
                            recommendations: [
                                'Review access control implementation',
                                'Consider implementing additional security checks',
                                'Ensure proper event emission for all state changes'
                            ]
                        }
                    };
                } else {
                    console.log('OpenRouter response validation failed, trying final fallback...');
                }
            }
        } catch (error) {
            console.error('OpenRouter generation error:', error instanceof Error ? error.message : String(error));
            console.log('Falling back to AIML API due to OpenRouter error');
        }

        // Final fallback to AIML API with Codestral model
        try {
            console.log('Falling back to AIML API (Codestral)...');
            
            const aimlResponse = await axios.post(
                'https://api.aimlapi.com/v1/chat/completions',
                {
                    model: "mistralai/codestral-2501",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert Solidity developer specializing in smart contract generation."
                        },
                        {
                            role: "user",
                            content: basePrompt
                        }
                    ],
                    temperature: 0.3 // Lower temperature for more deterministic code
                },
                {
                    headers: {
                        'Authorization': `Bearer ${AIML_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000
                }
            );
            
            if (aimlResponse.data?.choices?.[0]?.message?.content) {
                const contractCode = extractContractCode(aimlResponse.data.choices[0].message.content);
                
                if (validateContractCode(contractCode)) {
                    successfulProvider = 'AIML API';
                    console.log('Successfully generated contract using AIML API');
                    return {
                        analysis: `Contract analysis completed by Nanjunda for ${entityType} with ${transactionType} transactions.`,
                        code: contractCode,
                        security: {
                            vulnerabilities: [],
                            recommendations: [
                                'Implement more granular access controls',
                                'Consider using SafeMath for all arithmetic operations',
                                'Add more detailed input validation'
                            ]
                        }
                    };
                } else {
                    console.log('AIML API response validation failed, falling back to template...');
                }
            }
        } catch (error) {
            console.error('AIML API generation error:', error instanceof Error ? error.message : String(error));
            console.log('All AI providers failed, falling back to template contract');
        }

        // If all attempts fail, return a fallback contract template
        console.log('Using fallback contract template after all providers failed');
        return {
            analysis: `Nanjunda has analyzed your requirements for a ${contractType} contract for ${entityType} with ${transactionType} transactions. Due to generation issues with our AI providers, we are providing a template contract that meets your requirements.`,
            code: getFallbackContract(entityType, transactionType, contractType, customizations),
            security: {
                vulnerabilities: ["Template provided due to generation issues with AI providers."],
                recommendations: [
                    "Review the template contract thoroughly before deployment",
                    "Consider a security audit by a professional before using in production",
                    "Implement additional security checks specific to your use case"
                ]
            }
        };
    } catch (error) {
        console.error('Contract generation error:', error instanceof Error ? error.message : String(error));
        throw new Error(`Failed to generate contract using AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Extract the contract code from the AI response
 * @param content The raw content from the AI response
 * @returns The extracted contract code
 */
function extractContractCode(content: string): string {
    // First try to extract code from markdown code blocks
    const codeBlockRegex = /```(?:solidity)?\s*([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    // If no code block is found, try to extract code starting with pragma or SPDX
    const pragmaRegex = /(\/\/\s*SPDX-License-Identifier:.*?|pragma\s+solidity.*?)([\s\S]*)/;
    const pragmaMatch = content.match(pragmaRegex);
    
    if (pragmaMatch) {
        return (pragmaMatch[1] + pragmaMatch[2]).trim();
    }
    
    // If all else fails, return the content as is
    return content.trim();
}

/**
 * Basic validation of contract code
 * @param code The contract code to validate
 * @returns Boolean indicating if the code appears to be a valid Solidity contract
 */
function validateContractCode(code: string): boolean {
    // Check for essential Solidity elements
    const hasPragma = code.includes('pragma solidity');
    const hasContract = code.includes('contract ');
    const hasConstructor = code.includes('constructor');
    const hasFunction = code.includes('function ');
    const hasSPDXLicense = code.includes('SPDX-License-Identifier');
    
    // Check for placeholders or incomplete code
    const hasEllipsis = code.includes('...');
    const hasPlaceholderComment = code.includes('// TODO') || 
                                 code.includes('// Implementation') ||
                                 code.includes('rest of the code') ||
                                 code.includes('// Add implementation');
    
    // Check for reasonable length
    const isReasonableLength = code.length > 500;
    
    // Log validation results for debugging
    console.log('Contract code validation:', {
        hasPragma,
        hasContract,
        hasConstructor,
        hasFunction,
        hasSPDXLicense,
        hasEllipsis,
        hasPlaceholderComment,
        isReasonableLength,
        codeLength: code.length
    });
    
    return hasPragma && hasContract && (hasConstructor || hasFunction) && 
           !hasEllipsis && !hasPlaceholderComment && isReasonableLength;
}

/**
 * Provide a fallback contract template if all AI attempts fail
 * @param entityType The type of entity
 * @param transactionType The type of transaction
 * @param contractType The type of contract
 * @param customizations Optional customizations for the contract
 * @returns A basic contract template based on the specified parameters
 */
function getFallbackContract(
    entityType: string, 
    transactionType: string, 
    contractType: string,
    customizations?: Record<string, any>
): string {
    // Extract basic customization values with defaults
    const tokenName = customizations?.tokenName || "EquityToken";
    const tokenSymbol = customizations?.tokenSymbol || "EQT";
    const initialSupply = customizations?.initialSupply || "1000000";
    
    // Simple template for an Equity Tokenization contract
    if (contractType.includes('Equity')) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Equity Token for ${entityType}
 * @dev ERC20 token representing equity shares with vesting capabilities
 */
contract ${tokenName} is ERC20, Ownable, Pausable {
    // Token configuration
    uint256 private _totalShares;
    mapping(address => uint256) private _lockedTokens;
    mapping(address => uint256) private _vestingEnd;

    // Events
    event SharesLocked(address indexed holder, uint256 amount, uint256 vestingEnd);
    event SharesUnlocked(address indexed holder, uint256 amount);

    /**
     * @dev Constructor initializes the equity token
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        _totalShares = initialSupply;
    }

    /**
     * @dev Lock shares for vesting
     * @param holder Address of the shareholder
     * @param amount Amount of shares to lock
     * @param vestingDuration Duration of the vesting period in seconds
     */
    function lockShares(address holder, uint256 amount, uint256 vestingDuration) 
        external 
        onlyOwner 
    {
        require(balanceOf(holder) >= amount, "Insufficient balance");
        _lockedTokens[holder] = amount;
        _vestingEnd[holder] = block.timestamp + vestingDuration;
        emit SharesLocked(holder, amount, _vestingEnd[holder]);
    }

    /**
     * @dev Unlock shares after vesting period
     * @param holder Address of the shareholder
     */
    function unlockShares(address holder) 
        external 
    {
        require(block.timestamp >= _vestingEnd[holder], "Vesting period not ended");
        uint256 amount = _lockedTokens[holder];
        _lockedTokens[holder] = 0;
        _vestingEnd[holder] = 0;
        emit SharesUnlocked(holder, amount);
    }

    /**
     * @dev Override transfer function to respect locked shares
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        returns (bool) 
    {
        require(amount <= balanceOf(msg.sender) - _lockedTokens[msg.sender], "Shares locked");
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom function to respect locked shares
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        require(amount <= balanceOf(from) - _lockedTokens[from], "Shares locked");
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Pause all token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause all token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}`;
    }
    
    // Template for a Supply Chain Management contract
    if (contractType.includes('Supply Chain')) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Supply Chain Management Contract for ${entityType}
 * @dev Manages product tracking throughout a supply chain
 */
contract SupplyChainManagement is AccessControl, Pausable {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum ProductStatus { Created, Shipped, Delivered, Recalled }
    
    struct Product {
        string productId;
        address manufacturer;
        address currentOwner;
        uint256 timestamp;
        ProductStatus status;
        string metadata;
    }

    mapping(string => Product) public products;
    mapping(string => mapping(uint256 => address)) public productHistory;
    mapping(string => uint256) public productHistoryCount;

    event ProductCreated(string productId, address manufacturer, string metadata);
    event ProductShipped(string productId, address from, address to);
    event ProductDelivered(string productId, address by);
    event ProductRecalled(string productId, address by);
    event ProductOwnershipTransferred(string productId, address from, address to);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createProduct(
        string memory productId,
        string memory metadata
    ) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
    {
        require(products[productId].manufacturer == address(0), "Product already exists");
        
        products[productId] = Product({
            productId: productId,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            timestamp: block.timestamp,
            status: ProductStatus.Created,
            metadata: metadata
        });

        productHistory[productId][0] = msg.sender;
        productHistoryCount[productId] = 1;

        emit ProductCreated(productId, msg.sender, metadata);
    }

    function shipProduct(
        string memory productId,
        address to
    ) 
        external 
    {
        require(products[productId].currentOwner == msg.sender, "Not the current owner");
        require(
            hasRole(DISTRIBUTOR_ROLE, to) || hasRole(RETAILER_ROLE, to),
            "Invalid recipient"
        );

        products[productId].status = ProductStatus.Shipped;
        products[productId].currentOwner = to;
        products[productId].timestamp = block.timestamp;

        uint256 count = productHistoryCount[productId];
        productHistory[productId][count] = to;
        productHistoryCount[productId] = count + 1;

        emit ProductShipped(productId, msg.sender, to);
        emit ProductOwnershipTransferred(productId, msg.sender, to);
    }

    function deliverProduct(string memory productId) 
        external 
    {
        require(products[productId].currentOwner == msg.sender, "Not the current owner");
        require(products[productId].status == ProductStatus.Shipped, "Product not shipped");

        products[productId].status = ProductStatus.Delivered;
        products[productId].timestamp = block.timestamp;

        emit ProductDelivered(productId, msg.sender);
    }

    function recallProduct(string memory productId) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
    {
        require(products[productId].manufacturer == msg.sender, "Not the manufacturer");
        
        products[productId].status = ProductStatus.Recalled;
        products[productId].timestamp = block.timestamp;

        emit ProductRecalled(productId, msg.sender);
    }

    function getProduct(string memory productId) 
        external 
        view 
        returns (Product memory) 
    {
        return products[productId];
    }

    function getProductHistory(string memory productId) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 count = productHistoryCount[productId];
        address[] memory history = new address[](count);
        
        for(uint256 i = 0; i < count; i++) {
            history[i] = productHistory[productId][i];
        }
        
        return history;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}`;
    }
    
    // Template for a Profit Sharing Agreement contract
    if (contractType.includes('Profit Sharing')) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Profit Sharing Contract for ${entityType}
 * @dev Manages profit distribution among partners
 */
contract ProfitSharing is Ownable, ReentrancyGuard {
    struct Partner {
        uint256 shares;
        uint256 totalReceived;
        bool exists;
    }

    mapping(address => Partner) public partners;
    address[] public partnerList;
    uint256 public totalShares;
    uint256 public totalDistributed;

    event PartnerAdded(address indexed partner, uint256 shares);
    event PartnerRemoved(address indexed partner);
    event ProfitDistributed(uint256 amount);
    event SharesUpdated(address indexed partner, uint256 newShares);

    constructor(address[] memory _partners, uint256[] memory _shares) {
        require(_partners.length == _shares.length, "Arrays length mismatch");
        uint256 _totalShares = 0;
        
        for(uint i = 0; i < _partners.length; i++) {
            require(_partners[i] != address(0), "Invalid partner address");
            require(!partners[_partners[i]].exists, "Duplicate partner");
            
            partners[_partners[i]] = Partner({
                shares: _shares[i],
                totalReceived: 0,
                exists: true
            });
            partnerList.push(_partners[i]);
            _totalShares += _shares[i];
        }
        
        require(_totalShares == 100, "Total shares must be 100");
        totalShares = _totalShares;
    }

    function addPartner(address _partner, uint256 _shares) 
        external 
        onlyOwner 
    {
        require(_partner != address(0), "Invalid partner address");
        require(!partners[_partner].exists, "Partner already exists");
        require(totalShares + _shares <= 100, "Total shares cannot exceed 100");

        partners[_partner] = Partner({
            shares: _shares,
            totalReceived: 0,
            exists: true
        });
        partnerList.push(_partner);
        totalShares += _shares;

        emit PartnerAdded(_partner, _shares);
    }

    function removePartner(address _partner) 
        external 
        onlyOwner 
    {
        require(partners[_partner].exists, "Partner does not exist");
        totalShares -= partners[_partner].shares;
        delete partners[_partner];

        for(uint i = 0; i < partnerList.length; i++) {
            if(partnerList[i] == _partner) {
                partnerList[i] = partnerList[partnerList.length - 1];
                partnerList.pop();
                break;
            }
        }

        emit PartnerRemoved(_partner);
    }

    function updateShares(address _partner, uint256 _newShares) 
        external 
        onlyOwner 
    {
        require(partners[_partner].exists, "Partner does not exist");
        totalShares = totalShares - partners[_partner].shares + _newShares;
        require(totalShares <= 100, "Total shares cannot exceed 100");
        
        partners[_partner].shares = _newShares;
        emit SharesUpdated(_partner, _newShares);
    }

    function distributeProfits() 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "No profits to distribute");
        uint256 amount = msg.value;
        
        for(uint i = 0; i < partnerList.length; i++) {
            address partner = partnerList[i];
            uint256 share = (amount * partners[partner].shares) / 100;
            partners[partner].totalReceived += share;
            payable(partner).transfer(share);
        }
        
        totalDistributed += amount;
        emit ProfitDistributed(amount);
    }

    function getPartnerInfo(address _partner) 
        external 
        view 
        returns (uint256 shares, uint256 totalReceived, bool exists) 
    {
        Partner memory partner = partners[_partner];
        return (partner.shares, partner.totalReceived, partner.exists);
    }

    function getPartnerList() 
        external 
        view 
        returns (address[] memory) 
    {
        return partnerList;
    }
}`;
    }
    
    // Template for a Revenue Sharing Agreement contract
    if (contractType.includes('Revenue')) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Revenue Sharing Contract for ${entityType}
 * @dev Manages revenue distribution among stakeholders
 */
contract RevenueSharing is Ownable, ReentrancyGuard {
    struct Stakeholder {
        uint256 shares;
        uint256 totalEarnings;
        bool exists;
    }

    mapping(address => Stakeholder) public stakeholders;
    address[] public stakeholderList;
    
    uint256 public totalShares;
    uint256 public totalRevenue;
    uint256 public totalDistributed;
    
    uint256 public constant PRECISION = 10000; // For handling percentages with 2 decimal places

    event StakeholderAdded(address indexed stakeholder, uint256 shares);
    event StakeholderRemoved(address indexed stakeholder);
    event RevenueReceived(uint256 amount);
    event RevenueDistributed(uint256 amount);
    event SharesUpdated(address indexed stakeholder, uint256 newShares);

    constructor(address[] memory _stakeholders, uint256[] memory _shares) {
        require(_stakeholders.length == _shares.length, "Arrays length mismatch");
        uint256 _totalShares = 0;
        
        for(uint i = 0; i < _stakeholders.length; i++) {
            require(_stakeholders[i] != address(0), "Invalid stakeholder address");
            require(!stakeholders[_stakeholders[i]].exists, "Duplicate stakeholder");
            
            stakeholders[_stakeholders[i]] = Stakeholder({
                shares: _shares[i],
                totalEarnings: 0,
                exists: true
            });
            stakeholderList.push(_stakeholders[i]);
            _totalShares += _shares[i];
        }
        
        require(_totalShares == PRECISION, "Total shares must be 100%");
        totalShares = _totalShares;
    }

    receive() external payable {
        totalRevenue += msg.value;
        emit RevenueReceived(msg.value);
    }

    function addStakeholder(address _stakeholder, uint256 _shares) 
        external 
        onlyOwner 
    {
        require(_stakeholder != address(0), "Invalid stakeholder address");
        require(!stakeholders[_stakeholder].exists, "Stakeholder already exists");
        require(totalShares + _shares <= PRECISION, "Total shares cannot exceed 100%");

        stakeholders[_stakeholder] = Stakeholder({
            shares: _shares,
            totalEarnings: 0,
            exists: true
        });
        stakeholderList.push(_stakeholder);
        totalShares += _shares;

        emit StakeholderAdded(_stakeholder, _shares);
    }

    function removeStakeholder(address _stakeholder) 
        external 
        onlyOwner 
    {
        require(stakeholders[_stakeholder].exists, "Stakeholder does not exist");
        totalShares -= stakeholders[_stakeholder].shares;
        delete stakeholders[_stakeholder];

        for(uint i = 0; i < stakeholderList.length; i++) {
            if(stakeholderList[i] == _stakeholder) {
                stakeholderList[i] = stakeholderList[stakeholderList.length - 1];
                stakeholderList.pop();
                break;
            }
        }

        emit StakeholderRemoved(_stakeholder);
    }

    function updateShares(address _stakeholder, uint256 _newShares) 
        external 
        onlyOwner 
    {
        require(stakeholders[_stakeholder].exists, "Stakeholder does not exist");
        uint256 newTotal = totalShares - stakeholders[_stakeholder].shares + _newShares;
        require(newTotal <= PRECISION, "Total shares cannot exceed 100%");
        
        stakeholders[_stakeholder].shares = _newShares;
        totalShares = newTotal;
        
        emit SharesUpdated(_stakeholder, _newShares);
    }

    function distributeRevenue() 
        external 
        nonReentrant 
    {
        uint256 amount = address(this).balance;
        require(amount > 0, "No revenue to distribute");
        
        for(uint i = 0; i < stakeholderList.length; i++) {
            address stakeholder = stakeholderList[i];
            uint256 share = amount * stakeholders[stakeholder].shares / PRECISION;
            stakeholders[stakeholder].totalEarnings += share;
            payable(stakeholder).transfer(share);
        }
        
        totalDistributed += amount;
        emit RevenueDistributed(amount);
    }

    function getStakeholderInfo(address _stakeholder) 
        external 
        view 
        returns (uint256 shares, uint256 totalEarnings, bool exists) 
    {
        Stakeholder memory stakeholder = stakeholders[_stakeholder];
        return (stakeholder.shares, stakeholder.totalEarnings, stakeholder.exists);
    }

    function getStakeholderList() 
        external 
        view 
        returns (address[] memory) 
    {
        return stakeholderList;
    }

    function getContractBalance() 
        external 
        view 
        returns (uint256) 
    {
        return address(this).balance;
    }
}`;
    }
    
    // Generic template for other contract types
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title ${contractType.replace(/\s+/g, '')} for ${entityType}
 * @dev Standard contract for ${transactionType} transactions
 */
contract ${contractType.replace(/\s+/g, '')} is Ownable {
    // State variables
    string public name;
    uint256 public creationTimestamp;
    address public creator;
    
    // Custom parameters
    ${customizations ? Object.entries(customizations).map(([key, value]) => 
        `${typeof value === 'string' ? 'string' : 'uint256'} public ${key} = ${typeof value === 'string' ? `"${value}"` : value};`
    ).join('\n    ') : '// No custom parameters specified'}
    
    // Events
    event ContractInitialized(address indexed creator, uint256 timestamp);
    event ActionPerformed(address indexed performer, string actionType, uint256 timestamp);
    
    /**
     * @dev Constructor to initialize the contract
     */
    constructor() {
        name = "${contractType}";
        creationTimestamp = block.timestamp;
        creator = msg.sender;
        emit ContractInitialized(creator, creationTimestamp);
    }
    
    /**
     * @dev Example function for performing an action
     * @param actionType Type of action being performed
     */
    function performAction(string memory actionType) external {
        emit ActionPerformed(msg.sender, actionType, block.timestamp);
    }
    
    /**
     * @dev Function to retrieve contract information
     * @return Contract name, creator address, and creation timestamp
     */
    function getContractInfo() external view returns (string memory, address, uint256) {
        return (name, creator, creationTimestamp);
    }
}`;
}

/**
 * Extract vulnerabilities from a security analysis text
 * @param securityAnalysis The security analysis text
 * @returns Array of vulnerability strings
 */
function extractVulnerabilities(securityAnalysis: string): string[] {
    return securityAnalysis.split('\n')
        .filter(line => 
            line.toLowerCase().includes('vulnerability') || 
            line.toLowerCase().includes('risk') ||
            line.toLowerCase().includes('issue') ||
            line.toLowerCase().includes('weakness')
        )
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

/**
 * Extract recommendations from a security analysis text
 * @param securityAnalysis The security analysis text
 * @returns Array of recommendation strings
 */
function extractRecommendations(securityAnalysis: string): string[] {
    return securityAnalysis.split('\n')
        .filter(line => 
            line.toLowerCase().includes('recommend') || 
            line.toLowerCase().includes('suggest') ||
            line.toLowerCase().includes('should') ||
            line.toLowerCase().includes('best practice')
        )
        .map(line => line.trim())
        .filter(line => line.length > 0);
}