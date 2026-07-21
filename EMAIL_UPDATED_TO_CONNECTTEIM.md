# ✅ Email Credentials Updated Successfully

## 📧 Changes Made

### **Old Email Configuration:**
- Email: `IMCPCMC@gmail.com`
- App Password: `gors pytc uqwf mnjc`

### **New Email Configuration:**
- Email: `connectteim@gmail.com`
- App Password: `jvoe gsbi lesc dylm`

---

## 📝 Files Updated

### **1. Backend/.env**
```env
EMAIL_HOST_USER=connectteim@gmail.com
EMAIL_HOST_PASSWORD=jvoe gsbi lesc dylm
```

### **2. Backend/payments/email_utils.py**
- Updated `ADMIN_EMAIL = "connectteim@gmail.com"`
- Updated contact email in user email template

---

## 🚀 Deployment Required

These changes are on your LOCAL machine. You need to deploy to production:

### **Option 1: Git Deployment**
```bash
# On local machine
cd C:\Users\OWNER\Desktop\imc\imc-production

# Commit changes
git add Backend/.env Backend/payments/email_utils.py
git commit -m "Update email to connectteim@gmail.com"
git push origin main

# On production server (SSH)
cd /path/to/imc-production
git pull origin main

# Restart backend to apply changes
cd Docker
docker-compose restart backend
```

### **Option 2: Manual Update**
1. Edit `/path/to/Backend/.env` on server
2. Change `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
3. Restart: `docker-compose restart backend`

---

## ⚠️ Important Notes

### **1. Gmail App Password**
The password `jvoe gsbi lesc dylm` should be a Gmail App Password, not your regular Gmail password.

**To verify/create App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Login with `connectteim@gmail.com`
3. Create new App Password if needed
4. Use that password (format: `xxxx xxxx xxxx xxxx`)

### **2. Gmail Settings Required**
Make sure `connectteim@gmail.com` has:
- ✅ 2-Step Verification enabled
- ✅ App Passwords generated
- ✅ "Less secure app access" not needed (App Password is secure)

### **3. Emails Will Be Sent:**
- **From:** connectteim@gmail.com
- **To User:** Customer's email (from booking form)
- **To Admin:** connectteim@gmail.com (same email receives copy)

---

## 🧪 Test After Deployment

### **Method 1: Quick Django Shell Test**
```bash
# SSH to server
docker-compose exec backend python manage.py shell
```

```python
from django.core.mail import send_mail

# Test email
send_mail(
    'Test Email from IMC',
    'Testing new email configuration',
    'connectteim@gmail.com',
    ['your-test-email@gmail.com'],
    fail_silently=False,
)

# Should print: True (if successful)
```

### **Method 2: Make Test Payment**
1. Go to https://imcpune.in
2. Make test booking (Studio, Singing Class, etc.)
3. Use valid email in form
4. Complete payment
5. Check both:
   - Your email inbox
   - connectteim@gmail.com inbox

---

## 🔍 Verify Deployment

### **Check if New Email is Active:**
```bash
# On production server
cat /path/to/Backend/.env | grep EMAIL

# Should show:
EMAIL_HOST_USER=connectteim@gmail.com
EMAIL_HOST_PASSWORD=jvoe gsbi lesc dylm
```

### **Check Backend Logs:**
```bash
docker-compose logs --tail=50 backend | grep -i email
```

---

## 📊 What Will Happen After Deployment

### **User Receives:**
- Beautiful HTML email from `connectteim@gmail.com`
- Payment confirmation with order details
- IMC contact info showing `connectteim@gmail.com`

### **Admin Receives:**
- Email notification to `connectteim@gmail.com`
- Customer details
- Payment information
- Booking details

### **Email Content Updates:**
- Contact email in footer: connectteim@gmail.com
- Reply-to address: connectteim@gmail.com
- From address: connectteim@gmail.com

---

## ⚙️ Configuration Summary

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| From Email | IMCPCMC@gmail.com | connectteim@gmail.com |
| Admin Email | IMCPCMC@gmail.com | connectteim@gmail.com |
| SMTP Host | smtp.gmail.com | smtp.gmail.com (unchanged) |
| SMTP Port | 587 | 587 (unchanged) |
| App Password | gors pytc uqwf mnjc | jvoe gsbi lesc dylm |

---

## 🔐 Security Reminder

### **Never Share:**
- ❌ App Password: `jvoe gsbi lesc dylm`
- ❌ Regular Gmail password

### **Keep Safe:**
- .env file should not be committed to public Git
- .gitignore should include `.env`
- Only authorized people should have access

---

## 📞 Troubleshooting

### **Issue: Email Not Sending**

#### **Check 1: App Password Correct?**
```bash
docker-compose exec backend python manage.py shell
```
```python
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('connectteim@gmail.com', 'jvoe gsbi lesc dylm')
# If no error = credentials work ✅
```

#### **Check 2: Backend Restarted?**
```bash
docker-compose restart backend
docker-compose ps backend
# Status should be "Up"
```

#### **Check 3: .env File Updated on Server?**
```bash
cat /path/to/Backend/.env | grep EMAIL_HOST_USER
# Should show: connectteim@gmail.com
```

---

## ✅ Deployment Checklist

- [ ] Local files updated (Backend/.env, email_utils.py)
- [ ] Changes committed to Git
- [ ] Changes pushed to repository
- [ ] Server pulled latest code (git pull)
- [ ] Backend container restarted
- [ ] Test email sent successfully
- [ ] Checked connectteim@gmail.com inbox
- [ ] Made test payment to verify

---

## 🎯 Next Steps

1. **Deploy Changes to Production** (see deployment methods above)
2. **Restart Backend** to load new email settings
3. **Test Email** with Django shell
4. **Make Test Payment** to verify end-to-end
5. **Check Logs** for email confirmation messages

---

**Status:** ✅ Local changes complete, pending production deployment

**New Email:** connectteim@gmail.com
**Admin Notifications:** connectteim@gmail.com will receive all payment notifications

---

## 📧 Testing Commands

```bash
# 1. Check current email setting on server
cat Backend/.env | grep EMAIL_HOST_USER

# 2. Test SMTP connection
docker-compose exec backend python -c "
import smtplib
s = smtplib.SMTP('smtp.gmail.com', 587)
s.starttls()
s.login('connectteim@gmail.com', 'jvoe gsbi lesc dylm')
print('✅ SMTP Connection Successful!')
s.quit()
"

# 3. Send test email
docker-compose exec backend python manage.py shell -c "
from django.core.mail import send_mail
send_mail('Test', 'Test from IMC', 'connectteim@gmail.com', ['test@example.com'])
"
```

---

**Remember:** Deploy to production for changes to take effect!
