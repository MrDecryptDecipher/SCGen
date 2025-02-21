"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateMap = exports.contractMap = void 0;
exports.contractMap = {
    'PRIVATE LIMITED COMPANY': {
        'B2C': ['White Label', 'Private Label', 'Wholesaling', 'Dropshipping', 'Subscription Service'],
        'B2B': [
            'Equity Tokenization',
            'Vesting Agreements',
            'Supply Chain Management',
            'Revenue Sharing Agreement',
            'Corporate Governance',
            'Intellectual Property Licensing'
        ],
        'B2B2C': ['White Label', 'Private Label', 'Wholesaling', 'Dropshipping', 'Subscription Service'],
        'B2G': ['Equity Tokenization', 'Vesting Agreements'],
        'C2B': ['White Label', 'Private Label'],
        'D2C': ['White Label', 'Private Label'],
        'C2C': ['White Label', 'Private Label'],
        'G2C': ['White Label', 'Private Label'],
        'G2B': ['White Label', 'Private Label']
    },
    'LIMITED LIABILITY PARTNERSHIP': {
        'B2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'B2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'B2B2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'B2G': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'C2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'D2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'C2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'G2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
        'G2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions']
    },
    'GENERAL PARTNERSHIP': {
        'B2C': ['Purchase of any assets'],
        'B2B': ['Purchase of any assets'],
        'B2B2C': ['Purchase of any assets'],
        'B2G': ['Purchase of any assets'],
        'C2B': ['Purchase of any assets'],
        'D2C': ['Purchase of any assets'],
        'C2C': ['Purchase of any assets'],
        'G2C': ['Purchase of any assets'],
        'G2B': ['Purchase of any assets']
    },
    'SOLE PROPRIETORSHIP': {
        'B2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'B2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'B2B2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'B2G': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'C2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'D2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'C2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'G2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
        'G2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement']
    },
    'ONE PERSON COMPANY': {
        'B2C': ['Franchisee agreement', 'Commercialisation agreement'],
        'B2B': ['Franchisee agreement', 'Commercialisation agreement'],
        'B2B2C': ['Franchisee agreement', 'Commercialisation agreement'],
        'B2G': ['Franchisee agreement', 'Commercialisation agreement'],
        'C2B': ['Franchisee agreement', 'Commercialisation agreement'],
        'D2C': ['Franchisee agreement', 'Commercialisation agreement'],
        'C2C': ['Franchisee agreement', 'Commercialisation agreement'],
        'G2C': ['Franchisee agreement', 'Commercialisation agreement'],
        'G2B': ['Franchisee agreement', 'Commercialisation agreement']
    },
    'GOVERNMENT ENTITY': {
        'B2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'B2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'B2B2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'B2G': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'C2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'D2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'C2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'G2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
        'G2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement']
    },
    'INDIVIDUAL': {
        'i2i': ['Will documentation'],
        'i2m': ['Parent to children agreements'],
        'i2G': ['Individual to Government agreements'],
        'C2E': ['Commercialisation agreement'],
        'E2C': ['Commercialisation agreement'],
        'B2E': ['Commercialisation agreement'],
        'E2B': ['Commercialisation agreement'],
        'G2E': ['Commercialisation agreement'],
        'E2G': ['Commercialisation agreement'],
        'E2E': ['Commercialisation agreement']
    }
};
exports.templateMap = {
    'Equity Tokenization': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EquityToken is ERC20, Ownable, Pausable {
    uint256 private _totalShares;
    mapping(address => uint256) private _lockedTokens;
    mapping(address => uint256) private _vestingEnd;

    event SharesLocked(address indexed holder, uint256 amount, uint256 vestingEnd);
    event SharesUnlocked(address indexed holder, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        _totalShares = initialSupply;
    }

    function lockShares(address holder, uint256 amount, uint256 vestingDuration) 
        external 
        onlyOwner 
    {
        require(balanceOf(holder) >= amount, "Insufficient balance");
        _lockedTokens[holder] = amount;
        _vestingEnd[holder] = block.timestamp + vestingDuration;
        emit SharesLocked(holder, amount, _vestingEnd[holder]);
    }

    function unlockShares(address holder) 
        external 
    {
        require(block.timestamp >= _vestingEnd[holder], "Vesting period not ended");
        uint256 amount = _lockedTokens[holder];
        _lockedTokens[holder] = 0;
        _vestingEnd[holder] = 0;
        emit SharesUnlocked(holder, amount);
    }

    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        returns (bool) 
    {
        require(amount <= balanceOf(msg.sender) - _lockedTokens[msg.sender], "Shares locked");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        require(amount <= balanceOf(from) - _lockedTokens[from], "Shares locked");
        return super.transferFrom(from, to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}`,
    'Profit Sharing Agreement': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
}`,
    'Supply Chain Management': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

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
}`,
    'Revenue Sharing Agreement': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RevenueSharing is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

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
            _totalShares = _totalShares.add(_shares[i]);
        }
        
        require(_totalShares == PRECISION, "Total shares must be 100%");
        totalShares = _totalShares;
    }

    receive() external payable {
        totalRevenue = totalRevenue.add(msg.value);
        emit RevenueReceived(msg.value);
    }

    function addStakeholder(address _stakeholder, uint256 _shares) 
        external 
        onlyOwner 
    {
        require(_stakeholder != address(0), "Invalid stakeholder address");
        require(!stakeholders[_stakeholder].exists, "Stakeholder already exists");
        require(totalShares.add(_shares) <= PRECISION, "Total shares cannot exceed 100%");

        stakeholders[_stakeholder] = Stakeholder({
            shares: _shares,
            totalEarnings: 0,
            exists: true
        });
        stakeholderList.push(_stakeholder);
        totalShares = totalShares.add(_shares);

        emit StakeholderAdded(_stakeholder, _shares);
    }

    function removeStakeholder(address _stakeholder) 
        external 
        onlyOwner 
    {
        require(stakeholders[_stakeholder].exists, "Stakeholder does not exist");
        totalShares = totalShares.sub(stakeholders[_stakeholder].shares);
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
        uint256 newTotal = totalShares.sub(stakeholders[_stakeholder].shares).add(_newShares);
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
            uint256 share = amount.mul(stakeholders[stakeholder].shares).div(PRECISION);
            stakeholders[stakeholder].totalEarnings = stakeholders[stakeholder].totalEarnings.add(share);
            payable(stakeholder).transfer(share);
        }
        
        totalDistributed = totalDistributed.add(amount);
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
}`,
    'White Label Agreement': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract WhiteLabelAgreement is AccessControl, Pausable {
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant RESELLER_ROLE = keccak256("RESELLER_ROLE");

    struct Agreement {
        address provider;
        address reseller;
        uint256 startDate;
        uint256 endDate;
        uint256 revenueShare;
        bool active;
        string terms;
    }

    mapping(bytes32 => Agreement) public agreements;
    mapping(address => bytes32[]) public resellerAgreements;

    event AgreementCreated(bytes32 indexed agreementId, address provider, address reseller);
    event AgreementTerminated(bytes32 indexed agreementId);
    event RevenueDistributed(bytes32 indexed agreementId, uint256 amount);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createAgreement(
        address reseller,
        uint256 duration,
        uint256 revenueShare,
        string memory terms
    ) 
        external 
        onlyRole(PROVIDER_ROLE)
        returns (bytes32)
    {
        require(reseller != address(0), "Invalid reseller address");
        require(revenueShare <= 100, "Invalid revenue share");
        
        bytes32 agreementId = keccak256(
            abi.encodePacked(
                msg.sender,
                reseller,
                block.timestamp
            )
        );
        
        agreements[agreementId] = Agreement({
            provider: msg.sender,
            reseller: reseller,
            startDate: block.timestamp,
            endDate: block.timestamp + duration,
            revenueShare: revenueShare,
            active: true,
            terms: terms
        });
        
        resellerAgreements[reseller].push(agreementId);
        
        emit AgreementCreated(agreementId, msg.sender, reseller);
        return agreementId;
    }

    function terminateAgreement(bytes32 agreementId) 
        external 
    {
        Agreement storage agreement = agreements[agreementId];
        require(
            agreement.provider == msg.sender || 
            agreement.reseller == msg.sender,
            "Not authorized"
        );
        require(agreement.active, "Agreement not active");
        
        agreement.active = false;
        agreement.endDate = block.timestamp;
        
        emit AgreementTerminated(agreementId);
    }

    function distributeRevenue(bytes32 agreementId) 
        external 
        payable 
    {
        Agreement storage agreement = agreements[agreementId];
        require(agreement.active, "Agreement not active");
        require(msg.value > 0, "No revenue to distribute");
        
        uint256 resellerShare = (msg.value * agreement.revenueShare) / 100;
        uint256 providerShare = msg.value - resellerShare;
        
        payable(agreement.reseller).transfer(resellerShare);
        payable(agreement.provider).transfer(providerShare);
        
        emit RevenueDistributed(agreementId, msg.value);
    }

    function getAgreement(bytes32 agreementId) 
        external 
        view 
        returns (Agreement memory) 
    {
        return agreements[agreementId];
    }

    function getResellerAgreements(address reseller) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return resellerAgreements[reseller];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}`,
    'Franchisee Agreement': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FranchiseeAgreement is AccessControl, ReentrancyGuard {
    bytes32 public constant FRANCHISOR_ROLE = keccak256("FRANCHISOR_ROLE");
    bytes32 public constant FRANCHISEE_ROLE = keccak256("FRANCHISEE_ROLE");

    struct Franchise {
        address franchisor;
        address franchisee;
        uint256 startDate;
        uint256 endDate;
        uint256 royaltyPercentage;
        uint256 initialFee;
        bool active;
        string territory;
        string terms;
    }

    mapping(bytes32 => Franchise) public franchises;
    mapping(address => bytes32[]) public franchiseeAgreements;
    
    event FranchiseCreated(bytes32 indexed franchiseId, address franchisor, address franchisee);
    event FranchiseTerminated(bytes32 indexed franchiseId);
    event RoyaltyPaid(bytes32 indexed franchiseId, uint256 amount);
    event InitialFeePaid(bytes32 indexed franchiseId, uint256 amount);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createFranchise(
        address franchisee,
        uint256 duration,
        uint256 royaltyPercentage,
        uint256 initialFee,
        string memory territory,
        string memory terms
    ) 
        external 
        onlyRole(FRANCHISOR_ROLE)
        returns (bytes32)
    {
        require(franchisee != address(0), "Invalid franchisee address");
        require(royaltyPercentage <= 100, "Invalid royalty percentage");
        
        bytes32 franchiseId = keccak256(
            abi.encodePacked(
                msg.sender,
                franchisee,
                territory,
                block.timestamp
            )
        );
        
        franchises[franchiseId] = Franchise({
            franchisor: msg.sender,
            franchisee: franchisee,
            startDate: block.timestamp,
            endDate: block.timestamp + duration,
            royaltyPercentage: royaltyPercentage,
            initialFee: initialFee,
            active: true,
            territory: territory,
            terms: terms
        });
        
        franchiseeAgreements[franchisee].push(franchiseId);
        
        emit FranchiseCreated(franchiseId, msg.sender, franchisee);
        return franchiseId;
    }

    function payInitialFee(bytes32 franchiseId) 
        external 
        payable 
        nonReentrant
    {
        Franchise storage franchise = franchises[franchiseId];
        require(msg.sender == franchise.franchisee, "Not the franchisee");
        require(franchise.active, "Franchise not active");
        require(msg.value == franchise.initialFee, "Incorrect fee amount");
        
        payable(franchise.franchisor).transfer(msg.value);
        
        emit InitialFeePaid(franchiseId, msg.value);
    }

    function payRoyalty(bytes32 franchiseId) 
        external 
        payable 
        nonReentrant
    {
        Franchise storage franchise = franchises[franchiseId];
        require(msg.sender == franchise.franchisee, "Not the franchisee");
        require(franchise.active, "Franchise not active");
        require(msg.value > 0, "No royalty to pay");
        
        payable(franchise.franchisor).transfer(msg.value);
        
        emit RoyaltyPaid(franchiseId, msg.value);
    }

    function terminateFranchise(bytes32 franchiseId) 
        external 
    {
        Franchise storage franchise = franchises[franchiseId];
        require(
            franchise.franchisor == msg.sender || 
            franchise.franchisee == msg.sender,
            "Not authorized"
        );
        require(franchise.active, "Franchise not active");
        
        franchise.active = false;
        franchise.endDate = block.timestamp;
        
        emit FranchiseTerminated(franchiseId);
    }

    function getFranchise(bytes32 franchiseId) 
        external 
        view 
        returns (Franchise memory) 
    {
        return franchises[franchiseId];
    }

    function getFranchiseeAgreements(address franchisee) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return franchiseeAgreements[franchisee];
    }
}`,
    // Add more contract templates as needed...
};
