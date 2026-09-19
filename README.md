# Kingpin Wood — Django backend

This is the same site you already reviewed, now served by Django. The
5 catalog products live in the database and can be edited from
`/admin/`; orders submitted on the site are saved there too.

## What's inside

```
kingpinwood_django/
  manage.py
  kingpinwood/        <- project settings, urls
  store/               <- the app: Product & Order models, views, admin
  templates/index.html <- your site, now a Django template
  static/              <- styles.css, script.js, brand/site images
  media/products/      <- the 5 catalog photos (used by the fixture below)
```

## First-time setup (Windows CMD, in VS Code's terminal)

Open this folder in VS Code, then open a terminal (Terminal > New
Terminal) — make sure it's using **Command Prompt**, not PowerShell
(the dropdown in the top-right of the terminal panel lets you pick).

```
cd path\to\kingpinwood_django
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata products
python manage.py createsuperuser
python manage.py runserver
```

- `venv\Scripts\activate.bat` — you'll see `(venv)` appear in the
  prompt once it's active. Run this every time you open a new
  terminal to work on the project.
- `loaddata products` pre-loads the 5 catalog items (Fluted Panel,
  both Marble Sheets, the Wooden Door, Edge Banding) with their
  photos and the example prices, so you don't have to type them in
  by hand.
- `createsuperuser` asks for a username, email and password — that's
  your login for the admin panel.

Then open **http://127.0.0.1:8000/** for the site, and
**http://127.0.0.1:8000/admin/** to manage products and view orders.

## Day to day

Once it's set up, you only need:

```
cd path\to\kingpinwood_django
venv\Scripts\activate.bat
python manage.py runserver
```

## Editing products and prices

Go to `/admin/`, click **Products**. You can change prices, untick
"is active" to hide something without deleting it, or add a brand
new product (give it a unique slug like `mdf-board`, a category, a
unit, a price, and optionally upload a photo — if you leave the photo
blank it'll show as a plain colour swatch on the site instead).

## Checking orders

Go to `/admin/`, click **Orders**. Each order shows the customer's
name, phone, address, total and a reference like `KPW-000001`, with
the individual items listed underneath. Change the status dropdown
(pending / confirmed / fulfilled / cancelled) as you process them —
there's no automatic payment verification yet, since the site still
uses bank transfer + phone confirmation.

## Things to do before this goes live on the internet

These are all in `kingpinwood/settings.py`, marked with `TODO`:

- Replace `SECRET_KEY` with a new random value, and don't commit it
  to source control — read it from an environment variable instead.
- Set `DEBUG = False`.
- Add your real domain to `ALLOWED_HOSTS`.
- Switch the database from SQLite to something like PostgreSQL if
  you expect real concurrent traffic.
- Run `python manage.py collectstatic` and serve `static/` and
  `media/` properly (e.g. via WhiteNoise, Nginx, or your hosting
  provider's static file handling) — Django's own static serving
  here is for local development only.
