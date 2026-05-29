# payments/urls.py

from django.urls import path
from . import views


urlpatterns = [

    # Create payment session
    path("create-payment/", views.create_payment, name="create_payment"),

    # HDFC return URL after payment
    path("payment/return/", views.payment_return, name="payment_return"),

    # Check payment status (used by frontend polling)
    path("check-status/", views.check_status, name="check_status"),

    # HDFC webhook notification
    path("webhook/", views.payment_webhook, name="payment_webhook"),

    # Refund API
    path("refund/", views.refund_payment, name="refund_payment"),
    
   path("report/", views.payment_report, name="payment_report"),


]