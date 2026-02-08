"use client"

import Image from "next/image"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "#/components/ui/button"
import { truncateAddress } from "#/lib/format"

export function Header() {
	const { address, isConnected, chain } = useAccount()
	const { connectors, connect, isPending } = useConnect()
	const { disconnect } = useDisconnect()

	return (
		<header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link
						href="/"
						className="group flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
					>
						<Image
							src="/logo.svg"
							alt="VeilSwap"
							width={24}
							height={24}
							className="h-6 w-auto transition-transform duration-300 group-hover:rotate-6"
						/>
						<span className="font-semibold tracking-tight italic">
							VeilSwap
						</span>
					</Link>
					<nav className="flex items-center gap-1">
						<Link
							href="/"
							className="relative rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
						>
							Swap
						</Link>
						<Link
							href="/lp"
							className="relative rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
						>
							LPs
						</Link>
					</nav>
				</div>

				<div className="flex items-center gap-3">
					{isConnected ? (
						<>
							{chain && (
								<span className="rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-all duration-200 hover:bg-brand/15 hover:scale-105">
									{chain.name}
								</span>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={() => disconnect()}
								className="font-mono text-xs transition-all duration-150 hover:border-destructive/50 hover:text-destructive"
							>
								{truncateAddress(address)}
							</Button>
						</>
					) : (
						connectors.slice(0, 1).map((connector) => (
							<Button
								key={connector.uid}
								size="sm"
								onClick={() => connect({ connector })}
								disabled={isPending}
								className="bg-brand text-brand-foreground hover:bg-brand/90 transition-all duration-200 hover:shadow-md hover:shadow-brand/20"
							>
								{isPending ? "Connecting..." : "Connect Wallet"}
							</Button>
						))
					)}
				</div>
			</div>
		</header>
	)
}
