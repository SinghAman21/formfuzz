"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Loader2, AlertTriangle, Terminal, Play, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL

interface Log {
  time: string
  message: string
  type: "normal" | "warning" | "error"
}

export default function FormFuzzPage() {
  const [formUrl, setFormUrl] = useState("")
  const [submissionCount, setSubmissionCount] = useState(1)
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash")
  const [customModel, setCustomModel] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "running" | "finished" | "error">("idle")

  const logEndRef = useRef<HTMLDivElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom of console
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const fetchLogs = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${WEB_APP_URL}?jobId=${id}`)
      const data = await response.json()

      if (data.logs) {
        const processedLogs = data.logs.map((l: any) => {
          let type: "normal" | "warning" | "error" = "normal"
          if (l.message.includes("ERROR") || l.message.includes("failed")) type = "error"
          else if (l.message.includes("WARN") || l.message.includes("Skipped")) type = "warning"
          return { ...l, type }
        })

        setLogs(processedLogs)

        const lastLog = processedLogs.at(-1)?.message || ""
        if (lastLog.includes("Job finished") || lastLog.includes("Job completed successfully")) {
          stopPolling("finished")
        } else if (lastLog.includes("ERROR")) {
          stopPolling("error")
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching logs:", error)
    }
  }, [])

  const stopPolling = (finalStatus: "finished" | "error") => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
    setIsLoading(false)
    setStatus(finalStatus)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidFormUrl(formUrl)) return

    const newJobId = crypto.randomUUID()
    setJobId(newJobId)
    setLogs([])
    setIsLoading(true)
    setStatus("running")

    try {
      await fetch(WEB_APP_URL || "", {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: newJobId,
          formUrl,
          submissionCount,
          geminiApiKey: apiKey || undefined,
          geminiModel: geminiModel === "custom" ? customModel : geminiModel,
          geminiSystemPrompt: systemPrompt.trim() || undefined,
        }),
      })
    } catch (e) {
      console.error("[v0] Trigger error (no-cors mode):", e)
    }

    // 2. Start polling
    pollingInterval.current = setInterval(() => fetchLogs(newJobId), 1000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current)
    }
  }, [])

  const isValidFormUrl = (url: string) => {
    return /^https:\/\/docs\.google\.com\/forms\/d\/[a-zA-Z0-9_-]+\/edit/.test(url)
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 bg-background relative overflow-hidden">
      {/* Abstract background glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent">
              FormFuzz
            </h1>
            <p className="text-muted-foreground">Automated last-moment Google Forms data creation tool.</p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Job Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Form Edit URL
                  </label>
                  <Input
                    placeholder="https://docs.google.com/forms/d/.../edit"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={cn(
                      "bg-background/50 border-border/50 focus:ring-neon-purple/30",
                      formUrl && !isValidFormUrl(formUrl) && "border-destructive/50 focus:ring-destructive/30",
                    )}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submissions
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={submissionCount}
                      onChange={(e) => setSubmissionCount(Number.parseInt(e.target.value))}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gemini Model
                    </label>
                    <Select value={geminiModel} onValueChange={setGeminiModel}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash</SelectItem>
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {geminiModel === "custom" && (
                  <Input
                    placeholder="Enter model string... eg gemini-2.5-flash"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="bg-background/50 border-border/50 mt-2"
                  />
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    API Key (Optional)
                  </label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="AI key for smarter answers"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-background/50 border-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    System Prompt (Optional)
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Add extra instructions for Gemini (used for Text + Paragraph answers). Example: Answer like a helpful support agent. Keep it concise. No emojis."
                    rows={3}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none",
                      "bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-neon-purple/30",
                      "placeholder:text-muted-foreground/60",
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    This is sent with the job and applied when Gemini is enabled.
                  </p>
                </div>

                <div className="pt-2 space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                      <div className="w-4 h-[1px] bg-muted-foreground/30" />
                      Workflow
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-md border border-border/50 bg-background/30 px-3 py-2 flex gap-3">
                        <div className="size-5 rounded-full bg-neon-cyan/15 text-neon-cyan flex items-center justify-center text-[10px] font-bold shrink-0">
                          1
                        </div>
                        <div className="leading-snug">
                          <div className="text-[11px] font-semibold text-foreground/90">Paste Form Edit URL</div>
                          <div className="text-[10px] text-muted-foreground">Must end with /edit</div>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/50 bg-background/30 px-3 py-2 flex gap-3">
                        <div className="size-5 rounded-full bg-neon-cyan/15 text-neon-cyan flex items-center justify-center text-[10px] font-bold shrink-0">
                          2
                        </div>
                        <div className="leading-snug">
                          <div className="text-[11px] font-semibold text-foreground/90">Share to runner account</div>
                          <div className="text-[10px] text-muted-foreground">
                            Add <code className="text-neon-cyan">formfuzz@gmail.com</code> as editor
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/50 bg-background/30 px-3 py-2 flex gap-3">
                        <div className="size-5 rounded-full bg-neon-cyan/15 text-neon-cyan flex items-center justify-center text-[10px] font-bold shrink-0">
                          3
                        </div>
                        <div className="leading-snug">
                          <div className="text-[11px] font-semibold text-foreground/90">Set submissions + (optional) AI</div>
                          <div className="text-[10px] text-muted-foreground">Pick a model, add key if you want</div>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/50 bg-background/30 px-3 py-2 flex gap-3">
                        <div className="size-5 rounded-full bg-neon-cyan/15 text-neon-cyan flex items-center justify-center text-[10px] font-bold shrink-0">
                          4
                        </div>
                        <div className="leading-snug">
                          <div className="text-[11px] font-semibold text-foreground/90">Generate + watch console</div>
                          <div className="text-[10px] text-muted-foreground">Logs stream live on the right</div>
                        </div>
                      </div>
                    </div>

                    <details className="rounded-md border border-border/50 bg-background/20 px-3 py-2">
                      <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        How to find the Form Edit URL
                      </summary>
                      <div className="mt-2 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                        <div>
                          Go to{" "}
                          <a
                            className="text-neon-cyan underline underline-offset-2"
                            href="https://docs.google.com/forms/u/0/"
                            target="_blank"
                            rel="noreferrer"
                          >
                            https://docs.google.com/forms/u/0/
                          </a>
                          , choose a form you own.
                        </div>
                        <div>On the Questions tab, copy the active URL in your address bar.</div>
                        <div>
                          It should look like{" "}
                          <code className="text-neon-cyan">https://docs.google.com/forms/d/FORM_ID/edit</code>.
                        </div>
                      </div>
                    </details>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !isValidFormUrl(formUrl)}
                    className={cn(
                      "w-full h-12 font-bold transition-all duration-300",
                      "bg-gradient-to-r from-neon-purple to-neon-cyan hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]",
                      isLoading && "opacity-80 grayscale-[0.5]",
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        Generate Submissions
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Console */}
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-neon-cyan" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Live Console</h2>
            </div>
            {status === "finished" && (
              <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/5">
                <CheckCircle2 className="size-3 mr-1" /> Success
              </Badge>
            )}
            {status === "error" && (
              <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/5">
                <XCircle className="size-3 mr-1" /> Error
              </Badge>
            )}
            {status === "running" && (
              <Badge variant="outline" className="border-neon-purple/50 text-neon-purple animate-pulse">
                Running...
              </Badge>
            )}
          </div>

          <div className="flex-1 min-h-[400px] max-h-[600px] bg-black/80 border border-border/50 rounded-lg p-4 font-mono text-[13px] overflow-y-auto shadow-inner relative group">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20 space-y-4">
                  <Terminal className="size-12 opacity-10" />
                  <p className="text-xs uppercase tracking-widest">Awaiting Command...</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-muted-foreground/50 shrink-0">[{formatTime(log.time)}]</span>
                    <span
                      className={cn(
                        log.type === "error" && "text-red-400",
                        log.type === "warning" && "text-yellow-400",
                        log.type === "normal" && "text-green-400",
                      )}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>

            {/* Console Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-console-scanlines opacity-[0.03]" />
          </div>

          <div className="space-y-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded p-2 flex gap-2 items-center">
              <AlertTriangle className="size-3 text-destructive shrink-0" />
              <p className="text-[10px] text-destructive-foreground font-medium uppercase tracking-tighter">
                CRITICAL: Rating and File Upload questions are skipped due to Google limitations.
              </p>
            </div>
            <p className="text-[9px] text-center text-muted-foreground/40 uppercase tracking-widest">
              Live Console Feed • Auto-Scrolling Enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
