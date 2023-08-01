import { ethers } from "hardhat";
require("dotenv").config();

async function deploy() {
  const tkName = process.env.TOKEN_NAME || "";
  const tkSymbol = process.env.TOKEN_SYMBOL || "";
  const initSupply = process.env.TOTAL_SUPPLY || -1;

  const routerAddress = process.env.ROUTER_ADDRESS || "";

  const [deployer, others] = await ethers.getSigners();

  const router = await ethers.getContractAt("IRouter", routerAddress);
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
  const amountToLiquidity = totalSupply / 2n;

  // Approve for router to use token
  const approveTx = await tk.approve(routerAddress, totalSupply);
  await approveTx.wait();
  console.log("Approved for router");

  // Add liquidity
  const deadline = Math.round(Date.now() / 1000 + 300);
  const tx = await router.addLiquidityETH(
    tkAddress,
    amountToLiquidity,
    amountToLiquidity,
    ethers.parseEther("1.0"),
    deployer.address,
    deadline,
    { value: ethers.parseEther("1.0") }
  );
  await tx.wait();
  console.log("Liquidity added");

  // Get pair
  const pairAddress = await factory.getPair(tkAddress, await router.WETH());
  console.log(
    "Token: " + tkAddress,
    "\nPair: " + pairAddress,
    "\nToken in pair: " + ethers.formatEther(await tk.balanceOf(pairAddress)),
    "\nWETH in pair: " + ethers.formatEther(await weth.balanceOf(pairAddress))
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
