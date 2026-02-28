import uuid
import json
import requests
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .utils import get_headers
from .models import Payment

BASE_URL = "https://smartgateway.hdfcuat.bank.in"


def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# =====================================================
# 1️⃣ CREATE PAYMENT
# =====================================================
@csrf_exempt
def create_payment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    body = json.loads(request.body or "{}")
    amount = float(body.get("amount", 1.00))

    order_id = generate_order_id()

    payload = {
        "order_id": order_id,
        "amount": f"{amount:.2f}",
        "customer_id": "imc_user_101",
        "customer_email": "user@imc.com",
        "customer_phone": "9999999999",
        "payment_page_client_id": "hdfcmaster",
        "action": "paymentPage",
        "return_url": "https://www.imcpune.in/api/payments/payment/return/",
        "currency": "INR",
        "description": "IMC Membership Fee"
    }

    try:
        res = requests.post(
            f"{BASE_URL}/session",
            headers=get_headers("imc_user_101"),
            json=payload,
            timeout=30
        )

        data = res.json()

        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "amount": amount,
                "status": data.get("status", "INITIATED"),
                "raw_response": data
            }
        )

        data["order_id"] = order_id
        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# 2️⃣ RETURN URL (AUTO VERIFY)
# =====================================================
@csrf_exempt
def payment_return(request):

    order_id = request.POST.get("order_id")

    if not order_id:
        return redirect("https://www.imcpune.in/payment-success?status=failed")

    # 🔥 Verify payment after redirect
    verify_payment(order_id)

    return redirect(
        f"https://www.imcpune.in/payment-success?order_id={order_id}"
    )


# =====================================================
# 3️⃣ VERIFY PAYMENT (CORE LOGIC)
# =====================================================
def verify_payment(order_id):
    try:
        res = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers("imc_user_101"),
            timeout=30
        )

        data = res.json()

        status_value = data.get("status", "FAILED")

        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "txn_id": data.get("txn_id"),
                "txn_uuid": data.get("txn_uuid"),
                "amount": float(data.get("amount", 0)),
                "status": status_value,
                "payment_method": data.get("payment_method"),
                "payer_vpa": data.get("payer_vpa"),
                "raw_response": data
            }
        )

        return status_value

    except Exception as e:
        print("Verify Error:", str(e))
        return "FAILED"


# =====================================================
# 4️⃣ CHECK STATUS (MANUAL API)
# =====================================================
@csrf_exempt
def check_status(request):
    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    status_value = verify_payment(order_id)

    return JsonResponse({
        "order_id": order_id,
        "status": status_value
    })


# =====================================================
# 5️⃣ WEBHOOK (MOST IMPORTANT)
# =====================================================
@csrf_exempt
def payment_webhook(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)

        order_id = data.get("order_id")
        status_value = data.get("status")

        if order_id:
            Payment.objects.update_or_create(
                order_id=order_id,
                defaults={
                    "txn_id": data.get("txn_id"),
                    "txn_uuid": data.get("txn_uuid"),
                    "amount": float(data.get("amount", 0)),
                    "status": status_value,
                    "payment_method": data.get("payment_method"),
                    "payer_vpa": data.get("payer_vpa"),
                    "raw_response": data
                }
            )

        return JsonResponse({"message": "Webhook processed"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# 6️⃣ REFUND
# =====================================================
@csrf_exempt
def refund_payment(request):
    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payload = {
        "unique_request_id": f"REFUND{uuid.uuid4().hex[:10]}",
        "amount": ""
    }

    try:
        res = requests.post(
            f"{BASE_URL}/orders/{order_id}/refunds",
            headers=get_headers("imc_user_101"),
            json=payload,
            timeout=30
        )

        return JsonResponse(res.json(), safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)





localhost:8000