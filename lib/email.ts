import { Resend } from "resend";
import { GST_RATE, splitGstInclusive } from "@/lib/pricing";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export type ReceiptEmailInput = {
  to: string;
  planName: string;
  credits: number;
  bonus: number;
  priceInr: number;
  orderId: string;
  createdAt: Date;
};

function receiptHtml(input: ReceiptEmailInput): string {
  const { planName, credits, bonus, priceInr, orderId, createdAt } = input;
  const date = createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const price = `₹${priceInr.toLocaleString("en-IN")}`;
  const { base, gst } = splitGstInclusive(priceInr);
  const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const gstPct = (GST_RATE * 100).toFixed(0);
  const halfPct = (GST_RATE * 50).toFixed(1);

  return `
  <div style="background:#f8fafc;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:380px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="background:#ffffff;border:2px solid #000000;border-radius:18px;padding:34px 28px 28px;">

          <div style="text-align:center;margin-bottom:26px;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:11px;font-weight:800;line-height:28px;text-align:center;vertical-align:middle;">VF</span>
            <span style="font-size:19px;font-weight:900;color:#0f172a;vertical-align:middle;margin-left:8px;">VendorFlow</span>
          </div>

          <div style="display:flex;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">
            <span style="flex:1;">Purchased Plan</span>
            <span>Price</span>
          </div>
          <div style="height:1px;background:rgba(15,23,42,0.12);margin:10px 0;"></div>

          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="width:24px;vertical-align:top;padding-top:2px;">
                <span style="display:inline-block;width:24px;height:22px;border-radius:6px;background:rgba(14,165,233,0.14);color:#0ea5e9;font-size:11px;font-weight:900;text-align:center;line-height:22px;">01</span>
              </td>
              <td style="padding-left:10px;vertical-align:top;">
                <div style="font-size:16px;font-weight:850;color:#0f172a;">${planName}</div>
                <div style="margin-top:2px;font-size:12px;color:#64748b;">
                  ${credits} credits${bonus > 0 ? ` (${bonus} bonus included)` : ""}
                </div>
              </td>
              <td style="text-align:right;vertical-align:top;font-size:15px;font-weight:850;color:#0f172a;white-space:nowrap;">
                ${price}
              </td>
            </tr>
          </table>

          <div style="height:1px;background:rgba(15,23,42,0.12);margin:10px 0;"></div>

          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#64748b;margin-bottom:5px;">
            <span>Taxable Amount</span>
            <span>${inr(base)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#64748b;margin-bottom:5px;">
            <span>CGST (${halfPct}%)</span>
            <span>${inr(gst / 2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">
            <span>SGST (${halfPct}%)</span>
            <span>${inr(gst / 2)}</span>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:950;color:#0f172a;">
            <span>Total Paid</span>
            <span style="color:#0ea5e9;">${price} INR</span>
          </div>
          <div style="text-align:right;font-size:10px;font-weight:700;color:#64748b;">Inclusive of ${gstPct}% GST</div>

          <div style="border-top:1.5px dashed rgba(15,23,42,0.28);margin:10px 0;"></div>

          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748b;">
            <span>${date}</span>
            <span>${time}</span>
            <span>${orderId}</span>
          </div>

          <div style="text-align:center;margin-top:22px;font-size:12px;color:#64748b;line-height:1.6;">
            <strong style="display:block;font-size:13px;font-weight:900;color:#0f172a;text-transform:uppercase;">VendorFlow</strong>
            AI product image generator for online sellers<br/>
            hello@productvisuals.ai
          </div>

        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Fire-and-forget: a missing API key or a Resend error must never fail the
 * caller (the payment webhook still has to return 200 either way).
 */
export async function sendReceiptEmail(input: ReceiptEmailInput): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping receipt email.");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "VendorFlow <onboarding@resend.dev>",
      to: input.to,
      subject: `Your VendorFlow receipt — ${input.planName} plan`,
      html: receiptHtml(input),
    });
  } catch (err) {
    console.error("[email] Failed to send receipt email:", err);
  }
}

function verificationHtml(code: string): string {
  return `
  <div style="background:#f8fafc;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:380px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="background:#ffffff;border:2px solid #000000;border-radius:18px;padding:34px 28px 28px;text-align:center;">
          <div style="margin-bottom:22px;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:11px;font-weight:800;line-height:28px;text-align:center;vertical-align:middle;">VF</span>
            <span style="font-size:19px;font-weight:900;color:#0f172a;vertical-align:middle;margin-left:8px;">VendorFlow</span>
          </div>
          <div style="font-size:14px;color:#64748b;margin-bottom:18px;">Enter this code to verify your email address:</div>
          <div style="font-size:34px;font-weight:900;letter-spacing:0.18em;color:#0f172a;margin-bottom:18px;">${code}</div>
          <div style="font-size:12px;color:#94a3b8;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Fire-and-forget, same as sendReceiptEmail — a missing API key or send
 * failure must not break registration; the caller still returns the code
 * so the flow can be retried via the resend endpoint.
 */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping verification email.");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "VendorFlow <onboarding@resend.dev>",
      to,
      subject: `Your VendorFlow verification code: ${code}`,
      html: verificationHtml(code),
    });
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
  }
}
