"use client"

import {
	ArrowDown,
	Clock,
	Eye,
	Keyboard,
	Settings2,
	TrendingUp,
} from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { parseUnits } from "viem"
import { useAccount, useChainId } from "wagmi"
import { IntentTracker } from "#/components/intent/intent-tracker"
import { SlippageSettings } from "#/components/swap/slippage-settings"
import { SwapButton } from "#/components/swap/swap-button"
import { TokenInput } from "#/components/swap/token-input"
import { Button } from "#/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover"
import { INTENT_REGISTRY } from "#/config/contracts"
import { BUY_TOKENS, SELL_TOKENS } from "#/config/tokens"
import type { SupportedChainId } from "#/config/wagmi"
import { useIntentLifecycle } from "#/hooks/use-intent-lifecycle"
import { useTokenAllowance } from "#/hooks/use-token-allowance"
import { useTokenBalance } from "#/hooks/use-token-balance"
import { DEFAULT_SLIPPAGE_BPS } from "#/lib/constants"
import { useIntentStore } from "#/stores/intent-store"
import type { Token } from "#/types/token"

export function SwapCard() {
	const chainId = useChainId() as SupportedChainId
	const { address } = useAccount()
	const phase = useIntentStore((s) => s.phase)

	const [tokenIn, setTokenIn] = useState<Token | null>(SELL_TOKENS[0])
	const [tokenOut, setTokenOut] = useState<Token | null>(BUY_TOKENS[0])
	const [amountIn, setAmountIn] = useState("")
	const [amountOut, setAmountOut] = useState("")
	const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS)

	const tokenInAddress = tokenIn?.addresses[chainId]
	const spender = INTENT_REGISTRY[chainId]

	const { balance: balanceIn } = useTokenBalance(tokenInAddress, address)
	const { balance: balanceOut } = useTokenBalance(
		tokenOut?.addresses[chainId],
		address,
	)
	const { allowance } = useTokenAllowance(tokenInAddress, address, spender)

	const parsedAmount =
		amountIn && tokenIn ? parseUnits(amountIn, tokenIn.decimals) : 0n

	const needsApproval =
		allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount

	const { execute } = useIntentLifecycle()

	const handleSwap = useCallback(() => {
		if (!tokenIn || !tokenOut || !parsedAmount || !amountOut) return
		const tokenInAddr = tokenIn.addresses[chainId]
		const tokenOutAddr = tokenOut.addresses[chainId]
		if (!tokenInAddr || !tokenOutAddr) return

		const expectedAmountOut = parseUnits(amountOut, tokenOut.decimals)
		execute({
			tokenIn: tokenInAddr,
			tokenOut: tokenOutAddr,
			amountIn: parsedAmount,
			expectedAmountOut,
			needsApproval,
			slippageBps,
		})
	}, [
		tokenIn,
		tokenOut,
		parsedAmount,
		amountOut,
		chainId,
		needsApproval,
		slippageBps,
		execute,
	])

	// Compute mock output (1 ETH ≈ 2500 USDC for demo)
	const computeOutput = useCallback(
		(input: string) => {
			if (!input || !tokenIn || !tokenOut) {
				setAmountOut("")
				return
			}
			const val = Number.parseFloat(input)
			if (Number.isNaN(val) || val === 0) {
				setAmountOut("")
				return
			}
			if (tokenIn.symbol === "USDC" && tokenOut.symbol === "ETH") {
				setAmountOut((val / 2500).toFixed(6))
			} else if (tokenIn.symbol === "ETH" && tokenOut.symbol === "USDC") {
				setAmountOut((val * 2500).toFixed(2))
			} else {
				setAmountOut(val.toFixed(4))
			}
		},
		[tokenIn, tokenOut],
	)

	const isActive = phase !== "idle" && phase !== "filled" && phase !== "failed"

	const demoToasts = useCallback(() => {
		const mockTxHash = "0x1234...abcd"

		// Approving
		setTimeout(() => {
			toast.loading("Approving USDC...", {
				id: "demo-approve",
				description: "Waiting for wallet confirmation",
			})
		}, 0)

		// Approved
		setTimeout(() => {
			toast.success("Approved USDC", {
				id: "demo-approve",
				description: "Token allowance set",
			})
		}, 1500)

		// Submitting
		setTimeout(() => {
			toast.loading("Submitting intent...", {
				id: "demo-submit",
				description: "Creating swap order on-chain",
			})
		}, 2000)

		// Submitted
		setTimeout(() => {
			toast.success("Intent submitted", {
				id: "demo-submit",
				description: `Tx: ${mockTxHash}`,
				action: {
					label: "View",
					onClick: () =>
						window.open(`https://sepolia.basescan.org/tx/${mockTxHash}`),
				},
			})
		}, 3500)

		// Processing
		setTimeout(() => {
			toast.loading("Processing...", {
				id: "demo-process",
				description: "MPC nodes are filling your order",
			})
		}, 4000)

		// Settling
		setTimeout(() => {
			toast.loading("Settling...", {
				id: "demo-process",
				description: "Finalizing on-chain settlement",
			})
		}, 5500)

		// Filled
		setTimeout(() => {
			toast.success("Swap complete!", {
				id: "demo-process",
				description: "Received 0.4 ETH",
				action: {
					label: "View",
					onClick: () =>
						window.open(`https://sepolia.basescan.org/tx/${mockTxHash}`),
				},
			})
		}, 7000)

		// Error example (separate)
		setTimeout(() => {
			toast.error("Transaction failed", {
				id: "demo-error",
				description: "User rejected the request",
			})
		}, 8500)
	}, [])

	const rate =
		amountIn && amountOut && Number.parseFloat(amountIn) > 0
			? (Number.parseFloat(amountOut) / Number.parseFloat(amountIn)).toFixed(6)
			: null

	return (
		<div className="w-full max-w-[440px] animate-fade-in-up">
			{/* Command palette style header */}
			<div className="mb-4 flex items-center justify-between animate-fade-in-up stagger-2">
				<button
					type="button"
					className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 hover:translate-x-0.5 active:scale-95"
				>
					<Clock className="h-3 w-3" />
					History
				</button>
			</div>

			{/* Main interface - command palette aesthetic */}
			<div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/5 animate-fade-in-scale stagger-1">
				{/* Search-like input header */}
				<div className="border-b px-4 py-3">
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-muted-foreground">
							Swap
						</span>
						<div className="flex-1" />
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 hover:rotate-45 transition-transform duration-200"
								>
									<Settings2 className="h-3.5 w-3.5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-72" align="end">
								<SlippageSettings
									slippageBps={slippageBps}
									onSlippageChange={setSlippageBps}
								/>
							</PopoverContent>
						</Popover>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Keyboard className="h-3 w-3" />
							<span>Tab to switch</span>
						</div>
					</div>
				</div>

				{/* From row */}
				<TokenInput
					label="You pay"
					tokens={SELL_TOKENS}
					selectedToken={tokenIn}
					onSelectToken={setTokenIn}
					amount={amountIn}
					onAmountChange={(v) => {
						setAmountIn(v)
						computeOutput(v)
					}}
					balance={balanceIn}
					disabled={isActive}
				/>

				{/* Direction indicator - inline */}
				<div className="flex items-center gap-3 px-4 py-2 bg-muted/30 transition-colors duration-200 hover:bg-muted/50">
					<ArrowDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" />
					<div className="flex-1 flex items-center gap-2">
						{rate && tokenIn && tokenOut && (
							<>
								<TrendingUp className="h-3 w-3 text-brand animate-pulse-subtle" />
								<span className="text-xs text-muted-foreground">
									1 {tokenIn.symbol} = {rate} {tokenOut.symbol}
								</span>
							</>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						Slippage: {(slippageBps / 100).toFixed(1)}%
					</span>
				</div>

				{/* To row */}
				<TokenInput
					label="You receive"
					tokens={BUY_TOKENS}
					selectedToken={tokenOut}
					onSelectToken={setTokenOut}
					amount={amountOut}
					readOnly
					balance={balanceOut}
					disabled={isActive}
					highlight
				/>

				{/* Action bar */}
				<div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
					<div className="flex items-center gap-2">
						<kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground transition-all duration-150 hover:bg-muted hover:scale-105">
							Enter
						</kbd>
						<span className="text-xs text-muted-foreground">to confirm</span>
					</div>
					<SwapButton
						phase={phase}
						hasAmount={parsedAmount > 0n}
						hasTokens={!!tokenIn && !!tokenOut}
						needsApproval={needsApproval}
						onSwap={handleSwap}
					/>
				</div>

				{/* Intent tracker shows when swap is in progress */}
				{phase !== "idle" && (
					<div className="border-t px-4 py-3 animate-fade-in-up">
						<IntentTracker />
					</div>
				)}
			</div>

			{/* Quick tokens */}
			<div className="mt-4 flex items-center gap-2 animate-fade-in-up stagger-4">
				<span className="text-xs text-muted-foreground">Quick:</span>
				{BUY_TOKENS.map((token, i) => (
					<button
						type="button"
						key={token.symbol}
						onClick={() => setTokenOut(token)}
						disabled={isActive}
						className="rounded-md border bg-card px-2 py-1 text-xs font-medium transition-all duration-150 hover:bg-muted hover:border-brand/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
						style={{ animationDelay: `${250 + i * 50}ms` }}
					>
						{token.symbol}
					</button>
				))}
			</div>

			{/* Visualise button */}
			<div className="mt-3 animate-fade-in-up stagger-5">
				<button
					type="button"
					onClick={demoToasts}
					className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 hover:translate-x-0.5 active:scale-95"
				>
					<Eye className="h-3 w-3" />
					Visualise flow
				</button>
			</div>
		</div>
	)
}
