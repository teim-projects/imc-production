# 📧 How to Check if Email Sent or Not

## 🔍 Method 1: Check Server Logs (Best Method)

### **Step 1: SSH to Production Server**
```bash
ssh your-username@your-server-ip
# OR use PuTTY on Windows
```

### **Step 2: Check Docker Logs for Email Messages**
```bash
cd /path/to/imc-production/Docker

# Check recent backend logs
docker-compose logs --tail=100 backend

# Search for email-related messages
docker-compose logs backend | grep -i "email"
docker-compose logs backend | grep -i "Payment success emails sent"

# Search for your order ID
docker-compose logs backend | grep -i "IMC"
```

### **What to Look For:**

#### ✅ **If Email Sent Successfully:**
```
✓ Payment success emails sent for order IMC7fcc79cc1b9f8...
User email sent successfully to user@email.com for order IMC...
Admin email sent successfully for order IMC...
```

#### ❌ **If Email Failed:**
```
✗ Email sending failed: [error message]
Failed to send user email: [error details]
SMTPAuthenticationError: Username and Password not accepted
```

#### ⚠️ **If Code Not Deployed:**
```
# No email-related messages will appear
# You won't see any "email" keyword in logs
```

---

## 🔍 Method 2: Check Django Admin Logs

### **Step 1: SSH and Open Django Shell**
```bash
cd /path/to/imc-production/Docker
docker-compose exec backend python manage.py shell
```

### **Step 2: Check Recent Payments**
```python
from payments.models import Payment

# Get last 5 payments
payments = Payment.objects.all().order_by('-created_at')[:5]

for p in payments:
    print(f"\nOrder ID: {p.order_id}")
    print(f"Amount: ₹{p.amount}")
    print(f"Status: {p.status}")
    print(f"Service: {p.service}")
    print(f"Customer: {p.customer_name}")
    print(f"Created: {p.created_at}")
    print("-" * 50)
```

### **Step 3: Get Your Specific Payment Details**
```python
# Replace with your actual Order ID from payment success page
order_id = "IMC7fcc79cc1b9f8"  # Your order ID

payment = Payment.objects.filter(order_id=order_id).first()
if payment:
    print(f"Order Found: {payment.order_id}")
    print(f"Status: {payment.status}")
    print(f"Service: {payment.service}")
    print(f"Registration ID: {payment.registration_id}")
    
    # Try to get booking object
    if payment.service == "studio_booking":
        from api.models import Studio
        booking = Studio.objects.filter(id=payment.registration_id).first()
        if booking:
            print(f"\nBooking Details:")
            print(f"Customer: {booking.customer}")
            print(f"Email: {booking.email}")
            print(f"Phone: {booking.contact_number}")
else:
    print("Order not found!")
```

---

## 🔍 Method 3: Test Email Function Manually

### **Step 1: Connect to Django Shell**
```bash
docker-compose exec backend python manage.py shell
```

### **Step 2: Test Email Sending**
```python
from django.core.mail import send_mail

# Test basic email
try:
    send_mail(
        subject='Test Email from IMC',
        message='This is a test email.',
        from_email='IMCPCMC@gmail.com',
        recipient_list=['your-email@gmail.com'],  # Replace with your email
        fail_silently=False,
    )
    print("✅ Test email sent successfully!")
except Exception as e:
    print(f"❌ Email failed: {e}")
```

### **Step 3: Test Full Email System**
```python
from payments.models import Payment
from payments.email_utils import send_payment_success_emails
from api.models import Studio

# Get your payment
order_id = "IMC7fcc79cc1b9f8"  # Replace with your order ID
payment = Payment.objects.filter(order_id=order_id).first()

if payment and payment.service == "studio_booking":
    booking = Studio.objects.filter(id=payment.registration_id).first()
    
    if booking:
        print(f"Found booking: {booking.customer}")
        print(f"Email: {booking.email}")
        
        # Try sending email
        try:
            send_payment_success_emails(payment, booking)
            print("✅ Email sent successfully!")
        except Exception as e:
            print(f"❌ Email failed: {e}")
    else:
        print("Booking not found!")
else:
    print("Payment not found or not studio booking!")
```

---

## 🔍 Method 4: Check Email Inbox

### **Check These Places:**

#### **1. Your Email (User Email)**
- Open email inbox you provided during booking
- Check **Inbox** folder
- Check **Spam/Junk** folder ⚠️
- Check **Promotions** tab (Gmail)
- Search for: "IMC" or "Payment Successful"

#### **2. Admin Email**
- Login to: **IMCPCMC@gmail.com**
- Check Inbox
- Check Spam folder
- Search for: "New Payment" or "IMC"

---

## 🔍 Method 5: Check Email Configuration

### **Verify .env Settings**
```bash
# On server
cat /path/to/imc-production/Backend/.env | grep EMAIL

# Should show:
EMAIL_HOST_USER=IMCPCMC@gmail.com
EMAIL_HOST_PASSWORD=gors pytc uqwf mnjc
```

