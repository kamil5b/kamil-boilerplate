# SMTP Mail Configuration Guide

This application uses SMTP for sending emails. You need to configure the following environment variables:

## Required Environment Variables

Add these variables to your `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                  # true for 465, false for other ports
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your-app-password        # Your email password or app password
SMTP_FROM=your-email@gmail.com    # From address (usually same as SMTP_USER)

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Common SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Important for Gmail:**
- You need to use an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password
- Enable 2-factor authentication first
- Generate an app-specific password in your Google Account settings

### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## Email Features

The application sends emails for the following events:

1. **Account Activation** - When a user registers, they receive an activation link
2. **Password Reset** - When a user requests a password reset, they receive a reset link
3. **Welcome Email** - When a user activates their account, they receive a welcome message
4. **Password Changed** - When a password is successfully reset, a confirmation is sent

## Testing SMTP Connection

You can test your SMTP configuration by creating a test endpoint or running:

```typescript
import { testSmtpConnection } from '@/server/utils/mail';

const isConnected = await testSmtpConnection();
console.log('SMTP Connection:', isConnected ? 'Success' : 'Failed');
```

## Development Mode

For local development, you can use services like:
- [Mailtrap](https://mailtrap.io/) - Email testing service
- [Ethereal Email](https://ethereal.email/) - Fake SMTP service
- [MailHog](https://github.com/mailhog/MailHog) - Local email testing tool

### Example with Mailtrap
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

## Security Best Practices

1. **Never commit** your `.env.local` file to version control
2. Use **app-specific passwords** for Gmail and similar providers
3. Consider using **dedicated email services** (SendGrid, Mailgun) for production
4. Implement **rate limiting** to prevent email abuse
5. Monitor email sending and set up **alerts** for failures

## Troubleshooting

### Common Issues

**"Invalid login credentials"**
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, ensure you're using an App Password
- Check if 2FA is enabled

**"Connection timeout"**
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall settings
- Ensure your network allows outbound connections on the SMTP port

**"TLS/SSL errors"**
- Check SMTP_SECURE setting (false for port 587, true for port 465)
- Verify the SMTP provider supports the selected port

**Emails not received**
- Check spam/junk folders
- Verify SMTP_FROM is a valid email address
- Check email service logs for delivery issues

## Error Handling

The application handles email errors gracefully:
- Registration/password reset continues even if email fails
- Errors are logged to console
- Users still receive success messages (to prevent email enumeration)

## Future Enhancements

Consider implementing:
- Email templates with dynamic content
- Email queue for better performance
- Email delivery status tracking
- Unsubscribe functionality
- Email analytics
