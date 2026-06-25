const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { to, clientName, invoiceNumber, total, dueDate, paymentLinkUrl, companyName, lineItems } = JSON.parse(event.body);

    if (!to || !invoiceNumber || !companyName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: to, invoiceNumber, companyName" }) };
    }

    const lineItemsText = (lineItems || [])
      .map(li => {
        const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);
        return `  - ${li.desc}: ${li.qty} x $${(parseFloat(li.rate) || 0).toFixed(2)} = $${amt.toFixed(2)}`;
      })
      .join("\n");

    const paymentSection = paymentLinkUrl
      ? `\n\nPay online securely:\n${paymentLinkUrl}\n`
      : "";

    const plainTextBody = [
      `Hi ${clientName || "there"},`,
      "",
      `Please find your invoice ${invoiceNumber} from ${companyName}.`,
      "",
      `Amount due: $${parseFloat(total || 0).toFixed(2)}`,
      dueDate ? `Due date: ${dueDate}` : "",
      "",
      lineItemsText ? `Line items:\n${lineItemsText}` : "",
      paymentSection,
      "If you have any questions about this invoice, please don't hesitate to reach out.",
      "",
      "Thank you for your business!",
      "",
      `Best regards,`,
      companyName,
    ].filter(Boolean).join("\n");

    const subject = `Invoice ${invoiceNumber} from ${companyName}`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f1">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#1a1a18">${companyName}</div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700;color:#1D9E75">INVOICE</div>
          <div style="font-size:12px;color:#9a9a94">${invoiceNumber}</div>
        </div>
      </div>
      <div style="border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:16px">
        <div style="font-size:10px;color:#9a9a94;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Bill to</div>
        <div style="font-size:14px;font-weight:600">${clientName || to}</div>
        <div style="font-size:12px;color:#5a5a56">${to}</div>
      </div>
      ${dueDate ? `<div style="margin-bottom:16px"><span style="font-size:12px;color:#9a9a94">Due date: </span><span style="font-size:13px;font-weight:600">${dueDate}</span></div>` : ""}
      <div style="background:#E1F5EE;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px">
        <div style="font-size:12px;color:#0F6E56;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px">Amount due</div>
        <div style="font-size:28px;font-weight:700;color:#0F6E56">$${parseFloat(total || 0).toFixed(2)}</div>
      </div>
      ${paymentLinkUrl ? `<div style="text-align:center;margin-bottom:16px"><a href="${paymentLinkUrl}" style="display:inline-block;background:#635BFF;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px">Pay Now</a></div>` : ""}
      <div style="font-size:12px;color:#9a9a94;text-align:center;margin-top:20px">Thank you for your business!</div>
    </div>
  </div>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        plainTextBody,
        htmlBody,
        mailtoUrl: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

module.exports = { handler };
