import os
import django
from django.utils import timezone

# ✅ Correct project settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "imc_backend.settings")

django.setup()

from api.models import Singer


def delete_expired_videos():
    now = timezone.now()

    expired_singers = Singer.objects.filter(
        video_expiry_date__lte=now,
        video__isnull=False
    )

    for singer in expired_singers:

        # Delete file from storage
        if singer.video and os.path.isfile(singer.video.path):
            os.remove(singer.video.path)

        # Clear DB fields
        singer.video = None
        singer.video_expiry_date = None
        singer.save(update_fields=["video", "video_expiry_date"])

    print("✅ Expired videos deleted successfully.")


if __name__ == "__main__":
    delete_expired_videos()