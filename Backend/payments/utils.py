import base64

# =========================
# HDFC SmartGateway Config
# =========================

API_KEY = "07A5A65CCCD4696BDE003F06161E1E"
MERCHANT_ID = "70115"
PAYMENT_PAGE_CLIENT_ID = "70115"

BASE_URL = "https://smartgateway.hdfc.bank.in"
RESPONSE_KEY = "CCC4ED8ED8C45ECAF395C7791F9BEE"

ENABLE_LOGGING = False


def get_headers(customer_id):
    """
    Generate API headers for HDFC SmartGateway requests
    """

    encoded_key = base64.b64encode(API_KEY.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {encoded_key}",
        "Content-Type": "application/json",
        "x-merchantid": MERCHANT_ID,
        "x-customerid": customer_id,
    }

    return headers


# Example Usage
if __name__ == "__main__":
    customer_id = "CUST001"

    headers = get_headers(customer_id)

    print("Headers:")
    for key, value in headers.items():
        print(f"{key}: {value}")