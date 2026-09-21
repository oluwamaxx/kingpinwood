import json
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

from .models import Order, OrderItem, Product


@ensure_csrf_cookie
def index(request):
    """Render the site, handing the product catalog to the page as JSON
    so script.js can build the cards without a separate API call."""
    products = Product.objects.filter(is_active=True)
    products_data = [
        {
            "id": p.slug,
            "name": p.name,
            "category": p.category,
            "unit": p.unit,
            "price": float(p.price),
            "desc": p.description,
            "image": p.image.url if p.image else None,
        }
        for p in products
    ]
    return render(request, "index.html", {"products": products_data})


print("SETTINGS CHECK:", [k for k in dir(settings) if "EMAIL" in k or "ORDER" in k])