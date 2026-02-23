import uuid
import json
import requests
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from .utils import get_headers

BASE_URL = "https://smartgateway.hdfcuat.bank.in"  # SANDBOX


def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# ==============================
# 1️⃣ CREATE PAYMENT LINK
# ==============================
@csrf_exempt
def create_payment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    body = json.loads(request.body) if request.body else {}
    amount = body.get("amount", 1.00)

    order_id = generate_order_id()

    payload = {
        "order_id": order_id,
        "amount": f"{float(amount):.2f}",
        "customer_id": "imc_user_101",
        "customer_email": "user@imc.com",
        "customer_phone": "9999999999",
        "payment_page_client_id": "hdfcmaster",
        "action": "paymentPage",
        "return_url": "http://localhost:8000/api/payments/payment/return/",
        "currency": "INR",
        "description": "IMC Membership Fee"
    }

    res = requests.post(
        f"{BASE_URL}/session",
        headers=get_headers("imc_user_101"),
        json=payload,
        timeout=30
    )

    data = res.json()
    data["order_id"] = order_id

    return JsonResponse(data, safe=False)


# ==============================
# 2️⃣ RETURN URL (Gateway → Backend)
# 👉 REDIRECT TO REACT
# ==============================
@csrf_exempt
def payment_return(request):
    if request.method != "POST":
        return HttpResponse("Invalid Method", status=405)

    order_id = request.POST.get("order_id")

    if not order_id:
        return redirect("https://www.imcpune.in/payment-success?status=failed")

    # 🔥 IMPORTANT: redirect to React page
    return redirect(
        f"https://www.imcpune.in/payment-success?order_id={order_id}"
    )


# ==============================
# 3️⃣ VERIFY PAYMENT STATUS
# ==============================
def verify_payment(order_id):
    res = requests.get(
        f"{BASE_URL}/orders/{order_id}",
        headers=get_headers("imc_user_101"),
        timeout=30
    )

    data = res.json()
    status = data.get("status")

    if status == "CHARGED":
        success = True
        message = "Payment Successful"
    elif status in ["PENDING", "PENDING_VBV"]:
        success = False
        message = "Payment Pending. Approve in UPI app."
    else:
        success = False
        message = "Payment Failed / Cancelled"

    return JsonResponse({
        "success": success,
        "order_id": order_id,
        "gateway_status": status,
        "message": message,
        "data": data
    })


# ==============================
# 4️⃣ CHECK STATUS (Frontend Polling)
# ==============================
@csrf_exempt
def check_status(request):
    order_id = request.GET.get("order_id")
    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    return verify_payment(order_id)


# ==============================
# 5️⃣ REFUND PAYMENT
# ==============================
@csrf_exempt
def refund_payment(request):
    order_id = request.GET.get("order_id")
    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payload = {
        "unique_request_id": f"REFUND{uuid.uuid4().hex[:10]}",
        "amount": ""
    }

    res = requests.post(
        f"{BASE_URL}/orders/{order_id}/refunds",
        headers=get_headers("imc_user_101"),
        json=payload,
        timeout=30
    )

    return JsonResponse(res.json(), safe=False)
