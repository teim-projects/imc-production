import os
from django.utils import timezone
from .models import Singer


def delete_expired_videos():
    now = timezone.now()

    expired_singers = Singer.objects.filter(
        video_expiry_date__lte=now,
        video__isnull=False
    )

    for singer in expired_singers:

        # Delete file from storage
        if singer.video:
            if os.path.isfile(singer.video.path):
                os.remove(singer.video.path)

        # Clear DB fields
        singer.video = None
        singer.video_expiry_date = None
        singer.save(update_fields=["video", "video_expiry_date"])