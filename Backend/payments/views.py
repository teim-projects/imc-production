import uuid
import json
import requests
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from .utils import get_headers
from .models import Payment

BASE_URL = "https://smartgateway.hdfcuat.bank.in"


# =====================================================
# GENERATE UNIQUE ORDER ID
# =====================================================
def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# =====================================================
# 1️⃣ CREATE PAYMENT ORDER (Initiate Payment Page)
# =====================================================
@csrf_exempt
def create_payment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    amount = float(body.get("amount", 1.00))
    service = body.get("service", "unknown")  # e.g. "sound_system_service"

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
        "description": f"IMC Payment for {service}"
    }

    try:
        res = requests.post(
            f"{BASE_URL}/session",
            headers=get_headers("imc_user_101"),
            json=payload,
            timeout=30
        )
        res.raise_for_status()  # Raise error for bad status codes

        data = res.json()

        # Save initial payment record
        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "amount": amount,
                "service": service,
                "status": data.get("status", "INITIATED"),
                "raw_response": data
            }
        )

        # Add order_id to response for frontend
        data["order_id"] = order_id
        return JsonResponse(data)

    except requests.RequestException as e:
        return JsonResponse({"error": f"Payment initiation failed: {str(e)}"}, status=500)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# 2️⃣ PAYMENT RETURN URL (Callback from Gateway)
# =====================================================
@csrf_exempt
def payment_return(request):
    # Try to get order_id from POST or GET
    order_id = (
        request.POST.get("order_id") or
        request.GET.get("order_id") or
        request.POST.get("id") or
        request.GET.get("id")
    )

    if not order_id:
        return redirect("https://www.imcpune.in/payment-success?status=failed&error=no_order_id")

    # Verify latest status from gateway
    verify_payment(order_id)

    # Redirect to frontend success page with order_id
    return redirect(
        f"https://www.imcpune.in/payment-success?order_id={order_id}"
    )


# =====================================================
# 3️⃣ VERIFY PAYMENT STATUS FROM GATEWAY
# =====================================================
def verify_payment(order_id):
    try:
        res = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers("imc_user_101"),
            timeout=30
        )
        res.raise_for_status()

        data = res.json()
        status_value = data.get("status", "FAILED")

        # Update payment record with latest info
        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "txn_id": data.get("txn_id"),
                "txn_uuid": data.get("txn_uuid"),
                "amount": float(data.get("amount", 0)),
                "status": status_value,
                "payment_method": data.get("payment_method"),
                "payer_vpa": data.get("payer_vpa"),
                "payment_type": data.get("payment_method") or "UNKNOWN",
                "reference_id": data.get("bank_ref_no"),  # ← added reference_id
                "raw_response": data
            }
        )

        return status_value

    except requests.RequestException as e:
        print(f"Verify Error for {order_id}: {str(e)}")
        return "FAILED"
    except Exception as e:
        print(f"Unexpected verify error: {str(e)}")
        return "FAILED"


# =====================================================
# 4️⃣ CHECK PAYMENT STATUS (Frontend calls this)
# =====================================================
@csrf_exempt
def check_status(request):
    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    # Always verify latest status from gateway first
    verify_payment(order_id)

    payment = Payment.objects.filter(order_id=order_id).first()

    if not payment:
        return JsonResponse({"error": "Payment record not found"}, status=404)

    return JsonResponse({
        "success": payment.status == "CHARGED",
        "order_id": payment.order_id,
        "service": payment.service,
        "payment_type": payment.payment_type or "UNKNOWN",
        "status": payment.status,
        "txn_id": payment.txn_id,
        "txn_uuid": payment.txn_uuid,
        "amount": float(payment.amount),
        "payment_method": payment.payment_method,
        "payer_vpa": payment.payer_vpa,
        "reference_id": payment.reference_id,  # ← added reference_id
        "raw_response": payment.raw_response
    })


# =====================================================
# 5️⃣ WEBHOOK (Gateway sends real-time updates here)
# =====================================================
@csrf_exempt
def payment_webhook(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)

        order_id = data.get("order_id")
        if not order_id:
            return JsonResponse({"error": "No order_id in webhook"}, status=400)

        status_value = data.get("status", "UNKNOWN")

        Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                "txn_id": data.get("txn_id"),
                "txn_uuid": data.get("txn_uuid"),
                "amount": float(data.get("amount", 0)),
                "status": status_value,
                "payment_method": data.get("payment_method"),
                "payer_vpa": data.get("payer_vpa"),
                "payment_type": data.get("payment_method") or "UNKNOWN",
                "reference_id": data.get("bank_ref_no"),  # ← added reference_id
                "raw_response": data
            }
        )

        print(f"Webhook processed for order {order_id} - Status: {status_value}")
        return JsonResponse({"message": "Webhook processed successfully"})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in webhook"}, status=400)
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


# =====================================================
# 6️⃣ REFUND PAYMENT (Optional)
# =====================================================
@csrf_exempt
def refund_payment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    order_id = request.GET.get("order_id") or request.POST.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payload = {
        "unique_request_id": f"REFUND{uuid.uuid4().hex[:10]}",
        "amount": ""  # full refund if empty, or specify amount
    }

    try:
        res = requests.post(
            f"{BASE_URL}/orders/{order_id}/refunds",
            headers=get_headers("imc_user_101"),
            json=payload,
            timeout=30
        )
        res.raise_for_status()

        refund_data = res.json()

        # Optionally update payment status to REFUNDED
        Payment.objects.filter(order_id=order_id).update(
            status="REFUNDED",
            raw_response=refund_data
        )

        return JsonResponse(refund_data)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)