from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class CustomAccountAdapter(DefaultAccountAdapter):

    def clean_email(self, email):
        email = super().clean_email(email)

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )

        return email