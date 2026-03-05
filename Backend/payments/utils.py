import base64

# SANDBOX CREDENTIALS (HDFC SmartGateway / Juspay dashboard)
API_KEY = "6809F024D054422ACE05E091131FD6"
MERCHANT_ID = "SG4235"
RESELLER_ID = "hdfc_reseller"


def get_headers(customer_id):

    # Important → API_KEY + colon
    token = base64.b64encode(f"{API_KEY}:".encode()).decode()

    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "x-merchantid": MERCHANT_ID,
        "x-customerid": customer_id,
        "x-resellerid": RESELLER_ID,
    }