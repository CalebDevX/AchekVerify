import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Copy, Plus, Trash2, KeyRound, AlertCircle,
  Download, Check, Code2, Terminal,
} from "lucide-react";
import {
  useListApiKeys,
  getListApiKeysQueryKey,
  useCreateApiKey,
  useRevokeApiKey,
  useGetCurrentSubscription,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ApiKeyWithSecret } from "@workspace/api-client-react";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "/api";

function CodeSnippet({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlSend = `curl -X POST ${BASE_URL}/otp/send \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+2348012345678"}'`;

  const jsSend = `const res = await fetch("${BASE_URL}/otp/send", {
  method: "POST",
  headers: {
    "x-api-key": "${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ phoneNumber: "+2348012345678" }),
});
const { requestId } = await res.json();`;

  const verifyJs = `const res = await fetch("${BASE_URL}/otp/verify", {
  method: "POST",
  headers: {
    "x-api-key": "${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ requestId, code: userEnteredCode }),
});
const { valid } = await res.json();`;

  const blocks = [
    { id: "curl", label: "cURL", code: curlSend },
    { id: "js-send", label: "JS · Send", code: jsSend },
    { id: "js-verify", label: "JS · Verify", code: verifyJs },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ready-to-use code</p>
      <Tabs defaultValue="curl">
        <TabsList className="h-7">
          {blocks.map(b => <TabsTrigger key={b.id} value={b.id} className="text-xs h-6 px-2">{b.label}</TabsTrigger>)}
        </TabsList>
        {blocks.map(b => (
          <TabsContent key={b.id} value={b.id}>
            <div className="relative group">
              <pre className="p-3 rounded-md bg-gray-950 text-gray-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {b.code}
              </pre>
              <button
                onClick={() => copy(b.code, b.id)}
                className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied === b.id
                  ? <Check className="h-3 w-3 text-emerald-400" />
                  : <Copy className="h-3 w-3 text-gray-400" />}
              </button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyWithSecret | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, isLoading } = useListApiKeys();
  const { data: sub } = useGetCurrentSubscription();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const isFree = (sub as any)?.plan?.name === "Free" || !(sub as any)?.plan;

  const form = useForm<z.infer<typeof createKeySchema>>({
    resolver: zodResolver(createKeySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: z.infer<typeof createKeySchema>) => {
    try {
      const response = await createMutation.mutateAsync({ data });
      setNewKey(response as unknown as ApiKeyWithSecret);
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create key",
        description: error?.message || "Please try again later.",
      });
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      toast({ title: "Key Revoked", description: "The API key has been permanently revoked." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to revoke key", description: error?.message || "Please try again later." });
    }
  };

  const copyKey = () => {
    if (!newKey?.secret) return;
    navigator.clipboard.writeText(newKey.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "API key copied to clipboard." });
  };

  const downloadEnv = () => {
    if (!newKey?.secret) return;
    const content = [
      `# AchekOTP API Key — ${newKey.name}`,
      `# Generated: ${new Date().toISOString()}`,
      `# ⚠️  Keep this file secret. Never commit to version control.`,
      ``,
      `ACHEK_OTP_API_KEY=${newKey.secret}`,
      `ACHEK_OTP_BASE_URL=${BASE_URL}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.env.acheckotp`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: ".env file saved to your device." });
  };

  const handleCloseCreateModal = (open: boolean) => {
    if (!open) {
      setNewKey(null);
      setCopied(false);
    }
    setCreateOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage your API keys for programmatic access.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={handleCloseCreateModal}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-key">
              <Plus className="mr-2 h-4 w-4" /> Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className={newKey ? "sm:max-w-2xl" : "sm:max-w-md"}>
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" /> API Key Created
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="flex items-start gap-2 text-orange-600 dark:text-orange-400 font-medium mt-1">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {isFree
                          ? "This is the only time you can see this key. Free plan users cannot re-view or recover keys."
                          : "Copy or download your key now — it won't be shown again for security."}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                {/* Key display */}
                <div className="bg-gray-950 rounded-lg border border-gray-800 p-3 flex items-center justify-between gap-2">
                  <code className="text-emerald-400 text-sm font-mono break-all flex-1">{newKey.secret}</code>
                  <Button variant="ghost" size="icon" onClick={copyKey} className="flex-shrink-0 text-gray-400 hover:text-white">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={copyKey} className="gap-2">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Key"}
                  </Button>
                  {!isFree && (
                    <Button variant="outline" size="sm" onClick={downloadEnv} className="gap-2">
                      <Download className="h-4 w-4" /> Download .env
                    </Button>
                  )}
                  {isFree && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-md px-3 py-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Upgrade to download .env files
                    </div>
                  )}
                </div>

                {/* Code snippet */}
                <CodeSnippet apiKey={newKey.secret} />

                <DialogFooter className="mt-2">
                  <Button onClick={() => handleCloseCreateModal(false)} className="w-full">
                    I've saved my key — close
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create new API key</DialogTitle>
                  <DialogDescription>
                    Enter a descriptive name to help you identify this key later.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Production Website" {...field} data-testid="input-key-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        Your key will be shown <strong>once only</strong>. Copy and store it securely — we cannot recover it.
                        {isFree && " Free users cannot download keys — upgrade to enable .env downloads."}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-key">
                        Create Key
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <KeyRound className="h-4 w-4" />, title: "How to authenticate", desc: "Pass your key in the x-api-key header on every request to /api/otp/send and /api/otp/verify." },
          { icon: <AlertCircle className="h-4 w-4" />, title: "Keep it secret", desc: "Never expose API keys in frontend code, mobile apps, or public repos. Call from your backend only." },
          { icon: <Terminal className="h-4 w-4" />, title: "Quick test", desc: 'Use the cURL snippet in the creation dialog to send your first OTP right from the terminal.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-xl border p-4 bg-muted/30">
            <div className="text-emerald-600 mt-0.5 flex-shrink-0">{icon}</div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>These keys can be used to authenticate API requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        {key.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs">{key.keyPrefix}...</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(key.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === "active" ? "default" : "secondary"}>{key.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {key.status === "active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" data-testid={`button-revoke-${key.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Any applications using this key will immediately lose access. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevoke(key.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 border rounded-md border-dashed">
              <KeyRound className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No API keys yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 text-sm">Create your first key to start sending OTPs.</p>
              <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Create your first key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Docs shortcut */}
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/30">
        <Code2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Need the full API reference?</p>
          <p className="text-xs text-muted-foreground">See every endpoint, error code, and code example in the docs.</p>
        </div>
        <a href="/docs" target="_blank">
          <Button variant="outline" size="sm">View Docs</Button>
        </a>
      </div>
    </div>
  );
}
