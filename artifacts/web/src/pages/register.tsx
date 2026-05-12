import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, MessageCircle, CheckCircle2, Phone } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phoneNumber: z.string().min(7, { message: "Phone number is required (e.g. +2348012345678)" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredData, setRegisteredData] = useState<{ token: string; phoneNumber: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phoneNumber: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await registerMutation.mutateAsync({ data: data as any });
      login(response);
      setRegisteredData({ token: response.token, phoneNumber: data.phoneNumber });
      setStep("verify");
      toast({ title: "Account created!", description: "Now verify your WhatsApp number to complete setup." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error?.message || "Something went wrong. Please try again.",
      });
    }
  };

  const sendOtp = async () => {
    if (!registeredData) return;
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-phone/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${registeredData.token}`,
        },
        body: JSON.stringify({ phoneNumber: registeredData.phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      toast({ title: "OTP Sent", description: `Check your WhatsApp at ${registeredData.phoneNumber}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Send Failed", description: e.message });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!registeredData || !otpCode) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-phone/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${registeredData.token}`,
        },
        body: JSON.stringify({ phoneNumber: registeredData.phoneNumber, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      toast({ title: "Phone Verified!", description: "Your WhatsApp number is now verified." });
      setLocation("/dashboard");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: e.message });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const skipVerification = () => {
    toast({ title: "Skipped", description: "You can verify your phone number later from the dashboard." });
    setLocation("/dashboard");
  };

  if (step === "verify") {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Verify your WhatsApp</CardTitle>
            <CardDescription>
              We'll send a 6-digit code to{" "}
              <span className="font-semibold text-foreground">{registeredData?.phoneNumber}</span> via WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={sendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                ) : (
                  <><MessageCircle className="mr-2 h-4 w-4" />Send WhatsApp Code</>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Code sent! Check your WhatsApp.
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Enter 6-digit code</label>
                  <Input
                    placeholder="123456"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={verifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                >
                  {verifyingOtp ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
                  ) : (
                    "Verify Number"
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={sendOtp} disabled={sendingOtp}>
                  Resend code
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <button
              onClick={skipVerification}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Skip for now — verify later from dashboard
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Start verifying your users with WhatsApp OTPs today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Caleb Osky" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@gmail.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      WhatsApp Number
                      <Badge variant="outline" className="text-xs font-normal text-emerald-700 border-emerald-300 bg-emerald-50">
                        <MessageCircle className="h-2.5 w-2.5 mr-1" />
                        Verified via WhatsApp
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+2348012345678" className="pl-9" {...field} data-testid="input-phone" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={registerMutation.isPending}
                data-testid="button-submit-register"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                ) : (
                  "Create Account & Verify"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col text-center">
          <div className="text-sm text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-login">
                Log in
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
