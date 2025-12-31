# User_Dashboard/serializers.py
from rest_framework import serializers
from api.models import StudioMaster, StudioImage   # 👈 make sure StudioImage is imported
from .models import UserStudioBooking


# --------- PUBLIC STUDIO SERIALIZERS (for /user/studios/) --------- #

class PublicStudioImageSerializer(serializers.ModelSerializer):
    """
    Minimal studio image representation for the user side.
    Returns an absolute URL in 'url'.
    """
    url = serializers.SerializerMethodField()

    class Meta:
        model = StudioImage      # adjust if your model name is different
        fields = ["id", "url", "caption"]

    def get_url(self, obj):
        if not getattr(obj, "image", None):
            return ""
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class StudioPublicSerializer(serializers.ModelSerializer):
    """
    Read-only minimal view of StudioMaster for the user side.
    Now includes images + first_image so React can show thumbnails.
    """
    full_location = serializers.ReadOnlyField()
    images = PublicStudioImageSerializer(many=True, read_only=True)
    first_image = serializers.SerializerMethodField()

    class Meta:
        model = StudioMaster
        fields = [
            "id",
            "name",
            "full_location",
            "hourly_rate",
            "capacity",
            "google_map_link",
            "is_active",
            "images",       # 👈 list of images
            "first_image",  # 👈 single thumbnail URL
        ]
        read_only_fields = fields

    def get_first_image(self, obj):
        """
        Return the first image URL (absolute) for card thumbnail.
        """
        # assuming related_name="images" on StudioImage model
        if not hasattr(obj, "images"):
            return ""

        img = obj.images.first()
        if not img or not getattr(img, "image", None):
            return ""

        request = self.context.get("request")
        url = img.image.url
        return request.build_absolute_uri(url) if request else url


# --------- USER STUDIO BOOKING SERIALIZER (unchanged except imports) --------- #

class UserStudioBookingSerializer(serializers.ModelSerializer):
    studio_name = serializers.ReadOnlyField(source="studio.name")
    payment_methods = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="Array of payment methods (Card, UPI, NetBanking, Cash).",
    )
    payment_methods_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserStudioBooking
        fields = [
            "id",
            "user",
            "studio",
            "studio_name",
            "customer_name",
            "contact_number",
            "email",
            "address",
            "date",
            "time_slot",
            "duration_hours",
            "payment_methods",          # input
            "payment_methods_display",  # output
            "agreed_price",
            "notes",
            "is_cancelled",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "user",
            "studio_name",
            "payment_methods_display",
            "created_at",
            "updated_at",
        )

    def get_payment_methods_display(self, obj):
        return obj.payment_methods

    def validate_payment_methods(self, value):
        allowed = {c[0] for c in UserStudioBooking.PAYMENT_CHOICES}
        for v in value:
            if v not in allowed:
                raise serializers.ValidationError(
                    f"Invalid payment method '{v}'. Allowed: {', '.join(allowed)}"
                )
        return value

    def validate(self, attrs):
        date = attrs.get("date") or getattr(self.instance, "date", None)
        duration = attrs.get("duration_hours") or getattr(self.instance, "duration_hours", 0)
        if duration is None or float(duration) <= 0:
            raise serializers.ValidationError({"duration_hours": "Duration must be greater than 0."})
        if date is None:
            raise serializers.ValidationError({"date": "Date is required."})
        return attrs

    def create(self, validated_data):
        payment_methods = validated_data.pop("payment_methods", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user

        instance = super().create(validated_data)
        instance.payment_methods = payment_methods
        instance.save(update_fields=["payment_methods_csv"])
        return instance

    def update(self, instance, validated_data):
        payment_methods = validated_data.pop("payment_methods", None)
        instance = super().update(instance, validated_data)
        if payment_methods is not None:
            instance.payment_methods = payment_methods
            instance.save(update_fields=["payment_methods_csv"])
        return instance
from rest_framework import serializers
from api.models import PhotographyBooking


class UserPhotographyBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotographyBooking
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)




# User_Dashboard/serializers.py
from rest_framework import serializers
from api.models import Event, EventBooking


