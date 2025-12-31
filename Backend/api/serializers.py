# api/serializers.py
from decimal import Decimal, InvalidOperation
import re
from datetime import date

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import EmailMultiAlternatives
from django.db import IntegrityError, transaction

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer, UserDetailsSerializer

from .models import (
    # Core / Users
    CustomUser,
    # Studio master + bookings
    StudioMaster, Studio,
    # CRM modules
    PrivateBooking,
    PhotographyBooking,
    Event,  Payment, Videography,
   
    # Sound service
    Sound,
)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def to_decimal_or_zero(val):
    """
    Safely coerce strings/numbers like "999", "999.50", 999 -> Decimal("999.50").
    Returns Decimal("0") for None/"". Raises ValidationError if malformed.
    """
    if val in (None, ""):
        return Decimal("0")
    try:
        return Decimal(str(val))
    except (InvalidOperation, ValueError, TypeError):
        raise serializers.ValidationError("Enter a valid numeric amount.")

phone_regex = re.compile(r"\+?\d{7,15}")

def _validate_phone(value: str):
    if value in (None, ""):
        return value
    if not phone_regex.fullmatch(value.strip()):
        raise serializers.ValidationError("Enter a valid phone number (7–15 digits, optional +).")
    return value

def _ensure_hms(t: str) -> str:
    """
    If 't' is 'HH:MM' -> convert to 'HH:MM:00'. If already 'HH:MM:SS', return as-is.
    """
    if not t:
        return t
    s = str(t).strip()
    if re.fullmatch(r"\d{2}:\d{2}", s):
        return f"{s}:00"
    return s


# ---------------------------------------------------------------------
# Studio Master (catalog)
# ---------------------------------------------------------------------
# api/serializers.py
# api/serializers.py
from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from .models import StudioMaster, StudioImage

