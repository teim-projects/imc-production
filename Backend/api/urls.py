# api/urls.py
from django import views
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardSummary
from .views import SingingClassAdmissionViewSet


from .views import (
    # Auth helpers
    GoogleLogin, PasswordResetRequestView, PasswordResetConfirmView,

    # Studio catalog + bookings
    StudioMasterViewSet, StudioViewSet,

    # Core CRM modules
    EventViewSet, PaymentViewSet, PrivateBookingViewSet,

    # Media services
    VideographyViewSet, PhotographyBookingViewSet, SoundViewSet,


    StudioMasterViewSet, StudioImageUploadView, SingerViewSet, SingingClassAdmissionViewSet,
)
from .views import TrainerViewSet
from .views import BatchViewSet
from .views import TeacherViewSet
from .views import ClassViewSet


router = DefaultRouter()

# ============== Studio Catalog (Master) ==============
# api/urls.py
router.register(r"studio-master", StudioMasterViewSet, basename="studio-master")
router.register(r"auth/studio-master", StudioMasterViewSet, basename="auth-studio-master")  # 


# ============== Studio Bookings ======================
router.register(r"studios", StudioViewSet, basename="studios")
router.register(r"auth/studios", StudioViewSet, basename="auth-studios")  # alias for frontend

# ============== Events & Shows =======================
router.register(r"events", EventViewSet, basename="events")


# ============== Payments =============================
router.register(r"payments", PaymentViewSet, basename="payments")

# ============== Private Bookings =====================
router.register(r"private-bookings", PrivateBookingViewSet, basename="private-bookings")
router.register(r"auth/private-bookings", PrivateBookingViewSet, basename="auth-private-bookings")  # alias

# ============== Photography (old schema) =============
router.register(r"photography", PhotographyBookingViewSet, basename="photography")
router.register(r"auth/photography", PhotographyBookingViewSet, basename="auth-photography")  # alias
router.register(r"photography-bookings", PhotographyBookingViewSet, basename="photography-bookings")

# ============== Videography ==========================
router.register(r"videography", VideographyViewSet, basename="videography")
router.register(r"auth/videography", VideographyViewSet, basename="auth-videography")  # alias

# ============== Sound (service) ======================
router.register(r"sound", SoundViewSet, basename="sound")
router.register(r"auth/sound", SoundViewSet, basename="auth-sound")  # alias



router.register(r"singers", SingerViewSet, basename="singer")



router.register(r"singing-classes", SingingClassAdmissionViewSet, basename="singingclass")


router.register("teachers", TeacherViewSet)
router.register("batches", BatchViewSet, basename="batches")
router.register("classes", ClassViewSet)



router.register(r"trainers", TrainerViewSet, basename="trainers")


urlpatterns = [
    path("", include(router.urls)),

    # dj-rest-auth
    path("dj-rest-auth/", include("dj_rest_auth.urls")),
    path("dj-rest-auth/registration/", include("dj_rest_auth.registration.urls")),

    # Social login
    path("auth/google/", GoogleLogin.as_view(), name="google_login"),

    # Password reset
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("studio-master/<int:studio_pk>/images/", StudioImageUploadView.as_view(), name="studio-image-upload"),
    path("studio-master/<int:studio_pk>/images/<int:image_pk>/", StudioImageUploadView.as_view(), name="studio-image-delete"),
    path("dashboard/", DashboardSummary.as_view(), name="dashboard_summary"),
    
    
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
