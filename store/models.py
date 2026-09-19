from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("panels", "Panels & Surfaces"),
        ("doors", "Doors"),
        ("finishing", "Finishing"),
    ]

    # slug is the same id script.js already uses, e.g. "fluted-panel"
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    unit = models.CharField(max_length=50, help_text="e.g. per sheet, per door, per roll")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price in Naira")
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Untick to hide from the site without deleting it")
    display_order = models.PositiveIntegerField(default=0, help_text="Lower numbers show first")

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending — awaiting payment confirmation"),
        ("confirmed", "Confirmed — payment received"),
        ("fulfilled", "Fulfilled"),
        ("cancelled", "Cancelled"),
    ]

    reference = models.CharField(max_length=20, unique=True)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=30)
    customer_address = models.TextField(blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} — {self.customer_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=200)  # snapshot, in case the product changes later
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField()

    def line_total(self):
        return self.unit_price * self.qty

    def __str__(self):
        return f"{self.qty} x {self.name}"
