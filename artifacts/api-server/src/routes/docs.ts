import { Router } from "express";

const router = Router();

// ─── OpenAPI JSON spec ─────────────────────────────────────────────────────────

router.get("/openapi.json", (_req, res) => {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "AchekOTP API",
      version: "1.0.0",
      description: "WhatsApp-powered OTP delivery engine. Send and verify one-time passwords via WhatsApp.",
      contact: { name: "AchekOTP Support" },
    },
    servers: [{ url: "/api", description: "API base path" }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT token obtained from /api/auth/login" },
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key", description: "API key prefixed with watp_" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        Success: {
          type: "object",
          properties: { success: { type: "boolean" }, message: { type: "string" } },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string" },
            name: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            suspended: { type: "boolean" },
            phoneNumber: { type: "string", nullable: true },
            phoneVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Plan: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            period: { type: "string", enum: ["weekly", "monthly", "yearly"] },
            price: { type: "number" },
            currency: { type: "string" },
            otpLimit: { type: "integer" },
            features: { type: "array", items: { type: "string" } },
            popular: { type: "boolean" },
            allowCustomNumber: { type: "boolean" },
            allowUsaNumbers: { type: "boolean" },
          },
        },
        WhatsappNumber: {
          type: "object",
          properties: {
            id: { type: "integer" },
            phoneNumber: { type: "string" },
            country: { type: "string" },
            label: { type: "string", nullable: true },
            status: { type: "string", enum: ["disconnected", "connecting", "connected", "error"] },
            sessionActive: { type: "boolean" },
            otpSentCount: { type: "integer" },
            ownerId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            keyPrefix: { type: "string" },
            status: { type: "string", enum: ["active", "revoked"] },
            lastUsedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            requestCount: { type: "integer" },
          },
        },
        OtpLog: {
          type: "object",
          properties: {
            id: { type: "integer" },
            requestId: { type: "string" },
            phoneNumber: { type: "string" },
            status: { type: "string", enum: ["sent", "verified", "failed", "expired"] },
            country: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      // ── Health ──────────────────────────────────────────────────────────────
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } } } } } },
        },
      },

      // ── Auth ────────────────────────────────────────────────────────────────
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["email", "password", "name"], properties: { email: { type: "string" }, password: { type: "string", minLength: 6 }, name: { type: "string" }, phoneNumber: { type: "string" } } } } },
          },
          responses: {
            "201": { description: "Registered", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" }, token: { type: "string" } } } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and get a JWT token",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } },
          },
          responses: {
            "200": { description: "Logged in", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" }, token: { type: "string" } } } } } },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/auth/logout": {
        post: { tags: ["Auth"], summary: "Logout (client should discard the token)", security: [{ BearerAuth: [] }], responses: { "200": { description: "Logged out" } } },
      },
      "/auth/me": {
        get: { tags: ["Auth"], summary: "Get current user", security: [{ BearerAuth: [] }], responses: { "200": { description: "Current user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } } },
      },
      "/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change password (authenticated)",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 6 } } } } } },
          responses: { "200": { description: "Password changed" }, "401": { description: "Current password incorrect" } },
        },
      },
      "/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request a password reset OTP via WhatsApp",
          description: "Sends a 6-digit OTP to the user's verified WhatsApp number. Always returns 200 to avoid user enumeration.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber"], properties: { phoneNumber: { type: "string", example: "+2348012345678" } } } } } },
          responses: { "200": { description: "OTP sent (or silently ignored if phone not found)" } },
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password using OTP received via WhatsApp",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber", "code", "newPassword"], properties: { phoneNumber: { type: "string" }, code: { type: "string", example: "123456" }, newPassword: { type: "string", minLength: 6 } } } } } },
          responses: { "200": { description: "Password reset successfully" }, "400": { description: "Invalid or expired OTP" } },
        },
      },
      "/auth/verify-phone/send": {
        post: {
          tags: ["Auth"],
          summary: "Send an OTP to verify a phone number",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber"], properties: { phoneNumber: { type: "string" } } } } } },
          responses: { "200": { description: "OTP sent" }, "429": { description: "Rate limited" }, "503": { description: "No sender available" } },
        },
      },
      "/auth/verify-phone/confirm": {
        post: {
          tags: ["Auth"],
          summary: "Confirm phone verification OTP",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber", "code"], properties: { phoneNumber: { type: "string" }, code: { type: "string" } } } } } },
          responses: { "200": { description: "Phone verified" }, "400": { description: "Invalid OTP" } },
        },
      },
      "/auth/update-phone": {
        post: {
          tags: ["Auth"],
          summary: "Update phone number (marks it as unverified)",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber"], properties: { phoneNumber: { type: "string" } } } } } },
          responses: { "200": { description: "Phone updated" } },
        },
      },

      // ── OTP ─────────────────────────────────────────────────────────────────
      "/otp/send": {
        post: {
          tags: ["OTP"],
          summary: "Send an OTP to a phone number",
          description: "Requires an active subscription. Authenticate with Bearer token or x-api-key header.",
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phoneNumber"],
                  properties: {
                    phoneNumber: { type: "string", description: "Destination in E.164 format", example: "+2348012345678" },
                    template: { type: "string", description: "Custom message. Use {{code}} as placeholder. Default: 'Your AchekOTP verification code is: *{{code}}*'", example: "Your login code is {{code}}. Valid 10 minutes." },
                    senderNumberId: { type: "integer", description: "ID of a specific WhatsApp sender to use (must belong to you or be a pool number)" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "OTP sent", content: { "application/json": { schema: { type: "object", properties: { requestId: { type: "string" }, expiresAt: { type: "string", format: "date-time" }, message: { type: "string" } } } } } },
            "402": { description: "No active subscription" },
            "422": { description: "Requested sender not connected" },
            "429": { description: "OTP limit reached" },
            "503": { description: "No WhatsApp numbers connected" },
          },
        },
      },
      "/otp/verify": {
        post: {
          tags: ["OTP"],
          summary: "Verify an OTP code",
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["requestId", "code"], properties: { requestId: { type: "string", description: "requestId returned by /otp/send" }, code: { type: "string", description: "6-digit OTP code entered by the user" } } } } },
          },
          responses: {
            "200": { description: "Verification result", content: { "application/json": { schema: { type: "object", properties: { valid: { type: "boolean" }, message: { type: "string" } } } } } },
            "404": { description: "OTP request not found" },
          },
        },
      },
      "/otp/logs": {
        get: {
          tags: ["OTP"],
          summary: "Get OTP logs for the authenticated user",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "limit", schema: { type: "integer", default: 50, maximum: 200 } },
            { in: "query", name: "offset", schema: { type: "integer", default: 0 } },
            { in: "query", name: "status", schema: { type: "string", enum: ["sent", "verified", "failed", "expired"] } },
          ],
          responses: { "200": { description: "List of OTP logs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/OtpLog" } } } } } },
        },
      },

      // ── API Keys ─────────────────────────────────────────────────────────────
      "/api-keys": {
        get: {
          tags: ["API Keys"],
          summary: "List API keys",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "List of API keys", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ApiKey" } } } } } },
        },
        post: {
          tags: ["API Keys"],
          summary: "Create a new API key",
          description: "The raw key secret is only returned once on creation. Store it securely.",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Production" } } } } } },
          responses: { "201": { description: "API key created (secret shown once)", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/ApiKey" }, { type: "object", properties: { secret: { type: "string" } } }] } } } } },
        },
      },
      "/api-keys/{id}/revoke": {
        post: {
          tags: ["API Keys"],
          summary: "Revoke an API key",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Key revoked" }, "404": { description: "Key not found" } },
        },
      },

      // ── Plans ────────────────────────────────────────────────────────────────
      "/plans": {
        get: {
          tags: ["Plans"],
          summary: "List all active subscription plans",
          responses: { "200": { description: "Plans list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Plan" } } } } } },
        },
      },

      // ── Subscriptions ─────────────────────────────────────────────────────────
      "/subscriptions/current": {
        get: {
          tags: ["Subscriptions"],
          summary: "Get current active subscription",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Active subscription with plan" }, "404": { description: "No active subscription" } },
        },
      },
      "/subscriptions": {
        post: {
          tags: ["Subscriptions"],
          summary: "Subscribe to a plan (manual activation without payment)",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["planId"], properties: { planId: { type: "integer" } } } } } },
          responses: { "201": { description: "Subscribed" } },
        },
      },
      "/subscriptions/{id}/cancel": {
        post: {
          tags: ["Subscriptions"],
          summary: "Cancel a subscription",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Cancelled" }, "404": { description: "Not found" } },
        },
      },

      // ── Payments ─────────────────────────────────────────────────────────────
      "/payments/initialize": {
        post: {
          tags: ["Payments"],
          summary: "Initialize a Paystack payment for a plan",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["planId"], properties: { planId: { type: "integer" } } } } } },
          responses: { "200": { description: "Payment initialized", content: { "application/json": { schema: { type: "object", properties: { authorizationUrl: { type: "string" }, reference: { type: "string" }, planId: { type: "integer" }, planName: { type: "string" }, amount: { type: "number" }, currency: { type: "string" } } } } } }, "503": { description: "Payment gateway not configured" } },
        },
      },
      "/payments/verify/{reference}": {
        get: {
          tags: ["Payments"],
          summary: "Verify a Paystack payment and activate subscription",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "reference", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Payment verified, subscription activated" }, "400": { description: "Payment not successful" } },
        },
      },

      // ── Dashboard ────────────────────────────────────────────────────────────
      "/dashboard/stats": {
        get: {
          tags: ["Dashboard"],
          summary: "Get dashboard stats for current user",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Stats", content: { "application/json": { schema: { type: "object", properties: { otpSentToday: { type: "integer" }, otpSentMonth: { type: "integer" }, otpSuccessRate: { type: "integer" }, remainingOtps: { type: "integer" }, activeApiKeys: { type: "integer" }, recentActivity: { type: "array", items: { $ref: "#/components/schemas/OtpLog" } } } } } } } },
        },
      },

      // ── User WhatsApp Numbers ─────────────────────────────────────────────────
      "/user/whatsapp-numbers": {
        get: {
          tags: ["User Numbers"],
          summary: "List all WhatsApp numbers linked to your account",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Numbers list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/WhatsappNumber" } } } } } },
        },
        post: {
          tags: ["User Numbers"],
          summary: "Add a WhatsApp number to your account",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber"], properties: { phoneNumber: { type: "string", example: "+2348012345678" }, label: { type: "string", example: "Business" } } } } } },
          responses: { "201": { description: "Number added" }, "400": { description: "Already registered" } },
        },
      },
      "/user/whatsapp-numbers/{id}": {
        get: {
          tags: ["User Numbers"],
          summary: "Get a specific WhatsApp number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Number details" }, "404": { description: "Not found" } },
        },
        delete: {
          tags: ["User Numbers"],
          summary: "Remove a WhatsApp number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } },
        },
      },
      "/user/whatsapp-numbers/{id}/qr": {
        get: {
          tags: ["User Numbers"],
          summary: "Get QR code to connect a WhatsApp number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "QR code (null if already connected)", content: { "application/json": { schema: { type: "object", properties: { qrCode: { type: "string", nullable: true }, status: { type: "string" } } } } } } },
        },
      },
      "/user/whatsapp-numbers/{id}/retry-qr": {
        post: {
          tags: ["User Numbers"],
          summary: "Retry QR generation for a number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "QR retry initiated" } },
        },
      },
      "/user/whatsapp-numbers/{id}/status": {
        get: {
          tags: ["User Numbers"],
          summary: "Poll connection status for a number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Status" } },
        },
      },
      "/user/whatsapp-numbers/{id}/name": {
        post: {
          tags: ["User Numbers"],
          summary: "Update the WhatsApp display name for a number",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["displayName"], properties: { displayName: { type: "string", maxLength: 25 } } } } } },
          responses: { "200": { description: "Name updated or not connected" } },
        },
      },

      // ── Admin ────────────────────────────────────────────────────────────────
      "/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List all users",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "limit", schema: { type: "integer", default: 50, maximum: 200 } },
            { in: "query", name: "offset", schema: { type: "integer", default: 0 } },
          ],
          responses: { "200": { description: "Users list" }, "403": { description: "Admin only" } },
        },
      },
      "/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get a user by ID",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "User" }, "404": { description: "Not found" } },
        },
        delete: {
          tags: ["Admin"],
          summary: "Permanently delete a user and all their data",
          description: "Deletes the user's WhatsApp numbers, subscriptions, API keys, and OTP logs. Cannot delete yourself.",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "User deleted" }, "400": { description: "Cannot delete self" }, "404": { description: "Not found" } },
        },
      },
      "/admin/users/{id}/suspend": {
        post: {
          tags: ["Admin"],
          summary: "Toggle suspend/unsuspend a user",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "Updated" } },
        },
      },
      "/admin/users/{id}/role": {
        post: {
          tags: ["Admin"],
          summary: "Change a user's role",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["user", "admin"] } } } } } },
          responses: { "200": { description: "Role updated" } },
        },
      },
      "/admin/users/{id}/assign-plan": {
        post: {
          tags: ["Admin"],
          summary: "Assign a plan to a user (overrides any existing subscription)",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["planId"], properties: { planId: { type: "integer" } } } } } },
          responses: { "200": { description: "Plan assigned" } },
        },
      },
      "/admin/whatsapp-numbers": {
        get: {
          tags: ["Admin"],
          summary: "List pool WhatsApp numbers",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Pool numbers" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Add a number to the pool",
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phoneNumber"], properties: { phoneNumber: { type: "string" }, country: { type: "string" }, label: { type: "string" } } } } } },
          responses: { "201": { description: "Number added" } },
        },
      },
      "/admin/whatsapp-numbers/{id}": {
        get: { tags: ["Admin"], summary: "Get a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Number" } } },
        delete: { tags: ["Admin"], summary: "Delete a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Deleted" } } },
      },
      "/admin/whatsapp-numbers/{id}/qr": {
        get: { tags: ["Admin"], summary: "Get QR for a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "QR code" } } },
      },
      "/admin/whatsapp-numbers/{id}/retry-qr": {
        post: { tags: ["Admin"], summary: "Retry QR for a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "QR retry" } } },
      },
      "/admin/whatsapp-numbers/{id}/disconnect": {
        post: { tags: ["Admin"], summary: "Disconnect a pool number session", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Disconnected" } } },
      },
      "/admin/whatsapp-numbers/{id}/name": {
        post: { tags: ["Admin"], summary: "Update display name of a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["displayName"], properties: { displayName: { type: "string", maxLength: 25 } } } } } }, responses: { "200": { description: "Updated" } } },
      },
      "/admin/whatsapp-numbers/{id}/status": {
        get: { tags: ["Admin"], summary: "Poll connection status for a pool number", security: [{ BearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Status" } } },
      },
      "/admin/user-whatsapp-numbers": {
        get: { tags: ["Admin"], summary: "List all user-owned WhatsApp numbers", security: [{ BearerAuth: [] }], responses: { "200": { description: "Numbers" } } },
      },
      "/admin/otp-logs": {
        get: {
          tags: ["Admin"],
          summary: "Paginated OTP logs across all users",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "limit", schema: { type: "integer", default: 50, maximum: 200 } },
            { in: "query", name: "offset", schema: { type: "integer", default: 0 } },
            { in: "query", name: "status", schema: { type: "string", enum: ["sent", "verified", "failed", "expired"] } },
          ],
          responses: { "200": { description: "OTP logs" } },
        },
      },
      "/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Platform-wide statistics",
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Stats", content: { "application/json": { schema: { type: "object", properties: { totalUsers: { type: "integer" }, activeSubscriptions: { type: "integer" }, totalOtpSent: { type: "integer" }, connectedNumbers: { type: "integer" }, revenue: { type: "number" } } } } } } },
        },
      },
    },
  };

  res.setHeader("Content-Type", "application/json");
  return res.json(spec);
});

// ─── Swagger UI ───────────────────────────────────────────────────────────────

router.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AchekOTP API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fafafa; font-family: system-ui, sans-serif; }
    .topbar { background: #075e54; padding: 12px 24px; display: flex; align-items: center; gap: 12px; }
    .topbar h1 { color: #fff; margin: 0; font-size: 1.2rem; font-weight: 600; }
    .topbar span { color: #25d366; font-size: 1.5rem; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  </style>
</head>
<body>
  <div class="topbar">
    <span>💬</span>
    <h1>AchekOTP API Documentation</h1>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      tryItOutEnabled: true,
      persistAuthorization: true,
      displayRequestDuration: true,
    });
  </script>
</body>
</html>`);
});

export default router;
