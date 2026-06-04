import uuid
import json
import requests
from decimal import Decimal

from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .utils import get_headers
from .models import Payment
from api.models import (
    SingingClass,
    Studio,
    EventBooking,
    PrivateBooking,
    PhotographyBooking,
    Singer,
    Sound,
    Videography,
)


BASE_URL = "https://smartgateway.hdfcuat.bank.in"
PAYMENT_PAGE_CLIENT_ID = "hdfcmaster"

CUSTOMER_ID = "imc_user_101"
CUSTOMER_EMAIL = "user@imc.com"
CUSTOMER_PHONE = "9999999999"
RETURN_URL = "https://www.imcpune.in/api/payments/payment/return/"
SUCCESS_REDIRECT_BASE = "https://www.imcpune.in/payment-success"


def generate_order_id():
    return f"IMC{uuid.uuid4().hex[:16]}"


# ============================================================
# CREATE PAYMENT
# ============================================================

@csrf_exempt
@require_POST
def create_payment(request):

    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    service = body.get("service")
    registration_id = body.get("registration_id")

    if not service:
        return JsonResponse({"error": "service required"}, status=400)

    try:

        # =========================================
        # SINGING CLASS PAYMENT
        # =========================================
        if service == "singing_classes":

            registration = SingingClass.objects.get(
                id=registration_id
            )

            amount = registration.fee
            # ADDED:
            customer_name = f"{registration.first_name} {registration.last_name}"

        # =========================================
        # STUDIO BOOKING
        # =========================================
        elif service == "studio_booking":

            registration = Studio.objects.get(
                id=registration_id
            )

            amount = registration.total_amount
            # ADDED:
            customer_name = registration.customer

        # =========================================
        # EVENT BOOKING
        # =========================================
        elif service == "auditorium_music_shows":

            registration = EventBooking.objects.get(
                id=registration_id
            )

            amount = registration.total_amount
            # ADDED:
            customer_name = registration.customer_name

        # =========================================
        # PRIVATE EVENT
        # =========================================
        elif service == "private_music_events":

            registration = PrivateBooking.objects.get(
                id=registration_id
            )

            amount = Decimal("5000.00")
            # ADDED:
            customer_name = registration.customer

        # =========================================
        # PHOTOGRAPHY
        # =========================================
        elif service == "photography_service":

            registration = PhotographyBooking.objects.get(
                id=registration_id
            )

            amount = registration.package_price
            # ADDED:
            customer_name = registration.client

        # =========================================
        # SINGER
        # =========================================
        elif service == "singer_registration":

            registration = Singer.objects.get(
                id=registration_id
            )

            amount = Decimal("1000.00")
            # ADDED:
            customer_name = registration.name

        # =========================================
        # SOUND
        # =========================================
        elif service == "sound_service":

            registration = Sound.objects.get(
                id=registration_id
            )

            amount = registration.price
            # ADDED:
            customer_name = registration.client_name

        # =========================================
        # VIDEOGRAPHY
        # =========================================
        elif service == "videography_service":

            registration = Videography.objects.get(
                id=registration_id
            )

            amount = registration.package_price
            # ADDED:
            customer_name = registration.client_name

        else:
            return JsonResponse(
                {"error": "Invalid service"},
                status=400
            )

    except Exception as e:

        return JsonResponse(
            {"error": str(e)},
            status=400
        )

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

        print("PAYMENT PAYLOAD:", payload)

        resp = requests.post(
            f"{BASE_URL}/session",
            headers=get_headers(CUSTOMER_ID),
            json=payload,
            timeout=30,
        )

        print("GATEWAY STATUS:", resp.status_code)
        print("GATEWAY RESPONSE:", resp.text)

        resp.raise_for_status()
        data = resp.json()

        # UPDATED: Added customer_name field
        Payment.objects.create(
            registration_id=registration_id,
            customer_name=customer_name,  # ADDED THIS LINE
            order_id=order_id,
            amount=amount,
            service=service,
            status=data.get("status", "INITIATED"),
            raw_response=data
        )

        data["order_id"] = order_id

        return JsonResponse(data)

    except Exception as e:
        print("CREATE PAYMENT ERROR:", str(e))
        return JsonResponse({"error": str(e)}, status=500)


# ============================================================
# PAYMENT RETURN
# ============================================================

@csrf_exempt
def payment_return(request):

    order_id = (
        request.POST.get("order_id")
        or request.GET.get("order_id")
        or request.POST.get("id")
        or request.GET.get("id")
    )

    if not order_id:
        return redirect(f"{SUCCESS_REDIRECT_BASE}?status=failed")

    verify_payment(order_id)

    return redirect(f"{SUCCESS_REDIRECT_BASE}?order_id={order_id}")


# ============================================================
# VERIFY PAYMENT
# ============================================================

