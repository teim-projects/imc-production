from django.db import models


class Payment(models.Model):

    STATUS_CHOICES = (
        ("INITIATED", "Initiated"),
        ("PENDING", "Pending"),
        ("CHARGED", "Charged"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    )

    order_id = models.CharField(max_length=100, unique=True)

    txn_id = models.CharField(max_length=200, blank=True, null=True)
    txn_uuid = models.CharField(max_length=200, blank=True, null=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="INITIATED"
    )

    payment_type = models.CharField(
        max_length=100,
        default="IMC Service"
    )

    reference_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    payment_method = models.CharField(max_length=50, blank=True, null=True)

    payer_vpa = models.CharField(max_length=100, blank=True, null=True)

    raw_response = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_id} - {self.status}"