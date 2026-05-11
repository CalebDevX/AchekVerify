import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Docs() {
  const { toast } = useToast();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard.",
    });
  };

  const curlSend = `curl -X POST https://api.whatotp.com/v1/otp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+1234567890",
    "template": "Your verification code is {{code}}"
  }'`;

  const jsSend = `const response = await fetch('https://api.whatotp.com/v1/otp/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    template: 'Your verification code is {{code}}'
  })
});

const data = await response.json();
console.log(data.requestId); // Save this to verify later`;

  const curlVerify = `curl -X POST https://api.whatotp.com/v1/otp/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "requestId": "req_123abc...",
    "code": "123456"
  }'`;

  const jsVerify = `const response = await fetch('https://api.whatotp.com/v1/otp/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requestId: 'req_123abc...',
    code: '123456'
  })
});

const data = await response.json();
if (data.valid) {
  // Login user
}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">Learn how to integrate WhatOTP into your application.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Send OTP</CardTitle>
            <CardDescription>Send a verification code to a user's WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="sm" onClick={() => copyCode(curlSend)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <TabsContent value="curl">
                <pre className="p-4 rounded-md bg-muted font-mono text-sm overflow-x-auto text-foreground">
                  {curlSend}
                </pre>
              </TabsContent>
              <TabsContent value="node">
                <pre className="p-4 rounded-md bg-muted font-mono text-sm overflow-x-auto text-foreground">
                  {jsSend}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Verify OTP</CardTitle>
            <CardDescription>Verify the code entered by the user.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="sm" onClick={() => copyCode(curlVerify)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <TabsContent value="curl">
                <pre className="p-4 rounded-md bg-muted font-mono text-sm overflow-x-auto text-foreground">
                  {curlVerify}
                </pre>
              </TabsContent>
              <TabsContent value="node">
                <pre className="p-4 rounded-md bg-muted font-mono text-sm overflow-x-auto text-foreground">
                  {jsVerify}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
