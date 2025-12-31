# User_Dashboard/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone

from api.models import StudioMaster  # use your existing master table


User = settings.AUTH_USER_MODEL


def _list_to_csv(values):
    """
    Store payment methods as CSV string.
    """
    if not values:
        return ""
    if isinstance(values, str):
        return values
    return ",".join(str(v).strip() for v in values if str(v).strip())


def _csv_to_list(value):
    if not value:
        return []
    if isinstance(value, (list, tuple)):
        return list(value)
    return [p.strip() for p in str(value).split(",") if p.strip()]


class UserStudioBooking(models.Model):
    """
    Public / customer booking for a studio.
    This is separate from your admin-side 'Studio' booking if you want.
    """
    PAYMENT_CHOICES = (
        ("Card", "Card"),
        ("UPI", "UPI"),
        ("NetBanking", "Net banking"),
        ("Cash", "Cash"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user_studio_bookings",
        help_text="If the customer is logged in, link the booking to the user account.",
    )

    studio = models.ForeignKey(
        StudioMaster,
        on_delete=models.PROTECT,
        related_name="user_bookings",
        help_text="Studio being booked.",
    )

    # customer details
    customer_name = models.CharField(max_length=120)
    contact_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)

    # booking details
    date = models.DateField()
    time_slot = models.TimeField(help_text="Start time of the booking (24h).")
    duration_hours = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=1.0,
        help_text="Duration in hours, e.g. 1.0, 1.5, 2.0",
    )

    # payment
    payment_methods_csv = models.CharField(
        max_length=200,
        blank=True,
        help_text="Comma-separated payment methods.",
    )
    agreed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Final agreed price (total, not per hour).",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_cancelled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date", "-time_slot", "-created_at"]
        verbose_name = "User studio booking"
        verbose_name_plural = "User studio bookings"

    def __str__(self) -> str:
        return f"{self.customer_name} – {self.studio.name} on {self.date} at {self.time_slot}"

    # helper properties for payment methods
    @property
    def payment_methods(self):
        return _csv_to_list(self.payment_methods_csv)

    @payment_methods.setter
    def payment_methods(self, value):
        self.payment_methods_csv = _list_to_csv(value)

    def clean(self):
        """
        Optional: basic validation at model level (does not check overlaps).
        """
        super().clean()
        if self.date < timezone.localdate():
            # you can allow past bookings if you want – then delete this check
            from django.core.exceptions import ValidationError
            raise ValidationError({"date": "Booking date cannot be in the past."})