### **Test Gmail Credentials**
```bash
# Connect to Django shell
docker-compose exec backend python manage.py shell
```

```python
import smtplib
from email.mime.text import MIMEText

# Test SMTP connection
try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('IMCPCMC@gmail.com', 'gors pytc uqwf mnjc')
    print("✅ Gmail login successful!")
    server.quit()
except Exception as e:
    print(f"❌ Gmail login failed: {e}")
```

---

## 🔍 Method 6: Check if Code is Deployed

### **Quick File Check**
```bash
# SSH to server
ssh your-username@server

# Check if email_utils.py exists
ls -la /path/to/imc-production/Backend/payments/email_utils.py

# If file exists with recent date = DEPLOYED ✅
# If file not found = NOT DEPLOYED ❌
```

### **Check Payment Views Code**
```bash
# Check if import exists
grep -n "email_utils" /path/to/imc-production/Backend/payments/views.py

# Should show line with:
# from .email_utils import send_payment_success_emails
```

---

## 📊 Quick Diagnostic Commands

### **All-in-One Check Script:**
```bash
# On production server
cd /path/to/imc-production/Docker

echo "=== Checking Backend Status ==="
docker-compose ps backend

echo "\n=== Checking Recent Logs ==="
docker-compose logs --tail=50 backend | grep -i email

echo "\n=== Checking Email Utils File ==="
ls -la ../Backend/payments/email_utils.py

echo "\n=== Checking Recent Payments ==="
docker-compose exec backend python manage.py shell <<EOF
from payments.models import Payment
p = Payment.objects.last()
print(f"Last Payment: {p.order_id} - {p.status} - {p.customer_name}")
EOF
```

---

## 🎯 Most Likely Issues & Solutions

### **Issue 1: Code Not Deployed**
**Check:** File `email_utils.py` doesn't exist on server
**Solution:** Deploy code (see DEPLOY_EMAIL_SYSTEM.md)

### **Issue 2: Backend Not Restarted**
**Check:** Logs don't show email messages
**Solution:** 
```bash
docker-compose restart backend
```

### **Issue 3: Email Credentials Wrong**
**Check:** Error "SMTPAuthenticationError"
**Solution:** Verify Gmail App Password is correct

### **Issue 4: Email in Spam**
**Check:** Check spam/junk folder
**Solution:** Mark as "Not Spam" and add to contacts

### **Issue 5: No Email Field in Booking**
**Check:** Booking doesn't have email
**Solution:** User must enter email during booking

---

## ✅ Success Indicators

### **Email Sent Successfully:**
- ✅ Server logs show "Payment success emails sent"
- ✅ No error messages in logs
- ✅ User receives email in inbox/spam
- ✅ Admin (IMCPCMC@gmail.com) receives email

### **Email NOT Sent:**
- ❌ No email messages in server logs
- ❌ Error messages appear in logs
- ❌ File `email_utils.py` doesn't exist
- ❌ Django shell test fails

---

## 📞 Step-by-Step Troubleshooting

### **Step 1: Check if Code Deployed**
```bash
ls -la /path/to/Backend/payments/email_utils.py
```
- **File exists** → Go to Step 2
- **File not found** → Deploy code first!

### **Step 2: Check Backend Running**
```bash
docker-compose ps backend
```
- **Status: Up** → Go to Step 3
- **Status: Down** → Restart: `docker-compose up -d backend`

### **Step 3: Check Logs**
```bash
docker-compose logs --tail=100 backend | grep -i email
```
- **Email messages found** → Go to Step 4
- **No messages** → Code not executing, check deployment

### **Step 4: Check Email Inbox**
- Check user email inbox
- Check IMCPCMC@gmail.com
- Check spam folders
- **Email received** → ✅ SUCCESS!
- **No email** → Go to Step 5

### **Step 5: Manual Test**
- Run Django shell test (Method 3 above)
- Check for specific errors
- Fix based on error message

---

## 🔧 Quick Fixes

### **Fix 1: Restart Backend**
```bash
docker-compose restart backend
```

### **Fix 2: Check Logs in Real-time**
```bash
docker-compose logs -f backend
# Make a test payment and watch logs live
```

### **Fix 3: Re-deploy Code**
```bash
git pull origin main
docker-compose build --no-cache backend
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

---

## 📋 Checklist

Before contacting support, verify:
- [ ] Code deployed to production server
- [ ] Backend container is running
- [ ] email_utils.py file exists on server
- [ ] Backend restarted after deployment
- [ ] .env has correct EMAIL credentials
- [ ] Checked both inbox and spam
- [ ] Checked server logs for errors
- [ ] Tested email manually from Django shell

---

**Most Common Issue:** Code not deployed to production!
**Solution:** Follow DEPLOY_EMAIL_SYSTEM.md guide
