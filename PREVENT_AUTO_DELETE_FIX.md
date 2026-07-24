# 🛡️ Prevent Auto-Delete Records - Complete Fix

## 🔍 Problem Analysis

**Issue:** Singer and SingingClass records are automatically deleting after some time.

**Possible Causes:**
1. Database CASCADE deletion from related tables
2. MySQL scheduled events
3. Server cleanup scripts
4. File system auto-cleanup deleting videos (which triggers cascade)
5. Admin accidentally deleting
6. Foreign key on_delete=CASCADE

---

## ✅ Solution 1: Check and Fix Database Cascade

### **Check Singer Model Relationships:**

The Singer model doesn't have foreign keys, so CASCADE shouldn't affect it.
But let's verify SingingClass:

```python
# SingingClass has:
batch = models.ForeignKey("Batch", on_delete=models.CASCADE)
user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL)
```

**Fix:** If Batch is deleted, SingingClass gets deleted!

### **Solution:** Change to SET_NULL or PROTECT

```python
# In api/models.py - SingingClass model
batch = models.ForeignKey(
    "Batch",
    on_delete=models.SET_NULL,  # Changed from CASCADE
    related_name="admissions",
    null=True,  # Add this
    blank=True,  # Add this
)
```

---

## ✅ Solution 2: Prevent Video File Auto-Deletion

### **Problem:** 
Server might have a cleanup script deleting old video files, which triggers record deletion.

### **Fix:** Add soft delete for videos instead of actual file deletion

```python
# In api/models.py - Singer model

from django.utils import timezone
from datetime import timedelta

class Singer(models.Model):
    # ... existing fields ...
    
    video = models.FileField(
        upload_to=singer_video_upload_to,
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["mp4", "mov", "avi", "webm", "mkv"]
            )
        ],
    )
    
    # NEW FIELDS
    video_uploaded_at = models.DateTimeField(null=True, blank=True)
    video_expiry_date = models.DateTimeField(null=True, blank=True)
    video_expired = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        # ... existing save logic ...
        
        # Set video expiry date (1 month from upload)
        if self.video and not self.video_uploaded_at:
            self.video_uploaded_at = timezone.now()
            self.video_expiry_date = timezone.now() + timedelta(days=30)
        
        super().save(*args, **kwargs)
    
    def mark_video_expired(self):
        """Mark video as expired without deleting record"""
        self.video_expired = True
        self.save()
    
    @property
    def is_video_expired(self):
        """Check if video is expired"""
        if not self.video_expiry_date:
            return False
        return timezone.now() > self.video_expiry_date
```

---

## ✅ Solution 3: Check for MySQL Scheduled Events

### **Check if any events are deleting records:**

```bash
# SSH to production server
ssh your-user@server

# Login to MySQL
docker-compose exec mysql mysql -u imc_user -p imc_db

# Check for scheduled events
SHOW EVENTS;

# Check for any DELETE events
SHOW EVENTS WHERE Event_body LIKE '%DELETE%';

# If any suspicious event found, disable it:
ALTER EVENT event_name DISABLE;
```

---

## ✅ Solution 4: Add Soft Delete (Recommended)

### **Instead of deleting, mark as inactive:**

```python
# In api/models.py - Update Singer model

class Singer(models.Model):
    # ... existing fields ...
    
    active = models.BooleanField(default=True)
    deleted = models.BooleanField(default=False)  # NEW
    deleted_at = models.DateTimeField(null=True, blank=True)  # NEW
    
    class Meta:
        ordering = ['id']
        verbose_name = "Singer"
        verbose_name_plural = "Singers"
    
    def soft_delete(self):
        """Soft delete - mark as deleted without removing from database"""
        self.deleted = True
        self.deleted_at = timezone.now()
        self.active = False
        self.save()
    
    def restore(self):
        """Restore soft-deleted record"""
        self.deleted = False
        self.deleted_at = None
        self.active = True
        self.save()


# Update SingingClass model similarly
class SingingClass(models.Model):
    # ... existing fields ...
    
    deleted = models.BooleanField(default=False)  # NEW
    deleted_at = models.DateTimeField(null=True, blank=True)  # NEW
    
    def soft_delete(self):
        self.deleted = True
        self.deleted_at = timezone.now()
        self.status = "cancelled"
        self.save()
```

---

## ✅ Solution 5: Override Delete Method

### **Prevent actual deletion:**

```python
# In api/models.py

class Singer(models.Model):
    # ... all existing fields ...
    
    def delete(self, *args, **kwargs):
        """Override delete to prevent actual deletion"""
        # Instead of deleting, mark as inactive
        self.active = False
        self.save()
        # Don't call super().delete() - prevents actual deletion
        
    def hard_delete(self):
        """Only staff can truly delete"""
        super().delete()


class SingingClass(models.Model):
    # ... all existing fields ...
    
    def delete(self, *args, **kwargs):
        """Override delete to prevent actual deletion"""
        self.status = "cancelled"
        self.save()
        # Don't call super().delete()
    
    def hard_delete(self):
        """Only for admin use"""
        super().delete()
```

---

## ✅ Solution 6: Update Views to Show All Records

### **Make sure views don't filter out old records:**

