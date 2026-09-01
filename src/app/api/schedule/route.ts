import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const attendeeName = (data.attendeeName || data.name || '').trim();
    const attendeeEmail = (data.attendeeEmail || data.email || '').trim();
    const selectedDate = data.selectedDate || '';
    const selectedSlot = (data.selectedSlot || data.timeSlot || '').trim();
    const notes = (data.attendeeNotes || data.notes || '').trim();
    const duration = data.duration || '45 min appointments';

    if (!attendeeName) {
      return NextResponse.json({ success: false, error: 'Name is required.' }, { status: 400 });
    }
    if (!attendeeEmail) {
      return NextResponse.json({ success: false, error: 'Work email is required.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(attendeeEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!selectedDate || !selectedSlot) {
      return NextResponse.json({ success: false, error: 'Appointment date and time slot are required.' }, { status: 400 });
    }

    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || 'Info@frostyagent.com';
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'Frosty Agent Portal <Info@frostyagent.com>';
    const resendApiKey = process.env.RESEND_API_KEY || '';

    const htmlTemplate = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Discovery Call Scheduled</title></head>
<body style="margin:0;padding:28px 24px;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding:24px;background:linear-gradient(135deg,#0396A6,#027D8A);color:#FFFFFF;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">Discovery Call Scheduled!</h1>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Frostrek AI Workflow &amp; Conversion Session</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <div style="background:#F0FDFA;border:1px solid #CCFBF1;border-radius:12px;padding:16px;margin-bottom:20px;">
          <h3 style="margin:0 0 6px 0;color:#0F766E;font-size:15px;font-weight:700;">📅 Session Details</h3>
          <p style="margin:0;color:#115E59;font-size:14px;font-weight:600;">Date &amp; Time: ${selectedDate} at ${selectedSlot}</p>
          <p style="margin:4px 0 0 0;color:#134E4A;font-size:13px;">Duration: ${duration} • Video: Google Meet link will be attached</p>
        </div>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;line-height:1.6;">
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Attendee:</td>
            <td style="padding:10px 0;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">${attendeeName}</td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Email:</td>
            <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;"><a href="mailto:${attendeeEmail}" style="color:#0396A6;font-weight:600;text-decoration:none;">${attendeeEmail}</a></td>
          </tr>
          <tr>
            <td width="130" valign="top" style="padding:10px 0;color:#64748B;font-weight:600;border-bottom:1px solid #F1F5F9;">Topic / Notes:</td>
            <td style="padding:10px 0;color:#0F172A;border-bottom:1px solid #F1F5F9;">${notes || 'General AI Workflow Discovery'}</td>
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
            to: [recipientEmail, attendeeEmail],
            reply_to: attendeeEmail,
            subject: `Discovery Call Confirmed: ${attendeeName} - ${selectedDate} at ${selectedSlot}`,
            html: htmlTemplate,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          emailSent = true;
          resendMessageId = resendData.id || null;
        }
      } catch (err) {
        console.error('[Schedule API] Error contacting Resend:', err);
      }
    } else {
      console.log('ℹ️ [Schedule API] Booking confirmed (Dev mode):', {
        attendeeName,
        attendeeEmail,
        selectedDate,
        selectedSlot,
        notes,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Call scheduled successfully.',
      dispatched: emailSent,
      bookingId: resendMessageId || `book_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('[Schedule API] Internal Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
