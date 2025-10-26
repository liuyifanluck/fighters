import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { FighterNFT, FighterNFT__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FighterNFT")) as FighterNFT__factory;
  const contract = (await factory.deploy()) as FighterNFT;
  const address = await contract.getAddress();

  return { contract, address };
}

type EncryptedAttributes = {
  handles: readonly string[];
  proof: string;
};

async function encryptAttributes(
  contractAddress: string,
  signer: HardhatEthersSigner,
  distribution: [number, number, number],
): Promise<EncryptedAttributes> {
  const input = fhevm.createEncryptedInput(contractAddress, signer.address);
  input.add32(distribution[0]);
  input.add32(distribution[1]);
  input.add32(distribution[2]);

  const encrypted = await input.encrypt();
  return {
    handles: encrypted.handles,
    proof: encrypted.inputProof,
  };
}

async function decryptAttributes(
  contract: FighterNFT,
  contractAddress: string,
  tokenId: number,
  signer: HardhatEthersSigner,
) {
  const attributes = await contract.getEncryptedAttributes(tokenId);
  const agility = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[0], contractAddress, signer);
  const strength = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[1], contractAddress, signer);
  const stamina = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[2], contractAddress, signer);

  return {
    agility: Number(agility),
    strength: Number(strength),
    stamina: Number(stamina),
  };
}

describe("FighterNFT", function () {
  let signers: Signers;

  before(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const accounts: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: accounts[0], alice: accounts[1], bob: accounts[2] };
  });

  it("mints fighters with encrypted attributes", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    const encrypted = await encryptAttributes(address, signers.alice, [4, 3, 3]);
    const tx = await contract
      .connect(signers.alice)
      .mintFighter(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.proof);
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);

    const tokenOwner = await contract.ownerOf(1n);
    expect(tokenOwner).to.equal(signers.alice.address);

    const decrypted = await decryptAttributes(contract, address, 1, signers.alice);
    expect(decrypted).to.deep.equal({ agility: 4, strength: 3, stamina: 3 });

    const ownedTokens = await contract.fightersOf(signers.alice.address);
    expect(ownedTokens.map((token) => Number(token))).to.deep.equal([1]);

    const totalSupply = await contract.totalSupply();
    expect(totalSupply).to.equal(1n);
  });

  it("updates attributes and maintains access", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    const initialAttributes = await encryptAttributes(address, signers.alice, [3, 4, 3]);
    await contract
      .connect(signers.alice)
      .mintFighter(
        initialAttributes.handles[0],
        initialAttributes.handles[1],
        initialAttributes.handles[2],
        initialAttributes.proof,
      );

    const updatedAttributes = await encryptAttributes(address, signers.alice, [2, 5, 3]);
    const updateTx = await contract
      .connect(signers.alice)
      .updateAttributes(
        1n,
        updatedAttributes.handles[0],
        updatedAttributes.handles[1],
        updatedAttributes.handles[2],
        updatedAttributes.proof,
      );
    await updateTx.wait();

    const decrypted = await decryptAttributes(contract, address, 1, signers.alice);
    expect(decrypted).to.deep.equal({ agility: 2, strength: 5, stamina: 3 });
  });

  it("grants viewer access and handles transfers", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    const encrypted = await encryptAttributes(address, signers.alice, [2, 4, 4]);
    await contract
      .connect(signers.alice)
      .mintFighter(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.proof);

    await contract.connect(signers.alice).allowViewer(1n, signers.bob.address);

    const bobView = await decryptAttributes(contract, address, 1, signers.bob);
    expect(bobView).to.deep.equal({ agility: 2, strength: 4, stamina: 4 });

    await contract.connect(signers.alice).transferFrom(signers.alice.address, signers.bob.address, 1n);

    const ownerAfter = await contract.ownerOf(1n);
    expect(ownerAfter).to.equal(signers.bob.address);

    const aliceTokens = await contract.fightersOf(signers.alice.address);
    expect(aliceTokens.length).to.equal(0);

    const bobTokens = await contract.fightersOf(signers.bob.address);
    expect(bobTokens.map((token) => Number(token))).to.deep.equal([1]);

    const decryptedAfterTransfer = await decryptAttributes(contract, address, 1, signers.bob);
    expect(decryptedAfterTransfer).to.deep.equal({ agility: 2, strength: 4, stamina: 4 });
  });
});
