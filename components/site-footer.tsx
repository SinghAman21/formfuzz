import Link from "next/link"

import { cn } from "@/lib/utils"
import { FaXTwitter } from "react-icons/fa6"
import { FaGithub } from "react-icons/fa6"
import { SiPeerlist } from "react-icons/si"

const PEERLIST_URL = "https://peerlist.io/SinghAman21"
const X_URL = "https://x.com/SinghAman21_"
const GITHUB_PROFILE_URL = "https://github.com/SinghAman21"

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/50">
      <div className={cn("mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FormFuzz
        </p>

        <div className="flex items-center gap-5 text-sm">
          <Link
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <FaGithub className="size-4" />
            <span>GitHub</span>
          </Link>
          <Link
            href={PEERLIST_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Peerlist"
          >
            <SiPeerlist className="size-4" />
            <span>Peerlist</span>
          </Link>
          <Link
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="X"
          >
            <FaXTwitter className="size-4" />
            <span>X</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
