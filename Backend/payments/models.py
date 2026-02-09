from django.db import models

class Payment(models.Model):
    order_id = models.CharField(max_length=100, unique=True)
    txn_id = models.CharField(max_length=200)
    txn_uuid = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=50)
    payer_vpa = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id
