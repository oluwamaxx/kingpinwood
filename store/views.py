import json
from decimal import Decimal, InvalidOperation

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


@require_POST
def create_order(request):
    """Receives the JSON body script.js already builds on checkout and
    stores it as an Order + OrderItems. Returns {"reference": "..."}"""
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid request body."}, status=400)

    items = payload.get("items") or []
    if not items:
        return JsonResponse({"error": "Order has no items."}, status=400)

    try:
        total = Decimal(str(payload.get("total", "0")))
    except InvalidOperation:
        return JsonResponse({"error": "Invalid total."}, status=400)

    last_id = (Order.objects.order_by("-id").values_list("id", flat=True).first() or 0) + 1
    reference = f"KPW-{last_id:06d}"

    order = Order.objects.create(
        reference=reference,
        customer_name=payload.get("customer_name", "").strip(),
        customer_phone=payload.get("customer_phone", "").strip(),
        customer_address=payload.get("customer_address", "").strip(),
        total=total,
    )

    for item in items:
        product = Product.objects.filter(slug=item.get("product_id")).first()
        OrderItem.objects.create(
            order=order,
            product=product,
            name=item.get("name", ""),
            unit_price=Decimal(str(item.get("unit_price", "0"))),
            qty=int(item.get("qty", 1)),
        )

    return JsonResponse({"reference": order.reference}, status=201)
