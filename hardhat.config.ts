require('dotenv').config();
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: (process.env.BENCHMARKING=="true") ? true : false,
    },
    goerli: {
      url: process.env.RPC_URL,
      accounts: {
          mnemonic: process.env.MNEMONIC,
          path: "m/44'/60'/0'/0",
          initialIndex: 0,
          count: 10,
      },
    },
  }
};

export default {
  ...config,
  gasReporter: {
    enabled: (process.env.REPORT_GAS=="true") ? true : false,
  }
};
