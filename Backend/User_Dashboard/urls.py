# User_Dashboard/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PublicStudioViewSet,
    UserStudioBookingViewSet,
    UserPhotographyBookingViewSet,
    PublicEventViewSet,
    UserEventBookingViewSet,
    SingerViewSet,
    VideographyViewSet,   # ⬅️ NEW
)

router = DefaultRouter()

router.register(r"studios", PublicStudioViewSet, basename="user-studios")
router.register(
    r"studio-bookings",
    UserStudioBookingViewSet,
    basename="user-studio-bookings",
)
router.register(
    r"photography-bookings",
    UserPhotographyBookingViewSet,
    basename="photography-bookings"
)

router.register(
    r"auth/videography",
    VideographyViewSet,
    basename="auth-videography",
)

from rest_framework.routers import DefaultRouter
from .views import PublicEventViewSet, UserEventBookingViewSet

router = DefaultRouter()
router.register("events", PublicEventViewSet, basename="user-events")
router.register("event-bookings", UserEventBookingViewSet, basename="event-bookings")

urlpatterns = router.urls




# 🚀 THIS NOW RETURNS SINGER LIST, NOT EVENTS
router.register(
    r"singer",
    SingerViewSet,
    basename="user-singer",
)

urlpatterns = [
    path("", include(router.urls)),
]
