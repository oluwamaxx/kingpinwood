import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("name", models.CharField(max_length=200)),
                ("category", models.CharField(
                    choices=[
                        ("panels", "Panels & Surfaces"),
                        ("doors", "Doors"),
                        ("finishing", "Finishing"),
                    ],
                    max_length=20,
                )),
                ("unit", models.CharField(help_text="e.g. per sheet, per door, per roll", max_length=50)),
                ("price", models.DecimalField(decimal_places=2, help_text="Price in Naira", max_digits=10)),
                ("description", models.TextField(blank=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="products/")),
                ("is_active", models.BooleanField(default=True, help_text="Untick to hide from the site without deleting it")),
                ("display_order", models.PositiveIntegerField(default=0, help_text="Lower numbers show first")),
            ],
            options={
                "ordering": ["display_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=20, unique=True)),
                ("customer_name", models.CharField(max_length=200)),
                ("customer_phone", models.CharField(max_length=30)),
                ("customer_address", models.TextField(blank=True)),
                ("total", models.DecimalField(decimal_places=2, max_digits=12)),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Pending — awaiting payment confirmation"),
                        ("confirmed", "Confirmed — payment received"),
                        ("fulfilled", "Fulfilled"),
                        ("cancelled", "Cancelled"),
                    ],
                    default="pending",
                    max_length=20,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("qty", models.PositiveIntegerField()),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="store.order")),
                ("product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="store.product")),
            ],
        ),
    ]
