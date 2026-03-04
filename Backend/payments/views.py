import uuid
import json
import requests

from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt

from .utils import get_headers
from .models import Payment


BASE_URL = "https://smartgateway.hdfcuat.bank.in"


# =====================================================
# GENERATE ORDER ID
# =====================================================
def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# =====================================================
# CREATE PAYMENT
# =====================================================
@csrf_exempt
def create_payment(request):

    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    # Parse JSON
    try:
        body = json.loads(request.body or "{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Amount validation
    try:
        amount = float(body.get("amount"))
    except Exception:
        return JsonResponse({"error": "Invalid amount"}, status=400)

    # Service validation
    payment_type = body.get("payment_type")
    reference_id = body.get("reference_id")

    if not payment_type:
        return JsonResponse({"error": "payment_type is required"}, status=400)

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
        "description": payment_type
    }

    try:

        response = requests.post(
            f"{BASE_URL}/session",
            headers=get_headers("imc_user_101"),
            json=payload,
            timeout=30
        )

        data = response.json()

        Payment.objects.create(
            order_id=order_id,
            amount=amount,
            payment_type=payment_type,
            reference_id=reference_id,
            status=data.get("status", "INITIATED"),
            raw_response=data
        )

        return JsonResponse({
            "order_id": order_id,
            "payment_type": payment_type,
            "reference_id": reference_id,
            "payment_links": data.get("payment_links"),
            "status": data.get("status")
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# RETURN URL
# =====================================================
@csrf_exempt
def payment_return(request):

    order_id = (
        request.POST.get("order_id")
        or request.GET.get("order_id")
        or request.POST.get("id")
        or request.GET.get("id")
    )

    if not order_id:
        return redirect("https://www.imcpune.in/payment-success?status=failed")

    verify_payment(order_id)

    return redirect(
        f"https://www.imcpune.in/payment-success?order_id={order_id}"
    )


# =====================================================
# VERIFY PAYMENT
# =====================================================
def verify_payment(order_id):

    try:

        response = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers("imc_user_101"),
            timeout=30
        )

        data = response.json()

        payment = Payment.objects.filter(order_id=order_id).first()

        if payment:

            payment.txn_id = data.get("txn_id")
            payment.txn_uuid = data.get("txn_uuid")
            payment.status = data.get("status")
            payment.amount = float(data.get("amount", 0))
            payment.payment_method = data.get("payment_method")
            payment.payer_vpa = data.get("payer_vpa")
            payment.raw_response = data

            payment.save()

    except Exception as e:
        print("Verify Error:", str(e))


# =====================================================
# CHECK STATUS
# =====================================================
@csrf_exempt
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
        "status": payment.status,
        "txn_id": payment.txn_id,
        "txn_uuid": payment.txn_uuid,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "payer_vpa": payment.payer_vpa,
        "payment_type": payment.payment_type,
        "reference_id": payment.reference_id
    })


# =====================================================
# PAYMENT WEBHOOK
# =====================================================
@csrf_exempt
def payment_webhook(request):

    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:

        data = json.loads(request.body)

        order_id = data.get("order_id")

        payment = Payment.objects.filter(order_id=order_id).first()

        if payment:

            payment.txn_id = data.get("txn_id")
            payment.txn_uuid = data.get("txn_uuid")
            payment.amount = float(data.get("amount", 0))
            payment.status = data.get("status")
            payment.payment_method = data.get("payment_method")
            payment.payer_vpa = data.get("payer_vpa")
            payment.raw_response = data

            payment.save()

        return JsonResponse({"message": "Webhook processed"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# REFUND PAYMENT
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

        return JsonResponse(res.json())

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)