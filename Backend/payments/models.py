# payments/models.py

from django.db import models


class Payment(models.Model):

    STATUS_CHOICES = (
        ("INITIATED", "Initiated"),
        ("PENDING", "Pending"),
        ("CHARGED", "Charged"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    )

    PAYMENT_TYPE_CHOICES = (
        ("studio_booking", "Studio Booking"),
        ("singing_classes", "Singing Classes"),
        ("auditorium_music_shows", "Auditorium Music Shows"),
        ("private_music_events", "Private Music Events"),
        ("photography_service", "Photography Service"),
        ("videography_service", "Videography Service"),
        ("sound_system_service", "Sound System Service"),
        ("singer_management", "Singer Management"),
    )

    id = models.AutoField(primary_key=True)

    order_id = models.CharField(max_length=100, unique=True)
    txn_id = models.CharField(max_length=200, blank=True, null=True)
    txn_uuid = models.CharField(max_length=200, blank=True, null=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="INITIATED"
    )

    # NEW FIELD
    payment_type = models.CharField(
        max_length=100,
        choices=PAYMENT_TYPE_CHOICES,
        blank=True,
        null=True
    )

    # NEW FIELD
    reference_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payer_vpa = models.CharField(max_length=100, null=True, blank=True)

    raw_response = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_id} - {self.status}"