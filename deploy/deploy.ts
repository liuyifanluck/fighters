import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployedFighter = await deploy("FighterNFT", {
    from: deployer,
    log: true,
  });

  log(`FighterNFT contract deployed at ${deployedFighter.address}`);
};

export default func;
func.id = "deploy_fighter_nft";
func.tags = ["FighterNFT"];
