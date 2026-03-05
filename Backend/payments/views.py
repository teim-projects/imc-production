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

# ────────────────────────────────────────────────
#                  CONFIGURATION
# ────────────────────────────────────────────────
BASE_URL = "https://smartgateway.hdfcuat.bank.in"  # Change to production when going live
PAYMENT_PAGE_CLIENT_ID = "hdfcmaster"              # sandbox / UAT value
CUSTOMER_ID = "imc_user_101"
CUSTOMER_EMAIL = "user@imc.com"
CUSTOMER_PHONE = "9999999999"
RETURN_URL = "https://www.imcpune.in/api/payments/payment/return/"
SUCCESS_REDIRECT_BASE = "https://www.imcpune.in/payment-success"


def generate_order_id():
    """Generate unique order ID prefixed with IMC"""
    return f"IMC{uuid.uuid4().hex[:16]}"


# ────────────────────────────────────────────────
# 1. CREATE PAYMENT → Open HDFC payment page
# ────────────────────────────────────────────────
@csrf_exempt
@require_POST
def create_payment(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        amount = Decimal(str(body.get("amount", "1.00")))
        service = body.get("service")
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid amount format"}, status=400)

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

    try:
        resp = requests.post(
            f"{BASE_URL}/session",
            headers=get_headers(CUSTOMER_ID),
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()

        data = resp.json()

        # Save / update payment record
        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "amount": amount,
                "service": service,
                "status": data.get("status", "INITIATED"),
                "raw_response": data,
            }
        )

        # Very important: frontend needs order_id to poll status
        data["order_id"] = order_id

        return JsonResponse(data)

    except requests.RequestException as e:
        return JsonResponse(
            {"error": f"Failed to initiate payment: {str(e)}"},
            status=502
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ────────────────────────────────────────────────
# 2. RETURN URL (user redirected back from HDFC)
# ────────────────────────────────────────────────
@csrf_exempt
def payment_return(request):
    order_id = (
        request.POST.get("order_id")
        or request.GET.get("order_id")
        or request.POST.get("id")
        or request.GET.get("id")
    )

    if not order_id:
        return redirect(f"{SUCCESS_REDIRECT_BASE}?status=failed&reason=no_order_id")

    # Refresh status from gateway
    verify_payment(order_id)

    return redirect(f"{SUCCESS_REDIRECT_BASE}?order_id={order_id}")


# ────────────────────────────────────────────────
# 3. VERIFY PAYMENT STATUS from gateway
# ────────────────────────────────────────────────
def verify_payment(order_id: str) -> str:
    """
    Calls HDFC /orders/{order_id} endpoint and updates DB.
    Returns current status or "FAILED" on error.
    """
    try:
        resp = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers(CUSTOMER_ID),
            timeout=30,
        )
        resp.raise_for_status()

        data = resp.json()
        status_value = data.get("status", "FAILED")

        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "txn_id": data.get("txn_id"),
                "txn_uuid": data.get("txn_uuid"),
                "amount": Decimal(str(data.get("amount", "0"))),
                "status": status_value,
                "payment_method": data.get("payment_method"),
                "payer_vpa": data.get("payer_vpa"),
                "raw_response": data,
            }
        )

        return status_value

    except Exception as e:
        print(f"[verify_payment] {order_id} → error: {str(e)}")
        return "FAILED"


# ────────────────────────────────────────────────
# 4. CHECK STATUS (called by frontend / SPA)
# ────────────────────────────────────────────────
@csrf_exempt
@require_GET
def check_status(request):
    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id is required"}, status=400)

    # Always verify latest status
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
        "amount": float(payment.amount),          # JSON safe
        "payment_method": payment.payment_method,
        "payer_vpa": payment.payer_vpa,
        # "raw_response": payment.raw_response    # usually remove in prod
    })


# ────────────────────────────────────────────────
# 5. WEBHOOK (asynchronous status update from HDFC)
# ────────────────────────────────────────────────
@csrf_exempt
@require_POST
def payment_webhook(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    order_id = data.get("order_id")
    if not order_id:
        return JsonResponse({"error": "Missing order_id in webhook"}, status=400)

    try:
        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "txn_id": data.get("txn_id"),
                "txn_uuid": data.get("txn_uuid"),
                "amount": Decimal(str(data.get("amount", "0"))),
                "status": data.get("status", "UNKNOWN"),
                "payment_method": data.get("payment_method"),
                "payer_vpa": data.get("payer_vpa"),
                "raw_response": data,
            }
        )
        return JsonResponse({"message": "Webhook processed"})
    except Exception as e:
        print(f"[webhook] {order_id} → error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


# ────────────────────────────────────────────────
# 6. REFUND (full refund when amount is empty)
# ────────────────────────────────────────────────
@csrf_exempt
@require_GET   # ← you can change to POST + body if preferred
def refund_payment(request):
    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id is required"}, status=400)

    payload = {
        "unique_request_id": f"REF-{uuid.uuid4().hex[:12]}",
        "amount": ""   # empty → full refund (confirm in API docs!)
        # "amount": "450.00"   # partial refund (example)
    }

    try:
        resp = requests.post(
            f"{BASE_URL}/orders/{order_id}/refunds",
            headers=get_headers(CUSTOMER_ID),
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        return JsonResponse(resp.json())
    except requests.RequestException as e:
        return JsonResponse({"error": f"Refund failed: {str(e)}"}, status=502)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)