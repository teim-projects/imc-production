from django.urls import path
from . import views

urlpatterns = [
    path("create-payment/", views.create_payment),
    path("payment/return/", views.payment_return),
    path("check_status/", views.check_status),
    path("status/", views.check_status),   # ✅ ADD THIS LINE
    path("refund/", views.refund_payment),
]