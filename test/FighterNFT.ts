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

    const tx = await contract.connect(signers.alice).mintFighter(4, 3, 3);
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

  it("rejects invalid attribute totals", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    await expect(contract.connect(signers.alice).mintFighter(5, 3, 3)).to.be.revertedWithCustomError(
      contract,
      "AttributeTotalMismatch",
    );
  });

  it("updates attributes and maintains access", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    await contract.connect(signers.alice).mintFighter(3, 4, 3);

    const updateTx = await contract.connect(signers.alice).updateAttributes(1n, 2, 5, 3);
    await updateTx.wait();

    const decrypted = await decryptAttributes(contract, address, 1, signers.alice);
    expect(decrypted).to.deep.equal({ agility: 2, strength: 5, stamina: 3 });
  });

  it("grants viewer access and handles transfers", async function () {
    const { contract, address } = await loadFixture(deployFixture);

    await contract.connect(signers.alice).mintFighter(2, 4, 4);

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
