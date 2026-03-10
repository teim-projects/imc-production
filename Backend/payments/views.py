import uuid
import json
from decimal import Decimal, InvalidOperation
import requests

from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .utils import get_headers
from .models import Payment
from api.models import SingingClass, SingerRegistration, StudioBooking   # ← add other models

# ────────────────────────────────────────────────
#              Configuration
# ────────────────────────────────────────────────

BASE_URL = "https://smartgateway.hdfcuat.bank.in"
PAYMENT_PAGE_CLIENT_ID = "hdfcmaster"

CUSTOMER_ID = "imc_user_101"
CUSTOMER_EMAIL = "user@imc.com"
CUSTOMER_PHONE = "9999999999"

RETURN_URL = "https://www.imcpune.in/api/payments/payment/return/"
SUCCESS_REDIRECT_BASE = "https://www.imcpune.in/payment-success"


# ────────────────────────────────────────────────
#              Helpers
# ────────────────────────────────────────────────

def generate_order_id() -> str:
    return f"IMC{uuid.uuid4().hex[:16].upper()}"


SERVICE_MODEL_MAP = {
    "singing_classes":     SingingClass,
    "singer_registration": SingerRegistration,
    "studio_booking":      StudioBooking,
}

SERVICE_FEE_FIELD_MAP = {
    "singing_classes":     "fee",
    "singer_registration": "annual_fee",
    "studio_booking":      "amount",       # or whatever your field is called
}


def get_amount_from_registration(service: str, registration_id: str) -> Decimal:
    if service not in SERVICE_MODEL_MAP:
        raise ValueError(f"Unsupported service: {service}")

    model_class = SERVICE_MODEL_MAP[service]
    fee_field   = SERVICE_FEE_FIELD_MAP[service]

    try:
        reg_id = int(registration_id)
        registration = model_class.objects.get(id=reg_id)
    except (ValueError, TypeError):
        raise ValueError("registration_id must be a valid integer")
    except model_class.DoesNotExist:
        raise ValueError(f"{service.replace('_', ' ').title()} registration not found")

    try:
        raw_amount = getattr(registration, fee_field)
        amount = Decimal(str(raw_amount))
    except (AttributeError, InvalidOperation, TypeError):
        raise ValueError(f"Invalid/missing {fee_field} in registration")

    if amount <= 0:
        raise ValueError("Amount must be greater than zero")

    return amount


# ────────────────────────────────────────────────
#              CREATE PAYMENT
# ────────────────────────────────────────────────

@csrf_exempt
@require_POST
def create_payment(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    registration_id = body.get("registration_id")
    service         = body.get("service")

    if not registration_id or not service:
        return JsonResponse(
            {"error": "Both registration_id and service are required"},
            status=400
        )

    try:
        amount = get_amount_from_registration(service, registration_id)
    except ValueError as ve:
        return JsonResponse({"error": str(ve)}, status=400)

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
        "description": f"Payment for {service.replace('_', ' ').title()}",
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
    except requests.RequestException as e:
        return JsonResponse(
            {"error": f"Payment gateway error: {str(e)}"},
            status=502
        )

    Payment.objects.create(
        order_id=order_id,
        registration_id=registration_id,   # ← very useful to store!
        amount=amount,
        service=service,
        status=data.get("status", "INITIATED"),
        raw_response=data
    )

    data["order_id"] = order_id
    return JsonResponse(data)


# ────────────────────────────────────────────────
#              VERIFY PAYMENT (used by multiple endpoints)
# ────────────────────────────────────────────────

def verify_payment(order_id: str) -> str:
    try:
        resp = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers(CUSTOMER_ID),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"Verify failed (network/gateway): {order_id} → {e}")
        return "FAILED"

    payment = Payment.objects.filter(order_id=order_id).first()
    if not payment:
        return "NOT_FOUND"

    try:
        gateway_amount = Decimal(str(data.get("amount", "0")))
    except (InvalidOperation, TypeError):
        gateway_amount = Decimal("0")

    if gateway_amount != payment.amount:
        print(f"SECURITY ALERT: Amount mismatch for {order_id}")
        payment.status = "FAILED"
        payment.raw_response = data
        payment.save()
        return "FAILED"

    payment.txn_id        = data.get("txn_id")
    payment.txn_uuid      = data.get("txn_uuid")
    payment.status        = data.get("status", "FAILED")
    payment.payment_method = data.get("payment_method")
    payment.payer_vpa     = data.get("payer_vpa")
    payment.raw_response  = data
    payment.save()

    return payment.status


