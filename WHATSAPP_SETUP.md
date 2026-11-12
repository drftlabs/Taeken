# WhatsApp confirmation code for COD (setup)

When **Settings → "COD: % paid online upfront" = 0** (pure cash on delivery) **and** **"Confirm 0% COD orders with a WhatsApp code" is ticked**, the customer must confirm their phone with a 4-digit WhatsApp code before the order is placed. If the percentage is 1 or more, they pay that advance online and **no WhatsApp code is asked**. Online (prepaid) orders never ask for a code.

> The tick box is OFF by default, so COD keeps working normally until you have finished the steps below. Tick it last.

## 1. Meta / WhatsApp Business Platform
1. Go to business.facebook.com → create (or open) your **Meta Business account** and verify the business (Business settings → Security Center → Start verification). Verification is needed for higher sending limits; you can test without it.
2. developers.facebook.com → **My Apps → Create app → type "Business"**, attach your business account → **Add product → WhatsApp**.
3. In **WhatsApp → API Setup** add a **phone number** that is NOT already registered on the WhatsApp / WhatsApp Business app (a new SIM or landline is fine). Verify it by SMS/call. Note the **Phone number ID** shown on that page.
4. Add a **payment method** (WhatsApp Manager → Payment settings). Authentication messages are billed per message.

## 2. Create the message template
WhatsApp Manager → **Message templates → Create template**
- **Category:** Authentication
- **Name:** `taeken_cod_otp`
- **Language:** English
- **Code delivery setup:** **Copy code** (button text: "Copy code")
- Tick **Add security recommendation** ("For your security, do not share this code.")
- Tick **Add expiry time for the code** and set **10 minutes** (matches the site)
- Submit. Authentication templates are normally approved within minutes.

The message the customer receives (Meta generates the wording for Authentication templates):
> **4821** is your verification code. For your security, do not share this code.
> This code expires in 10 minutes.
> [ Copy code ]

## 3. Permanent access token
Business settings → **Users → System users → Add** (role: Admin) → **Add assets** → your WhatsApp app (full control) → **Generate new token**, choose your app, never expiry, permissions `whatsapp_business_messaging` and `whatsapp_business_management`. Copy the token (the temporary token on the API Setup page expires in 24 hours, do not use it for the live site).

## 4. Vercel environment variables
`WHATSAPP_TOKEN` = the permanent token, `WHATSAPP_PHONE_ID` = Phone number ID, `WHATSAPP_TEMPLATE` = `taeken_cod_otp`, `WHATSAPP_TEMPLATE_LANG` = `en`. Redeploy.

## 5. Supabase
Run `supabase/migration_6.sql` in the SQL Editor.

## 6. Test
- Before Meta approves anything, add `OTP_TEST_MODE` = `1` in Vercel and redeploy: no WhatsApp is sent; the code is shown inside the box. **Delete OTP_TEST_MODE before going live.**
- Then in Admin → Settings set **COD: % paid online upfront = 0**, tick **Confirm 0% COD orders with a WhatsApp code**, Save, and place a COD order with your own number, enter the code. The order should place by itself and show "WhatsApp verified". Admin → Orders → the order shows "Phone verified on WhatsApp".

## Notes
- Customers must have WhatsApp on the number they enter.
- Limits built in: 25 seconds between sends, 4 codes per number per 30 minutes, 5 wrong tries per code, code valid 10 minutes.
- If WhatsApp is not configured, pure-COD checkout shows "WhatsApp confirmation isn't set up yet" instead of silently skipping the check.
