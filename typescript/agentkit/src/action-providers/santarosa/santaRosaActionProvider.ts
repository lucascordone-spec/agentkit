import { z } from "zod";
import { encodeFunctionData } from "viem";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../wallet-providers";
import { CreateAction } from "../actionDecorator";
import { Network } from "../../network";
import {
  SANTA_ROSA_ROUTER_BASE,
  SANTA_ROSA_DEFAULT_REFERRAL,
  SANTA_ROSA_ROUTER_ABI,
  SUPPORTED_NETWORKS,
} from "./constants";
import {
  GetUserDebtPositionsSchema,
  SimulateRescueSavingsSchema,
  BuildRescueTransactionSchema,
} from "./schemas";

/**
 * SantaRosaActionProvider enables autonomous AI agents to scan lending debt positions,
 * simulate 95% cheaper atomic anti-liquidation rescues, and execute flash loan transactions
 * on Base L2 while capturing an instant 0.05% builder revenue share in USDC.
 */
export class SantaRosaActionProvider extends ActionProvider<EvmWalletProvider> {
  private partnerReferral: string;

  constructor(partnerReferral: string = SANTA_ROSA_DEFAULT_REFERRAL) {
    super("santarosa", []);
    this.partnerReferral = partnerReferral;
  }

  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === "evm" &&
      SUPPORTED_NETWORKS.includes(network.networkId || "")
    );
  }

  /**
   * Inspects a borrower's active debt and collateral positions on Morpho Base.
   */
  @CreateAction({
    name: "get_user_debt_positions",
    description: `
Scans active debt positions on Base L2 across Morpho Blue.
Returns active debt in USD, collateral, and liquidation Health Factor.
`,
    schema: GetUserDebtPositionsSchema,
  })
  async getUserDebtPositions(
    _wallet: EvmWalletProvider,
    args: z.infer<typeof GetUserDebtPositionsSchema>,
  ): Promise<string> {
    try {
      const query = `
        query {
          marketPositions(where: { userAddress_in: ["${args.userAddress}"], chainId_in: [8453] }) {
            items {
              market {
                uniqueKey
                loanAsset { symbol address decimals }
                collateralAsset { symbol address decimals }
              }
              healthFactor
              state {
                borrowAssetsUsd
                collateralUsd
              }
            }
          }
        }
      `;

      const res = await fetch("https://api.morpho.org/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      const positions = (json.data?.marketPositions?.items || []).filter(
        (p: any) => (p.state?.borrowAssetsUsd || 0) > 1,
      );

      return JSON.stringify({
        status: "success",
        user: args.userAddress,
        network: "Base L2 (8453)",
        count: positions.length,
        positions: positions.map((p: any) => ({
          pair: `${p.market.collateralAsset?.symbol}/${p.market.loanAsset?.symbol}`,
          debtUsd: p.state.borrowAssetsUsd,
          collateralUsd: p.state.collateralUsd,
          healthFactor: p.healthFactor,
          isAtRisk: p.healthFactor < 1.08,
        })),
      }, null, 2);
    } catch (err: any) {
      return `Error scanning debt positions: ${err.message}`;
    }
  }

  /**
   * Simulates savings and 0.05% builder revenue share for rescuing an at-risk position.
   */
  @CreateAction({
    name: "simulate_rescue_savings",
    description: `
Simulates anti-liquidation flash loan debt rescue savings on Base L2.
Compares standard 5% liquidator penalty vs Santa Rosa 0.25% flat fee.
Returns exact user savings (~95% preserved capital) and instant 0.05% builder revenue share.
`,
    schema: SimulateRescueSavingsSchema,
  })
  async simulateRescueSavings(
    _wallet: EvmWalletProvider,
    args: z.infer<typeof SimulateRescueSavingsSchema>,
  ): Promise<string> {
    const penaltyAvoided = args.debtToRepayUsd * 0.05;
    const protocolFee = args.debtToRepayUsd * 0.0025;
    const builderFee = args.debtToRepayUsd * 0.0005;
    const netSaved = penaltyAvoided - protocolFee;

    return JSON.stringify({
      status: "success",
      user: args.userAddress,
      repayAmountUsd: args.debtToRepayUsd,
      financialComparison: {
        liquidationPenaltyAvoidedUsd: penaltyAvoided,
        santaRosaFlatFeeUsd: protocolFee,
        netUserSavingsUsd: netSaved,
        builderRevenueShareUsd: builderFee,
        savingsFactor: "20.0x cheaper than liquidation",
      },
    }, null, 2);
  }

  /**
   * Builds ready-to-execute transaction payload targeting the Santa Rosa Base Router.
   */
  @CreateAction({
    name: "build_rescue_transaction",
    description: `
Generates executable calldata for an atomic anti-liquidation debt rescue on Base L2.
Targets Santa Rosa Router (0xcd4f88bca4e2653fd24f61b4ef3aaccd76310a57).
Routes 0.05% builder fee automatically to the agent's referral address in the same block.
`,
    schema: BuildRescueTransactionSchema,
  })
  async buildRescueTransaction(
    wallet: EvmWalletProvider,
    args: z.infer<typeof BuildRescueTransactionSchema>,
  ): Promise<string> {
    try {
      const referral = args.referralAddress || this.partnerReferral || (await wallet.getAddress());

      const emptySwap = {
        aggregatorRouter: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        tokenIn: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        tokenOut: args.loanToken as `0x${string}`,
        amountIn: 0n,
        minAmountOut: 0n,
        callData: "0x" as `0x${string}`,
      };

      const calldata = encodeFunctionData({
        abi: SANTA_ROSA_ROUTER_ABI,
        functionName: "executeAction",
        args: [
          0, // ActionType.RESCUE
          0, // TargetProtocol.MORPHO
          args.loanToken as `0x${string}`,
          BigInt(args.loanAmountWei),
          referral as `0x${string}`,
          emptySwap,
        ],
      });

      return JSON.stringify({
        status: "success",
        to: SANTA_ROSA_ROUTER_BASE,
        data: calldata,
        value: "0x0",
        network: "Base L2 (8453)",
        estimatedGas: "< 500,000 (< $0.05 USD on Base)",
      }, null, 2);
    } catch (err: any) {
      return `Error building rescue transaction: ${err.message}`;
    }
  }
}

export const santaRosaActionProvider = (partnerReferral?: string) =>
  new SantaRosaActionProvider(partnerReferral);
