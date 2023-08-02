import { ethers } from "hardhat";
require("dotenv").config();

async function removeLiquidityETH() {
  const [deployer, _] = await ethers.getSigners();

  const tkAddress = process.env.TOKEN_ADDRESS || "";
  const routerAddress = process.env.ROUTER_ADDRESS || "";
  const liq_percent = BigInt(process.env.LIQ_PERCENT || "");
  const trigger_liq_percent = BigInt(process.env.TRIGGER_LIQ_PERCENT || "");

  const tk = await ethers.getContractAt("Token", tkAddress);
  const router = await ethers.getContractAt("IRouter", routerAddress);
  const factory = await ethers.getContractAt(
    "IFactory",
    await router.factory()
  );
  const pairAddress = await factory.getPair(tkAddress, await router.WETH());
  const pair = await ethers.getContractAt("IPair", pairAddress);

  // Check if we have lp token
  const lpBalance = await pair.balanceOf(deployer.address);
  console.log(
    `Token: ${await tk.name()} - ${tkAddress}\nLP balance: ${lpBalance}`
  );
  if (lpBalance <= 10n) {
    console.log(`No LP for token ${tkAddress}`);
    return;
  }

  const totalSupply = await tk.totalSupply();
  const triggetLiq =
    (((totalSupply * liq_percent) / 100n) * trigger_liq_percent) / 100n;

  var lpToken: bigint;
  console.log("Checking amount token in liquidity...");
  while (true) {
    lpToken = await tk.balanceOf(pairAddress);
    if (lpToken <= triggetLiq) {
      console.log("Triggered remove liquidity");
      break;
    }
    await new Promise((f) => setTimeout(f, 5000)); // recheck every 5s (5 * 1000ms)
  }

  // Approve for router to use LP
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
  console.log("Removed liquidity with tx hash:", removeLiquidityTx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
removeLiquidityETH().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
