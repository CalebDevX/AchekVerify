import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdminStats, ApiKey, ApiKeyInput, ApiKeyWithSecret, AssignPlanInput, AuthResponse, DashboardStats, DisplayNameInput, ErrorResponse, HealthStatus, ListOtpLogsParams, ListUsersParams, LoginInput, OtpLog, OtpSendInput, OtpSendResponse, OtpVerifyInput, OtpVerifyResponse, PaymentInitInput, PaymentInitResponse, Plan, QrCodeResponse, RegisterInput, Subscription, SubscriptionInput, SuccessResponse, User, UserWhatsappNumberInput, UserWithSubscription, WhatsappNumber, WhatsappNumberInput } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Register a new user
 */
export declare const getRegisterUrl: () => string;
export declare const register: (registerInput: RegisterInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterInput>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Register a new user
 */
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
/**
 * @summary Login
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
/**
 * @summary Logout
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all available plans
 */
export declare const getListPlansUrl: () => string;
export declare const listPlans: (options?: RequestInit) => Promise<Plan[]>;
export declare const getListPlansQueryKey: () => readonly ["/api/plans"];
export declare const getListPlansQueryOptions: <TData = Awaited<ReturnType<typeof listPlans>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPlans>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPlans>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPlansQueryResult = NonNullable<Awaited<ReturnType<typeof listPlans>>>;
export type ListPlansQueryError = ErrorType<unknown>;
/**
 * @summary List all available plans
 */
export declare function useListPlans<TData = Awaited<ReturnType<typeof listPlans>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPlans>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get current user subscription
 */
export declare const getGetCurrentSubscriptionUrl: () => string;
export declare const getCurrentSubscription: (options?: RequestInit) => Promise<Subscription>;
export declare const getGetCurrentSubscriptionQueryKey: () => readonly ["/api/subscriptions/current"];
export declare const getGetCurrentSubscriptionQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentSubscription>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentSubscription>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentSubscription>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentSubscriptionQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentSubscription>>>;
export type GetCurrentSubscriptionQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user subscription
 */
export declare function useGetCurrentSubscription<TData = Awaited<ReturnType<typeof getCurrentSubscription>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentSubscription>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Subscribe to a plan
 */
export declare const getCreateSubscriptionUrl: () => string;
export declare const createSubscription: (subscriptionInput: SubscriptionInput, options?: RequestInit) => Promise<Subscription>;
export declare const getCreateSubscriptionMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSubscription>>, TError, {
        data: BodyType<SubscriptionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSubscription>>, TError, {
    data: BodyType<SubscriptionInput>;
}, TContext>;
export type CreateSubscriptionMutationResult = NonNullable<Awaited<ReturnType<typeof createSubscription>>>;
export type CreateSubscriptionMutationBody = BodyType<SubscriptionInput>;
export type CreateSubscriptionMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Subscribe to a plan
 */
export declare const useCreateSubscription: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSubscription>>, TError, {
        data: BodyType<SubscriptionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSubscription>>, TError, {
    data: BodyType<SubscriptionInput>;
}, TContext>;
/**
 * @summary Cancel a subscription
 */
export declare const getCancelSubscriptionUrl: (id: number) => string;
export declare const cancelSubscription: (id: number, options?: RequestInit) => Promise<Subscription>;
export declare const getCancelSubscriptionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelSubscription>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelSubscription>>, TError, {
    id: number;
}, TContext>;
export type CancelSubscriptionMutationResult = NonNullable<Awaited<ReturnType<typeof cancelSubscription>>>;
export type CancelSubscriptionMutationError = ErrorType<unknown>;
/**
 * @summary Cancel a subscription
 */
export declare const useCancelSubscription: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelSubscription>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelSubscription>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List user API keys
 */
export declare const getListApiKeysUrl: () => string;
export declare const listApiKeys: (options?: RequestInit) => Promise<ApiKey[]>;
export declare const getListApiKeysQueryKey: () => readonly ["/api/api-keys"];
export declare const getListApiKeysQueryOptions: <TData = Awaited<ReturnType<typeof listApiKeys>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListApiKeysQueryResult = NonNullable<Awaited<ReturnType<typeof listApiKeys>>>;
export type ListApiKeysQueryError = ErrorType<unknown>;
/**
 * @summary List user API keys
 */
export declare function useListApiKeys<TData = Awaited<ReturnType<typeof listApiKeys>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApiKeys>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new API key
 */
export declare const getCreateApiKeyUrl: () => string;
export declare const createApiKey: (apiKeyInput: ApiKeyInput, options?: RequestInit) => Promise<ApiKeyWithSecret>;
export declare const getCreateApiKeyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
        data: BodyType<ApiKeyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
    data: BodyType<ApiKeyInput>;
}, TContext>;
export type CreateApiKeyMutationResult = NonNullable<Awaited<ReturnType<typeof createApiKey>>>;
export type CreateApiKeyMutationBody = BodyType<ApiKeyInput>;
export type CreateApiKeyMutationError = ErrorType<unknown>;
/**
 * @summary Create a new API key
 */
export declare const useCreateApiKey: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createApiKey>>, TError, {
        data: BodyType<ApiKeyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createApiKey>>, TError, {
    data: BodyType<ApiKeyInput>;
}, TContext>;
/**
 * @summary Revoke an API key
 */
export declare const getRevokeApiKeyUrl: (id: number) => string;
export declare const revokeApiKey: (id: number, options?: RequestInit) => Promise<ApiKey>;
export declare const getRevokeApiKeyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeApiKey>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof revokeApiKey>>, TError, {
    id: number;
}, TContext>;
export type RevokeApiKeyMutationResult = NonNullable<Awaited<ReturnType<typeof revokeApiKey>>>;
export type RevokeApiKeyMutationError = ErrorType<unknown>;
/**
 * @summary Revoke an API key
 */
export declare const useRevokeApiKey: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeApiKey>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof revokeApiKey>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all WhatsApp numbers (admin)
 */
export declare const getListWhatsappNumbersUrl: () => string;
export declare const listWhatsappNumbers: (options?: RequestInit) => Promise<WhatsappNumber[]>;
export declare const getListWhatsappNumbersQueryKey: () => readonly ["/api/admin/whatsapp-numbers"];
export declare const getListWhatsappNumbersQueryOptions: <TData = Awaited<ReturnType<typeof listWhatsappNumbers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWhatsappNumbers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listWhatsappNumbers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListWhatsappNumbersQueryResult = NonNullable<Awaited<ReturnType<typeof listWhatsappNumbers>>>;
export type ListWhatsappNumbersQueryError = ErrorType<unknown>;
/**
 * @summary List all WhatsApp numbers (admin)
 */
export declare function useListWhatsappNumbers<TData = Awaited<ReturnType<typeof listWhatsappNumbers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWhatsappNumbers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Add a WhatsApp number (admin)
 */
export declare const getCreateWhatsappNumberUrl: () => string;
export declare const createWhatsappNumber: (whatsappNumberInput: WhatsappNumberInput, options?: RequestInit) => Promise<WhatsappNumber>;
export declare const getCreateWhatsappNumberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWhatsappNumber>>, TError, {
        data: BodyType<WhatsappNumberInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createWhatsappNumber>>, TError, {
    data: BodyType<WhatsappNumberInput>;
}, TContext>;
export type CreateWhatsappNumberMutationResult = NonNullable<Awaited<ReturnType<typeof createWhatsappNumber>>>;
export type CreateWhatsappNumberMutationBody = BodyType<WhatsappNumberInput>;
export type CreateWhatsappNumberMutationError = ErrorType<unknown>;
/**
 * @summary Add a WhatsApp number (admin)
 */
export declare const useCreateWhatsappNumber: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWhatsappNumber>>, TError, {
        data: BodyType<WhatsappNumberInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createWhatsappNumber>>, TError, {
    data: BodyType<WhatsappNumberInput>;
}, TContext>;
/**
 * @summary Get WhatsApp number details (admin)
 */
export declare const getGetWhatsappNumberUrl: (id: number) => string;
export declare const getWhatsappNumber: (id: number, options?: RequestInit) => Promise<WhatsappNumber>;
export declare const getGetWhatsappNumberQueryKey: (id: number) => readonly [`/api/admin/whatsapp-numbers/${number}`];
export declare const getGetWhatsappNumberQueryOptions: <TData = Awaited<ReturnType<typeof getWhatsappNumber>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWhatsappNumber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWhatsappNumber>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWhatsappNumberQueryResult = NonNullable<Awaited<ReturnType<typeof getWhatsappNumber>>>;
export type GetWhatsappNumberQueryError = ErrorType<unknown>;
/**
 * @summary Get WhatsApp number details (admin)
 */
export declare function useGetWhatsappNumber<TData = Awaited<ReturnType<typeof getWhatsappNumber>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWhatsappNumber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a WhatsApp number (admin)
 */
export declare const getDeleteWhatsappNumberUrl: (id: number) => string;
export declare const deleteWhatsappNumber: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteWhatsappNumberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteWhatsappNumber>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteWhatsappNumber>>, TError, {
    id: number;
}, TContext>;
export type DeleteWhatsappNumberMutationResult = NonNullable<Awaited<ReturnType<typeof deleteWhatsappNumber>>>;
export type DeleteWhatsappNumberMutationError = ErrorType<unknown>;
/**
 * @summary Delete a WhatsApp number (admin)
 */
export declare const useDeleteWhatsappNumber: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteWhatsappNumber>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteWhatsappNumber>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get QR code for WhatsApp number session (admin)
 */
export declare const getGetWhatsappQrUrl: (id: number) => string;
export declare const getWhatsappQr: (id: number, options?: RequestInit) => Promise<QrCodeResponse>;
export declare const getGetWhatsappQrQueryKey: (id: number) => readonly [`/api/admin/whatsapp-numbers/${number}/qr`];
export declare const getGetWhatsappQrQueryOptions: <TData = Awaited<ReturnType<typeof getWhatsappQr>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWhatsappQr>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWhatsappQr>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWhatsappQrQueryResult = NonNullable<Awaited<ReturnType<typeof getWhatsappQr>>>;
export type GetWhatsappQrQueryError = ErrorType<unknown>;
/**
 * @summary Get QR code for WhatsApp number session (admin)
 */
export declare function useGetWhatsappQr<TData = Awaited<ReturnType<typeof getWhatsappQr>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWhatsappQr>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Send OTP via WhatsApp
 */
export declare const getSendOtpUrl: () => string;
export declare const sendOtp: (otpSendInput: OtpSendInput, options?: RequestInit) => Promise<OtpSendResponse>;
export declare const getSendOtpMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOtp>>, TError, {
        data: BodyType<OtpSendInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendOtp>>, TError, {
    data: BodyType<OtpSendInput>;
}, TContext>;
export type SendOtpMutationResult = NonNullable<Awaited<ReturnType<typeof sendOtp>>>;
export type SendOtpMutationBody = BodyType<OtpSendInput>;
export type SendOtpMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Send OTP via WhatsApp
 */
export declare const useSendOtp: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendOtp>>, TError, {
        data: BodyType<OtpSendInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendOtp>>, TError, {
    data: BodyType<OtpSendInput>;
}, TContext>;
/**
 * @summary Verify OTP code
 */
export declare const getVerifyOtpUrl: () => string;
export declare const verifyOtp: (otpVerifyInput: OtpVerifyInput, options?: RequestInit) => Promise<OtpVerifyResponse>;
export declare const getVerifyOtpMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyOtp>>, TError, {
        data: BodyType<OtpVerifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof verifyOtp>>, TError, {
    data: BodyType<OtpVerifyInput>;
}, TContext>;
export type VerifyOtpMutationResult = NonNullable<Awaited<ReturnType<typeof verifyOtp>>>;
export type VerifyOtpMutationBody = BodyType<OtpVerifyInput>;
export type VerifyOtpMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Verify OTP code
 */
export declare const useVerifyOtp: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyOtp>>, TError, {
        data: BodyType<OtpVerifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof verifyOtp>>, TError, {
    data: BodyType<OtpVerifyInput>;
}, TContext>;
/**
 * @summary List OTP request logs for current user
 */
export declare const getListOtpLogsUrl: (params?: ListOtpLogsParams) => string;
export declare const listOtpLogs: (params?: ListOtpLogsParams, options?: RequestInit) => Promise<OtpLog[]>;
export declare const getListOtpLogsQueryKey: (params?: ListOtpLogsParams) => readonly ["/api/otp/logs", ...ListOtpLogsParams[]];
export declare const getListOtpLogsQueryOptions: <TData = Awaited<ReturnType<typeof listOtpLogs>>, TError = ErrorType<unknown>>(params?: ListOtpLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOtpLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOtpLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOtpLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listOtpLogs>>>;
export type ListOtpLogsQueryError = ErrorType<unknown>;
/**
 * @summary List OTP request logs for current user
 */
export declare function useListOtpLogs<TData = Awaited<ReturnType<typeof listOtpLogs>>, TError = ErrorType<unknown>>(params?: ListOtpLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOtpLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Initialize a Paystack payment for a plan
 */
export declare const getInitializePaymentUrl: () => string;
export declare const initializePayment: (paymentInitInput: PaymentInitInput, options?: RequestInit) => Promise<PaymentInitResponse>;
export declare const getInitializePaymentMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initializePayment>>, TError, {
        data: BodyType<PaymentInitInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof initializePayment>>, TError, {
    data: BodyType<PaymentInitInput>;
}, TContext>;
export type InitializePaymentMutationResult = NonNullable<Awaited<ReturnType<typeof initializePayment>>>;
export type InitializePaymentMutationBody = BodyType<PaymentInitInput>;
export type InitializePaymentMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Initialize a Paystack payment for a plan
 */
export declare const useInitializePayment: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initializePayment>>, TError, {
        data: BodyType<PaymentInitInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof initializePayment>>, TError, {
    data: BodyType<PaymentInitInput>;
}, TContext>;
/**
 * @summary Verify Paystack payment and activate subscription
 */
export declare const getVerifyPaymentUrl: (reference: string) => string;
export declare const verifyPayment: (reference: string, options?: RequestInit) => Promise<Subscription>;
export declare const getVerifyPaymentQueryKey: (reference: string) => readonly [`/api/payments/verify/${string}`];
export declare const getVerifyPaymentQueryOptions: <TData = Awaited<ReturnType<typeof verifyPayment>>, TError = ErrorType<ErrorResponse>>(reference: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof verifyPayment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof verifyPayment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type VerifyPaymentQueryResult = NonNullable<Awaited<ReturnType<typeof verifyPayment>>>;
export type VerifyPaymentQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Verify Paystack payment and activate subscription
 */
export declare function useVerifyPayment<TData = Awaited<ReturnType<typeof verifyPayment>>, TError = ErrorType<ErrorResponse>>(reference: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof verifyPayment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get user's linked custom WhatsApp number
 */
export declare const getGetUserWhatsappNumberUrl: () => string;
export declare const getUserWhatsappNumber: (options?: RequestInit) => Promise<WhatsappNumber | null>;
export declare const getGetUserWhatsappNumberQueryKey: () => readonly ["/api/user/whatsapp-number"];
export declare const getGetUserWhatsappNumberQueryOptions: <TData = Awaited<ReturnType<typeof getUserWhatsappNumber>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappNumber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappNumber>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserWhatsappNumberQueryResult = NonNullable<Awaited<ReturnType<typeof getUserWhatsappNumber>>>;
export type GetUserWhatsappNumberQueryError = ErrorType<unknown>;
/**
 * @summary Get user's linked custom WhatsApp number
 */
export declare function useGetUserWhatsappNumber<TData = Awaited<ReturnType<typeof getUserWhatsappNumber>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappNumber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Register a custom WhatsApp number (Business+ plans)
 */
export declare const getRegisterUserWhatsappNumberUrl: () => string;
export declare const registerUserWhatsappNumber: (userWhatsappNumberInput: UserWhatsappNumberInput, options?: RequestInit) => Promise<WhatsappNumber>;
export declare const getRegisterUserWhatsappNumberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerUserWhatsappNumber>>, TError, {
        data: BodyType<UserWhatsappNumberInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof registerUserWhatsappNumber>>, TError, {
    data: BodyType<UserWhatsappNumberInput>;
}, TContext>;
export type RegisterUserWhatsappNumberMutationResult = NonNullable<Awaited<ReturnType<typeof registerUserWhatsappNumber>>>;
export type RegisterUserWhatsappNumberMutationBody = BodyType<UserWhatsappNumberInput>;
export type RegisterUserWhatsappNumberMutationError = ErrorType<unknown>;
/**
 * @summary Register a custom WhatsApp number (Business+ plans)
 */
export declare const useRegisterUserWhatsappNumber: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerUserWhatsappNumber>>, TError, {
        data: BodyType<UserWhatsappNumberInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof registerUserWhatsappNumber>>, TError, {
    data: BodyType<UserWhatsappNumberInput>;
}, TContext>;
/**
 * @summary Remove user's custom WhatsApp number
 */
export declare const getDeleteUserWhatsappNumberUrl: () => string;
export declare const deleteUserWhatsappNumber: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteUserWhatsappNumberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUserWhatsappNumber>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUserWhatsappNumber>>, TError, void, TContext>;
export type DeleteUserWhatsappNumberMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUserWhatsappNumber>>>;
export type DeleteUserWhatsappNumberMutationError = ErrorType<unknown>;
/**
 * @summary Remove user's custom WhatsApp number
 */
export declare const useDeleteUserWhatsappNumber: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUserWhatsappNumber>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUserWhatsappNumber>>, TError, void, TContext>;
/**
 * @summary Get QR code to link user's custom WhatsApp number
 */
export declare const getGetUserWhatsappQrUrl: () => string;
export declare const getUserWhatsappQr: (options?: RequestInit) => Promise<QrCodeResponse>;
export declare const getGetUserWhatsappQrQueryKey: () => readonly ["/api/user/whatsapp-number/qr"];
export declare const getGetUserWhatsappQrQueryOptions: <TData = Awaited<ReturnType<typeof getUserWhatsappQr>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappQr>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappQr>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserWhatsappQrQueryResult = NonNullable<Awaited<ReturnType<typeof getUserWhatsappQr>>>;
export type GetUserWhatsappQrQueryError = ErrorType<unknown>;
/**
 * @summary Get QR code to link user's custom WhatsApp number
 */
export declare function useGetUserWhatsappQr<TData = Awaited<ReturnType<typeof getUserWhatsappQr>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserWhatsappQr>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all users (admin)
 */
export declare const getListUsersUrl: (params?: ListUsersParams) => string;
export declare const listUsers: (params?: ListUsersParams, options?: RequestInit) => Promise<UserWithSubscription[]>;
export declare const getListUsersQueryKey: (params?: ListUsersParams) => readonly ["/api/admin/users", ...ListUsersParams[]];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users (admin)
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get user details (admin)
 */
export declare const getGetUserUrl: (id: number) => string;
export declare const getUser: (id: number, options?: RequestInit) => Promise<UserWithSubscription>;
export declare const getGetUserQueryKey: (id: number) => readonly [`/api/admin/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<unknown>;
/**
 * @summary Get user details (admin)
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Suspend a user (admin)
 */
export declare const getSuspendUserUrl: (id: number) => string;
export declare const suspendUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getSuspendUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suspendUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof suspendUser>>, TError, {
    id: number;
}, TContext>;
export type SuspendUserMutationResult = NonNullable<Awaited<ReturnType<typeof suspendUser>>>;
export type SuspendUserMutationError = ErrorType<unknown>;
/**
 * @summary Suspend a user (admin)
 */
export declare const useSuspendUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suspendUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof suspendUser>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Assign a plan to a user (admin override)
 */
export declare const getAdminAssignPlanUrl: (id: number) => string;
export declare const adminAssignPlan: (id: number, assignPlanInput: AssignPlanInput, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getAdminAssignPlanMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminAssignPlan>>, TError, {
        id: number;
        data: BodyType<AssignPlanInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminAssignPlan>>, TError, {
    id: number;
    data: BodyType<AssignPlanInput>;
}, TContext>;
export type AdminAssignPlanMutationResult = NonNullable<Awaited<ReturnType<typeof adminAssignPlan>>>;
export type AdminAssignPlanMutationBody = BodyType<AssignPlanInput>;
export type AdminAssignPlanMutationError = ErrorType<unknown>;
/**
 * @summary Assign a plan to a user (admin override)
 */
export declare const useAdminAssignPlan: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminAssignPlan>>, TError, {
        id: number;
        data: BodyType<AssignPlanInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminAssignPlan>>, TError, {
    id: number;
    data: BodyType<AssignPlanInput>;
}, TContext>;
/**
 * @summary Update WhatsApp display name for a number (admin)
 */
export declare const getUpdateWhatsappNumberNameUrl: (id: number) => string;
export declare const updateWhatsappNumberName: (id: number, displayNameInput: DisplayNameInput, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getUpdateWhatsappNumberNameMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateWhatsappNumberName>>, TError, {
        id: number;
        data: BodyType<DisplayNameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateWhatsappNumberName>>, TError, {
    id: number;
    data: BodyType<DisplayNameInput>;
}, TContext>;
export type UpdateWhatsappNumberNameMutationResult = NonNullable<Awaited<ReturnType<typeof updateWhatsappNumberName>>>;
export type UpdateWhatsappNumberNameMutationBody = BodyType<DisplayNameInput>;
export type UpdateWhatsappNumberNameMutationError = ErrorType<unknown>;
/**
 * @summary Update WhatsApp display name for a number (admin)
 */
export declare const useUpdateWhatsappNumberName: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateWhatsappNumberName>>, TError, {
        id: number;
        data: BodyType<DisplayNameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateWhatsappNumberName>>, TError, {
    id: number;
    data: BodyType<DisplayNameInput>;
}, TContext>;
/**
 * @summary Request a WhatsApp display name change (Business/Enterprise users)
 */
export declare const getRequestWhatsappNameChangeUrl: () => string;
export declare const requestWhatsappNameChange: (displayNameInput: DisplayNameInput, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getRequestWhatsappNameChangeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestWhatsappNameChange>>, TError, {
        data: BodyType<DisplayNameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestWhatsappNameChange>>, TError, {
    data: BodyType<DisplayNameInput>;
}, TContext>;
export type RequestWhatsappNameChangeMutationResult = NonNullable<Awaited<ReturnType<typeof requestWhatsappNameChange>>>;
export type RequestWhatsappNameChangeMutationBody = BodyType<DisplayNameInput>;
export type RequestWhatsappNameChangeMutationError = ErrorType<unknown>;
/**
 * @summary Request a WhatsApp display name change (Business/Enterprise users)
 */
export declare const useRequestWhatsappNameChange: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestWhatsappNameChange>>, TError, {
        data: BodyType<DisplayNameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestWhatsappNameChange>>, TError, {
    data: BodyType<DisplayNameInput>;
}, TContext>;
/**
 * @summary Get dashboard statistics for current user
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics for current user
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get platform-wide admin statistics
 */
export declare const getGetAdminStatsUrl: () => string;
export declare const getAdminStats: (options?: RequestInit) => Promise<AdminStats>;
export declare const getGetAdminStatsQueryKey: () => readonly ["/api/admin/stats"];
export declare const getGetAdminStatsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminStats>>>;
export type GetAdminStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get platform-wide admin statistics
 */
export declare function useGetAdminStats<TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map