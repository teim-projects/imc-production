# imc_backend/__init__.py
import pymysql
pymysql.install_as_MySQLdb()

# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'imc_db',
        'HOST': 'localhost',
        'USER': 'root',
        'PASSWORD': '',           # or your real password
        'PORT': 3306,
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