# ────────────────────────────────────────────────
#              PAYMENT RETURN (browser redirect from gateway)
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

    status = verify_payment(order_id)

    params = f"order_id={order_id}&status={status.lower()}"
    if status == "CHARGED":
        return redirect(f"{SUCCESS_REDIRECT_BASE}?{params}")
    else:
        return redirect(f"{SUCCESS_REDIRECT_BASE}?{params}&failed=1")


# ────────────────────────────────────────────────
#              CHECK STATUS (for frontend polling)
# ────────────────────────────────────────────────

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
        "amount": float(payment.amount),
        "txn_id": payment.txn_id,
        "txn_uuid": payment.txn_uuid,
        "payment_method": payment.payment_method,
        "payer_vpa": payment.payer_vpa,
    })


# ────────────────────────────────────────────────
#              WEBHOOK (server-to-server notification)
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
        return JsonResponse({"error": "Missing order_id"}, status=400)

    # TODO: IMPORTANT ─ Add real signature / HMAC verification here!
    # Example (pseudo):
    # if not verify_webhook_signature(request.headers, request.body):
    #     return JsonResponse({"error": "Invalid signature"}, status=401)

    payment = Payment.objects.filter(order_id=order_id).first()
    if not payment:
        return JsonResponse({"message": "Order not found – ignored"}, status=200)

    try:
        gateway_amount = Decimal(str(data.get("amount", "0")))
    except (InvalidOperation, TypeError):
        gateway_amount = Decimal("0")

    if gateway_amount != payment.amount:
        payment.status = "FAILED"
        payment.raw_response = data
        payment.save()
        return JsonResponse({"error": "Amount mismatch"}, status=400)

    payment.txn_id         = data.get("txn_id")
    payment.txn_uuid       = data.get("txn_uuid")
    payment.status         = data.get("status", "UNKNOWN")
    payment.payment_method = data.get("payment_method")
    payment.payer_vpa      = data.get("payer_vpa")
    payment.raw_response   = data
    payment.save()

    return JsonResponse({"message": "Webhook processed"})


# ────────────────────────────────────────────────
#              REFUND PAYMENT
# ────────────────────────────────────────────────

@csrf_exempt
@require_POST   # better to use POST for refund (idempotency possible)
def refund_payment(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    order_id = body.get("order_id")
    refund_amount_str = body.get("amount")   # optional – blank = full refund

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payment = Payment.objects.filter(order_id=order_id).first()
    if not payment:
        return JsonResponse({"error": "Payment not found"}, status=404)

    if payment.status != "CHARGED":
        return JsonResponse({"error": "Only CHARGED payments can be refunded"}, status=400)

    refund_amount = payment.amount
    if refund_amount_str:
        try:
            refund_amount = Decimal(refund_amount_str)
            if refund_amount <= 0 or refund_amount > payment.amount:
                return JsonResponse({"error": "Invalid refund amount"}, status=400)
        except InvalidOperation:
            return JsonResponse({"error": "Invalid amount format"}, status=400)

    payload = {
        "unique_request_id": f"REF-{uuid.uuid4().hex[:12].upper()}",
        # "amount": f"{refund_amount:.2f}",   # many gateways expect it as string
    }

    # If partial refund is supported → include amount
    # Comment/uncomment depending on your gateway docs
    # payload["amount"] = f"{refund_amount:.2f}"

    try:
        resp = requests.post(
            f"{BASE_URL}/orders/{order_id}/refunds",
            headers=get_headers(CUSTOMER_ID),
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        refund_data = resp.json()

        # Optionally update Payment model with refund info
        # payment.refund_status = refund_data.get("status", "INITIATED")
        # payment.refund_id = refund_data.get("refund_id")
        # payment.save()

        return JsonResponse({
            "success": True,
            "refund_response": refund_data
        })

    except requests.RequestException as e:
        return JsonResponse(
            {"error": f"Refund failed: {str(e)}"},
            status=502
        )