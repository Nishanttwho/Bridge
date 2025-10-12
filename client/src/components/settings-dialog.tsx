import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { Settings } from "@shared/schema";

const settingsSchema = z.object({
  mt5ApiSecret: z.string().min(1, "MT5 API Secret is required"),
  accountBalance: z.string().min(1, "Account balance is required"),
  riskPercentage: z.string().min(1, "Risk percentage is required"),
  autoTrade: z.string(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      mt5ApiSecret: '',
      accountBalance: '10000',
      riskPercentage: '1',
      autoTrade: 'true',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        mt5ApiSecret: settings.mt5ApiSecret || '',
        accountBalance: settings.accountBalance || '10000',
        riskPercentage: settings.riskPercentage || '1',
        autoTrade: settings.autoTrade || 'true',
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest('POST', '/api/settings', {
        mt5ApiSecret: data.mt5ApiSecret,
        accountBalance: data.accountBalance,
        riskPercentage: data.riskPercentage,
        autoTrade: data.autoTrade,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your MT5 HTTP polling configuration has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook`
    : '/api/webhook';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your MetaTrader 5 HTTP polling connection and trading parameters
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              {/* Webhook URL */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-2">TradingView Webhook URL</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Use this URL in your TradingView alert settings
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={webhookUrl} 
                    readOnly 
                    className="font-mono text-xs"
                    data-testid="input-webhook-url"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={copyWebhookUrl}
                    data-testid="button-copy-webhook"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-chart-2" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* MT5 HTTP Connection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">MT5 HTTP Polling Connection</h3>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/mt5-files/INSTALLATION_GUIDE.md', '_blank');
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Installation Guide
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect MT5 using built-in WebRequest (no external libraries needed). MT5 polls this server every second.
                </p>
                
                <FormField
                  control={form.control}
                  name="mt5ApiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MT5 API Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter a secret key for MT5 authentication" 
                          {...field} 
                          data-testid="input-mt5-api-secret" 
                        />
                      </FormControl>
                      <FormDescription>
                        This must match the ApiSecret in your MT5 Expert Advisor settings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    📋 <strong>Setup Required:</strong> Install the TradingViewHTTP_EA.mq5 Expert Advisor in your MT5 terminal. 
                    Check the <code className="bg-background/50 px-1 rounded">mt5-files/INSTALLATION_GUIDE.md</code> for complete instructions.
                  </p>
                </div>
              </div>

              {/* Trading Parameters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Trading Parameters</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="accountBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Balance ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} data-testid="input-account-balance" />
                        </FormControl>
                        <FormDescription>Your account balance for risk calculation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Per Trade (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0.1" max="100" {...field} data-testid="input-risk-percentage" />
                        </FormControl>
                        <FormDescription>Percentage of account to risk per trade</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border border-muted bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Lot size is automatically calculated based on your risk percentage and a 20-pip stop loss
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="autoTrade"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto Trading</FormLabel>
                        <FormDescription>
                          Automatically execute trades when signals are received
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'true'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
                          data-testid="switch-auto-trade"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  data-testid="button-save-settings"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
