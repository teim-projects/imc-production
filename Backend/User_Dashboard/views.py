# User_Dashboard/views.py
from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action

from api.models import StudioMaster
from .models import UserStudioBooking
from .serializers import StudioPublicSerializer, UserStudioBookingSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Users may see their own bookings; staff can see all.
    """

    def has_object_permission(self, request, view, obj):
        # safe methods always allowed
        if request.method in permissions.SAFE_METHODS:
            if request.user.is_staff or request.user.is_superuser:
                return True
            return obj.user == request.user
        # write operations:
        if request.user.is_staff or request.user.is_superuser:
            return True
        return obj.user == request.user


class PublicStudioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only list of active studios for the user side.
    """
    queryset = StudioMaster.objects.filter(is_active=True).order_by("name")
    serializer_class = StudioPublicSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "location", "city", "area", "state"]
    ordering_fields = ["name", "hourly_rate", "capacity"]
    ordering = ["name"]


class UserStudioBookingViewSet(viewsets.ModelViewSet):
    """
    User / customer bookings.
    - Authenticated user: sees only their bookings (unless staff).
    - Anonymous: can create bookings, but cannot list (for safety).
    """

    serializer_class = UserStudioBookingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["customer_name", "email", "contact_number", "studio__name"]
    ordering_fields = ["date", "time_slot", "created_at"]
    ordering = ["-date", "-time_slot"]

    def get_queryset(self):
        qs = UserStudioBooking.objects.select_related("studio")
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return qs
        if user.is_authenticated:
            return qs.filter(user=user)
        # anonymous – no listing, only create allowed
        return qs.none()

    def perform_create(self, serializer):
        serializer.save()
        # user assignment is already done in serializer.create()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my(self, request, *args, **kwargs):
        """
        GET /user/studio-bookings/my/ => current user's bookings.
        """
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)



from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from api.models import PhotographyBooking
from .serializers import UserPhotographyBookingSerializer


class UserPhotographyBookingViewSet(ModelViewSet):
    serializer_class = UserPhotographyBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PhotographyBooking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# User_Dashboard/views.py

from rest_framework import viewsets, permissions, filters
from api.models import Event, EventBooking
from .serializers import EventListSerializer, UserEventBookingSerializer


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /user/events/
      GET /user/events/        -> list all events (user side)
      GET /user/events/<id>/   -> single event detail

    Uses EventListSerializer to map internal Event fields
    (title/date/time_slot/etc.) to the frontend shape:
      - name
      - event_date
      - event_time
      - location
      - ticket_price, basic_price, premium_price, vip_price
      - available_seats
      - booked_seats
      - user_booked_seats (if request.user is authenticated)
    """
    queryset = Event.objects.all().order_by("-date", "time_slot", "-created_at")
    serializer_class = EventListSerializer
    permission_classes = [permissions.AllowAny]

    # optional: search + ordering (for future filters/search)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "location", "description", "event_type"]
    ordering_fields = [
        "date",
        "time_slot",
        "created_at",
        "total_seats",
        "available_seats",
        "basic_price",
        "premium_price",
        "vip_price",
        "ticket_price",
    ]
    ordering = ["-date", "time_slot"]

    def get_serializer_context(self):
        """
        Pass request in context so serializer can compute user_booked_seats
        based on request.user.
        """
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class UserEventBookingViewSet(viewsets.ModelViewSet):
    """
    /user/event-bookings/
      GET  /user/event-bookings/        -> list current user's bookings
      POST /user/event-bookings/        -> create booking for an event
      GET  /user/event-bookings/<id>/   -> booking detail
      PUT/PATCH/DELETE (optional)       -> on user's own bookings

    Frontend:
      - POST from SeatSelectionModal:
          {
            "event": 1,
            "customer_name": "...",
            "contact_number": "...",
            "email": "",
            "ticket_type": "basic" | "premium" | "vip",
            "number_of_tickets": 2,
            "seat_numbers": ["basic-1-01","basic-1-02"],
            "total_amount": "500.00",
            "payment_method": "UPI" | "Card" | "Cash"
          }

      - GET from "My Bookings" modal:
          returns list of objects like:
          {
            "id": ...,
            "event": 1,
            "event_detail": {
                "id": ...,
                "name": "...",
                "event_date": "2025-01-01",
                "event_time": "19:00:00",
                "location": "...",
                ...
            },
            "customer_name": "...",
            "contact_number": "...",
            "ticket_type": "basic",
            "number_of_tickets": 2,
            "seat_numbers": ["basic-1-01","basic-1-02"],
            "total_amount": "500.00",
            "payment_method": "UPI",
            "created_at": "2025-01-01T10:30:00Z"
          }
    """

    serializer_class = UserEventBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Only bookings of the logged-in user, newest first.
        We also join the related event so serializer can expose event_detail.
        """
        return (
            EventBooking.objects
            .filter(user=self.request.user)
            .select_related("event")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        """
        Ensure serializer has access to request for any user-specific logic.
        """
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        """
        Attach the authenticated user to the booking.
        Any extra logic (like seat validation / total_amount calculation)
        should live in UserEventBookingSerializer.validate()/create().
        """
        serializer.save(user=self.request.user)



# ... your existing PublicEventViewSet & UserEventBookingViewSet ...
# User_Dashboard/views.py
from rest_framework import viewsets, permissions, filters
from api.models import Event, EventBooking, Singer
from .serializers import (
    EventListSerializer,
    UserEventBookingSerializer,
    SingerListSerializer,
)

# ... PublicEventViewSet + UserEventBookingViewSet above ...


class SingerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /user/singer/
      GET /user/singer/       -> list available singers (view-only)
      GET /user/singer/<id>/  -> single singer detail
    """

    serializer_class = SingerListSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Singer.objects.filter(active=True).order_by("name")

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "genre", "city", "area", "state", "profession"]
    ordering_fields = ["name", "experience", "rate", "city"]
    ordering = ["name"]

    def get_serializer_context(self):
        """
        Ensure request is in context so photo_url builds absolute URL.
        """
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx







# ====================================================================
# Singer Master (Service)
# ====================================================================
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from api.models import Singer
from .serializers import (
    StudioPublicSerializer,
    UserStudioBookingSerializer,
)

# -------------------------------
# PUBLIC SINGER LIST (READ ONLY)
# -------------------------------
class SingerPublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Singer.objects.all().order_by("-id")
    serializer_class = StudioPublicSerializer
    permission_classes = [permissions.AllowAny]


# -------------------------------
# USER BOOKINGS (EXAMPLE)
# -------------------------------
class UserStudioBookingViewSet(viewsets.ModelViewSet):
    serializer_class = UserStudioBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.serializer_class.Meta.model.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# -------------------------------
# SIMPLE FUNCTION VIEW (OPTIONAL)
# -------------------------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def singer_list(request):
    singers = Singer.objects.all()
    serializer = StudioPublicSerializer(singers, many=True)
    return Response(serializer.data)

