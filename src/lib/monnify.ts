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
}): Promise<InitializeTransactionResponse> {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      paymentReference: params.paymentReference,
      contractCode: MONNIFY_CONTRACT_CODE,
      currencyCode: "NGN",
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      description: params.description,
      redirectUrl: params.redirectUrl,
    }),
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
