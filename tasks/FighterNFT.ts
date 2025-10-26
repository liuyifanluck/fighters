import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "FighterNFT";

function parseAttribute(value: string, attribute: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${attribute} must be an integer`);
  }
  if (parsed < 0 || parsed > 10) {
    throw new Error(`${attribute} must be between 0 and 10`);
  }
  return parsed;
}

async function getContract(hre: any, addressOverride?: string) {
  const { deployments, ethers } = hre;
  if (addressOverride) {
    return {
      address: addressOverride,
      instance: await ethers.getContractAt(CONTRACT_NAME, addressOverride),
    };
  }
  const deployment = await deployments.get(CONTRACT_NAME);
  return {
    address: deployment.address,
    instance: await ethers.getContractAt(CONTRACT_NAME, deployment.address),
  };
}

task("fighter:address", "Prints the FighterNFT address")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await hre.deployments.get(CONTRACT_NAME);
    console.log(`${CONTRACT_NAME} address: ${deployment.address}`);
  });

task("fighter:mint", "Mints a new fighter with encrypted attributes")
  .addParam("agility", "Agility points (0-10)")
  .addParam("strength", "Strength points (0-10)")
  .addParam("stamina", "Stamina points (0-10)")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    const agility = parseAttribute(taskArguments.agility, "agility");
    const strength = parseAttribute(taskArguments.strength, "strength");
    const stamina = parseAttribute(taskArguments.stamina, "stamina");

    if (agility + strength + stamina !== 10) {
      throw new Error("Attribute points must sum to 10");
    }

    const { address, instance } = await getContract(hre, taskArguments.address);

    const [signer] = await ethers.getSigners();

    const input = fhevm.createEncryptedInput(address, signer.address);
    input.add32(agility);
    input.add32(strength);
    input.add32(stamina);
    const encrypted = await input.encrypt();

    const tx = await instance
      .connect(signer)
      .mintFighter(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

    console.log(`Mint transaction submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Mint transaction status: ${receipt?.status}`);

    const totalSupply = await instance.totalSupply();
    console.log(`Minted fighter tokenId: ${totalSupply.toString()}`);
  });

task("fighter:attributes", "Decrypt fighter attributes")
  .addParam("tokenid", "Token id to decrypt")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const { address, instance } = await getContract(hre, taskArguments.address);
    const [signer] = await ethers.getSigners();

    const tokenId = BigInt(taskArguments.tokenid);

    const attributes = await instance.getEncryptedAttributes(tokenId);

    const agility = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[0], address, signer);
    const strength = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[1], address, signer);
    const stamina = await fhevm.userDecryptEuint(FhevmType.euint32, attributes[2], address, signer);

    console.log(`Fighter ${tokenId.toString()} attributes:`);
    console.log(`  Agility : ${agility.toString()}`);
    console.log(`  Strength: ${strength.toString()}`);
    console.log(`  Stamina : ${stamina.toString()}`);
  });

task("fighter:update", "Updates fighter attributes")
  .addParam("tokenid", "Token id to update")
  .addParam("agility", "Agility points (0-10)")
  .addParam("strength", "Strength points (0-10)")
  .addParam("stamina", "Stamina points (0-10)")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    const agility = parseAttribute(taskArguments.agility, "agility");
    const strength = parseAttribute(taskArguments.strength, "strength");
    const stamina = parseAttribute(taskArguments.stamina, "stamina");

    if (agility + strength + stamina !== 10) {
      throw new Error("Attribute points must sum to 10");
    }

    const { address, instance } = await getContract(hre, taskArguments.address);
    const [signer] = await ethers.getSigners();

    const tokenId = BigInt(taskArguments.tokenid);

    const input = fhevm.createEncryptedInput(address, signer.address);
    input.add32(agility);
    input.add32(strength);
    input.add32(stamina);
    const encrypted = await input.encrypt();

    const tx = await instance
      .connect(signer)
      .updateAttributes(
        tokenId,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
      );

    console.log(`Update transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log(`Attributes updated for fighter ${tokenId.toString()}`);
  });

task("fighter:allow", "Allows a viewer address to decrypt fighter attributes")
  .addParam("tokenid", "Token id to share")
  .addParam("viewer", "Address to grant access")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;

    const { instance } = await getContract(hre, taskArguments.address);
    const [signer] = await ethers.getSigners();

    const tokenId = BigInt(taskArguments.tokenid);
    const viewer = taskArguments.viewer as string;

    const tx = await instance.connect(signer).allowViewer(tokenId, viewer);
    console.log(`Allow viewer transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log(`Access granted to ${viewer} for fighter ${tokenId.toString()}`);
  });
