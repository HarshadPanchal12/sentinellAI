#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Seed demo data (only inserts if DB is empty)
python manage.py seed_data || true

# Create default admin user if it doesn't exist
python manage.py shell -c "
from api.models import CustomUser
if not CustomUser.objects.filter(username='admin').exists():
    user = CustomUser.objects.create_superuser('admin', 'admin@sentinellai.in', 'admin123')
    user.role = 'admin'
    user.department = 'System Administration'
    user.save()
    print('Admin user created')
else:
    print('Admin user already exists')
" || true
