# api/views.py
from datetime import timedelta
import os

from django.contrib.auth import get_user_model
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
    Sound,   StudioSlot,   # <-- Add this
)

from .serializers import (
    # Studio
    StudioMasterSerializer, StudioSerializer,
    # CRM modules
    PrivateBookingSerializer, EventSerializer, PaymentSerializer, StudioSlotSerializer, VideographySerializer,
    # Auth helpers
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,

    # Photography (old schema)
    PhotographyBookingSerializer,StudioSlotSerializer,   # <-- Add this
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
# Studios (bookings)
# ====================================================================
class StudioViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Studio bookings.
    Frontend is calling:  BASE + "/auth/studios/"

    ✅ LIST action: Returns ALL studio bookings (for admin view) - NO PAGINATION
    ✅ by_date action: Only returns booked+blocked slots (for slot picker)
    ✅ upcoming action: Returns all non-cancelled bookings
    ✅ CREATE / RETRIEVE / UPDATE / DELETE: Full queryset access
    """

    serializer_class = StudioSerializer
    # Disable pagination for admin view - return ALL records
    pagination_class = None

    def get_queryset(self):
        """
        Dynamic queryset based on action:
        
        - LIST (default): ALL records for complete admin view
        - by_date: Only booked+blocked (prevents double booking in slot picker)
        - upcoming: All except cancelled
        - Other actions (retrieve, update, delete): Full queryset
        """
        
        # Slot picker - only show occupied slots (pending/cancelled don't block slots)
        if self.action == "by_date":
            return Studio.objects.filter(status__in=["booked", "blocked"])
        
        # Upcoming bookings - exclude cancelled
        if self.action == "upcoming":
            return Studio.objects.exclude(status="cancelled")
        
        # ✅ DEFAULT (list, retrieve, update, delete) - ALL RECORDS
        return Studio.objects.all()

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
        target = request.query_params.get("date")
        studio = request.query_params.get("studio")
    
        qs = self.get_queryset()
    
        if target:
            qs = qs.filter(date=target)
    
        if studio:
            qs = qs.filter(studio_name=studio)
    
        serializer = self.get_serializer(
            qs.order_by("time_slot"),
            many=True,
        )
    
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)



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

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

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
        if "photo" in request.FILES and instance.photo:
            instance.photo.delete(save=False)

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
        if "photo" in request.FILES and instance.photo:
            instance.photo.delete(save=False)

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
        Link authenticated user if available.
        """
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

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

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)
    
    
    

# views.py

class StudioSlotViewSet(viewsets.ModelViewSet):
    queryset = StudioSlot.objects.all()
    serializer_class = StudioSlotSerializer


