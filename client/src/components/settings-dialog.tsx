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
import { Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Settings } from "@shared/schema";

const settingsSchema = z.object({
  mt5Server: z.string().optional(),
  mt5Login: z.string().optional(),
  mt5Password: z.string().optional(),
  metaApiToken: z.string().optional(),
  metaApiAccountId: z.string().optional(),
  accountBalance: z.string().min(1, "Account balance is required"),
  riskPercentage: z.string().min(1, "Risk percentage is required"),
  defaultLotSize: z.string().min(1, "Lot size is required"),
  maxSpread: z.string().optional(),
  slippage: z.string().optional(),
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
      mt5Server: '',
      mt5Login: '',
      mt5Password: '',
      metaApiToken: '',
      metaApiAccountId: '',
      accountBalance: '10000',
      riskPercentage: '1',
      defaultLotSize: '0.01',
      maxSpread: '3',
      slippage: '3',
      autoTrade: 'true',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        mt5Server: settings.mt5Server || '',
        mt5Login: settings.mt5Login || '',
        mt5Password: settings.mt5Password || '',
        metaApiToken: settings.metaApiToken || '',
        metaApiAccountId: settings.metaApiAccountId || '',
        accountBalance: settings.accountBalance || '10000',
        riskPercentage: settings.riskPercentage || '1',
        defaultLotSize: settings.defaultLotSize || '0.01',
        maxSpread: settings.maxSpread?.toString() || '3',
        slippage: settings.slippage?.toString() || '3',
        autoTrade: settings.autoTrade || 'true',
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest('POST', '/api/settings', {
        ...data,
        accountBalance: data.accountBalance,
        riskPercentage: data.riskPercentage,
        defaultLotSize: data.defaultLotSize, // Keep as string
        maxSpread: data.maxSpread ? parseInt(data.maxSpread) : 3,
        slippage: data.slippage ? parseInt(data.slippage) : 3,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your MT5 configuration has been updated successfully.",
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
            Configure your MetaTrader 5 connection and trading parameters
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

              {/* MetaApi Connection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">MetaApi Configuration</h3>
                <p className="text-xs text-muted-foreground">
                  Get your MetaApi token and account ID from <a href="https://app.metaapi.cloud" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">app.metaapi.cloud</a>
                </p>
                
                <FormField
                  control={form.control}
                  name="metaApiToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MetaApi Token</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your MetaApi authentication token" {...field} data-testid="input-metaapi-token" />
                      </FormControl>
                      <FormDescription>Required for MT5 connection</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaApiAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MetaApi Account ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Your MT5 account ID in MetaApi" {...field} data-testid="input-metaapi-account-id" />
                      </FormControl>
                      <FormDescription>The ID of your MT5 account in MetaApi</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* MT5 Connection (Optional - for reference) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">MT5 Details (Optional)</h3>
                <p className="text-xs text-muted-foreground">For reference only - connection is managed through MetaApi</p>
                
                <FormField
                  control={form.control}
                  name="mt5Server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Exness-MT5Real" {...field} data-testid="input-mt5-server" />
                      </FormControl>
                      <FormDescription>Your MT5 broker server (e.g., Exness-MT5Real)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="mt5Login"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} data-testid="input-mt5-login" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mt5Password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-mt5-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormDescription>Percentage of account to risk (default: 1%)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="defaultLotSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Lot Size</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0.01" {...field} data-testid="input-lot-size" />
                        </FormControl>
                        <FormDescription>Auto-calculated based on risk</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxSpread"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Spread (pips)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-max-spread" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slippage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slippage (pips)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-slippage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
