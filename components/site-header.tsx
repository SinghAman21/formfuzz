import Link from "next/link"

import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className={cn("mx-auto flex h-16 max-w-6xl items-center justify-between px-4")}>
        <Link href="/" className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan shadow-[0_0_18px_var(--glow-purple)]" />
          <span className="text-2xl font-semibold tracking-tight">FormFuzz</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* <span className="hidden sm:inline">Google Forms QA runner</span> */}
        </nav>
      </div>
    </header>
  )
}


