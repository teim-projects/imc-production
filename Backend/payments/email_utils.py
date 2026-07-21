"""
Email Notification Utility for Payment Success
Sends emails to both user and admin after successful payment
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

# Admin email - can be configured in settings or hardcoded
ADMIN_EMAIL = "imcpcmc@gmail.com"  # Admin notification email


def get_service_display_name(service_code):
    """Convert service code to readable name"""
    service_map = {
        "singing_classes": "Singing Class Registration",
        "studio_booking": "Studio Booking",
        "auditorium_music_shows": "Auditorium Music Show",
        "private_music_events": "Private Music Event",
        "photography_service": "Photography Service",
        "singer_registration": "Singer Registration",
        "sound_service": "Sound Service",
        "videography_service": "Videography Service",
    }
    return service_map.get(service_code, service_code.replace("_", " ").title())


def get_booking_details(payment, booking_obj):
    """Extract booking details from the booking object"""
    details = {
        "customer_name": payment.customer_name,
        "customer_email": None,
        "customer_phone": None,
        "booking_date": None,
        "booking_time": None,
        "additional_info": {}
    }
    
    try:
        if payment.service == "singing_classes":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "phone", None)
            details["booking_date"] = getattr(booking_obj, "created_at", None)
            details["additional_info"] = {
                "Batch": getattr(booking_obj.batch, "name", "N/A") if hasattr(booking_obj, 'batch') and booking_obj.batch else "N/A",
                "Start Date": getattr(booking_obj, "start_date", "N/A"),
            }
            
        elif payment.service == "studio_booking":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "contact_number", None)
            details["booking_date"] = getattr(booking_obj, "date", None)
            details["booking_time"] = getattr(booking_obj, "time_slot", None)
            details["additional_info"] = {
                "Studio": getattr(booking_obj, "studio_name", "N/A"),
                "Duration": f"{getattr(booking_obj, 'duration', 'N/A')} hours",
            }
            
        elif payment.service == "auditorium_music_shows":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "contact_number", None)
            details["booking_date"] = getattr(booking_obj, "created_at", None)
            event = getattr(booking_obj, "event", None)
            details["additional_info"] = {
                "Event": getattr(event, "title", "N/A") if event else "N/A",
                "Tickets": getattr(booking_obj, "number_of_tickets", "N/A"),
                "Ticket Type": getattr(booking_obj, "ticket_type", "N/A").title(),
            }
            
        elif payment.service == "private_music_events":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "contact_number", None)
            details["booking_date"] = getattr(booking_obj, "date", None)
            details["booking_time"] = getattr(booking_obj, "time_slot", None)
            details["additional_info"] = {
                "Event Type": getattr(booking_obj, "event_type", "N/A"),
                "Venue": getattr(booking_obj, "venue", "N/A"),
                "Guest Count": getattr(booking_obj, "guest_count", "N/A"),
            }
            
        elif payment.service == "photography_service":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "mobile", None)
            details["booking_date"] = getattr(booking_obj, "event_date", None)
            details["additional_info"] = {
                "Package": getattr(booking_obj, "package_name", "N/A"),
                "Event Type": getattr(booking_obj, "event_type", "N/A"),
            }
            
        elif payment.service == "singer_registration":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "mobile", None)
            details["booking_date"] = getattr(booking_obj, "created_at", None)
            details["additional_info"] = {
                "Genre": getattr(booking_obj, "genre", "N/A"),
                "Experience": f"{getattr(booking_obj, 'experience', 'N/A')} years",
            }
            
        elif payment.service == "sound_service":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "mobile_no", None)
            details["booking_date"] = getattr(booking_obj, "event_date", None)
            details["additional_info"] = {
                "System Type": getattr(booking_obj, "system_type", "N/A"),
                "Location": getattr(booking_obj, "location", "N/A"),
                "Speakers": getattr(booking_obj, "speakers_count", "N/A"),
            }
            
        elif payment.service == "videography_service":
            details["customer_email"] = getattr(booking_obj, "email", None)
            details["customer_phone"] = getattr(booking_obj, "mobile_no", None)
            details["booking_date"] = getattr(booking_obj, "shoot_date", None)
            details["booking_time"] = getattr(booking_obj, "start_time", None)
            details["additional_info"] = {
                "Event Type": getattr(booking_obj, "event_type", "N/A"),
                "Project": getattr(booking_obj, "project", "N/A"),
                "Package": getattr(booking_obj, "package_type", "N/A"),
            }
            
    except Exception as e:
        logger.error(f"Error extracting booking details: {e}")
    
    return details


def create_user_email_html(payment, booking_details):
    """Create HTML email for user"""
    service_name = get_service_display_name(payment.service)
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .success-badge {{ background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: bold; }}
            .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .details-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
            .details-row:last-child {{ border-bottom: none; }}
            .label {{ font-weight: bold; color: #667eea; }}
            .value {{ color: #333; }}
            .amount {{ font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }}
            .contact-info {{ background: #667eea; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .contact-info a {{ color: white; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Payment Successful!</h1>
                <p>Indian Musical Club (IMC)</p>
            </div>
            
            <div class="content">
                <div class="success-badge">✓ Payment Confirmed</div>
                
                <p>Dear <strong>{booking_details['customer_name']}</strong>,</p>
                
                <p>Thank you for your payment! Your booking has been confirmed successfully.</p>
                
                <div class="amount">₹{payment.amount}</div>
                
                <div class="details">
                    <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
                    <div class="details-row">
                        <span class="label">Service:</span>
                        <span class="value">{service_name}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Order ID:</span>
                        <span class="value">{payment.order_id}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">{payment.txn_id or 'Processing'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">{payment.payment_method or 'Online'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Status:</span>
                        <span class="value" style="color: #10b981; font-weight: bold;">Paid</span>
                    </div>
    """
    
    # Add additional booking details
    if booking_details.get('booking_date'):
        html += f"""
                    <div class="details-row">
                        <span class="label">Date:</span>
                        <span class="value">{booking_details['booking_date']}</span>
                    </div>
        """
    
    if booking_details.get('booking_time'):
        html += f"""
                    <div class="details-row">
                        <span class="label">Time:</span>
                        <span class="value">{booking_details['booking_time']}</span>
                    </div>
        """
    
    # Add service-specific details
    for key, value in booking_details.get('additional_info', {}).items():
        html += f"""
                    <div class="details-row">
                        <span class="label">{key}:</span>
                        <span class="value">{value}</span>
                    </div>
        """
    
    html += """
                </div>
                
                <div class="contact-info">
                    <h3 style="margin-top: 0;">Contact Us</h3>
                    <p><strong>📞 Phone:</strong> +91 8767055580 / 9834944461</p>
                    <p><strong>✉️ Email:</strong> <a href="mailto:imcpcmc@gmail.com">imcpcmc@gmail.com</a></p>
                    <p><strong>📍 Address:</strong> S-19, Ground floor, Greens Center, Opposite Pudumjee Paper Mill, Thergaon, Chinchwad 411033</p>
                </div>
                
                <p style="margin-top: 20px;">We look forward to serving you!</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2024 Indian Musical Club. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


def create_admin_email_html(payment, booking_details):
    """Create HTML email for admin"""
    service_name = get_service_display_name(payment.service)
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .alert {{ background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }}
            .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .details-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
            .details-row:last-child {{ border-bottom: none; }}
            .label {{ font-weight: bold; color: #f59e0b; }}
            .value {{ color: #333; }}
            .amount {{ font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }}
            .customer-info {{ background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 New Payment Received</h1>
                <p>IMC Admin Notification</p>
            </div>
            
            <div class="content">
                <div class="alert">✓ PAYMENT CONFIRMED</div>
                
                <div class="amount">₹{payment.amount}</div>
                
                <div class="customer-info">
                    <h3 style="margin-top: 0; color: #f59e0b;">Customer Information</h3>
                    <p><strong>Name:</strong> {booking_details['customer_name']}</p>
    """
    
    if booking_details.get('customer_email'):
        html += f"<p><strong>Email:</strong> {booking_details['customer_email']}</p>"
    
    if booking_details.get('customer_phone'):
        html += f"<p><strong>Phone:</strong> {booking_details['customer_phone']}</p>"
    
    html += f"""
                </div>
                
                <div class="details">
                    <h3 style="margin-top: 0; color: #f59e0b;">Payment Details</h3>
                    <div class="details-row">
                        <span class="label">Service:</span>
                        <span class="value">{service_name}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Order ID:</span>
                        <span class="value">{payment.order_id}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">{payment.txn_id or 'Processing'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">{payment.payment_method or 'Online'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Registration ID:</span>
                        <span class="value">{payment.registration_id}</span>
                    </div>
    """
    
    if booking_details.get('booking_date'):
        html += f"""
                    <div class="details-row">
                        <span class="label">Booking Date:</span>
                        <span class="value">{booking_details['booking_date']}</span>
                    </div>
        """
    
    if booking_details.get('booking_time'):
        html += f"""
                    <div class="details-row">
                        <span class="label">Booking Time:</span>
                        <span class="value">{booking_details['booking_time']}</span>
                    </div>
        """
    
    # Add service-specific details
    for key, value in booking_details.get('additional_info', {}).items():
        html += f"""
                    <div class="details-row">
                        <span class="label">{key}:</span>
                        <span class="value">{value}</span>
                    </div>
        """
    
    html += f"""
                    <div class="details-row">
                        <span class="label">Payment Time:</span>
                        <span class="value">{payment.created_at.strftime("%d-%m-%Y %H:%M:%S")}</span>
                    </div>
                </div>
                
                <p style="margin-top: 20px; text-align: center; color: #666;">
                    <em>This is an automated notification from IMC Payment System</em>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


def send_payment_success_emails(payment, booking_obj):
    """
    Send payment success emails to both user and admin
    
    Args:
        payment: Payment model instance
        booking_obj: The booking object (SingingClass, Studio, EventBooking, etc.)
    """
    try:
        # Get booking details
        booking_details = get_booking_details(payment, booking_obj)
        service_name = get_service_display_name(payment.service)
        
        # Send email to user (if email exists)
        user_email = booking_details.get('customer_email')
        user_phone = booking_details.get('customer_phone')
        
        if user_email:
            try:
                user_html = create_user_email_html(payment, booking_details)
                user_plain = strip_tags(user_html)
                
                send_mail(
                    subject=f"✓ Payment Successful - {service_name} | IMC",
                    message=user_plain,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user_email],
                    html_message=user_html,
                    fail_silently=False,
                )
                logger.info(f"User email sent successfully to {user_email} for order {payment.order_id}")
            except Exception as e:
                logger.error(f"Failed to send user email: {e}")
        else:
            logger.warning(f"No email found for user. Phone: {user_phone}. Order: {payment.order_id}")
        
        # Send email to admin
        try:
            admin_html = create_admin_email_html(payment, booking_details)
            admin_plain = strip_tags(admin_html)
            
            send_mail(
                subject=f"💰 New Payment: ₹{payment.amount} - {service_name} | IMC",
                message=admin_plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[ADMIN_EMAIL],
                html_message=admin_html,
                fail_silently=False,
            )
            logger.info(f"Admin email sent successfully for order {payment.order_id}")
        except Exception as e:
            logger.error(f"Failed to send admin email: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error in send_payment_success_emails: {e}")
        return False