def verify_payment(order_id):

    try:

        resp = requests.get(
            f"{BASE_URL}/orders/{order_id}",
            headers=get_headers(CUSTOMER_ID),
            timeout=30,
        )

        resp.raise_for_status()
        data = resp.json()

        payment = Payment.objects.filter(order_id=order_id).first()

        if not payment:
            return "FAILED"

        gateway_amount = Decimal(str(data.get("amount", "0")))

        if gateway_amount != payment.amount:

            print("SECURITY ALERT: Amount mismatch")

            payment.status = "FAILED"
            payment.raw_response = data
            payment.save()

            return "FAILED"

        payment.txn_id = data.get("txn_id")
        payment.txn_uuid = data.get("txn_uuid")
        payment.status = data.get("status", "FAILED")
        payment.payment_method = data.get("payment_method")
        payment.payer_vpa = data.get("payer_vpa")
        payment.raw_response = data

        payment.save()

        # ======================================
        # DYNAMIC PAYMENT STATUS UPDATE
        # ======================================

        if payment.status == "CHARGED":

            # Singing
            if payment.service == "singing_classes":

                obj = SingingClass.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.status = "confirmed"
                    obj.save()

            # Studio
            elif payment.service == "studio_booking":

                obj = Studio.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Event
            elif payment.service == "auditorium_music_shows":

                obj = EventBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.status = "confirmed"
                    obj.save()

            # Private Booking
            elif payment.service == "private_music_events":

                obj = PrivateBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Photography
            elif payment.service == "photography_service":

                obj = PhotographyBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Singer
            elif payment.service == "singer_registration":

                obj = Singer.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Sound
            elif payment.service == "sound_service":

                obj = Sound.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Videography
            elif payment.service == "videography_service":

                obj = Videography.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

        return payment.status

    except Exception as e:
        print("VERIFY ERROR:", e)
        return "FAILED"


# ============================================================
# CHECK PAYMENT STATUS
# ============================================================

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


# ============================================================
# WEBHOOK
# ============================================================

@csrf_exempt
@require_POST
def payment_webhook(request):

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    order_id = data.get("order_id")

    if not order_id:
        return JsonResponse({"error": "Missing order_id"}, status=400)

    payment = Payment.objects.filter(order_id=order_id).first()

    if payment:

        gateway_amount = Decimal(str(data.get("amount", "0")))

        if gateway_amount != payment.amount:

            payment.status = "FAILED"
            payment.raw_response = data
            payment.save()

            return JsonResponse({"error": "Amount mismatch"}, status=400)

        payment.txn_id = data.get("txn_id")
        payment.txn_uuid = data.get("txn_uuid")
        payment.status = data.get("status", "UNKNOWN")
        payment.payment_method = data.get("payment_method")
        payment.payer_vpa = data.get("payer_vpa")
        payment.raw_response = data

        payment.save()

        # ======================================
        # DYNAMIC PAYMENT STATUS UPDATE IN WEBHOOK
        # ======================================

        if payment.status == "CHARGED":

            # Singing
            if payment.service == "singing_classes":

                obj = SingingClass.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.status = "confirmed"
                    obj.save()

            # Studio
            elif payment.service == "studio_booking":

                obj = Studio.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Event
            elif payment.service == "auditorium_music_shows":

                obj = EventBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.status = "confirmed"
                    obj.save()

            # Private Booking
            elif payment.service == "private_music_events":

                obj = PrivateBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Photography
            elif payment.service == "photography_service":

                obj = PhotographyBooking.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Singer
            elif payment.service == "singer_registration":

                obj = Singer.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Sound
            elif payment.service == "sound_service":

                obj = Sound.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

            # Videography
            elif payment.service == "videography_service":

                obj = Videography.objects.filter(
                    id=payment.registration_id
                ).first()

                if obj:
                    obj.payment_status = "paid"
                    obj.save()

    return JsonResponse({"message": "Webhook processed"})


# ============================================================
# REFUND
# ============================================================

@csrf_exempt
@require_GET
def refund_payment(request):

    order_id = request.GET.get("order_id")

    if not order_id:
        return JsonResponse({"error": "order_id required"}, status=400)

    payload = {
        "unique_request_id": f"REF-{uuid.uuid4().hex[:10]}",
        "amount": ""
    }

    try:

        resp = requests.post(
            f"{BASE_URL}/orders/{order_id}/refunds",
            headers=get_headers(CUSTOMER_ID),
            json=payload,
            timeout=30
        )

        resp.raise_for_status()

        return JsonResponse(resp.json())

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ============================================================
# PAYMENT REPORT (JSON API)
# ============================================================

def get_customer_name(payment):

    try:

        if payment.service == "singing_classes":
            obj = SingingClass.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return f"{obj.first_name} {obj.last_name}"

        elif payment.service == "studio_booking":
            obj = Studio.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.customer

        elif payment.service == "auditorium_music_shows":
            obj = EventBooking.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.customer_name

        elif payment.service == "private_music_events":
            obj = PrivateBooking.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.customer

        elif payment.service == "photography_service":
            obj = PhotographyBooking.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.client

        elif payment.service == "singer_registration":
            obj = Singer.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.name

        elif payment.service == "sound_service":
            obj = Sound.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.client_name

        elif payment.service == "videography_service":
            obj = Videography.objects.filter(
                id=payment.registration_id
            ).first()

            if obj:
                return obj.client_name

    except Exception as e:
        print("Customer Name Error:", e)

    return "N/A"


def payment_report(request):
    try:

        payments = Payment.objects.all().order_by("-created_at")

        data = []

        for p in payments:

            data.append({
                "name": get_customer_name(p),
                "order_id": p.order_id,
                "service": p.service,
                "amount": float(p.amount),
                "status": p.status,
                "payment_method": p.payment_method,
                "txn_id": p.txn_id,
                "payer_vpa": p.payer_vpa,
                "created_at": p.created_at.strftime("%d-%m-%Y %H:%M")
            })

        return JsonResponse({
            "success": True,
            "count": len(data),
            "payments": data
        })

    except Exception as e:

        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)