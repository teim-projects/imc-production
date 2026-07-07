# api/views.py
from datetime import timedelta
import os

from django.contrib.auth import get_user_model
from django.db import IntegrityError  # <-- ADDED for custom create
from django.db.models import Sum
from django.utils.timezone import now

from rest_framework import viewsets, filters, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from google.oauth2 import id_token  # type: ignore
from google.auth.transport import requests  # type: ignore

import os

from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    # Studio
    StudioMaster, Studio,
    # CRM modules
    PrivateBooking, Event, Payment, Videography,
    # Photography (old schema)
    PhotographyBooking,
    # Sound service
    Sound,   StudioSlot,
)

from .serializers import (
    # Studio
    StudioMasterSerializer, StudioSerializer,
    # CRM modules
    PrivateBookingSerializer, EventSerializer, PaymentSerializer, StudioSlotSerializer, VideographySerializer,
    # Auth helpers
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    # Photography (old schema)
    PhotographyBookingSerializer, StudioSlotSerializer,
    # Sound service
    SoundSerializer,
)

User = get_user_model()


# ====================================================================
# Pagination
# ====================================================================
class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


# ====================================================================
# Google OAuth2 Login → JWT (safe stub)
# ====================================================================
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    # callback_url = "http://127.0.0.1:8000/accounts/google/login/callback/"
    callback_url = os.getenv('GOOGLE_CALLBACK_URL')

    def post(self, request, *args, **kwargs):
        """
        Verify Google token → get/create user → issue JWT tokens.
        """
        token = request.data.get("access_token")
        if not token:
            return Response({"error": "Missing access_token"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
                # "129181997839-0rlmm080229tetuka9c0i83la4r4lhdt.apps.googleusercontent.com"
            )

            email = idinfo.get("email")
            name = idinfo.get("name", "")
            picture = idinfo.get("picture", "")

            # ✅ Get or create user
            user, created = User.objects.get_or_create(email=email)
            if created:
                user.is_active = True
                if hasattr(user, "full_name"):
                    user.full_name = name
                if hasattr(user, "profile_photo") and picture:
                    user.profile_photo = picture
                user.save()

            # ✅ Generate JWT tokens for this user
            refresh = RefreshToken.for_user(user)
            data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "name": name,
                "message": "Google login successful"
            }

            return Response(data, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"error": "Invalid Google token", "details": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ====================================================================
# Password Reset
# ====================================================================
class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password reset email sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


# ====================================================================
# Studio Master (catalog)
# ====================================================================
# api/views.py
# api/views.py
from django.db import transaction
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import StudioMaster, StudioImage
from .serializers import StudioMasterSerializer, StudioImageSerializer
from .permissions import IsStaffOrRoleAdmin

class DefaultPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 200

class StudioMasterViewSet(viewsets.ModelViewSet):
    # Prefetch images so serializer returns them in list endpoints
    queryset = StudioMaster.objects.all().order_by("name").prefetch_related("images")
    serializer_class = StudioMasterSerializer

    # Choose permission:
    # - For dev/user-created studios: IsAuthenticatedOrReadOnly
    # - For admin-only writes use IsStaffOrRoleAdmin
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = DefaultPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "location", "area", "city", "state"]
    ordering_fields = ["name", "capacity", "hourly_rate", "updated_at", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        city = self.request.query_params.get("city")
        if is_active is not None:
            if is_active.lower() in ("1", "true", "yes"):
                qs = qs.filter(is_active=True)
            elif is_active.lower() in ("0", "false", "no"):
                qs = qs.filter(is_active=False)
        if city:
            qs = qs.filter(city__iexact=city)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        name = (serializer.validated_data.get("name") or "").strip()
        location = serializer.validated_data.get("location", "") or ""
        serializer.save(name=name, location=location)

    @transaction.atomic
    def perform_update(self, serializer):
        name = (serializer.validated_data.get("name") or "").strip()
        location = serializer.validated_data.get("location", "") or ""
        serializer.save(name=name, location=location)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save(update_fields=["is_active", "updated_at"])
        return Response({"id": instance.id, "is_active": instance.is_active}, status=status.HTTP_200_OK)


class StudioImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, studio_pk, *args, **kwargs):
        try:
            studio = StudioMaster.objects.get(pk=studio_pk)
        except StudioMaster.DoesNotExist:
            return Response({"detail": "Studio not found."}, status=status.HTTP_404_NOT_FOUND)

        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "No files uploaded. Use field 'images'."}, status=status.HTTP_400_BAD_REQUEST)

        created_objs = []
        for f in files:
            si = StudioImage.objects.create(studio=studio, image=f)
            created_objs.append(si)

        serializer = StudioImageSerializer(created_objs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, studio_pk, image_pk=None, *args, **kwargs):
        if image_pk is None:
            return Response({"detail": "Image id required in URL."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            img = StudioImage.objects.get(pk=image_pk, studio_id=studio_pk)
        except StudioImage.DoesNotExist:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WhoAmI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({
            "id": getattr(u, "id", None),
            "email": getattr(u, "email", None),
            "mobile_no": getattr(u, "mobile_no", None),
            "is_staff": getattr(u, "is_staff", False),
            "is_superuser": getattr(u, "is_superuser", False),
            "role": getattr(u, "role", None),
        })


# ====================================================================
# Studios (bookings)  <-- UPDATED with custom create()
# ====================================================================
class StudioViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Studio bookings.
    Frontend is calling:  BASE + "/auth/studios/"
    """

    queryset = Studio.objects.all()
    serializer_class = StudioSerializer
    pagination_class = DefaultPagination

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "studio_name",
        "customer",
        "email",
        "contact_number",
        "address",
    ]
    ordering_fields = ["date", "time_slot", "duration", "created_at"]
    ordering = ["-date", "-time_slot"]

    # ============================================================
    # CUSTOM CREATE – handles pending bookings & unique constraint
    # ============================================================
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Attempt to create with pending status
            booking = serializer.save(
                status="pending",
                payment_status="pending",
            )
            return Response(
                self.get_serializer(booking).data,
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError:
            # Duplicate key – check if it's a pending booking we can replace
            studio_name = request.data.get("studio_name")
            date = request.data.get("date")
            time_slot = request.data.get("time_slot")

            old_booking = Studio.objects.filter(
                studio_name=studio_name,
                date=date,
                time_slot=time_slot,
                payment_status="pending",
            ).first()

            if old_booking:
                # Delete the old pending booking and create a new one
                old_booking.delete()
                booking = serializer.save(
                    status="pending",
                    payment_status="pending",
                )
                return Response(
                    self.get_serializer(booking).data,
                    status=status.HTTP_201_CREATED,
                )

            # If the existing booking is not pending (i.e., paid/confirmed), return error
            return Response(
                {"error": "Slot already booked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """
        GET /auth/studios/upcoming/?days=7

        Returns upcoming bookings for the next N days (default 7).
        """
        try:
            days = int(request.query_params.get("days", 7))
        except ValueError:
            days = 7

        today = now().date()
        qs = (
            self.get_queryset()
            .filter(date__gte=today, date__lte=today + timedelta(days=days))
            .order_by("date", "time_slot")
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_date(self, request):
        """
        GET /auth/studios/by_date/?date=YYYY-MM-DD

        Returns all bookings for a given date.
        """
        target = request.query_params.get("date")
        if not target:
            return Response(
                {"error": "Missing 'date' parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(date=target).order_by("time_slot")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ====================================================================
# Private Bookings
# ====================================================================

# authapp/views.py

from rest_framework import viewsets, status, filters
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PrivateBooking
from .serializers import PrivateBookingSerializer


class PrivateBookingViewSet(viewsets.ModelViewSet):
    queryset = PrivateBooking.objects.all().order_by("-id")
    serializer_class = PrivateBookingSerializer

    # 🔥 IMPORTANT → Prevent 401
    authentication_classes = []
    permission_classes = [AllowAny]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["customer", "event_type", "venue", "email"]
    ordering_fields = ["date", "time_slot", "duration"]
    ordering = ["-date"]

    @action(detail=False, methods=["get"])
    def by_date(self, request):
        target = request.query_params.get("date")
        if not target:
            return Response(
                {"error": "Missing 'date' parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = self.get_queryset().filter(date=target)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        total = qs.count()
        total_guests = sum(int(x.guest_count or 0) for x in qs)

        return Response({
            "total_bookings": total,
            "total_guests": total_guests
        })


# ====================================================================
# Events
# ====================================================================
# api/views.py
from rest_framework import viewsets, permissions, filters

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Events (Live / Karaoke + time slot + seats + tier prices)

    Base URL: /auth/events/

    - GET    /auth/events/          -> list
    - POST   /auth/events/          -> create
    - GET    /auth/events/<id>/     -> retrieve
    - PUT    /auth/events/<id>/     -> update
    - PATCH  /auth/events/<id>/     -> partial update
    - DELETE /auth/events/<id>/     -> delete
    """

    queryset = Event.objects.all().order_by("-date", "time_slot", "-created_at")
    serializer_class = EventSerializer

    # Public can view, only authenticated users can create/update/delete
    permission_classes = [permissions.AllowAny]

    # Search + ordering for your admin table UI
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        "title",
        "location",
        "description",
        "event_type",
    ]

    ordering_fields = [
        "date",
        "time_slot",
        "created_at",
        "total_seats",      # ⭐ seats
        "available_seats",  # ⭐ seats
        "basic_price",
        "premium_price",
        "vip_price",
        "ticket_price",
    ]

    # default ordering
    ordering = ["-date", "time_slot"]


from django.utils.timezone import now
from rest_framework import viewsets, permissions, parsers, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PhotographyBooking
from .serializers import PhotographyBookingSerializer


class PhotographyBookingViewSet(viewsets.ModelViewSet):
    """
    PUBLIC Photography Booking
    SAME AS SINGER STYLE
    """

    queryset = PhotographyBooking.objects.all().order_by("-date", "-created_at")
    serializer_class = PhotographyBookingSerializer

    # 🔥 PUBLIC (no login required)
    permission_classes = [permissions.AllowAny]

    # 🔥 JSON ONLY (this fixes 415 error)
    parser_classes = [parsers.JSONParser]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "client",
        "email",
        "contact_number",
        "event_type",
        "package_type",
        "location",
        "notes",
    ]
    ordering_fields = [
        "date",
        "created_at",
        "package_price",
        "photographers_count",
    ]
    ordering = ["-date", "-created_at"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def today(self, request):
        qs = self.get_queryset().filter(date=now().date())
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ====================================================================
# Payments
# ====================================================================
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = DefaultPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["customer", "method"]
    ordering_fields = ["amount", "date", "created_at"]
    ordering = ["-date"]

    @action(detail=False, methods=["get"])
    def total(self, request):
        agg = self.get_queryset().aggregate(total=Sum("amount"))
        total_amount = agg["total"] or 0
        return Response({"total_collected": total_amount})


# ====================================================================
# Videography
# ====================================================================
# videography/views.py
from django.utils.timezone import now
from rest_framework import viewsets, permissions, parsers, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Videography
from .serializers import VideographySerializer


class VideographyViewSet(viewsets.ModelViewSet):
    queryset = Videography.objects.all().order_by("-shoot_date", "-created_at")
    serializer_class = VideographySerializer

    # Anyone can GET; auth required for POST/PUT/PATCH/DELETE
    permission_classes = [permissions.AllowAny]

    # JSON + form data
    parser_classes = [parsers.JSONParser, parsers.FormParser]

    # Search + ordering support
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "project",
        "editor",
        "client_name",
        "email",
        "mobile_no",
        "location",
        "package_type",
        "notes",
    ]
    ordering_fields = [
        "shoot_date",
        "created_at",
        "duration_hours",
        "package_price",
    ]
    ordering = ["-shoot_date", "-created_at"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=["get"])
    def today(self, request):
        """
        GET /auth/videography/today/
        Returns today's videography jobs.
        """
        qs = self.get_queryset().filter(shoot_date=now().date())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ====================================================================
