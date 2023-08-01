// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.10;

import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IETH is IERC20, IWETH {
    function transfer(
        address to,
        uint256 amount
    ) external override(IWETH, IERC20) returns (bool);
}
