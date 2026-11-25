import os
import django
from datetime import date

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "imc_backend.settings")
django.setup()

from api.models import Singer, SingingClass, Batch

today = date.today()
print(f"Today is: {today}")

sample_singers = [
    {
        "name": "Aarav Mehta",
        "birth_date": date(1996, 11, 25),
        "mobile": "9823011223",
        "email": "aarav.mehta@imcpune.in",
        "genre": "Classical & Semi-Classical",
        "city": "Pune",
        "gender": "male",
        "profession": "Professional Vocalist",
        "active": True
    },
    {
        "name": "Sneha Deshmukh",
        "birth_date": date(1999, 11, 25),
        "mobile": "9845144556",
        "email": "sneha.deshmukh@imcpune.in",
        "genre": "Bollywood & Sufi",
        "city": "Mumbai",
        "gender": "female",
        "profession": "Playback Singer",
        "active": True
    },
    {
        "name": "Pooja Patil",
        "birth_date": date(1994, 11, 25),
        "mobile": "9922033445",
        "email": "pooja.patil@imcpune.in",
        "genre": "Ghazal & Light Music",
        "city": "Pune",
        "gender": "female",
        "profession": "Vocal Coach",
        "active": True
    }
]

created_singers = []
for data in sample_singers:
    singer, created = Singer.objects.update_or_create(
        email=data["email"],
        defaults=data
    )
    created_singers.append(singer)
    print(f"Singer {'created' if created else 'updated'}: {singer.id} - {singer.name} (DOB: {singer.birth_date})")

batch = Batch.objects.first()
if not batch:
    print("Warning: No batch found for students!")

sample_students = [
    {
        "first_name": "Rohan",
        "last_name": "Kulkarni",
        "birth_date": date(2003, 11, 25),
        "phone": "9765277889",
        "email": "rohan.k@imcpune.in",
        "city": "Pune",
        "batch": batch,
        "fee": 0.0,
        "status": SingingClass.Status.CONFIRMED,
        "payment_status": "paid"
    },
    {
        "first_name": "Ananya",
        "last_name": "Verma",
        "birth_date": date(2001, 11, 25),
        "phone": "9811255667",
        "email": "ananya.verma@imcpune.in",
        "city": "Pimpri-Chinchwad",
        "batch": batch,
        "fee": 0.0,
        "status": SingingClass.Status.CONFIRMED,
        "payment_status": "paid"
    }
]

created_students = []
for data in sample_students:
    student, created = SingingClass.objects.update_or_create(
        email=data["email"],
        defaults=data
    )
    created_students.append(student)
    print(f"Student {'created' if created else 'updated'}: ID {student.id} - {student.first_name} {student.last_name} (DOB: {student.birth_date})")

print(f"\nSuccessfully seeded 5 sample birthday records for today ({today.strftime('%d %B')}):")
print(f"- 3 Singers: {[s.name for s in created_singers]}")
print(f"- 2 Students: {[f'{st.first_name} {st.last_name}' for st in created_students]}")
