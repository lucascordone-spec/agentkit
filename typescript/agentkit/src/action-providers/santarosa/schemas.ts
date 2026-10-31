import { z } from "zod";

/**
 * Input schema for inspecting a user's debt positions on Base L2.
 */
export const GetUserDebtPositionsSchema = z
  .object({
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The EVM wallet or vault address to inspect for active debt and collateral on Morpho Base."),
  })
  .describe("Input schema for inspecting user debt positions on Base L2");

/**
 * Input schema for simulating debt rescue savings.
 */
export const SimulateRescueSavingsSchema = z
  .object({
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The borrower address on Base whose position is near liquidation."),
    currentDebtUsd: z
      .number()
      .positive()
      .describe("Total current debt amount in USD."),
    debtToRepayUsd: z
      .number()
      .positive()
      .describe("Amount of debt in USD to deleverage/repay using a 0% flash loan."),
    referralAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .optional()
      .describe("Builder referral address to receive the 0.05% revenue share on Base L2."),
  })
  .describe("Input schema for simulating anti-liquidation rescue savings");

/**
 * Input schema for building executable rescue transaction calldata.
 */
export const BuildRescueTransactionSchema = z
  .object({
    loanToken: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The underlying debt token address on Base (e.g., USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)."),
    loanAmountWei: z
      .string()
      .regex(/^\d+$/, "Must be a valid integer string representing amount in atomic units (wei)")
      .describe("The loan amount in atomic units (wei) to flash borrow and repay."),
    referralAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .optional()
      .describe("Builder referral address to receive 0.05% fee share directly in the same execution block."),
  })
  .describe("Input schema for building atomic rescue transaction calldata on Base L2");
