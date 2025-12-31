# api/permissions.py
from rest_framework import permissions

class IsStaffOrRoleAdmin(permissions.BasePermission):
    """
    Allow read-only access to everyone.
    Allow write access only if user is authenticated and (is_staff or role == 'admin').
    """

    def has_permission(self, request, view):
        # Allow safe methods (GET, HEAD, OPTIONS) to everyone
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Accept staff or superuser
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True

        # Accept if user has a 'role' attribute equal to "admin" (case-insensitive)
        role = getattr(user, "role", None)
        if role and str(role).lower() == "admin":
            return True

        return False
