import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Plus, Trash2, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
import { 
  useListApiKeys, 
  getListApiKeysQueryKey,
  useCreateApiKey, 
  useRevokeApiKey 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyWithSecret | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const { data: apiKeys, isLoading } = useListApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const form = useForm<z.infer<typeof createKeySchema>>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof createKeySchema>) => {
    try {
      const response = await createMutation.mutateAsync({ data });
      setNewKey(response as unknown as ApiKeyWithSecret);
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      form.reset();
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
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
      toast({
        title: "Key Revoked",
        description: "The API key has been permanently revoked.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to revoke key",
        description: error?.message || "Please try again later.",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  const handleCloseCreateModal = (open: boolean) => {
    if (!open && newKey) {
      // Clear the secret when the modal closes
      setNewKey(null);
      setShowSecret(false);
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
              <Plus className="mr-2 h-4 w-4" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Save your API key</DialogTitle>
                  <DialogDescription className="text-orange-600 dark:text-orange-400 font-medium flex items-start gap-2 mt-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    Please copy this key and save it somewhere safe. For security reasons, we cannot show it to you again.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-muted rounded-md my-4 flex items-center justify-between border">
                  <code className="text-sm font-mono break-all">{showSecret ? newKey.secret : `${newKey.keyPrefix}...${'*'.repeat(24)}`}</code>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKey.secret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleCloseCreateModal(false)} className="w-full">
                    I have saved my key
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
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                        Cancel
                      </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            These keys can be used to authenticate API requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
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
                    <TableCell className="font-medium flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      {key.name}
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
                      <Badge variant={key.status === "active" ? "default" : "secondary"}>
                        {key.status}
                      </Badge>
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
                                This action cannot be undone. Any applications using this key will immediately lose access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRevoke(key.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
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
              <h3 className="text-lg font-medium">No API keys found</h3>
              <p className="text-muted-foreground mt-1 mb-4">You haven't created any API keys yet.</p>
              <Button onClick={() => setCreateOpen(true)} variant="outline">
                Create your first key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