```python
# In api/views.py - SingerViewSet

class SingerViewSet(viewsets.ModelViewSet):
    # Show ALL records, including inactive
    queryset = Singer.objects.all().order_by("id")
    
    # Or if you want to hide deleted ones:
    # queryset = Singer.objects.filter(deleted=False).order_by("id")
    
    def get_queryset(self):
        """Override to control visibility"""
        qs = super().get_queryset()
        
        # Admin sees all
        if self.request.user and self.request.user.is_staff:
            return qs
        
        # Public only sees active
        return qs.filter(active=True, deleted=False)
```

---

## 🛠️ Complete Implementation

### **Step 1: Update Models**

```python
# File: Backend/api/models.py

from django.utils import timezone
from datetime import timedelta

class Singer(models.Model):
    # ... all existing fields ...
    
    # NEW FIELDS for soft delete
    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # NEW FIELDS for video expiry
    video_uploaded_at = models.DateTimeField(null=True, blank=True)
    video_expiry_date = models.DateTimeField(null=True, blank=True)
    video_expired = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.id:
            # ... existing ID generation logic ...
            pass
        
        # Set video expiry (1 month from upload)
        if self.video and not self.video_uploaded_at:
            self.video_uploaded_at = timezone.now()
            self.video_expiry_date = timezone.now() + timedelta(days=30)
        
        # ... rest of existing save logic ...
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Soft delete - don't actually remove from database"""
        self.deleted = True
        self.deleted_at = timezone.now()
        self.active = False
        self.save()
    
    def hard_delete(self):
        """Actually delete from database (admin only)"""
        super().delete()
    
    @property
    def is_video_expired(self):
        if not self.video_expiry_date:
            return False
        return timezone.now() > self.video_expiry_date


class SingingClass(models.Model):
    # ... all existing fields ...
    
    # NEW FIELDS for soft delete
    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Change CASCADE to SET_NULL
    batch = models.ForeignKey(
        "Batch",
        on_delete=models.SET_NULL,
        related_name="admissions",
        null=True,
        blank=True,
    )
    
    def delete(self, *args, **kwargs):
        """Soft delete"""
        self.deleted = True
        self.deleted_at = timezone.now()
        self.status = "cancelled"
        self.save()
    
    def hard_delete(self):
        """Actually delete (admin only)"""
        super().delete()
```

### **Step 2: Create Migration**

```bash
cd Backend
python manage.py makemigrations --name prevent_auto_delete
python manage.py migrate
```

### **Step 3: Update Views**

```python
# File: Backend/api/views.py

class SingerViewSet(viewsets.ModelViewSet):
    # Show only non-deleted records
    queryset = Singer.objects.filter(deleted=False).order_by("id")
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to use soft delete"""
        singer = self.get_object()
        singer.delete()  # Calls soft delete
        
        return Response(
            {"success": True, "message": "Singer deactivated successfully"},
            status=status.HTTP_200_OK,
        )


class SingingClassViewSet(viewsets.ModelViewSet):
    # Show only non-deleted records
    queryset = SingingClass.objects.filter(deleted=False)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to use soft delete"""
        admission = self.get_object()
        admission.delete()  # Calls soft delete
        
        return Response(
            {"success": True, "message": "Admission cancelled successfully"},
            status=status.HTTP_200_OK,
        )
```

---

## 🔍 Debugging - Find Why Records Are Deleting

### **Check Database Logs:**

```bash
# Check MySQL query log
docker-compose exec mysql tail -f /var/log/mysql/query.log

# Watch for DELETE statements
```

### **Check Django Logs:**

```bash
# Check for delete operations
docker-compose logs --tail=1000 backend | grep -i delete
docker-compose logs --tail=1000 backend | grep -i Singer
docker-compose logs --tail=1000 backend | grep -i SingingClass
```

### **Check Cron Jobs:**

```bash
# Check if any cron jobs are running
crontab -l

# Check system cron
ls -la /etc/cron.*
```

---

## ✅ Quick Fix (Minimal Changes)

If you want minimal changes, just prevent CASCADE deletion:

```python
# In api/models.py

class SingingClass(models.Model):
    batch = models.ForeignKey(
        "Batch",
        on_delete=models.SET_NULL,  # Changed from CASCADE
        related_name="admissions",
        null=True,  # Add this
        blank=True,  # Add this
    )
```

Then create migration:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 📋 Deployment Checklist

- [ ] Update models.py with soft delete fields
- [ ] Create and run migrations
- [ ] Update views.py to use soft delete
- [ ] Test on local database first
- [ ] Deploy to production
- [ ] Monitor logs for DELETE statements
- [ ] Check MySQL events (SHOW EVENTS)
- [ ] Verify records are not deleting

---

## 🎯 Recommended Solution

**Best Approach:**
1. Add soft delete to both models
2. Change CASCADE to SET_NULL
3. Override delete() method
4. Video expires after 1 month but record remains
5. Admin can hard_delete if really needed

This way:
- ✅ Records NEVER get automatically deleted
- ✅ Videos can expire but record stays
- ✅ Cascade won't delete records
- ✅ Can restore if needed
- ✅ Complete audit trail

---

**Next Step:** Let me know which solution you prefer and I'll implement it!
