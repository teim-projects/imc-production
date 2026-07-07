# Generated migration: add user FK to Studio, PrivateBooking, SingingClass

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_alter_studio_payment_status_alter_studio_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Studio → user FK
        migrations.AddField(
            model_name='studio',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='studio_bookings',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # PrivateBooking → user FK
        migrations.AddField(
            model_name='privatebooking',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='private_bookings',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # SingingClass → user FK
        migrations.AddField(
            model_name='singingclass',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='singing_class_admissions',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
