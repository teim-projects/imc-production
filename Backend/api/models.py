# api/models.py
from decimal import Decimal
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

# ============================================================
# ===============  UTIL / LEGACY MIGRATION HOOK  =============
# ============================================================

def upload_image_to(instance, filename):
    """
    Legacy helper retained so older migrations that reference
    api.models.upload_image_to continue to work.
    """
    return f"uploads/{filename}"

def user_profile_path(instance, filename):
    # e.g. media/profiles/42/avatar.png
    uid = instance.pk or "tmp"
    return f"profiles/{uid}/{filename}"


# ============================================================
# ===============  CUSTOM USER MODEL SECTION  ================
# ============================================================

class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, mobile_no=None, password=None, **extra_fields):
        if not email and not mobile_no:
            raise ValueError("User must have either an email or mobile number")

        if email:
            email = self.normalize_email(email)
            extra_fields["email"] = email

        user = self.model(mobile_no=mobile_no, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, mobile_no, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, mobile_no, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("staff", "Staff"),
        ("customer", "Customer"),
    )

    username = None
    email = models.EmailField(unique=True, blank=True, null=True)
    mobile_no = models.CharField(max_length=15, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="customer")

    # Use a deterministic folder per user
    profile_photo = models.ImageField(upload_to=user_profile_path, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["mobile_no"]

    def __str__(self):
        return self.email if self.email else str(self.mobile_no)


# ============================================================
# ===================== STUDIO MASTER ========================
# ============================================================
# api/models.py
# api/models.py
from decimal import Decimal
from django.db import models

def studio_image_path(instance, filename):
    sid = getattr(instance.studio, "id", "tmp")
    return f"uploads/studios/{sid}/{filename}"

class StudioMaster(models.Model):
    name = models.CharField(max_length=120, unique=True)
    location = models.CharField(max_length=160, blank=True)
    area = models.CharField(max_length=160, blank=True, help_text="Area / locality (e.g., Andheri East)")
    city = models.CharField(max_length=120, blank=True, help_text="City (e.g., Mumbai)")
    state = models.CharField(max_length=120, blank=True, help_text="State (e.g., Maharashtra)")
    google_map_link = models.URLField(max_length=500, blank=True, help_text="Optional Google Maps URL")
    capacity = models.PositiveIntegerField(blank=True, null=True, help_text="Number of people the studio can hold")
    size_sq_ft = models.CharField(max_length=40, blank=True, help_text="Studio size in square feet (e.g., 1200). Stored as text")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return self.name

    @property
    def full_location(self):
        parts = []
        if self.area:
            parts.append(self.area)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if parts:
            return ", ".join(parts)
        return self.location or ""


class StudioImage(models.Model):
    studio = models.ForeignKey(StudioMaster, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=studio_image_path)
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "-uploaded_at"]
        indexes = [
            models.Index(fields=["studio"]),
            models.Index(fields=["is_primary"]),
        ]

    def __str__(self):
        return f"Image {self.pk} for studio {getattr(self.studio, 'id', '?')}"


# ============================================================
# ===================== STUDIO BOOKING =======================
# ============================================================

class Studio(models.Model):
    # Customer Info
    customer = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Studio Rental (kept as a plain name to preserve old data)
    studio_name = models.CharField(max_length=100)
    date = models.DateField()
    time_slot = models.TimeField(blank=True, null=True)  # "HH:MM" accepted
    duration = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(Decimal("0.5"))],
        help_text="Duration in hours",
    )

    # Payment Options (CSV; API can expose list)
    payment_methods = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Comma-separated: Card, UPI, NetBanking",
    )

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Studio Booking"
        verbose_name_plural = "Studio Bookings"
        ordering = ["-date", "-time_slot"]
        constraints = [
            models.UniqueConstraint(
                fields=["studio_name", "date", "time_slot"],
                name="uniq_studio_date_timeslot",
            ),
        ]
        indexes = [
            models.Index(fields=["date", "time_slot"]),
            models.Index(fields=["studio_name"]),
        ]

    def __str__(self):
        return f"{self.studio_name} | {self.customer} | {self.date}"

    @property
    def payment_list(self):
        if not self.payment_methods:
            return []
        s = (self.payment_methods or "").strip()
        if not s:
            return []
        if "," not in s:
            return [s]
        return [x.strip() for x in s.split(",") if x.strip()]




# ============================================================
# ===================== STUDIO BOOKING =======================
# ============================================================
from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator

class Studio(models.Model):
    # Customer Info
    customer = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    studio_name = models.CharField(max_length=100)
    date = models.DateField()
    time_slot = models.TimeField(blank=True, null=True)
    duration = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(Decimal("0.5"))],
        help_text="Duration in hours",
    )

    price_per_hour = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Price per hour in INR for this booking",
    )

    payment_methods = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Comma-separated: Card, UPI, NetBanking",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Studio Booking"
        verbose_name_plural = "Studio Bookings"
        ordering = ["-date", "-time_slot"]
        constraints = [
            models.UniqueConstraint(
                fields=["studio_name", "date", "time_slot"],
                name="uniq_studio_date_timeslot",
            ),
        ]
        indexes = [
            models.Index(fields=["date", "time_slot"]),
            models.Index(fields=["studio_name"]),
        ]

    def __str__(self):
        return f"{self.studio_name} | {self.customer} | {self.date}"

    @property
    def payment_list(self):
        if not self.payment_methods:
            return []
        s = (self.payment_methods or "").strip()
        if not s:
            return []
        if "," not in s:
            return [s]
        return [x.strip() for x in s.split(",") if x.strip()]

    @property
    def total_price(self):
        if self.price_per_hour is None or self.duration is None:
            return None
        return self.price_per_hour * self.duration


# ============================================================
# ================== PRIVATE BOOKING MODEL ===================
# ============================================================

class PrivateBooking(models.Model):
    # Customer info
    customer = models.CharField(max_length=120)
    contact_number = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Event details
    event_type = models.CharField(max_length=120)   # Birthday / Wedding / Corporate / Party
    venue = models.CharField(max_length=160)

    # Schedule
    date = models.DateField()
    time_slot = models.TimeField(blank=True, null=True)
    duration = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal("0.1"))])

    # Extras
    guest_count = models.PositiveIntegerField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Store checkbox array as JSON (works perfectly with React list)
    payment_methods = models.JSONField(default=list, blank=True)

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-time_slot"]
        indexes = [
            models.Index(fields=["date", "time_slot"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["venue"]),
        ]

    def __str__(self):
        return f"{self.customer} • {self.event_type} • {self.date}"


# ============================================================
# ===================== PHOTOGRAPHY (OLD NAMES) ==============
# ============================================================
from django.db import models
from django.conf import settings


class PhotographyBooking(models.Model):
    client = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)

    # Event
    event_type = models.CharField(max_length=100)
    event_type_other = models.CharField(max_length=200, blank=True, null=True)

    # Package
    package_type = models.CharField(max_length=100)
    package_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Add-on
    addon_name = models.CharField(max_length=200, blank=True, null=True)
    addon_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Schedule
    date = models.DateField()
    start_time = models.TimeField()
    duration_hours = models.IntegerField(default=1)
    location = models.CharField(max_length=255)

    photographers_count = models.IntegerField(default=1)

    # Options
    drone_needed = models.BooleanField(default=False)
    equipment_needed = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Payment
    payment_methods_list = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="photo_bookings"
    )

    def __str__(self):
        return f"{self.client} – {self.event_type}"



# ============================================================
# ===================== EVENT MODEL ==========================
# ============================================================
# api/models.py
from django.db import models
from django.conf import settings

CustomUser = settings.AUTH_USER_MODEL


class Event(models.Model):
    EVENT_TYPES = [
        ("live", "Live"),
        ("karaoke", "Karaoke"),
    ]

    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    date = models.DateField()

    # Time slot for the event (e.g. "18:00 - 20:00")
    time_slot = models.CharField(
        max_length=50,
        help_text="Time slot for the event, e.g. '18:00 - 20:00'.",
    )

    # Live / Karaoke
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPES,
        default="live",
    )

    # ⭐ Seats (overall)
    total_seats = models.PositiveIntegerField(
        default=0,
        help_text="Total seats for this event.",
    )
    available_seats = models.PositiveIntegerField(
        default=0,
        help_text="Seats remaining for bookings.",
    )

    # ⭐ Seats per ticket tier (optional)
    basic_seats = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Seats allocated for Basic tickets (optional).",
    )
    premium_seats = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Seats allocated for Premium tickets (optional).",
    )
    vip_seats = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Seats allocated for VIP tickets (optional).",
    )

    # OLD general price (optional now)
    ticket_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Legacy general ticket price (optional).",
    )

    # New tier prices (all optional)
    basic_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Basic ticket price (₹).",
    )
    premium_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Premium ticket price (₹).",
    )
    vip_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="VIP ticket price (₹).",
    )

    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "time_slot", "-created_at"]

    def save(self, *args, **kwargs):
        """
        On first create:
        - If available_seats is not set, default it to total_seats
        (tier seats are optional and only used for UI / reporting).
        """
        if self.pk is None and (self.available_seats is None or self.available_seats == 0):
            self.available_seats = self.total_seats
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()}) @ {self.date} {self.time_slot or ''}"


