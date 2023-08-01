import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

describe("Contract", function () {
  async function deployContractFixture() {
    const [deployer, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("Token");
    const ctr = await Contract.deploy("TokenName", "SYMBOL", 100_000_000_000);

    return { ctr, deployer, otherAccount };
  }

  describe("Deployment", function () {
    it("Deployment", async function () {
      const { ctr } = await loadFixture(deployContractFixture);
      console.log(await ctr.name());
      console.log(await ctr.symbol());
      console.log(await ctr.totalSupply());
    });
  });
});
