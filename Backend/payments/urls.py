from django.urls import path
from . import views

urlpatterns = [
    path("create-payment/", views.create_payment),
    path("payment/return/", views.payment_return),
    path("check-status/", views.check_status),
    path("webhook/", views.payment_webhook),
    path("refund/", views.refund_payment),
]