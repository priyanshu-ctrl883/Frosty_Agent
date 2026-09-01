import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const firstName = (data.firstName || data.fullName?.split(' ')[0] || '').trim();
    const lastName = (data.lastName || data.fullName?.split(' ').slice(1).join(' ') || '').trim();
    const fullName = data.fullName ? data.fullName.trim() : `${firstName} ${lastName}`.trim();
    const workEmail = (data.workEmail || data.email || '').trim();
    const company = (data.company || data.companyName || 'N/A').trim();
    const jobRole = (data.jobRole || data.jobTitle || 'N/A').trim();
    const reachTarget = (data.reachTarget || data.reachType || 'Sales Enquiry').trim();
    const message = (data.message || data.projectDetails || '').trim();

    // Validation
    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }
    if (!workEmail) {
      return NextResponse.json({ success: false, error: 'Work email is required.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message description is required.' }, { status: 400 });
    }

    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || 'Info@frostyagent.com';
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'Frosty Agent Portal <Info@frostyagent.com>';
    const resendApiKey = process.env.RESEND_API_KEY || '';

    // HTML Email Template adhering to Frostrek AI branding
    const mailtoSubject = encodeURIComponent(`Re: New Contact Inquiry: ${reachTarget} - ${fullName}`);
    const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    const htmlTemplate = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Message from Frostrek Website</title></head>
<body style="margin:0;padding:28px 24px;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding:24px;background:linear-gradient(135deg,#0396A6,#027D8A);color:#FFFFFF;">
        <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">New Inquiry from Frostrek Website</h1>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Direct contact submission via landing portal</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;line-height:1.6;">
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Name:</td>
            <td style="padding:10px 0;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">${fullName}</td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Work Email:</td>
            <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
              <a href="mailto:${workEmail}" style="color:#0396A6;font-weight:600;text-decoration:none;">${workEmail}</a>
            </td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Company:</td>
            <td style="padding:10px 0;color:#0F172A;border-bottom:1px solid #F1F5F9;">${company}</td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Job Role:</td>
            <td style="padding:10px 0;color:#0F172A;border-bottom:1px solid #F1F5F9;">${jobRole}</td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Enquiry Type:</td>
            <td style="padding:10px 0;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">
              <span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#E0F7F9;color:#027D8A;font-size:12px;font-weight:700;">${reachTarget}</span>
            </td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:16px 0 8px;color:#64748B;font-weight:600;">Message:</td>
            <td style="padding:16px 0 8px;">
              <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #0396A6;border-radius:8px;padding:14px;color:#1E293B;font-size:13.5px;line-height:1.6;">
                ${safeMessage}
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2" align="center" style="padding:28px 0 10px;">
              <a href="mailto:${workEmail}?subject=${mailtoSubject}" style="display:inline-block;background-color:#0396A6;color:#FFFFFF;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:9999px;box-shadow:0 4px 6px -1px rgba(3,150,166,0.3);">
                Reply Directly to ${firstName || fullName} &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let emailSent = false;
    let resendMessageId: string | null = null;

    if (resendApiKey && resendApiKey.trim().length > 0) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [recipientEmail],
            reply_to: workEmail,
            subject: `New Contact Inquiry: ${reachTarget} - ${fullName}`,
            html: htmlTemplate,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          emailSent = true;
          resendMessageId = resendData.id || null;
        } else {
          console.warn('[Contact API] Resend API error:', resendData);
        }
      } catch (emailErr) {
        console.error('[Contact API] Error contacting Resend:', emailErr);
      }
    } else {
      console.log('ℹ️ [Contact API] Received inquiry (Dev mode / No RESEND_API_KEY set):', {
        fullName,
        workEmail,
        company,
        jobRole,
        reachTarget,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
      dispatched: emailSent,
      id: resendMessageId || `lead_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('[Contact API] Internal Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