class EventBooking(models.Model):
    """
    Stores a user's booking for a specific event.
    Supports ticket type (basic/premium/vip/general) and payment method.
    """

    PAYMENT_METHODS = [
        ("UPI", "UPI"),
        ("Card", "Card"),
        ("Cash", "Cash"),
    ]

    TICKET_TYPE_CHOICES = [
        ("basic", "Basic"),
        ("premium", "Premium"),
        ("vip", "VIP"),
        ("general", "General"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_bookings",
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    # snapshot so even if event title changes, booking still shows old name
    event_name = models.CharField(max_length=255, blank=True)

    customer_name = models.CharField(max_length=120)
    contact_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)

    ticket_type = models.CharField(
        max_length=20,
        choices=TICKET_TYPE_CHOICES,
        default="general",
    )

    number_of_tickets = models.PositiveIntegerField(default=1)

    # ⭐ NEW: store seat ids like ["premium-1-02", "premium-1-03"]
    seat_numbers = models.JSONField(
        default=list,
        blank=True,
        help_text="List of seat ids for this booking (e.g. ['vip-1-01','vip-1-02']).",
    )

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHODS,
        default="UPI",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer_name} • {self.event_name or self.event.title} ({self.number_of_tickets} tickets)"

# ============================================================
# ===================== PAYMENT MODEL ========================
# ============================================================

class Payment(models.Model):
    PAYMENT_METHODS = [
        ("Card", "Credit/Debit Card"),
        ("UPI", "UPI"),
        ("NetBanking", "Net Banking"),
        ("Cash", "Cash"),
    ]
    customer = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    method = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    date = models.DateField(auto_now_add=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["method"]),
        ]

    def __str__(self):
        return f"{self.customer} - ₹{self.amount} via {self.method}"


# ============================================================
# ===================== VIDEOGRAPHY MODEL ====================
# ============================================================

# videography/models.py
from decimal import Decimal
from django.db import models
from django.conf import settings  # remove if you don't want user FK


class Videography(models.Model):
    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Card", "Card"),
        ("UPI", "UPI"),
    ]

    PACKAGE_CHOICES = [
        ("Standard", "Standard"),
        ("Premium", "Premium"),
        ("Custom", "Custom"),
    ]

    # ✅ Event type choices (matching your frontend dropdown)
    EVENT_TYPE_CHOICES = [
        ("theatre music events", "theatre music events"),
        ("private music events", "private music events"),
        ("Birthday", "Birthday"),
        ("Other", "Other"),
    ]

    # Basic client info
    client_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    mobile_no = models.CharField(max_length=20, blank=True)

    # Core job fields
    project = models.CharField(max_length=150)   # Event / project name
    editor = models.CharField(max_length=120)
    shoot_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)

    # HOURS (non-null with default)
    duration_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("1.00"),
        help_text="Duration in hours (e.g. 1.50 = 1h 30m)",
    )

    # Extra
    location = models.CharField(max_length=150, blank=True)

    package_type = models.CharField(
        max_length=20,
        choices=PACKAGE_CHOICES,
        default="Standard",
    )

    # ✅ Package Price stored in DB
    package_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Package price in INR",
    )

    # ✅ NEW: Event type (optional) – ties to your frontend dropdown
    event_type = models.CharField(
        max_length=50,
        choices=EVENT_TYPE_CHOICES,
        blank=True,
        default="",
        help_text="Type of event (theatre music events, private music events, Birthday, Other)",
    )

    # ✅ NEW: Other event name (when event_type = 'Other')
    other_event_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Custom event name when event_type is 'Other'",
    )

    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_CHOICES,
        default="Cash",
    )

    notes = models.TextField(blank=True)

    # Optional: who created this booking
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="videography_entries",
    )

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-shoot_date", "-created_at")

    def __str__(self):
        # If "Other", show the custom name in brackets
        extra = ""
        if self.event_type == "Other" and self.other_event_name:
            extra = f" [{self.other_event_name}]"
        elif self.event_type:
            extra = f" ({self.event_type})"
        return f"{self.project}{extra} — {self.editor} ({self.shoot_date})"



# ===============================================
# ============  SOUND SYSTEM (SERVICE)  =========
# ===============================================

