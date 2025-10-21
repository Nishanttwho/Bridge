import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, TrendingUp, CheckCircle2, Percent, Settings as SettingsIcon, Wallet, X, DollarSign, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignalsTable } from "@/components/signals-table";
import { SettingsDialog } from "@/components/settings-dialog";
import { ConnectionStatus } from "@/components/connection-status";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { DashboardStats, Signal, MT5AccountInfo, MT5Position } from "@shared/schema";

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [closingPositions, setClosingPositions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Initialize WebSocket connection
  const ws = useWebSocket();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery<Signal[]>({
    queryKey: ['/api/signals'],
  });

  const { data: mt5Account } = useQuery<MT5AccountInfo>({
    queryKey: ['/api/mt5-account'],
  });

  const { data: mt5Positions = [] } = useQuery<MT5Position[]>({
    queryKey: ['/api/mt5-positions'],
  });

  const closePosition = (ticket: string) => {
    // Prevent duplicate close commands
    if (closingPositions.has(ticket)) {
      toast({
        title: "Already closing",
        description: "Position is already being closed",
        variant: "destructive",
      });
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      // Mark position as closing
      setClosingPositions(prev => new Set(prev).add(ticket));

      ws.send(JSON.stringify({
        type: 'close_position',
        ticket,
      }));
      
      toast({
        title: "Position closing",
        description: "Close command sent to MT5",
      });

      // Remove from closing state after 3 seconds (safety timeout)
      setTimeout(() => {
        setClosingPositions(prev => {
          const next = new Set(prev);
          next.delete(ticket);
          return next;
        });
      }, 3000);
    } else {
      toast({
        title: "Error",
        description: "WebSocket not connected",
        variant: "destructive",
      });
    }
  };

  const isConnected = stats?.isConnected ?? false;
  const successRate = stats?.successRate ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">Trading Bridge</h1>
              <p className="text-xs text-muted-foreground">TradingView → MT5</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} />
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-error-logs"
              asChild
            >
              <Link href="/error-logs">
                <AlertCircle className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-alert-guide"
              asChild
            >
              <Link href="/alert-guide">
                <BookOpen className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-open-settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* MT5 Account Info */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MT5 Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {!mt5Account ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold font-mono text-primary" data-testid="text-mt5-balance">
                  ${mt5Account.balance.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Actual MT5 balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equity</CardTitle>
              <DollarSign className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {!mt5Account ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold font-mono" data-testid="text-mt5-equity">
                  ${mt5Account.equity.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Current equity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold font-mono text-chart-4" data-testid="text-pending-signals">
                  {stats?.pendingSignals ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Awaiting execution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Executed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold font-mono text-chart-2" data-testid="text-executed-trades">
                  {stats?.executedTrades ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Successfully traded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span 
                    className={`text-2xl font-bold font-mono ${
                      successRate >= 80 ? 'text-chart-2' : 
                      successRate >= 50 ? 'text-chart-4' : 
                      'text-destructive'
                    }`}
                    data-testid="text-success-rate"
                  >
                    {successRate.toFixed(0)}%
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Execution success</p>
            </CardContent>
          </Card>
        </div>

        {/* Open Positions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Open Positions</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {mt5Positions.length} {mt5Positions.length === 1 ? 'Position' : 'Positions'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {mt5Positions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No open positions
              </div>
            ) : (
              <div className="space-y-3">
                {mt5Positions.map((position) => (
                  <div
                    key={position.ticket}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                    data-testid={`position-${position.ticket}`}
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Symbol</p>
                        <p className="font-semibold font-mono" data-testid={`text-symbol-${position.ticket}`}>{position.symbol}</p>
                        <Badge 
                          variant={position.type === 'BUY' ? 'default' : 'secondary'}
                          className="mt-1 text-xs"
                          data-testid={`badge-type-${position.ticket}`}
                        >
                          {position.type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="font-mono text-sm" data-testid={`text-volume-${position.ticket}`}>{position.volume}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Open Price</p>
                        <p className="font-mono text-sm" data-testid={`text-open-price-${position.ticket}`}>{position.openPrice.toFixed(5)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SL / TP</p>
                        <p className="font-mono text-sm" data-testid={`text-sl-${position.ticket}`}>
                          {position.stopLoss > 0 ? position.stopLoss.toFixed(5) : '-'}
                        </p>
                        <p className="font-mono text-sm text-muted-foreground" data-testid={`text-tp-${position.ticket}`}>
                          {position.takeProfit > 0 ? position.takeProfit.toFixed(5) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-mono text-sm" data-testid={`text-current-price-${position.ticket}`}>{position.currentPrice.toFixed(5)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Profit</p>
                        <p 
                          className={`font-mono font-bold ${
                            position.profit > 0 ? 'text-chart-2' : 
                            position.profit < 0 ? 'text-destructive' : 
                            'text-muted-foreground'
                          }`}
                          data-testid={`text-profit-${position.ticket}`}
                        >
                          ${position.profit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => closePosition(position.ticket)}
                      disabled={closingPositions.has(position.ticket) || !isConnected}
                      className="ml-4"
                      data-testid={`button-close-${position.ticket}`}
                      title={!isConnected ? "MT5 not connected" : "Close position"}
                    >
                      {closingPositions.has(position.ticket) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signals Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Signals</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <SignalsTable signals={signals} isLoading={signalsLoading} />
          </CardContent>
        </Card>
      </main>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
