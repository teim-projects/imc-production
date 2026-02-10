from django.urls import path
from .views import (
    create_payment,
    payment_return,
    check_status,
    refund_payment,
)

urlpatterns = [
    path("create-payment/", create_payment),
    path("payment/return/", payment_return),
    path("status/", check_status),
    path("refund/", refund_payment),
]
