import { HardhatUserConfig } from "hardhat/config";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: (process.env.BENCHMARKING=="true") ? true : false
    }
  }
};

export default {
  ...config,
  gasReporter: {
    enabled: (process.env.REPORT_GAS=="true") ? true : false,
  }
};