class StudioImageSerializer(serializers.ModelSerializer):
    # Provide full absolute URL for the frontend
    url = serializers.SerializerMethodField()

    class Meta:
        model = StudioImage
        fields = ["id", "url", "caption", "is_primary", "uploaded_at"]
        read_only_fields = ["id", "url", "uploaded_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        try:
            path = obj.image.url
        except ValueError:
            return None
        if request:
            return request.build_absolute_uri(path)
        return path


class StudioMasterSerializer(serializers.ModelSerializer):
    full_location = serializers.ReadOnlyField()
    images = StudioImageSerializer(many=True, read_only=True)

    class Meta:
        model = StudioMaster
        fields = [
            "id",
            "name",
            "location",
            "area",
            "city",
            "state",
            "full_location",
            "google_map_link",
            "capacity",
            "size_sq_ft",
            "hourly_rate",
            "is_active",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "full_location", "images")

    def validate_name(self, v):
        v = (v or "").strip()
        if not v:
            raise serializers.ValidationError("Studio name is required.")
        return v

    def validate_capacity(self, v):
        if v is None:
            return v
        try:
            if int(v) < 0:
                raise serializers.ValidationError("Capacity must be 0 or greater.")
        except (TypeError, ValueError):
            raise serializers.ValidationError("Capacity must be an integer.")
        return v

    def validate_size_sq_ft(self, v):
        if v in (None, ""):
            return v
        s = str(v).strip().replace(",", "")
        try:
            Decimal(s)
        except (InvalidOperation, ValueError):
            raise serializers.ValidationError("Size (sq ft) must be numeric (e.g. 1200).")
        return str(v).strip()

    def validate_hourly_rate(self, v):
        if v in (None, ""):
            return v
        try:
            dec = Decimal(v)
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError("Hourly rate must be a valid number.")
        if dec < 0:
            raise serializers.ValidationError("Hourly rate cannot be negative.")
        return dec

    def validate_google_map_link(self, v):
        if not v:
            return v
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise serializers.ValidationError("Google map link must start with http:// or https://")
        return v

    def create(self, validated_data):
        hr = validated_data.get("hourly_rate")
        if hr is not None and not isinstance(hr, Decimal):
            try:
                validated_data["hourly_rate"] = Decimal(str(hr))
            except (InvalidOperation, TypeError, ValueError):
                validated_data["hourly_rate"] = Decimal("0.00")
        if "size_sq_ft" in validated_data and validated_data["size_sq_ft"] is not None:
            validated_data["size_sq_ft"] = str(validated_data["size_sq_ft"]).strip()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        hr = validated_data.get("hourly_rate")
        if hr is not None and not isinstance(hr, Decimal):
            try:
                validated_data["hourly_rate"] = Decimal(str(hr))
            except (InvalidOperation, TypeError, ValueError):
                validated_data["hourly_rate"] = instance.hourly_rate or Decimal("0.00")
        if "size_sq_ft" in validated_data and validated_data["size_sq_ft"] is not None:
            validated_data["size_sq_ft"] = str(validated_data["size_sq_ft"]).strip()
        return super().update(instance, validated_data)

# ---------------------------------------------------------------------
# Studio Booking
# ---------------------------------------------------------------------
from rest_framework import serializers
from .models import Studio


class StudioSerializer(serializers.ModelSerializer):
    # Expose payment_methods as a list to the UI
    payment_methods = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    # Optional: computed total price (read-only, uses @property total_price on model)
    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Studio
        # include all model fields; total_price is added as extra serializer field above
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {
            "time_slot": {"required": False, "allow_null": True},
        }

    def to_internal_value(self, data):
        data = data.copy()

        # Allow frontend to send payment_methods as CSV string OR list
        pm = data.get("payment_methods")
        if isinstance(pm, str):
            data["payment_methods"] = [s.strip() for s in pm.split(",") if s.strip()]

        # Treat empty string as null for time_slot
        if data.get("time_slot", None) == "":
            data["time_slot"] = None

        return super().to_internal_value(data)

    def validate_contact_number(self, value):
        # assumes you have _validate_phone imported somewhere above
        return _validate_phone(value)

    def validate_duration(self, value):
        if value is None or float(value) <= 0:
            raise serializers.ValidationError("Duration must be greater than 0.")
        return value

    def create(self, validated_data):
        pm = validated_data.pop("payment_methods", [])
        obj = Studio(**validated_data)
        # store CSV in model
        obj.payment_methods = ", ".join(pm) if pm else ""
        obj.full_clean()
        obj.save()
        return obj

    def update(self, instance, validated_data):
        pm = validated_data.pop("payment_methods", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if pm is not None:
            instance.payment_methods = ", ".join(pm)
        instance.full_clean()
        instance.save()
        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # frontend gets list, not CSV
        rep["payment_methods"] = instance.payment_list
        return rep




# ---------------------------------------------------------------------
# Private Booking
# ---------------------------------------------------------------------
class PrivateBookingSerializer(serializers.ModelSerializer):
    payment_methods = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = PrivateBooking
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {
            "time_slot": {"required": False, "allow_null": True},
            "guest_count": {"required": False, "allow_null": True},
            "notes": {"required": False, "allow_blank": True},
        }

    def validate_contact_number(self, value):
        return _validate_phone(value)

    def validate_duration(self, value):
        if value is None or float(value) <= 0:
            raise serializers.ValidationError("Duration must be greater than 0.")
        return value

    def to_internal_value(self, data):
        data = data.copy()
        if data.get("time_slot", None) == "":
            data["time_slot"] = None
        pm = data.get("payment_methods")
        if isinstance(pm, str):
            data["payment_methods"] = [s.strip() for s in pm.split(",") if s.strip()]
        return super().to_internal_value(data)


# ---------------------------------------------------------------------
# Photography: Booking (OLD field names to match your DB)
# ---------------------------------------------------------------------
from rest_framework import serializers
from .models import PhotographyBooking

class PhotographyBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotographyBooking
        fields = "__all__"

    def validate(self, data):
        if data.get("event_type") == "Other" and not data.get("event_type_other"):
            raise serializers.ValidationError({
                "event_type_other": "Other event type is required when selecting 'Other'."
            })

        if not data.get("payment_methods_list"):
            raise serializers.ValidationError({
                "payment_methods_list": "Select a payment method."
            })

        return data


# ---------------------------------------------------------------------
# Event / Show
# ---------------------------------------------------------------------
# api/serializers.py
# api/serializers.py
# api/serializers.py
from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "location",
            "date",
            "time_slot",
            "event_type",
            "total_seats",
            "available_seats",
            "basic_seats",
            "premium_seats",
            "vip_seats",
            "ticket_price",
            "basic_price",
            "premium_price",
            "vip_price",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        def current(field):
            if field in attrs:
                return attrs[field]
            return getattr(instance, field, None) if instance else None

        # prices
        for field in ["ticket_price", "basic_price", "premium_price", "vip_price"]:
            val = current(field)
            if val is not None and val < 0:
                raise serializers.ValidationError({field: "Must be ≥ 0."})

        # seats
        total = current("total_seats") or 0
        available = current("available_seats") or 0
        basic = current("basic_seats") or 0
        premium = current("premium_seats") or 0
        vip = current("vip_seats") or 0

        for field_name, val in [
            ("total_seats", total),
            ("available_seats", available),
            ("basic_seats", basic),
            ("premium_seats", premium),
            ("vip_seats", vip),
        ]:
            if val < 0:
                raise serializers.ValidationError({field_name: "Must be ≥ 0."})

        if available > total:
            raise serializers.ValidationError(
                {"available_seats": "Available seats cannot be more than total seats."}
            )

        if basic + premium + vip > total:
            raise serializers.ValidationError(
                {"basic_seats": "Sum of tier seats cannot exceed total seats."}
            )

        return attrs

    def create(self, validated_data):
        total = validated_data.get("total_seats", 0)
        if validated_data.get("available_seats") is None:
            validated_data["available_seats"] = total
        return super().create(validated_data)


# ---------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def to_internal_value(self, data):
        data = data.copy()
        if "amount" in data:
            try:
                data["amount"] = to_decimal_or_zero(data.get("amount"))
            except serializers.ValidationError as e:
                raise serializers.ValidationError({"amount": e.detail})
        return super().to_internal_value(data)

    def validate_amount(self, value):
        if value is None or Decimal(value) <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return Decimal(value)


# ---------------------------------------------------------------------
# Videography
# ---------------------------------------------------------------------
# videography/serializers.py
from rest_framework import serializers
from .models import Videography


class VideographySerializer(serializers.ModelSerializer):
    class Meta:
        model = Videography
        fields = "__all__"

    def validate(self, data):
        # Match your frontend validations
        if not data.get("project"):
            raise serializers.ValidationError({"project": "Project / Event name is required."})
        if not data.get("editor"):
            raise serializers.ValidationError({"editor": "Editor is required."})
        if not data.get("shoot_date"):
            raise serializers.ValidationError({"shoot_date": "Shoot date is required."})

        d = data.get("duration_hours")
        if d is None or d <= 0:
            raise serializers.ValidationError(
                {"duration_hours": "Duration (hours) must be greater than 0."}
            )

        if not data.get("payment_method"):
            raise serializers.ValidationError({"payment_method": "Select a payment method."})

        # Optional: ensure package_price is not negative
        price = data.get("package_price")
        if price is not None and price < 0:
            raise serializers.ValidationError({"package_price": "Price cannot be negative."})

        return data


# =====================================================================
# ===================== Authentication Serializers ====================
# =====================================================================
User = get_user_model()

class CustomRegisterSerializer(RegisterSerializer):
    """
    Extends dj-rest-auth RegisterSerializer to support:
    - mobile_no (validated, unique)
    - profile_photo (optional) — also accepts `photo` key from client
    """
    username = None  # disable username completely

    mobile_no = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=15,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This mobile number is already registered.")]
    )
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    def validate_mobile_no(self, v: str):
        v = (v or "").strip()
        if v == "":
            return v
        return _validate_phone(v)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["mobile_no"] = self.validated_data.get("mobile_no", "")
        if "profile_photo" in self.validated_data:
            data["profile_photo"] = self.validated_data.get("profile_photo")
        elif self.context and (req := self.context.get("request")):
            data["profile_photo"] = req.FILES.get("photo", None)
        return data

    @transaction.atomic
    def save(self, request):
        user = super().save(request)  # creates user with email/password
        user.mobile_no = self.validated_data.get("mobile_no", "")

        photo = (
            self.validated_data.get("profile_photo")
            or (request.FILES.get("photo") if request and hasattr(request, "FILES") else None)
        )
        if photo:
            user.profile_photo = photo

        try:
            user.save()
        except IntegrityError:
            raise serializers.ValidationError({"mobile_no": ["This mobile number is already registered."]})
        return user


class CustomLoginSerializer(LoginSerializer):
    username = None
    email_or_mobile = serializers.CharField(required=True)
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        email_or_mobile = attrs.get('email_or_mobile')
        password = attrs.get('password')

        if not email_or_mobile or not password:
            raise serializers.ValidationError("Both email/mobile and password are required.")

        user = authenticate(username=email_or_mobile, password=password)

        if not user:
            try:
                if '@' in email_or_mobile:
                    user = User.objects.get(email=email_or_mobile)
                else:
                    user = User.objects.get(mobile_no=email_or_mobile)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid credentials.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs['user'] = user
        return attrs


class CustomUserDetailsSerializer(UserDetailsSerializer):
    profile_photo = serializers.ImageField(read_only=True, use_url=True, allow_null=True, required=False)

    class Meta:
        model = User       
        fields = ('id', 'email', 'mobile_no', 'first_name', 'last_name', 'role', 'profile_photo')
        read_only_fields = ('email',)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['full_name'] = f"{(instance.first_name or '').strip()} {(instance.last_name or '').strip()}".strip()
        return rep


# ---------------------------------------------------------------------
# Password Reset (request & confirm)
# ---------------------------------------------------------------------
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        self.context['user'] = user
        return value

    def save(self):
        user = self.context['user']
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173/password-reset-confirm")
        if not frontend_url.endswith("/"):
            frontend_url = f"{frontend_url}/"
        reset_link = f"{frontend_url}{uid}/{token}/"

        subject = "Password Reset Request"
        context = {"user": user, "reset_link": reset_link}
        body = render_to_string("registration/custom_password_reset_email.html", context)

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")
        email = EmailMultiAlternatives(subject, body, from_email, [user.email])
        email.send()

        return {"detail": "Password reset email sent successfully."}


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        uidb64 = attrs.get("uidb64")
        token = attrs.get("token")
        new_password = attrs.get("new_password")

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uidb64": "Invalid UID."})

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        user.set_password(new_password)
        user.save()

        return {"detail": "Password has been reset successfully."}


# ---------------------------------------------------------------------
# Sound System (Service)
# ---------------------------------------------------------------------
class SoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sound
        fields = "__all__"
        read_only_fields = ("created_at",)
        extra_kwargs = {
            "email": {"required": False, "allow_null": True, "allow_blank": True},
            "mobile_no": {"required": False, "allow_null": True, "allow_blank": True},
            "location": {"required": False, "allow_null": True, "allow_blank": True},
            "system_type": {"required": False, "allow_null": True, "allow_blank": True},
            "mixer_model": {"required": False, "allow_null": True, "allow_blank": True},
            "notes": {"required": False, "allow_null": True, "allow_blank": True},
            "event_date": {"required": False, "allow_null": True},
            "payment_method": {"required": False},  # model default is "Cash"
        }

    # --- small helpers ---
    def _blank_to_none(self, v):
        return None if (isinstance(v, str) and v.strip() == "") else v

    def _to_int_or_zero(self, v):
        if v in (None, "", "null"):
            return 0
        try:
            return int(v)
        except Exception:
            return 0  # permissive: coerce invalid to 0

    def _to_decimal_or_zero(self, v):
        if v in (None, "", "null"):
            return Decimal("0")
        try:
            return Decimal(str(v))
        except Exception:
            return Decimal("0")  # permissive

    def to_internal_value(self, data):
        d = data.copy()

        # Map legacy SoundSetup keys if they appear
        if "setup_date" in d and "event_date" not in d:
            d["event_date"] = d.get("setup_date")
        if "equipment" in d and "system_type" not in d:
            d["system_type"] = d.get("equipment")
        if "technician" in d and "notes" not in d:
            tech = str(d.get("technician") or "").strip()
            d["notes"] = f"Technician: {tech}" if tech else d.get("notes")

        # Normalize empties
        for k in ["email", "mobile_no", "location", "system_type", "mixer_model", "notes"]:
            d[k] = self._blank_to_none(d.get(k))
        d["event_date"] = self._blank_to_none(d.get("event_date"))

        # Numbers
        d["speakers_count"] = self._to_int_or_zero(d.get("speakers_count"))
        d["microphones_count"] = self._to_int_or_zero(d.get("microphones_count"))
        d["price"] = self._to_decimal_or_zero(d.get("price"))

        # Payment choice (normalize)
        pm = (d.get("payment_method") or "").strip().lower()
        d["payment_method"] = {"upi": "UPI", "card": "Card", "cash": "Cash"}.get(pm, "Cash")

        # Client name default
        if not (d.get("client_name") or "").strip():
            d["client_name"] = "Unnamed"

        return super().to_internal_value(d)

    # keep validation permissive
    def validate_mobile_no(self, v):
        if v in (None, ""):
            return v
        if not re.fullmatch(r"\+?\d{7,15}", str(v).strip()):
            return ""  # drop invalid mobile instead of erroring (permissive)
        return v





# ---------------------------------------------------------------------
# Singer Master (Service)
# ---------------------------------------------------------------------
from rest_framework import serializers
from .models import Singer


class SingerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Singer
        fields = "__all__"

    def to_internal_value(self, data):
        data = data.copy()

        # Remove frontend-only field
        data.pop("agreed_terms", None)

        # Normalize gender
        if "gender" in data and isinstance(data["gender"], str):
            data["gender"] = data["gender"].lower()

        # Convert empty strings to None
        for field in ["experience", "rate", "birth_date"]:
            if field in data and data[field] == "":
                data[field] = None

        return super().to_internal_value(data)



# ---------------------------------------------------------------------
# Singing class  (Service)
# ---------------------------------------------------------------------
# api/serializers.py
from rest_framework import serializers
from .models import SingingClass


class SingingClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SingingClass
        fields = "__all__"






from rest_framework import serializers
from .models import Trainer

class TrainerSerializer(serializers.ModelSerializer):
    batch_schedule = serializers.SerializerMethodField()

    class Meta:
        model = Trainer
        fields = "__all__"

    def get_batch_schedule(self, obj):
        return f"{obj.batch_day} {obj.batch_start_time} - {obj.batch_end_time}"

    def validate(self, data):
        if data["batch_end_time"] <= data["batch_start_time"]:
            raise serializers.ValidationError(
                "Batch end time must be after start time."
            )
        return data
    





from rest_framework import serializers
from .models import Teacher, Class, Batch


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ["id", "name", "phone", "email"]


class ClassSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source="trainer.name", read_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "name",
            "description",
            "fee",
            "trainer",
            "trainer_name",
        ]


from rest_framework import serializers
from .models import Batch

class BatchSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_obj.name", read_only=True)
    class_fee = serializers.DecimalField(
        source="class_obj.fee",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    trainer_name = serializers.CharField(source="trainer.name", read_only=True)

    class Meta:
        model = Batch
        fields = [
            "id",
            "class_obj",
            "class_name",
            "class_fee",
            "trainer",
            "trainer_name",
            "day",
            "time_slot",
            "capacity",
            "created_at",
        ]

