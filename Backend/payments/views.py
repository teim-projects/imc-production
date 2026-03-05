import uuid
import json
import requests
from decimal import Decimal
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .utils import get_headers
from .models import Payment


BASE_URL = "https://smartgateway.hdfcuat.bank.in"

PAYMENT_PAGE_CLIENT_ID = "hdfcmaster"

CUSTOMER_ID = "imc_user_101"
CUSTOMER_EMAIL = "user@imc.com"
CUSTOMER_PHONE = "9999999999"

RETURN_URL = "https://www.imcpune.in/api/payments/payment/return/"
SUCCESS_REDIRECT_BASE = "https://www.imcpune.in/payment-success"


def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# CREATE PAYMENT

@csrf_exempt
@require_POST
def create_payment(request):

    body = json.loads(request.body)

    amount = Decimal(str(body.get("amount")))
    service = body.get("service")

    order_id = generate_order_id()

    payload = {
        "order_id": order_id,
        "amount": f"{amount:.2f}",
        "customer_id": CUSTOMER_ID,
        "customer_email": CUSTOMER_EMAIL,
        "customer_phone": CUSTOMER_PHONE,
        "payment_page_client_id": PAYMENT_PAGE_CLIENT_ID,
        "action": "paymentPage",
        "return_url": RETURN_URL,
        "currency": "INR",
        "description": f"Payment for {service}",
    }

    resp = requests.post(
        f"{BASE_URL}/session",
        headers=get_headers(CUSTOMER_ID),
        json=payload,
        timeout=30,
    )

    data = resp.json()

    Payment.objects.create(
        order_id=order_id,
        amount=amount,
        service=service,
        status=data.get("status", "INITIATED"),
        raw_response=data,
    )

    data["order_id"] = order_id

    return JsonResponse(data)


# RETURN URL

@csrf_exempt
def payment_return(request):

    order_id = (
        request.GET.get("order_id")
        or request.POST.get("order_id")
        or request.GET.get("id")
    )

    if not order_id:
        return redirect(f"{SUCCESS_REDIRECT_BASE}?status=failed")

    verify_payment(order_id)

    return redirect(f"{SUCCESS_REDIRECT_BASE}?order_id={order_id}")


# VERIFY PAYMENT

def verify_payment(order_id):

    resp = requests.get(
        f"{BASE_URL}/orders/{order_id}",
        headers=get_headers(CUSTOMER_ID),
        timeout=30,
    )

    data = resp.json()

    payment = Payment.objects.filter(order_id=order_id).first()

    if payment:

        payment.txn_id = data.get("txn_id")
        payment.txn_uuid = data.get("txn_uuid")
        payment.amount = Decimal(str(data.get("amount", payment.amount)))
        payment.status = data.get("status", payment.status)
        payment.payment_method = data.get("payment_method")
        payment.payer_vpa = data.get("payer_vpa")
        payment.raw_response = data

        payment.save()

        return payment.status

    return "FAILED"


# CHECK STATUS

@csrf_exempt
@require_GET
def check_status(request):

    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    verify_payment(order_id)

    payment = Payment.objects.filter(order_id=order_id).first()

    if not payment:
        return JsonResponse({"error": "Payment not found"}, status=404)

    return JsonResponse({
        "success": payment.status == "CHARGED",
        "order_id": payment.order_id,
        "service": payment.service,
        "status": payment.status,
        "txn_id": payment.txn_id,
        "txn_uuid": payment.txn_uuid,
        "amount": float(payment.amount),
        "payment_method": payment.payment_method,
        "payer_vpa": payment.payer_vpa
    })


# WEBHOOK

@csrf_exempt
@require_POST
def payment_webhook(request):

    data = json.loads(request.body)

    order_id = data.get("order_id")

    payment = Payment.objects.filter(order_id=order_id).first()

    if payment:

        payment.txn_id = data.get("txn_id")
        payment.txn_uuid = data.get("txn_uuid")
        payment.amount = Decimal(str(data.get("amount", payment.amount)))
        payment.status = data.get("status", payment.status)
        payment.payment_method = data.get("payment_method")
        payment.payer_vpa = data.get("payer_vpa")
        payment.raw_response = data

        payment.save()

    return JsonResponse({"message": "Webhook processed"})


# REFUND

@csrf_exempt
@require_GET
def refund_payment(request):

    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payload = {
        "unique_request_id": f"REF-{uuid.uuid4().hex[:12]}",
        "amount": ""
    }

    resp = requests.post(
        f"{BASE_URL}/orders/{order_id}/refunds",
        headers=get_headers(CUSTOMER_ID),
        json=payload,
        timeout=30,
    )

    return JsonResponse(resp.json())