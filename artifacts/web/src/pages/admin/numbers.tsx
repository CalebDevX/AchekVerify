import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus, Trash2, Smartphone, RefreshCw, CheckCircle2,
  AlertCircle, Wifi, WifiOff, Pencil, ScanLine, Info,
} from "lucide-react";
import {
  useListWhatsappNumbers,
  getListWhatsappNumbersQueryKey,
  useCreateWhatsappNumber,
  useDeleteWhatsappNumber,
  useGetWhatsappQr,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const createNumberSchema = z.object({
  phoneNumber: z.string().min(7, "Phone number is required"),
  country: z.enum(["ng", "us", "uk"]),
  label: z.string().optional(),
});

const nameSchema = z.object({ displayName: z.string().min(1).max(25) });

function QrModal({ numberId, open, onOpenChange }: { numberId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, isLoading, refetch } = useGetWhatsappQr(numberId, {
    query: { enabled: open, refetchInterval: 3500 } as any,
  });

  const isConnected = data?.status === "connected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-emerald-600" /> Connect WhatsApp
          </DialogTitle>
          <DialogDescription>
            Scan the QR code below using WhatsApp on your phone to link the number to this platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 min-h-[260px] p-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-gray-500">Starting session…</p>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center gap-3 text-emerald-600">
              <CheckCircle2 className="h-16 w-16" />
              <p className="font-semibold text-lg text-gray-900">Connected!</p>
              <p className="text-sm text-gray-500 text-center">WhatsApp is now active and ready to send OTPs.</p>
            </div>
          ) : data?.qrCode ? (
            <div>
              <div className="bg-white p-2 rounded-xl shadow-inner border border-gray-200 mb-3">
                <img src={data.qrCode} alt="WhatsApp QR Code" className="w-52 h-52 rounded-lg" />
              </div>
              <p className="text-xs text-center text-gray-400">QR expires in 60 seconds — refreshes automatically</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm text-center">No QR code yet. The session may still be starting.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Retry
              </Button>
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">How to scan:</p>
              <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu (⋮) → Linked Devices</li>
                <li>Tap "Link a device" and scan this code</li>
              </ol>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isConnected ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NameDialog({ numberId, open, onOpenChange }: { numberId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("whatotp_token");
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), defaultValues: { displayName: "" } });

  const onSubmit = async (values: z.infer<typeof nameSchema>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/whatsapp-numbers/${numberId}/name`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: values.displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Display Name Updated", description: `Name changed to "${values.displayName}"` });
      onOpenChange(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Display Name</DialogTitle>
          <DialogDescription>
            Update the WhatsApp profile name shown to recipients when they receive an OTP. The number must be connected.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name <span className="text-gray-400 font-normal">(max 25 chars)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Verify" maxLength={25} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating…" : "Update Name"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const COUNTRY_MAP: Record<string, string> = { us: "🇺🇸", uk: "🇬🇧", ng: "🇳🇬" };

export default function AdminNumbers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [qrModalId, setQrModalId] = useState<number | null>(null);
  const [nameModalId, setNameModalId] = useState<number | null>(null);

  const { data: numbers, isLoading } = useListWhatsappNumbers();
  const createMutation = useCreateWhatsappNumber();
  const deleteMutation = useDeleteWhatsappNumber();

  const form = useForm<z.infer<typeof createNumberSchema>>({
    resolver: zodResolver(createNumberSchema),
    defaultValues: { phoneNumber: "", country: "ng", label: "" },
  });

  const onSubmit = async (data: z.infer<typeof createNumberSchema>) => {
    try {
      await createMutation.mutateAsync({ data: data as any });
      queryClient.invalidateQueries({ queryKey: getListWhatsappNumbersQueryKey() });
      setCreateOpen(false);
      form.reset();
      toast({ title: "Number Added", description: "WhatsApp sender number registered. Click Connect to link it." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error?.message || "Please try again." });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListWhatsappNumbersQueryKey() });
      toast({ title: "Number Deleted", description: "The number has been removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error?.message || "Please try again." });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
      case "connecting":
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Connecting</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><WifiOff className="h-3 w-3 mr-1 text-gray-400" />Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sender Numbers</h1>
          <p className="text-muted-foreground mt-1">Manage WhatsApp numbers used to send OTPs. Connect each number by scanning the QR code.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Add Number
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add WhatsApp Number</DialogTitle>
              <DialogDescription>
                Register a WhatsApp number to use as a sender. After adding, click Connect and scan the QR code.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (with country code)</FormLabel>
                      <FormControl>
                        <Input placeholder="+2348012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ng">🇳🇬 Nigeria</SelectItem>
                            <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="us">🇺🇸 United States</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Worker 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding…" : "Add Number"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">WhatsApp Sender Pool</CardTitle>
          <CardDescription>All numbers in the shared pool. Connected numbers are used to dispatch OTPs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : numbers && numbers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OTPs Sent</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((num) => (
                  <TableRow key={num.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl" title={num.country}>
                          {COUNTRY_MAP[num.country] ?? "🌐"}
                        </span>
                        <span className="font-mono font-medium text-sm">{num.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{num.label || "—"}</TableCell>
                    <TableCell><StatusBadge status={num.status} /></TableCell>
                    <TableCell className="font-mono text-muted-foreground text-sm">
                      {num.otpSentCount?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(num.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {num.status !== "connected" ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setQrModalId(num.id)}
                          >
                            <ScanLine className="h-3.5 w-3.5 mr-1" /> Connect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNameModalId(num.id)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Rename
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this number?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{num.phoneNumber}</strong> from the pool. Any active session will be disconnected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(num.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 border-t m-0">
              <div className="bg-gray-50 mx-6 rounded-2xl py-12 px-6">
                <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No sender numbers yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-5">
                  Add a WhatsApp number, then scan the QR code to connect it. Connected numbers are used to send OTPs to your users.
                </p>
                <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> Add your first number
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {qrModalId !== null && (
        <QrModal
          numberId={qrModalId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setQrModalId(null);
              queryClient.invalidateQueries({ queryKey: getListWhatsappNumbersQueryKey() });
            }
          }}
        />
      )}
      {nameModalId !== null && (
        <NameDialog
          numberId={nameModalId}
          open={true}
          onOpenChange={(open) => { if (!open) setNameModalId(null); }}
        />
      )}
    </div>
  );
}