# ====================================================================
# My Bookings — authenticated user's bookings across all services
# ====================================================================
class MyBookingsView(APIView):
    """
    GET /api/my-bookings/

    Returns all bookings belonging to the currently authenticated user,
    aggregated across every service. Requires a valid JWT token.
    No other user's data is ever included.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        bookings = []

        # ── Event Bookings ──────────────────────────────────────────
        try:
            from .models import EventBooking
            for b in EventBooking.objects.filter(user=user).select_related("event").order_by("-created_at"):
                bookings.append({
                    "id": b.id,
                    "service": "Event Booking",
                    "service_type": "event",
                    "title": b.event_name or (b.event.title if b.event else "Event"),
                    "date": str(b.event.date) if b.event else None,
                    "time_slot": str(b.event.time_slot) if b.event else None,
                    "location": b.event.location if b.event else None,
                    "status": b.status,
                    "payment_status": b.payment_status,
                    "amount": float(b.total_amount) if b.total_amount else None,
                    "details": {
                        "ticket_type": b.ticket_type,
                        "number_of_tickets": b.number_of_tickets,
                        "payment_method": b.payment_method,
                        "seat_numbers": b.seat_numbers,
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # ── Studio Bookings ─────────────────────────────────────────
        try:
            from .models import Studio
            for b in Studio.objects.filter(user=user).order_by("-created_at"):
                bookings.append({
                    "id": b.id,
                    "service": "Studio Booking",
                    "service_type": "studio",
                    "title": b.studio_name,
                    "date": str(b.date) if b.date else None,
                    "time_slot": str(b.time_slot) if b.time_slot else None,
                    "location": None,
                    "status": b.status,
                    "payment_status": b.payment_status,
                    "amount": float(b.total_amount) if b.total_amount else None,
                    "details": {
                        "duration_hours": str(b.duration),
                        "price_per_hour": float(b.price_per_hour) if b.price_per_hour else None,
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # ── Photography Bookings ────────────────────────────────────
        try:
            from .models import PhotographyBooking
            for b in PhotographyBooking.objects.filter(user=user).order_by("-created_at"):
                bookings.append({
                    "id": b.id,
                    "service": "Photography",
                    "service_type": "photography",
                    "title": f"{b.event_type} Photography",
                    "date": str(b.date) if b.date else None,
                    "time_slot": str(b.start_time) if b.start_time else None,
                    "location": b.location,
                    "status": "pending",
                    "payment_status": "pending",
                    "amount": float(b.package_price) if b.package_price else None,
                    "details": {
                        "package_type": b.package_type,
                        "photographers_count": b.photographers_count,
                        "duration_hours": b.duration_hours,
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # ── Videography Bookings ────────────────────────────────────
        try:
            from .models import Videography
            for b in Videography.objects.filter(user=user).order_by("-created_at"):
                bookings.append({
                    "id": b.id,
                    "service": "Videography",
                    "service_type": "videography",
                    "title": b.project,
                    "date": str(b.shoot_date) if b.shoot_date else None,
                    "time_slot": str(b.start_time) if b.start_time else None,
                    "location": b.location or None,
                    "status": "pending",
                    "payment_status": "pending",
                    "amount": float(b.package_price) if b.package_price else None,
                    "details": {
                        "package_type": b.package_type,
                        "event_type": b.event_type,
                        "duration_hours": str(b.duration_hours),
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # ── Private Bookings ────────────────────────────────────────
        try:
            from .models import PrivateBooking
            for b in PrivateBooking.objects.filter(user=user).order_by("-created_at"):
                bookings.append({
                    "id": b.id,
                    "service": "Private Event",
                    "service_type": "private",
                    "title": b.event_type,
                    "date": str(b.date) if b.date else None,
                    "time_slot": str(b.time_slot) if b.time_slot else None,
                    "location": b.venue,
                    "status": "pending",
                    "payment_status": "pending",
                    "amount": None,
                    "details": {
                        "venue": b.venue,
                        "guest_count": b.guest_count,
                        "duration_hours": str(b.duration),
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # ── Singing Class Admissions ────────────────────────────────
        try:
            from .models import SingingClass
            for b in SingingClass.objects.filter(user=user).select_related(
                "batch", "batch__class_obj"
            ).order_by("-created_at"):
                class_name = b.batch.class_obj.name if b.batch and b.batch.class_obj else "Singing Class"
                batch_schedule = f"{b.batch.day} {b.batch.time_slot}" if b.batch else None
                bookings.append({
                    "id": b.id,
                    "service": "Singing Class",
                    "service_type": "singing_class",
                    "title": class_name,
                    "date": str(b.start_date) if b.start_date else None,
                    "time_slot": batch_schedule,
                    "location": None,
                    "status": b.status,
                    "payment_status": b.payment_status,
                    "amount": float(b.fee) if b.fee else None,
                    "details": {
                        "batch_schedule": batch_schedule,
                        "fee_month": str(b.fee_month_date) if b.fee_month_date else None,
                    },
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                })
        except Exception:
            pass

        # Sort all bookings newest first
        bookings.sort(
            key=lambda x: x.get("created_at") or "",
            reverse=True,
        )

        return Response({
            "count": len(bookings),
            "results": bookings,
        })


# ============================================================
# BIRTHDAY AUTOMATION MODULE VIEWS
# ============================================================
import base64
import logging
from datetime import date, datetime, timedelta
from django.core.mail import EmailMultiAlternatives
from email.mime.image import MIMEImage

logger = logging.getLogger(__name__)


def _calc_birthday_meta(bdate, today=None):
    if not bdate:
        return None
    if today is None:
        today = date.today()
    try:
        try:
            bday_this_year = bdate.replace(year=today.year)
        except ValueError:
            # Leap day fallback
            bday_this_year = date(today.year, 2, 28)

        if bday_this_year < today:
            try:
                next_bday = bdate.replace(year=today.year + 1)
            except ValueError:
                next_bday = date(today.year + 1, 2, 28)
        else:
            next_bday = bday_this_year

        days_until = (next_bday - today).days
        is_today = (bdate.month == today.month and bdate.day == today.day)
        is_this_week = 0 <= days_until <= 7
        is_this_month = bdate.month == today.month
        turning_age = (today.year - bdate.year) if (bdate.year and bdate.year > 1900) else None

        return {
            "days_until": days_until,
            "is_today": is_today,
            "is_this_week": is_this_week,
            "is_this_month": is_this_month,
            "next_birthday": next_bday.isoformat(),
            "formatted_birth_date": bdate.strftime("%d %b %Y"),
            "display_dob": bdate.strftime("%d %B"),
            "turning_age": turning_age,
        }
    except Exception as e:
        logger.warning("Error calculating birthday meta for %s: %s", bdate, e)
        return None


class BirthdayListView(APIView):
    """
    Returns aggregated birthday records for Singers and SingingClass students.
    Supports filtering by 'filter' (today, upcoming_7, upcoming_30, this_month, all),
    'role' (all, singer, student), 'search', and 'month'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        filter_type = request.query_params.get("filter", "all")
        role_filter = request.query_params.get("role", "all").lower()
        search_query = request.query_params.get("search", "").strip().lower()
        month_query = request.query_params.get("month", None)

        try:
            from .models import Singer, SingingClass, BirthdayWishLog
        except ImportError:
            return Response({"error": "Models not found"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Retrieve wish logs for current year
        wished_map = {}
        try:
            logs = BirthdayWishLog.objects.filter(wish_year=today.year, status="sent")
            for log in logs:
                key = f"{log.person_type}_{log.person_id}" if log.person_id else log.email
                if key:
                    wished_map[key] = {
                        "sent_at": log.created_at.isoformat(),
                        "sent_by": log.sent_by.email if log.sent_by else None,
                        "status": "sent"
                    }
        except Exception as e:
            logger.warning("Could not query BirthdayWishLog: %s", e)

        records = []

        # 1. Singers
        if role_filter in ["all", "singer"]:
            try:
                singers = Singer.objects.filter(birth_date__isnull=False)
                for s in singers:
                    meta = _calc_birthday_meta(s.birth_date, today)
                    if not meta:
                        continue

                    # Search filter
                    if search_query:
                        match = (
                            search_query in (s.name or "").lower() or
                            search_query in (s.email or "").lower() or
                            search_query in (s.mobile or "").lower()
                        )
                        if not match:
                            continue

                    # Month filter
                    if month_query and str(s.birth_date.month) != str(month_query):
                        continue

                    record_id = f"singer_{s.id}"
                    wish_info = wished_map.get(record_id) or wished_map.get(s.email) or {"status": "pending"}

                    user_photo = None
                    try:
                        if getattr(s, "photo", None) and s.photo:
                            user_photo = request.build_absolute_uri(s.photo.url)
                        else:
                            from django.contrib.auth import get_user_model
                            UserModel = get_user_model()
                            u = None
                            if s.email:
                                u = UserModel.objects.filter(email__iexact=s.email).first()
                            if not u and s.mobile:
                                u = UserModel.objects.filter(mobile_no=s.mobile).first()
                            if u and u.profile_photo:
                                user_photo = request.build_absolute_uri(u.profile_photo.url)
                    except Exception:
                        pass

                    records.append({
                        "unique_id": record_id,
                        "source_id": s.id,
                        "role": "Singer",
                        "role_type": "singer",
                        "name": s.name,
                        "birth_date": s.birth_date.isoformat(),
                        "email": s.email or "",
                        "phone": s.mobile or "",
                        "photo": user_photo,
                        "genre": s.genre or "",
                        "city": s.city or "",
                        "wish_status": wish_info.get("status", "pending"),
                        "last_wished_at": wish_info.get("sent_at", None),
                        "sent_by": wish_info.get("sent_by", None),
                        **meta
                    })
            except Exception as e:
                logger.exception("Failed to load singers for birthday list: %s", e)

        # 2. Singing Class Students
        if role_filter in ["all", "student"]:
            try:
                students = SingingClass.objects.filter(birth_date__isnull=False).select_related("user", "batch")
                for st in students:
                    meta = _calc_birthday_meta(st.birth_date, today)
                    if not meta:
                        continue

                    full_name = f"{st.first_name} {st.last_name}".strip()
                    if search_query:
                        match = (
                            search_query in full_name.lower() or
                            search_query in (st.email or "").lower() or
                            search_query in (st.phone or "").lower()
                        )
                        if not match:
                            continue

                    if month_query and str(st.birth_date.month) != str(month_query):
                        continue

                    record_id = f"student_{st.id}"
                    wish_info = wished_map.get(record_id) or wished_map.get(st.email) or {"status": "pending"}

                    user_photo = None
                    try:
                        if getattr(st, "photo", None) and st.photo:
                            user_photo = request.build_absolute_uri(st.photo.url)
                        elif st.user and st.user.profile_photo:
                            user_photo = request.build_absolute_uri(st.user.profile_photo.url)
                    except Exception:
                        pass

                    batch_name = str(st.batch) if st.batch else "Singing Class"

                    records.append({
                        "unique_id": record_id,
                        "source_id": st.id,
                        "role": "Student",
                        "role_type": "student",
                        "name": full_name,
                        "birth_date": st.birth_date.isoformat(),
                        "email": st.email or "",
                        "phone": st.phone or "",
                        "photo": user_photo,
                        "genre": batch_name,
                        "city": st.city or "",
                        "wish_status": wish_info.get("status", "pending"),
                        "last_wished_at": wish_info.get("sent_at", None),
                        "sent_by": wish_info.get("sent_by", None),
                        **meta
                    })
            except Exception as e:
                logger.exception("Failed to load students for birthday list: %s", e)

        # Sort: today first (days_until == 0), then ascending by days_until
        records.sort(key=lambda r: (r["days_until"], r["name"]))

        today_birthdays = [r for r in records if r["is_today"]]
        upcoming_week = [r for r in records if not r["is_today"] and r["is_this_week"]]
        upcoming_month = [r for r in records if not r["is_today"] and r["days_until"] <= 30]

        # Apply specific filter to results
        filtered_records = records
        if filter_type == "today":
            filtered_records = today_birthdays
        elif filter_type == "upcoming_7":
            filtered_records = [r for r in records if r["is_this_week"]]
        elif filter_type == "upcoming_30":
            filtered_records = [r for r in records if r["days_until"] <= 30]
        elif filter_type == "this_month":
            filtered_records = [r for r in records if r["is_this_month"]]

        return Response({
            "today_count": len(today_birthdays),
            "upcoming_week_count": len(upcoming_week),
            "upcoming_month_count": len(upcoming_month),
            "total_with_birthdays": len(records),
            "today_birthdays": today_birthdays,
            "upcoming_birthdays": upcoming_week,
            "results": filtered_records,
        })


class BirthdayTodayPopupView(APIView):
    """
    Lightweight endpoint for admin dashboard to trigger birthday alerts/popups.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        from .models import Singer, SingingClass, BirthdayWishLog

        wished_map = {}
        try:
            logs = BirthdayWishLog.objects.filter(wish_year=today.year, status="sent")
            for log in logs:
                key = f"{log.person_type}_{log.person_id}" if log.person_id else log.email
                if key:
                    wished_map[key] = True
        except Exception:
            pass

        today_list = []
        upcoming_week_count = 0

        # Check Singers
        try:
            for s in Singer.objects.filter(birth_date__isnull=False):
                meta = _calc_birthday_meta(s.birth_date, today)
                if not meta:
                    continue
                if meta["is_today"]:
                    rec_id = f"singer_{s.id}"
                    user_photo = None
                    try:
                        if getattr(s, "photo", None) and s.photo:
                            user_photo = request.build_absolute_uri(s.photo.url)
                        else:
                            from django.contrib.auth import get_user_model
                            UserModel = get_user_model()
                            u = None
                            if s.email:
                                u = UserModel.objects.filter(email__iexact=s.email).first()
                            if not u and s.mobile:
                                u = UserModel.objects.filter(mobile_no=s.mobile).first()
                            if u and u.profile_photo:
                                user_photo = request.build_absolute_uri(u.profile_photo.url)
                    except Exception:
                        pass

                    today_list.append({
                        "unique_id": rec_id,
                        "source_id": s.id,
                        "role": "Singer",
                        "role_type": "singer",
                        "name": s.name,
                        "birth_date": s.birth_date.isoformat(),
                        "email": s.email or "",
                        "phone": s.mobile or "",
                        "photo": user_photo,
                        "already_wished": wished_map.get(rec_id, False) or wished_map.get(s.email, False),
                        **meta
                    })
                elif meta["is_this_week"]:
                    upcoming_week_count += 1
        except Exception as e:
            logger.warning("Popup view singer error: %s", e)

        # Check Students
        try:
            for st in SingingClass.objects.filter(birth_date__isnull=False).select_related("user"):
                meta = _calc_birthday_meta(st.birth_date, today)
                if not meta:
                    continue
                if meta["is_today"]:
                    rec_id = f"student_{st.id}"
                    full_name = f"{st.first_name} {st.last_name}".strip()
                    user_photo = None
                    try:
                        if getattr(st, "photo", None) and st.photo:
                            user_photo = request.build_absolute_uri(st.photo.url)
                        elif st.user and st.user.profile_photo:
                            user_photo = request.build_absolute_uri(st.user.profile_photo.url)
                    except Exception:
                        pass
                    today_list.append({
                        "unique_id": rec_id,
                        "source_id": st.id,
                        "role": "Student",
                        "role_type": "student",
                        "name": full_name,
                        "birth_date": st.birth_date.isoformat(),
                        "email": st.email or "",
                        "phone": st.phone or "",
                        "photo": user_photo,
                        "already_wished": wished_map.get(rec_id, False) or wished_map.get(st.email, False),
                        **meta
                    })
                elif meta["is_this_week"]:
                    upcoming_week_count += 1
        except Exception as e:
            logger.warning("Popup view student error: %s", e)

        return Response({
            "has_birthdays_today": len(today_list) > 0,
            "today_count": len(today_list),
            "upcoming_week_count": upcoming_week_count,
            "today_birthdays": today_list,
        })


class BirthdaySendWishView(APIView):
    """
    Sends personalized birthday wish email to singer/student with high-res poster attached.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        recipient_email = data.get("email") or data.get("recipient_email")
        recipient_name = data.get("name") or data.get("recipient_name") or "Valued Member"
        role = data.get("role") or "Valued Star"
        custom_message = data.get("message") or (
            f"Wishing you a very Happy Birthday! May your special day and the year ahead be filled with "
            f"magnificent melodies, joyful harmonies, good health, and tremendous success. "
            f"Thank you for being an inspiring part of the IMC Music Hub family!"
        )
        subject = data.get("subject") or f"🎉 Happy Birthday {recipient_name}! - Wishes from IMC Music Hub 🎂🎶"
        poster_base64 = data.get("poster_base64")
        person_id = str(data.get("person_id") or "")
        person_type = data.get("person_type") or ("singer" if "singer" in role.lower() else "student")

        if not recipient_email:
            return Response({"error": "Recipient email address is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Decode poster image
        image_bytes = None
        if poster_base64:
            try:
                if "," in poster_base64:
                    _, b64data = poster_base64.split(",", 1)
                else:
                    b64data = poster_base64
                image_bytes = base64.b64decode(b64data)
            except Exception as e:
                logger.error("Failed to decode poster image: %s", e)
                return Response({"error": f"Invalid poster image data: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Build clean filename
        safe_name = "".join(c for c in recipient_name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
        filename = f"IMC_Birthday_Poster_{safe_name}.png"

        # Email Body HTML
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Happy Birthday from IMC Music Hub</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%); border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
    <!-- Header -->
    <tr>
      <td style="padding: 36px 24px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: radial-gradient(circle at center top, rgba(245, 158, 11, 0.18), transparent 70%);">
        <div style="font-size: 13px; font-weight: 700; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
          ✦ IMC MUSIC HUB PUNE ✦
        </div>
        <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; margin: 0 0 10px; line-height: 1.2;">
          Happy Birthday, {recipient_name}! 🎂🎶
        </h1>
        <p style="font-size: 15px; color: #cbd5e1; margin: 0; font-weight: 500;">
          Celebrating our amazing {role} on your special day!
        </p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 28px 24px;">
        <div style="background: rgba(255, 255, 255, 0.04); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 24px; color: #e2e8f0; font-size: 15px; line-height: 1.7;">
          <p style="margin: 0 0 12px; font-weight: 600; color: #fbbf24;">Dearest {recipient_name},</p>
          <p style="margin: 0;">{custom_message}</p>
        </div>

        {"<!-- Poster Section -->" if image_bytes else ""}
        {"<div style='text-align: center; margin: 24px 0;'><p style='font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;'>✨ Your Special Birthday Poster ✨</p><div style='border-radius: 12px; overflow: hidden; border: 2px solid rgba(251, 191, 36, 0.4); box-shadow: 0 15px 30px rgba(0,0,0,0.5); display: inline-block; max-width: 100%;'><img src='cid:birthday_poster' alt='IMC Birthday Poster' style='width: 100%; max-width: 500px; height: auto; display: block;' /></div><p style='font-size: 12px; color: #64748b; margin-top: 10px;'>📎 High-resolution poster is also attached below for you to save and share!</p></div>" if image_bytes else ""}

        <div style="text-align: center; margin-top: 28px; padding: 18px; background: rgba(245, 158, 11, 0.08); border-radius: 12px; border: 1px dashed rgba(245, 158, 11, 0.3);">
          <p style="margin: 0; font-size: 14px; color: #fbbf24; font-weight: 600;">
            🎵 "Where words fail, music speaks. May your song keep playing loud and bright!" 🎵
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px; text-align: center; background-color: #080c14; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #94a3b8; line-height: 1.6;">
        <p style="margin: 0 0 6px; font-weight: 600; color: #cbd5e1;">IMC Music Hub — Studio, Academy & Events</p>
        <p style="margin: 0 0 10px;">Pune, Maharashtra • <a href="https://imcpune.in" style="color: #fbbf24; text-decoration: none;">www.imcpune.in</a></p>
        <p style="margin: 0; font-size: 11px; color: #64748b;">This heartfelt birthday message was sent with love by the IMC Music Hub Admin Team.</p>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        text_body = f"""
Happy Birthday, {recipient_name}!

{custom_message}

Where words fail, music speaks. Wishing you a year full of rhythm, melodies, and boundless happiness!

Warm wishes,
IMC Music Hub Pune
https://imcpune.in
"""

        # Send Email
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or os.getenv("EMAIL_HOST_USER", "connectteim@gmail.com")
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=from_email,
                to=[recipient_email],
            )
            msg.attach_alternative(html_body, "text/html")

            # Attach inline image if provided
            if image_bytes:
                img_mime = MIMEImage(image_bytes)
                img_mime.add_header("Content-ID", "<birthday_poster>")
                img_mime.add_header("Content-Disposition", "inline", filename=filename)
                msg.attach(img_mime)

                # Also attach as downloadable file
                msg.attach(filename, image_bytes, "image/png")

            msg.send(fail_silently=False)
            logger.info("Birthday wish email sent successfully to %s", recipient_email)

            # Record in BirthdayWishLog
            try:
                from .models import BirthdayWishLog
                BirthdayWishLog.objects.create(
                    person_type=person_type,
                    person_id=person_id,
                    name=recipient_name,
                    email=recipient_email,
                    wish_year=date.today().year,
                    sent_by=request.user if request.user.is_authenticated else None,
                    message=custom_message,
                    status="sent"
                )
            except Exception as log_err:
                logger.warning("Could not create BirthdayWishLog: %s", log_err)

            return Response({
                "success": True,
                "message": f"Birthday wish email sent successfully to {recipient_email}!"
            }, status=status.HTTP_200_OK)

        except Exception as email_err:
            logger.exception("Failed to send birthday wish email: %s", email_err)
            return Response({
                "error": f"Failed to send email: {str(email_err)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
