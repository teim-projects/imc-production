# 🚀 Deploy Email Notification System

## ⚠️ Important: Changes Need Deployment

The email notification code is currently only on your LOCAL machine.
You need to deploy it to your PRODUCTION server (imcpune.in).

---

## 📦 Files That Need to be Deployed

### **New Files Created:**
1. `Backend/payments/email_utils.py` - Complete email system
2. `Backend/api/migrations/0039_add_email_to_singer.py` - Database migration

### **Modified Files:**
1. `Backend/api/models.py` - Added email field to Singer model
2. `Backend/payments/views.py` - Added email sending calls
3. `Frontend/imc/src/userDashboard/pages/SingerRegistration.jsx` - Added email input

---

## 🔄 Deployment Methods

### **Method 1: Using Git (Recommended)**

#### Step 1: Commit Changes to Git
```bash
cd C:\Users\OWNER\Desktop\imc\imc-production

# Add all changed files
git add Backend/payments/email_utils.py
git add Backend/api/models.py
git add Backend/api/migrations/0039_add_email_to_singer.py
git add Backend/payments/views.py
git add Frontend/imc/src/userDashboard/pages/SingerRegistration.jsx

# Commit changes
git commit -m "Add email notification system for all payment services"

# Push to repository
git push origin main
```

#### Step 2: SSH to Production Server
```bash
ssh your-user@your-server-ip
# OR use PuTTY on Windows
```

#### Step 3: Pull Changes on Server
```bash
cd /path/to/imc-production

# Pull latest code
git pull origin main

# Navigate to Docker directory
cd Docker

# Rebuild and restart containers
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Restart services to ensure changes take effect
docker-compose restart backend
```

---

### **Method 2: Using GitHub Actions (If Configured)**

If you have GitHub Actions deployment configured:

```bash
git add .
git commit -m "Add email notification system"
git push origin main
```

Then wait for automatic deployment to complete.

---

### **Method 3: Manual File Upload (Not Recommended)**

If you don't have Git access:

1. **Upload New Files via FTP/SFTP:**
   - Upload `Backend/payments/email_utils.py` to server

2. **Replace Modified Files:**
   - Replace `Backend/api/models.py`
   - Replace `Backend/payments/views.py`
   - Replace `Frontend/imc/src/userDashboard/pages/SingerRegistration.jsx`

3. **Upload Migration File:**
   - Upload `Backend/api/migrations/0039_add_email_to_singer.py`

4. **SSH to Server and Run:**
   ```bash
   cd /path/to/imc-production/Docker
   docker-compose exec backend python manage.py migrate
   docker-compose restart backend frontend
   ```

---

## ✅ Verify Deployment

### 1. Check Server Logs
```bash
# Check backend logs
docker-compose logs -f backend

# Look for email sending messages after payment
```

### 2. Test Payment
1. Go to https://imcpune.in
2. Make a test Studio booking with your email
3. Complete payment
4. Check both:
   - Your email inbox
   - IMCPCMC@gmail.com inbox

### 3. Check for Errors
If emails not received, check:
```bash
# View backend logs
docker-compose logs backend | grep -i email

# Check for errors
docker-compose logs backend | grep -i error
```

---

## 🔍 Troubleshooting

### **Issue: Email Not Received**

#### Check 1: Code Deployed?
```bash
# SSH to server
ssh your-user@server

# Check if email_utils.py exists
ls -la /path/to/imc-production/Backend/payments/email_utils.py

# Should show the file with recent timestamp
```

#### Check 2: Backend Restarted?
```bash
cd /path/to/imc-production/Docker
docker-compose restart backend

# Wait 30 seconds
docker-compose ps
# Backend should show "Up" status
```

#### Check 3: Gmail Credentials Working?
```bash
# Connect to backend container
docker-compose exec backend python manage.py shell

# Test email
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'Testing email configuration',
    'IMCPCMC@gmail.com',
    ['your-test-email@gmail.com'],
    fail_silently=False,
)

# If error appears, check .env file EMAIL_HOST_PASSWORD
```

#### Check 4: Migration Run?
```bash
docker-compose exec backend python manage.py showmigrations api

# Should show:
# [X] 0039_add_email_to_singer
```

---

## 📧 Email Configuration Check

### Verify .env File on Server:
```bash
# On production server
cat /path/to/imc-production/Backend/.env | grep EMAIL

# Should show:
# EMAIL_HOST_USER=IMCPCMC@gmail.com
# EMAIL_HOST_PASSWORD=gors pytc uqwf mnjc
```

### Verify Gmail App Password:
1. The password `gors pytc uqwf mnjc` is a Gmail App Password
2. Make sure it's still valid
3. If not working, generate new one at: https://myaccount.google.com/apppasswords

---

## 🎯 Quick Deploy Commands (All-in-One)

```bash
# On your local machine
cd C:\Users\OWNER\Desktop\imc\imc-production
git add .
git commit -m "Add email notifications for all services"
git push origin main

# On production server (via SSH)
cd /path/to/imc-production
git pull origin main
cd Docker
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose restart backend
```

---

## 📞 Contact Support

If issues persist:
1. Check server logs: `docker-compose logs backend`
2. Check email server connection
3. Verify Gmail App Password is still valid
4. Test email manually from Django shell

---

## ✅ Success Indicators

After successful deployment, you should see:
- ✅ Backend container restarted
- ✅ Migration 0039 applied
- ✅ Payment success triggers email
- ✅ Emails received by user and admin
- ✅ Server logs show "Payment success emails sent for order..."

---

**Remember:** The code is ready and working, it just needs to be deployed to production!
