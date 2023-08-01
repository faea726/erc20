import { ethers } from "hardhat";
require("dotenv").config();

async function removeLiquidity() {
  const [deployer, others] = await ethers.getSigners();

  const tkAddress = process.env.TOKEN_ADDRESS || "";
  const router = await ethers.getContractAt(
    "IRouter",
    process.env.ROUTER_ADDRESS || ""
  );
  const factory = await ethers.getContractAt(
    "IFactory",
    await router.factory()
  );
  const weth = await ethers.getContractAt("IETH", await router.WETH());

  const pair = await ethers.getContractAt(
    "IPair",
    await factory.getPair(tkAddress, await weth.getAddress())
  );

  // Approve for router to use LP
  const lpBalance = await pair.balanceOf(deployer.address);
  if (lpBalance <= 5n) {
    console.log(`No LP for token${tkAddress}`);
    return;
  }
  const approveTx = await pair.approve(await router.getAddress(), lpBalance);
  await approveTx.wait();
  console.log("Approved pair");

  // Remove liquidity ETH
  const deadline = Math.round(Date.now() + 300);
  const removeLiquidityTx = await router.removeLiquidityETH(
    tkAddress,
    lpBalance,
    0,
    0,
    deployer.address,
    deadline
  );
  await removeLiquidityTx.wait();
  console.log("Removed liquidity:", removeLiquidityTx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
removeLiquidity().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
