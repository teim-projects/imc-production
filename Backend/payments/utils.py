import base64

# 🔴 SANDBOX CREDENTIALS (Bank/Juspay dashboard मधून)
API_KEY = "6809F024D054422ACE05E091131FD6"
MERCHANT_ID = "SG4235"
RESELLER_ID = "hdfc_reseller"

def get_headers(customer_id):
    encoded_key = base64.b64encode(API_KEY.encode()).decode()

    return {
        "Authorization": f"Basic {encoded_key}",
        "Content-Type": "application/json",
        "x-merchantid": MERCHANT_ID,
        "x-customerid": customer_id,
        "x-resellerid": RESELLER_ID,
    }
