// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract FighterNFT is IERC721Metadata, SepoliaConfig {
    struct FighterAttributes {
        euint32 agility;
        euint32 strength;
        euint32 stamina;
    }

    string private constant _TOKEN_NAME = "Encrypted Fighter";
    string private constant _TOKEN_SYMBOL = "eFGT";
    uint32 private constant _TOTAL_ATTRIBUTE_POINTS = 10;

    uint256 private _nextTokenId = 1;
    uint256 private _totalMinted;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => FighterAttributes) private _fighterAttributes;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    error FighterDoesNotExist(uint256 tokenId);
    error TokenAlreadyMinted(uint256 tokenId);
    error NotAuthorized();
    error InvalidAddress();
    error AttributeTotalMismatch();
    error AttributeOutOfRange();

    modifier onlyExistingToken(uint256 tokenId) {
        if (!_exists(tokenId)) {
            revert FighterDoesNotExist(tokenId);
        }
        _;
    }

    modifier nonZeroAddress(address account) {
        if (account == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC721).interfaceId
            || interfaceId == type(IERC721Metadata).interfaceId;
    }

    function name() external pure override returns (string memory) {
        return _TOKEN_NAME;
    }

    function symbol() external pure override returns (string memory) {
        return _TOKEN_SYMBOL;
    }

    function tokenURI(uint256) external pure override returns (string memory) {
        return "";
    }

    function totalSupply() external view returns (uint256) {
        return _totalMinted;
    }

    function balanceOf(address owner) external view override nonZeroAddress(owner) returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override onlyExistingToken(tokenId) returns (address) {
        return _owners[tokenId];
    }

    function getApproved(uint256 tokenId) external view override onlyExistingToken(tokenId) returns (address) {
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function fightersOf(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function getEncryptedAttributes(uint256 tokenId)
        external
        view
        onlyExistingToken(tokenId)
        returns (euint32 agility, euint32 strength, euint32 stamina)
    {
        FighterAttributes storage attributes = _fighterAttributes[tokenId];
        return (attributes.agility, attributes.strength, attributes.stamina);
    }

    function mintFighter(uint32 agilityPoints, uint32 strengthPoints, uint32 staminaPoints)
        external
        returns (uint256 tokenId)
    {
        tokenId = _nextTokenId;
        _nextTokenId++;
        _totalMinted++;

        FighterAttributes memory encryptedAttributes = _createAttributes(agilityPoints, strengthPoints, staminaPoints);

        _fighterAttributes[tokenId] = encryptedAttributes;

        FighterAttributes storage storedAttributes = _fighterAttributes[tokenId];
        _allowContract(storedAttributes);
        _allowViewer(storedAttributes, msg.sender);

        _mint(msg.sender, tokenId);
    }

    function updateAttributes(uint256 tokenId, uint32 agilityPoints, uint32 strengthPoints, uint32 staminaPoints)
        external
        onlyExistingToken(tokenId)
    {
        address owner = _owners[tokenId];
        if (!_isApprovedOrOwner(msg.sender, tokenId, owner)) {
            revert NotAuthorized();
        }

        FighterAttributes memory encryptedAttributes = _createAttributes(agilityPoints, strengthPoints, staminaPoints);

        _fighterAttributes[tokenId] = encryptedAttributes;

        FighterAttributes storage storedAttributes = _fighterAttributes[tokenId];
        _allowContract(storedAttributes);
        _allowViewer(storedAttributes, owner);
    }

    function allowViewer(uint256 tokenId, address viewer) external onlyExistingToken(tokenId) {
        if (viewer == address(0)) {
            revert InvalidAddress();
        }
        address owner = _owners[tokenId];
        if (!_isApprovedOrOwner(msg.sender, tokenId, owner)) {
            revert NotAuthorized();
        }

        FighterAttributes storage attributes = _fighterAttributes[tokenId];
        _allowViewer(attributes, viewer);
    }

    function approve(address to, uint256 tokenId) external override onlyExistingToken(tokenId) {
        address owner = _owners[tokenId];
        if (msg.sender != owner && !_operatorApprovals[owner][msg.sender]) {
            revert NotAuthorized();
        }
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        _transfer(from, to, tokenId);
        if (!_checkOnERC721Received(from, to, tokenId, "")) {
            revert NotAuthorized();
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override {
        _transfer(from, to, tokenId);
        if (!_checkOnERC721Received(from, to, tokenId, data)) {
            revert NotAuthorized();
        }
    }

    function _mint(address to, uint256 tokenId) private nonZeroAddress(to) {
        if (_exists(tokenId)) {
            revert TokenAlreadyMinted(tokenId);
        }

        _beforeTokenTransfer(address(0), to, tokenId);

        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) private nonZeroAddress(to) {
        if (!_exists(tokenId)) {
            revert FighterDoesNotExist(tokenId);
        }
        address owner = _owners[tokenId];
        if (owner != from) {
            revert NotAuthorized();
        }
        if (!_isApprovedOrOwner(msg.sender, tokenId, owner)) {
            revert NotAuthorized();
        }
        if (to == address(0)) {
            revert InvalidAddress();
        }

        _beforeTokenTransfer(from, to, tokenId);

        delete _tokenApprovals[tokenId];

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId, address owner) private view returns (bool) {
        return spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender];
    }

    function _exists(uint256 tokenId) private view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _createAttributes(uint32 agility, uint32 strength, uint32 stamina)
        private
        returns (FighterAttributes memory attributes)
    {
        _validateDistribution(agility, strength, stamina);

        attributes = FighterAttributes({
            agility: FHE.asEuint32(agility),
            strength: FHE.asEuint32(strength),
            stamina: FHE.asEuint32(stamina)
        });
    }

    function _allowContract(FighterAttributes storage attributes) private {
        FHE.allowThis(attributes.agility);
        FHE.allowThis(attributes.strength);
        FHE.allowThis(attributes.stamina);
    }

    function _allowViewer(FighterAttributes storage attributes, address viewer) private {
        FHE.allow(attributes.agility, viewer);
        FHE.allow(attributes.strength, viewer);
        FHE.allow(attributes.stamina, viewer);
    }

    function _validateDistribution(uint32 agility, uint32 strength, uint32 stamina) private pure {
        if (agility > _TOTAL_ATTRIBUTE_POINTS || strength > _TOTAL_ATTRIBUTE_POINTS || stamina > _TOTAL_ATTRIBUTE_POINTS) {
            revert AttributeOutOfRange();
        }

        if (agility + strength + stamina != _TOTAL_ATTRIBUTE_POINTS) {
            revert AttributeTotalMismatch();
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) private {
        if (from == to) {
            return;
        }

        if (from != address(0)) {
            uint256 lastIndex = _ownedTokens[from].length - 1;
            uint256 tokenIndex = _ownedTokensIndex[tokenId];

            if (tokenIndex != lastIndex) {
                uint256 lastTokenId = _ownedTokens[from][lastIndex];
                _ownedTokens[from][tokenIndex] = lastTokenId;
                _ownedTokensIndex[lastTokenId] = tokenIndex;
            }

            _ownedTokens[from].pop();
            delete _ownedTokensIndex[tokenId];
        }

        if (to != address(0)) {
            _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
            _ownedTokens[to].push(tokenId);
        }
    }

    function _afterTokenTransfer(address from, address to, uint256 tokenId) private {
        if (from != address(0) && to != address(0)) {
            FighterAttributes storage attributes = _fighterAttributes[tokenId];
            _allowViewer(attributes, to);
        }
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data)
        private
        returns (bool)
    {
        if (to.code.length == 0) {
            return true;
        }

        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch {
            return false;
        }
    }
}