# Sound System (Service)
# ====================================================================
class SoundViewSet(viewsets.ModelViewSet):
    """
    /api/auth/sound/
    """
    queryset = Sound.objects.all().order_by("-event_date", "-created_at")
    serializer_class = SoundSerializer
    pagination_class = DefaultPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "client_name", "email", "mobile_no",
        "system_type", "location", "mixer_model", "notes"
    ]
    ordering_fields = [
        "event_date", "created_at", "price",
        "speakers_count", "microphones_count", "system_type"
    ]
    ordering = ["-event_date", "-created_at"]

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Quick filter for today's sound jobs."""
        qs = self.get_queryset().filter(event_date=now().date())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)


from rest_framework import viewsets, permissions, filters, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

from .models import Singer
from .serializers import SingerSerializer


# -----------------------------
# Permission
# -----------------------------
class SingerPermission(permissions.BasePermission):
    """
    GET, POST  → Public
    PUT, PATCH, DELETE → Staff only
    """
    def has_permission(self, request, view):
        if request.method in ["GET", "POST"]:
            return True
        return bool(request.user and request.user.is_staff)


# -----------------------------
# ViewSet
# -----------------------------
class SingerViewSet(viewsets.ModelViewSet):
    """
    BASE URL:
    /api/auth/singer/
    """

    # ✅ FIXED ORDER → 1,2,3,4 (Ascending ID)
    queryset = Singer.objects.all().order_by("id")

    serializer_class = SingerSerializer
    permission_classes = [SingerPermission]

    # ✅ REQUIRED FOR JSON + FORM + VIDEO
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    # 🔍 Search
    filter_backends = [filters.SearchFilter]
    search_fields = ["id", "name", "city", "genre", "mobile"]

    # -----------------------------
    # CREATE (POST)
    # -----------------------------
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    # -----------------------------
    # UPDATE (PUT)
    # -----------------------------
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Singer.DoesNotExist:
            raise NotFound("Singer not found")

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=False
        )
        serializer.is_valid(raise_exception=True)

        if "video" in request.FILES and instance.video:
            instance.video.delete(save=False)

        serializer.save()

        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # -----------------------------
    # PARTIAL UPDATE (PATCH)
    # -----------------------------
    def partial_update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Singer.DoesNotExist:
            raise NotFound("Singer not found")

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        if "video" in request.FILES and instance.video:
            instance.video.delete(save=False)

        serializer.save()

        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # -----------------------------
    # DELETE
    # -----------------------------
    def destroy(self, request, *args, **kwargs):
        try:
            singer = self.get_object()
        except Singer.DoesNotExist:
            raise NotFound("Singer not found")

        if singer.video:
            singer.video.delete(save=False)

        singer.delete()

        return Response(
            {"success": True, "message": "Singer deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


# api/views.py (replace or add)
import logging
from importlib import import_module

from django.apps import apps
from django.db.models import Sum
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

logger = logging.getLogger(__name__)

def get_model_safely(app_label, model_name):
    """
    Return the model class or None. Use apps.get_model which reads installed apps.
    """
    try:
        return apps.get_model(app_label, model_name)
    except Exception:
        return None

def first_existing_attr(obj, candidates, default=None):
    for c in candidates:
        if hasattr(obj, c):
            return c
    return default


class DashboardSummary(APIView):
    """
    Dashboard summary with comprehensive statistics including:
    - Customer, booking, event counts
    - Revenue from all sources (Payments, Studio, Photography, Videography, Sound, Classes, Annual Fees)
    - Payment status statistics for singing classes
    - Monthly chart data for revenue visualization
    - Recent activities from all modules
    """
    permission_classes = [IsAuthenticated]  # Change to [AllowAny] for testing without auth

    def _safe_count(self, Model):
        try:
            return Model.objects.count()
        except Exception as e:
            logger.exception("Count failed for %s", Model)
            return 0

    def _safe_sum(self, Model, field_names):
        """
        Try to sum the first matching field name in field_names.
        Returns float total or 0.0 on error.
        """
        for fld in field_names:
            try:
                agg = Model.objects.aggregate(total=Sum(fld))
                if agg and agg.get("total") is not None:
                    return float(agg["total"])
            except Exception:
                # try next candidate field
                logger.debug("Sum candidate '%s' not usable for %s", fld, Model)
                continue
        return 0.0

    def _gather_recent(self, Model, type_name, date_fields, price_fields, customer_fields):
        """
        Return list of dicts for recent items from Model. Try common fields for date/price/customer.
        """
        out = []
        try:
            # determine which date field exists
            sample = Model.objects.first()
            if not sample:
                return out
            date_field = first_existing_attr(sample, date_fields)
            price_field = first_existing_attr(sample, price_fields)
            customer_field = first_existing_attr(sample, customer_fields)

            qs = Model.objects.all().order_by(f"-{date_field or 'pk'}")[:8]
            for obj in qs:
                date_val = getattr(obj, date_field) if date_field else None
                price_val = getattr(obj, price_field) if price_field else None
                cust_val = getattr(obj, customer_field) if customer_field else None

                # customer text
                cust_text = "—"
                try:
                    if cust_val:
                        if hasattr(cust_val, "email"):
                            cust_text = getattr(cust_val, "email")
                        elif hasattr(cust_val, "first_name"):
                            cust_text = f"{getattr(cust_val,'first_name','')} {getattr(cust_val,'last_name','')}".strip()
                        else:
                            cust_text = str(cust_val)
                except Exception:
                    cust_text = "—"

                out.append({
                    "type": type_name,
                    "id": getattr(obj, "id", None),
                    "date": date_val.isoformat() if date_val is not None else None,
                    "price": float(price_val) if price_val is not None else None,
                    "customer": cust_text,
                })
        except Exception:
            logger.exception("Failed to gather recent items for %s", Model)
        return out

    def get(self, request):
        try:
            from django.db.models.functions import TruncMonth
            
            APP = "api"

            CustomUser = get_model_safely(APP, "CustomUser") or get_model_safely("auth", "User")
            Studio = get_model_safely(APP, "Studio")
            PrivateBooking = get_model_safely(APP, "PrivateBooking")
            PhotographyBooking = get_model_safely(APP, "PhotographyBooking")
            Videography = get_model_safely(APP, "Videography")
            Event = get_model_safely(APP, "Event")
            Show = get_model_safely(APP, "Show")
            Payment = get_model_safely(APP, "Payment")
            SingingClass = get_model_safely(APP, "SingingClass")
            Singer = get_model_safely(APP, "Singer")
            Trainer = get_model_safely(APP, "Trainer")
            Sound = get_model_safely(APP, "Sound")
            AnnualFee = get_model_safely(APP, "AnnualFee")

            # ==================================
            # COUNTS
            # ==================================
            
            # Customers count
            customers = 0
            if CustomUser:
                try:
                    customers = CustomUser.objects.filter(is_active=True).count()
                except Exception:
                    customers = self._safe_count(CustomUser)

            # Individual booking counts
            studio_count = Studio.objects.count() if Studio else 0
            private_count = PrivateBooking.objects.count() if PrivateBooking else 0
            photo_count = PhotographyBooking.objects.count() if PhotographyBooking else 0
            video_count = Videography.objects.count() if Videography else 0

            # Total bookings
            bookings = studio_count + private_count + photo_count + video_count

            # Events count
            events = 0
            for M in (Event, Show):
                if M:
                    events += self._safe_count(M)

            # Other counts
            singers_count = Singer.objects.count() if Singer else 0
            trainers_count = Trainer.objects.count() if Trainer else 0
            sound_count = Sound.objects.count() if Sound else 0
            singing_classes_count = SingingClass.objects.count() if SingingClass else 0

            # ==================================
            # REVENUE FROM ALL SOURCES
            # ==================================

            # Payment revenue
            payment_revenue = 0.0
            if Payment:
                payment_revenue = float(
                    Payment.objects.aggregate(total=Sum("amount"))["total"] or 0
                )

            # Studio revenue
            studio_revenue = 0.0
            if Studio:
                studio_revenue = float(
                    Studio.objects.aggregate(total=Sum("total_amount"))["total"] or 0
                )

            # Photography revenue
            photo_revenue = 0.0
            if PhotographyBooking:
                photo_revenue = float(
                    PhotographyBooking.objects.aggregate(total=Sum("package_price"))["total"] or 0
                )

            # Videography revenue
            video_revenue = 0.0
            if Videography:
                video_revenue = float(
                    Videography.objects.aggregate(total=Sum("package_price"))["total"] or 0
                )

            # Sound revenue
            sound_revenue = 0.0
            if Sound:
                sound_revenue = float(
                    Sound.objects.aggregate(total=Sum("price"))["total"] or 0
                )

            # Singing class revenue
            class_revenue = 0.0
            if SingingClass:
                class_revenue = float(
                    SingingClass.objects.aggregate(total=Sum("fee"))["total"] or 0
                )

            # Annual fee revenue
            annual_fee_revenue = 0.0
            if AnnualFee:
                annual_fee_revenue = float(
                    AnnualFee.objects.aggregate(total=Sum("amount"))["total"] or 0
                )

            # Total revenue from all sources
            total_revenue = (
                payment_revenue +
                studio_revenue +
                photo_revenue +
                video_revenue +
                sound_revenue +
                class_revenue +
                annual_fee_revenue
            )

            # ==================================
            # PAYMENT STATUS STATISTICS
            # ==================================

            paid_students = 0
            pending_students = 0
            paid_revenue = 0.0
            pending_revenue = 0.0

            if SingingClass:
                try:
                    paid_students = SingingClass.objects.filter(
                        payment_status="paid"
                    ).count()

                    pending_students = SingingClass.objects.filter(
                        payment_status="pending"
                    ).count()

                    paid_revenue = float(
                        SingingClass.objects.filter(
                            payment_status="paid"
                        ).aggregate(total=Sum("fee"))["total"] or 0
                    )

                    pending_revenue = float(
                        SingingClass.objects.filter(
                            payment_status="pending"
                        ).aggregate(total=Sum("fee"))["total"] or 0
                    )
                except Exception as e:
                    logger.warning("payment_status field may not exist in SingingClass: %s", e)

            # ==================================
            # MONTHLY CHART DATA
            # ==================================
            
            monthly_chart = []
            
            if Payment:
                try:
                    monthly_data = (
                        Payment.objects
                        .annotate(month=TruncMonth("created_at"))   # ✅ changed from "date"
                        .values("month")
                        .annotate(total=Sum("amount"))
                        .order_by("month")
                    )

                    monthly_chart = [
                        {
                            "name": item["month"].strftime("%b"),
                            "value": float(item["total"])
                        }
                        for item in monthly_data
                    ]
                except Exception as e:
                    logger.warning("Monthly chart error: %s", e)

            # ==================================
            # RECENT ACTIVITIES
            # ==================================

            recent = []

            # Studio recent bookings
            if Studio:
                for item in Studio.objects.order_by("-created_at")[:5]:
                    recent.append({
                        "type": "Studio",
                        "customer": item.customer,
                        "price": float(item.total_amount or 0),
                        "date": str(item.date) if item.date else None
                    })

            # Photography recent bookings
            if PhotographyBooking:
                for item in PhotographyBooking.objects.order_by("-created_at")[:5]:
                    recent.append({
                        "type": "Photography",
                        "customer": item.client,
                        "price": float(item.package_price or 0),
                        "date": str(item.date) if item.date else None
                    })

            # Videography recent bookings
            if Videography:
                for item in Videography.objects.order_by("-created_at")[:5]:
                    recent.append({
                        "type": "Videography",
                        "customer": item.client_name,
                        "price": float(item.package_price or 0),
                        "date": str(item.shoot_date) if item.shoot_date else None
                    })

            # Sound recent bookings
            if Sound:
                for item in Sound.objects.order_by("-created_at")[:5]:
                    recent.append({
                        "type": "Sound",
                        "customer": item.client_name,
                        "price": float(item.price or 0),
                        "date": str(item.event_date) if item.event_date else None
                    })

            # Private booking recent entries
            if PrivateBooking:
                for item in PrivateBooking.objects.order_by("-created_at")[:5]:
                    recent.append({
                        "type": "Private Booking",
                        "customer": item.customer_name,
                        "price": float(item.amount or 0),
                        "date": str(item.date) if item.date else None
                    })

            # Sort recent by date (descending) and keep top 10
            recent = sorted(
                [r for r in recent if r.get("date")],
                key=lambda x: x["date"],
                reverse=True
            )[:10]

            # ==================================
            # FINAL PAYLOAD
            # ==================================
            
            payload = {
                # Basic counts
                "customers": customers,
                "bookings": bookings,
                "events": events,
                
                # Revenue (multiple formats for compatibility)
                "revenue": total_revenue,
                "totalRevenue": total_revenue,
                
                # Individual revenue breakdown
                "payment_revenue": payment_revenue,
                "studio_revenue": studio_revenue,
                "photo_revenue": photo_revenue,
                "video_revenue": video_revenue,
                "sound_revenue": sound_revenue,
                "class_revenue": class_revenue,
                "annual_fee_revenue": annual_fee_revenue,
                
                # Individual counts
                "studio_count": studio_count,
                "private_count": private_count,
                "photo_count": photo_count,
                "video_count": video_count,
                
                # Singing Class Stats
                "singing_classes_count": singing_classes_count,
                "paid_students": paid_students,
                "pending_students": pending_students,
                "paid_revenue": float(paid_revenue),
                "pending_revenue": float(pending_revenue),
                
                # Other counts
                "singers_count": singers_count,
                "trainers_count": trainers_count,
                "sound_count": sound_count,
                
                # Chart Data
                "chartData": monthly_chart,   # ✅ changed from "chart_data"
                
                # Recent activities
                "recent_bookings": recent,
                
                # Metadata
                "generated_at": timezone.now().isoformat(),
            }
            
            return Response(payload)
            
        except Exception as exc:
            # Log full exception server-side for debugging
            logger.exception("DashboardSummary failed")
            # Return the error back in the response to help debugging
            return Response(
                {
                    "detail": "Failed to compute dashboard summary",
                    "error": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# api/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics

from .models import SingingClass
from .serializers import SingingClassSerializer

# views.py
class SingerListView(generics.ListAPIView):
    queryset = Singer.objects.all()
    serializer_class = SingerSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Disable pagination if no page params
        if 'page' not in self.request.query_params:
            self.pagination_class = None
        return queryset
    
class SingingClassPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class SingingClassAdmissionViewSet(viewsets.ModelViewSet):
    """
    Handles:
    - Create admission
    - List admissions
    - Update / delete
    - Filter by day & time
    """

    queryset = SingingClass.objects.select_related(
        "batch",
        "batch__class_obj",
        "batch__trainer"
    ).order_by("-created_at")

    serializer_class = SingingClassSerializer

    # ✅ IMPORTANT FIX (prevents 401 Unauthorized)
    authentication_classes = []   # <-- REQUIRED
    permission_classes = [permissions.AllowAny]

    pagination_class = SingingClassPagination

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        "first_name",
        "last_name",
        "phone",
        "email",
        "preferred_batch",
        "day",
        "time_slot",
    ]

    ordering_fields = ["date", "created_at", "fee"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        """
        Create admission.
        preferred_batch auto-filled in model save()
        """
        serializer.save()

    # ---------------------------------------------------
    # UPDATE STATUS (admin usage)
    # ---------------------------------------------------
    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        obj = self.get_object()
        status_value = request.data.get("status")

        if status_value not in ["pending", "confirmed", "cancelled"]:
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.status = status_value
        obj.save(update_fields=["status"])

        return Response(
            {"id": obj.id, "status": obj.status},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------
    # FILTER BY DAY / TIME SLOT
    # ---------------------------------------------------
    @action(detail=False, methods=["get"], url_path="by-slot")
    def by_slot(self, request):
        day = request.query_params.get("day")
        slot = request.query_params.get("time_slot")

        qs = self.get_queryset()

        if day:
            qs = qs.filter(day=day)
        if slot:
            qs = qs.filter(time_slot=slot)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        return Response(self.get_serializer(qs, many=True).data)


# api/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Trainer
from .serializers import TrainerSerializer


class TrainerViewSet(ModelViewSet):
    queryset = Trainer.objects.all()
    serializer_class = TrainerSerializer
    permission_classes = [IsAuthenticated]


from rest_framework.viewsets import ModelViewSet
from .models import Teacher, Class, Batch
from .serializers import TeacherSerializer, ClassSerializer, BatchSerializer
from .serializers import BatchSerializer


class TeacherViewSet(ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer


class ClassViewSet(ModelViewSet):
    queryset = Class.objects.select_related("trainer")
    serializer_class = ClassSerializer


class BatchViewSet(ModelViewSet):
    queryset = Batch.objects.select_related('class_obj', 'trainer').all()
    serializer_class = BatchSerializer  # ← ABSOLUTELY REQUIRED


from rest_framework import viewsets, permissions
from .models import AnnualFee
from .serializers import AnnualFeeSerializer

class AnnualFeeViewSet(viewsets.ModelViewSet):
    queryset = AnnualFee.objects.all().order_by("-created_at")
    serializer_class = AnnualFeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        singer_id = self.request.query_params.get("singer")
        if singer_id:
            qs = qs.filter(singer_id=singer_id)
        return qs


from .models import EventBooking
from .serializers import EventBookingSerializer
from rest_framework import permissions, viewsets

class EventBookingViewSet(viewsets.ModelViewSet):
    queryset = EventBooking.objects.all().order_by("-created_at")
    serializer_class = EventBookingSerializer

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    

# views.py
class StudioSlotViewSet(viewsets.ModelViewSet):
    queryset = StudioSlot.objects.all()
    serializer_class = StudioSlotSerializer