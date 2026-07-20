const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;

interface MonnifyTokenResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseBody: {
    accessToken: string;
    expiry: string;
  };
}

interface InitializeTransactionResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseBody: {
    transactionRef: string;
    checkoutUrl: string;
    paymentReference: string;
  };
}

interface VerifyTransactionResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseBody: {
    transactionRef: string;
    paymentRef: string;
    amountPaid: number;
    totalPayable: number;
    settlementAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdOn: string;
    paidOn: string;
  };
}

export async function getMonnifyToken(): Promise<string> {
  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64");

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  const data: MonnifyTokenResponse = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return data.responseBody.accessToken;
}

export async function initializeTransaction(params: {
  amount: number;
  paymentReference: string;
  customerName: string;
  customerEmail: string;
  description: string;
  redirectUrl: string;
  splitCode?: string;
}): Promise<InitializeTransactionResponse> {
  const token = await getMonnifyToken();

  const body: Record<string, string | number> = {
    amount: params.amount,
    paymentReference: params.paymentReference,
    contractCode: MONNIFY_CONTRACT_CODE || "",
    currencyCode: "NGN",
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    description: params.description,
    redirectUrl: params.redirectUrl,
  };

  if (params.splitCode) {
    body.splitCode = params.splitCode;
  }

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: InitializeTransactionResponse = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return data;
}

export async function verifyTransaction(transactionRef: string): Promise<VerifyTransactionResponse> {
  const token = await getMonnifyToken();

  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/verify/${transactionRef}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data: VerifyTransactionResponse = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return data;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha512", MONNIFY_SECRET_KEY).update(payload).digest("hex");
  return hash === signature;
}

// ============================================================
// RESERVED ACCOUNTS
// ============================================================
export async function createReservedAccount(params: {
  accountReference: string;
  accountName: string;
  customerEmail: string;
  customerName: string;
  bvn: string;
}): Promise<{ accountNumber: string; bankName: string; accountReference: string }> {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/reserved-accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accountReference: params.accountReference,
      accountName: params.accountName,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      bvn: params.bvn,
      contractCode: MONNIFY_CONTRACT_CODE || "",
    }),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return {
    accountNumber: data.responseBody.accountNumber,
    bankName: data.responseBody.bankName || "Moniepoint MFB",
    accountReference: params.accountReference,
  };
}

// ============================================================
// INVOICES
// ============================================================
export async function createInvoice(params: {
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  lineItems: Array<{ name: string; description: string; quantity: number; unitPrice: number }>;
  expiryDate?: string;
}): Promise<{ invoiceId: string; invoiceUrl: string; paymentReference: string }> {
  const token = await getMonnifyToken();
  const paymentRef = `INV-${Date.now()}`;

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      paymentReference: paymentRef,
      contractCode: MONNIFY_CONTRACT_CODE || "",
      currencyCode: "NGN",
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      description: params.description,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/success`,
    }),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return {
    invoiceId: data.responseBody.transactionRef,
    invoiceUrl: data.responseBody.checkoutUrl,
    paymentReference: paymentRef,
  };
}

// ============================================================
// REFUNDS
// ============================================================
export async function processRefund(params: {
  transactionReference: string;
  amount?: number;
  reason: string;
}): Promise<{ refundReference: string; status: string }> {
  const token = await getMonnifyToken();

  const body: Record<string, string | number> = {
    transactionReference: params.transactionReference,
    refundReason: params.reason,
  };

  if (params.amount) {
    body.amount = params.amount;
  }

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return {
    refundReference: data.responseBody?.refundReference || `REF-${Date.now()}`,
    status: "PENDING",
  };
}

// ============================================================
// KYC VERIFICATION (BVN)
// ============================================================
export async function verifyBVN(bvn: string): Promise<{ verified: boolean; fullName?: string; dateOfBirth?: string }> {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/verification/verify-bvn`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bvn }),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    return { verified: false };
  }

  return {
    verified: true,
    fullName: data.responseBody?.firstName ? `${data.responseBody.firstName} ${data.responseBody.lastName}` : undefined,
    dateOfBirth: data.responseBody?.dateOfBirth,
  };
}

// ============================================================
// NAME ENQUIRY (Verify bank account)
// ============================================================
export async function verifyBankAccount(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<{ verified: boolean; accountName?: string }> {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/banks/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bankCode: params.bankCode,
      accountNumber: params.accountNumber,
    }),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    return { verified: false };
  }

  return {
    verified: true,
    accountName: data.responseBody?.accountName,
  };
}

// ============================================================
// DISBURSEMENTS (Single Transfer)
// ============================================================
export async function disburseFunds(params: {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration: string;
  reference: string;
}): Promise<{ reference: string; status: string }> {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      paymentReference: params.reference,
      contractCode: MONNIFY_CONTRACT_CODE || "",
      currencyCode: "NGN",
      customerName: params.accountName,
      customerEmail: "disbursement@marketrun.com",
      description: params.narration,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    }),
  });

  const data = await response.json();

  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage);
  }

  return {
    reference: params.reference,
    status: "INITIATED",
  };
}
