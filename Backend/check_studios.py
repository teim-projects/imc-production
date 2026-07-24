import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imc_backend.settings')
django.setup()

from api.models import Studio
from django.db.models import Count

print('Total Studio records:', Studio.objects.count())
print('\nBy status:')
for s in Studio.objects.values('status').annotate(count=Count('id')).order_by('status'):
    print(f"  {s['status']}: {s['count']}")

print('\nAll Studio records:')
for studio in Studio.objects.all().order_by('-id')[:10]:
    print(f"  ID {studio.id}: {studio.customer} | {studio.studio_name} | {studio.date} | Status: {studio.status}")