class Sound(models.Model):
    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Card", "Card"),
        ("UPI", "UPI"),
    ]
    client_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)
    mobile_no = models.CharField(max_length=20, blank=True, null=True)
    event_date = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)

    system_type = models.CharField(max_length=120, blank=True, null=True)   # e.g., PA, DJ, Live
    speakers_count = models.PositiveIntegerField(default=0)
    microphones_count = models.PositiveIntegerField(default=0)
    mixer_model = models.CharField(max_length=120, blank=True, null=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default="Cash")
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.client_name} - {self.system_type or 'Sound'}"

# Temporary alias for legacy imports
SoundSetup = Sound






# ===============================================
# ============  Singer (SERVICE)  =========
# ===============================================
import os
import uuid
import re
from datetime import date
from django.db import models, transaction
from django.db.models import Q


# --------------------------------------------------
# IMAGE UPLOAD HELPERS (DO NOT DELETE)
# --------------------------------------------------
def singer_photo_upload_to(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join("singers", filename)


def singer_upload_to(instance, filename):
    return singer_photo_upload_to(instance, filename)


# --------------------------------------------------
# SINGER MODEL
# --------------------------------------------------
class Singer(models.Model):

    # ✅ STRING PRIMARY KEY
    id = models.CharField(
        max_length=20,
        primary_key=True,
        editable=False
    )

    name = models.CharField(max_length=255)
    birth_date = models.DateField(null=True, blank=True)
    mobile = models.CharField(max_length=20, blank=True, default="")
    profession = models.CharField(max_length=200, blank=True, default="")
    education = models.CharField(max_length=300, blank=True, default="")
    achievement = models.TextField(blank=True, default="")
    favourite_singer = models.CharField(max_length=200, blank=True, default="")
    reference_by = models.CharField(max_length=200, blank=True, default="")
    genre = models.CharField(max_length=100, blank=True, default="")
    experience = models.PositiveIntegerField(null=True, blank=True)

    area = models.CharField(max_length=200, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")

    rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True,
        default=""
    )

    active = models.BooleanField(default=True)
    photo = models.ImageField(upload_to=singer_photo_upload_to, null=True, blank=True)

    # ✅ DATE ONLY (AUTO HANDLED)
    created_at = models.DateField(editable=False)
    updated_at = models.DateField(editable=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Singer"
        verbose_name_plural = "Singers"

    # --------------------------------------------------
    # SAFE AUTO-ID + DATE LOGIC (NO DUPLICATES EVER)
    # --------------------------------------------------
    def save(self, *args, **kwargs):

        # 🔐 AUTO ID ONLY FOR NEW RECORD
        if not self.id:
            with transaction.atomic():
                ids = (
                    Singer.objects
                    .select_for_update()
                    .filter(id__startswith="IMC/SM-")
                    .exclude(Q(id="") | Q(id__isnull=True))
                    .values_list("id", flat=True)
                )

                max_num = 0
                for i in ids:
                    match = re.search(r"IMC/SM-(\d+)$", i)
                    if match:
                        max_num = max(max_num, int(match.group(1)))

                self.id = f"IMC/SM-{max_num + 1:03d}"

        # 📅 DATE ONLY AUTO
        if not self.created_at:
            self.created_at = date.today()

        self.updated_at = date.today()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.name}"

# ===============================================
# ============  Singing (SERVICE)  =========
# ===============================================
# api/models.py
from django.db import models
from django.core.validators import MinValueValidator


class SingingClass(models.Model):
    class PaymentMethod(models.TextChoices):
        CARD = "card", "Card"
        UPI = "upi", "UPI"
        NETBANKING = "netbanking", "NetBanking"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    # 🔥 IMPORTANT FIX
    batch = models.ForeignKey(
        "Batch",
        on_delete=models.CASCADE,
        related_name="admissions"
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20)

    email = models.EmailField(blank=True, null=True)

    address1 = models.CharField(max_length=255, blank=True)
    address2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )

    agreed_terms = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.batch}"





# api/models.py
from django.db import models

class Trainer(models.Model):
    trainer_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    batch_day = models.CharField(max_length=20)
    batch_start_time = models.TimeField()
    batch_end_time = models.TimeField()
    fee = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.trainer_name





# app/models.py
class Teacher(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return self.name


class Class(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    trainer = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="classes"
    )

    def __str__(self):
        return self.name


class Batch(models.Model):
    DAY_CHOICES = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    ]

    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="batches"
    )

    trainer = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="batches"
    )

    day = models.CharField(max_length=20, choices=DAY_CHOICES)
    time_slot = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.class_obj.name} - {self.day} {self.time_slot}"