# -------------------------------------------------------------------
# Small event serializer used inside bookings + base for event list
# -------------------------------------------------------------------
class MiniEventSerializer(serializers.ModelSerializer):
    """
    Common mapping of Event -> fields used in React.
    """

    name = serializers.CharField(source="title")
    event_date = serializers.DateField(source="date")
    event_time = serializers.CharField(source="time_slot")

    class Meta:
        model = Event
        fields = [
            "id",
            "name",        # from title
            "event_type",
            "event_date",  # from date
            "event_time",  # from time_slot
            "location",
        ]


# -------------------------------------------------------------------
# Public event serializer for /user/events/
# -------------------------------------------------------------------
class EventListSerializer(MiniEventSerializer):
    """
    Public event serializer for user side (used on UserEvents.jsx).
    Extends MiniEventSerializer and adds price/seat fields plus:
      - booked_seats:    all seat ids booked for this event
      - user_booked_seats: seat ids booked by current user
    """

    ticket_price = serializers.SerializerMethodField()
    booked_seats = serializers.SerializerMethodField()
    user_booked_seats = serializers.SerializerMethodField()

    class Meta(MiniEventSerializer.Meta):
        model = Event
        fields = MiniEventSerializer.Meta.fields + [
            "description",
            # prices
            "ticket_price",   # computed
            "basic_price",
            "premium_price",
            "vip_price",
            # seats (overall + per tier)
            "basic_seats",
            "premium_seats",
            "vip_seats",
            "total_seats",
            "available_seats",
            # seat maps
            "booked_seats",
            "user_booked_seats",
        ]

    def get_ticket_price(self, obj):
        """
        Main price for card UI: prefer basic_price, else legacy ticket_price, else 0.
        """
        if obj.basic_price is not None:
            return obj.basic_price
        if obj.ticket_price is not None:
            return obj.ticket_price
        return 0

    # ---------- helpers for booked seats ----------

    def _flatten_seat_numbers(self, queryset):
        """
        Turn seat_numbers from multiple bookings into a flat list of strings.
        Works with JSONField(list) or comma-separated string.
        """
        seats = []
        for booking in queryset:
            sn = getattr(booking, "seat_numbers", None)
            if not sn:
                continue

            if isinstance(sn, (list, tuple)):
                seats.extend([str(s).strip() for s in sn if str(s).strip()])
            else:
                parts = str(sn).split(",")
                seats.extend([p.strip() for p in parts if p.strip()])

        return seats

    def get_booked_seats(self, obj):
        qs = EventBooking.objects.filter(event=obj)
        return self._flatten_seat_numbers(qs)

    def get_user_booked_seats(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return []
        qs = EventBooking.objects.filter(event=obj, user=request.user)
        return self._flatten_seat_numbers(qs)


# -------------------------------------------------------------------
# User bookings serializer for /user/event-bookings/
# -------------------------------------------------------------------
class UserEventBookingSerializer(serializers.ModelSerializer):
    """
    Serializer for user's event bookings (list + create).

    Used by: /user/event-bookings/  ViewSet.

    Frontend (MyBookingsModal) expects:
      - event_detail: MiniEventSerializer(event)
      - event_name: snapshot of event.title
      - seat_numbers: list of seat ids (["premium-1-02", ...])
    """

    # this is filled automatically from event.title
    event_name = serializers.CharField(read_only=True)

    # nested event info for MyBookingsModal
    event_detail = MiniEventSerializer(source="event", read_only=True)

    # will store JSON list in DB (recommended: JSONField)
    seat_numbers = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = EventBooking
        fields = [
            "id",
            "event",
            "event_name",
            "event_detail",     # nested event data
            "customer_name",
            "contact_number",
            "email",
            "ticket_type",        # basic / premium / vip / general
            "number_of_tickets",
            "seat_numbers",       # list of seat ids
            "total_amount",
            "payment_method",     # UPI / Card / Cash
            "status",             # confirmed / pending / cancelled
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "event_name",
            "event_detail",
            "status",
            "created_at",
        ]

    # -------- helpers --------

    def _tier_capacity(self, event, ticket_type: str) -> int:
        """
        Simple per-tier capacity based on Event fields.
        (Currently static – not decreased per booking.)
        """
        t = (ticket_type or "general").lower()
        if t == "basic":
            return event.basic_seats or 0
        if t == "premium":
            return event.premium_seats or 0
        if t == "vip":
            return event.vip_seats or 0
        # "general" – fall back to total_seats (or unlimited if 0)
        return event.total_seats or 0

    def _pick_price(self, event, ticket_type: str):
        """
        Decide price per ticket based on ticket_type and Event tier fields.
        """
        ticket_type = (ticket_type or "general").lower()

        if ticket_type == "basic" and event.basic_price is not None:
            return event.basic_price
        if ticket_type == "premium" and event.premium_price is not None:
            return event.premium_price
        if ticket_type == "vip" and event.vip_price is not None:
            return event.vip_price

        # fallback to legacy general price
        if event.ticket_price is not None:
            return event.ticket_price

        # last fallback
        return 0

    # -------- validation / create --------

    def validate(self, attrs):
        event = attrs.get("event")
        number_of_tickets = attrs.get("number_of_tickets", 1)
        ticket_type = attrs.get("ticket_type") or "general"

        if not event:
            raise serializers.ValidationError("Event is required.")

        if number_of_tickets < 1:
            raise serializers.ValidationError(
                {"number_of_tickets": "Number of tickets must be at least 1."}
            )

        # simple capacity check against configured seats
        capacity = self._tier_capacity(event, ticket_type)
        if capacity and number_of_tickets > capacity:
            raise serializers.ValidationError(
                {
                    "number_of_tickets": (
                        f"Maximum {capacity} ticket(s) available for {ticket_type} tier."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        event = validated_data["event"]
        number_of_tickets = validated_data.get("number_of_tickets", 1)
        ticket_type = validated_data.get("ticket_type") or "general"

        # snapshot event title
        validated_data["event_name"] = event.title

        # attach user if logged in
        if user and user.is_authenticated:
            validated_data["user"] = user

        # normalise seat_numbers so we always store list[str]
        sn = validated_data.get("seat_numbers")
        if sn is None:
            pass
        elif isinstance(sn, (list, tuple)):
            validated_data["seat_numbers"] = [str(s).strip() for s in sn if str(s).strip()]
        else:
            parts = str(sn).split(",")
            validated_data["seat_numbers"] = [p.strip() for p in parts if p.strip()]

        # auto-calculate total_amount if not provided or <= 0
        price_per_ticket = self._pick_price(event, ticket_type)
        total_amount = validated_data.get("total_amount")
        if not total_amount or total_amount <= 0:
            validated_data["total_amount"] = price_per_ticket * number_of_tickets

        # default status – confirmed
        if not validated_data.get("status"):
            validated_data["status"] = "confirmed"

        return super().create(validated_data)





# User_Dashboard/serializers.py
from rest_framework import serializers
from api.models import Event, EventBooking, Singer

# ... your other serializers (EventListSerializer, UserEventBookingSerializer, etc.) ...


class SingerListSerializer(serializers.ModelSerializer):
    """
    Serializer for singer listing on frontend.
    """
    display_name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Singer
        fields = [
            "id",
            "display_name",
            "name",
            "genre",
            "city",
            "state",
            "area",
            "experience",
            "rate",
            "mobile",
            "gender",
            "birth_date",
            "achievement",
            "education",
            "favourite_singer",
            "profession",
            "reference_by",
            "photo",
            "photo_url",
            "active",
        ]

    def get_display_name(self, obj):
        return obj.name

    def get_photo_url(self, obj):
        """
        Returns absolute URL for singer photo (or None).
        """
        if not obj.photo:
            return None
        try:
            url = obj.photo.url
        except ValueError:
            return None

        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(url)
        return url





# ---------------------------------------------------------------------
# Singer Master (Service)
# ---------------------------------------------------------------------
from rest_framework import serializers
from api.models import Singer


class UserSingerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Singer
        fields = "__all__"

