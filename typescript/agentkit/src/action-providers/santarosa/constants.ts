export const SANTA_ROSA_ROUTER_BASE = "0xcd4f88bca4e2653fd24f61b4ef3aaccd76310a57";
export const SANTA_ROSA_DEFAULT_REFERRAL = "0xf8e8f98CB88199650Fa8e93965fDf4F02c2EA7a8";
export const MORPHO_BLUE_BASE = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

export const SUPPORTED_NETWORKS = ["base-mainnet"];

export const SANTA_ROSA_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint8", name: "action", type: "uint8" },
      { internalType: "uint8", name: "protocol", type: "uint8" },
      { internalType: "address", name: "loanToken", type: "address" },
      { internalType: "uint256", name: "loanAmount", type: "uint256" },
      { internalType: "address", name: "referral", type: "address" },
      {
        components: [
          { internalType: "address", name: "aggregatorRouter", type: "address" },
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "minAmountOut", type: "uint256" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct FlashShiftRouter.SwapParams",
        name: "swap",
        type: "tuple",
      },
    ],
    name: "executeAction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
