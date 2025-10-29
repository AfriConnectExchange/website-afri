<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coming Soon | AfriConnect Exchange</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root { --primary: #e00707; }
    html,body { height: 100%; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    /* subtle pattern overlay */
    .bg-pattern {
      background-image: radial-gradient(rgba(224,7,7,0.02) 1px, transparent 1px);
      background-size: 18px 18px;
    }
    /* accessible focus style for buttons/inputs */
    .focus-ring:focus { outline: 3px solid rgba(224,7,7,0.18); outline-offset: 2px; }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: '#e00707'
            }
          }
        }
      }
    }
  </script>
</head>

<body class="bg-gray-50 text-gray-800 antialiased">
  <div class="min-h-screen flex flex-col bg-pattern">
    <header class="py-6">
      <div class="container mx-auto px-6 flex items-center justify-between">
        <a href="#" class="flex items-center gap-3" aria-label="AfriConnect Exchange home">
          <div class="w-12 h-12 bg-gradient-to-br from-primary to-red-700 rounded-xl flex items-center justify-center shadow-md">
            <span class="text-white font-bold text-lg">AE</span>
          </div>
          <span class="text-lg font-semibold">AfriConnect Exchange</span>
        </a>
        <nav class="hidden md:flex gap-6 text-sm text-gray-600">
          <a href="#features" class="hover:text-gray-900">Features</a>
          <a href="mailto:info@africonnect-exchange.org" class="text-primary font-medium">Contact</a>
        </nav>
      </div>
    </header>

    <main class="flex-grow flex items-center">
      <div class="container mx-auto px-6 py-12">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left column: Hero -->
          <section class="space-y-6 text-center lg:text-left">
            <p class="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m4 4v-4m0 0a4 4 0 10-8 0v4M5 20h14v2H5z"/></svg>
              Launching soon
            </p>

            <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
              A marketplace for authentic goods —
              <span class="text-primary">built for the diaspora.</span>
            </h1>

            <p class="text-lg text-gray-600 max-w-2xl">
              We’re crafting a safe, community-first platform to help entrepreneurs reach the diaspora with products, services and skills. Stay tuned for launch updates.
            </p>

            <div class="mt-4">
              <a href="mailto:info@africonnect-exchange.org" class="inline-flex items-center px-4 py-3 bg-primary text-white rounded-md font-semibold hover:bg-red-600 focus-ring">Contact us</a>
            </div>

            <div class="mt-6 flex gap-6 justify-center lg:justify-start text-sm text-gray-500">
              <div class="flex items-center gap-2">
                <strong class="text-gray-900">Secure escrow</strong>
                <span class="text-gray-400">&middot;</span>
                <span>Community-powered</span>
              </div>
            </div>

            <div class="mt-6 flex gap-4 items-center justify-center lg:justify-start">
              <div class="text-center">
                <p class="text-xs text-gray-500">Estimated launch</p>
                <div id="countdown" class="mt-1 text-2xl font-mono font-semibold text-gray-900">00d 00h 00m 00s</div>
              </div>
            </div>
          </section>

          <!-- Right column: Illustration + features -->
          <aside class="space-y-6">
            <div class="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <!-- Simple illustrative SVG to keep it self-contained -->
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center">
                <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" class="w-3/4 h-3/4">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#fed7d7"/><stop offset="1" stop-color="#fee2e2"/></linearGradient>
                  </defs>
                  <rect width="100%" height="100%" rx="12" fill="url(#g1)" />
                  <g transform="translate(14,14)" fill="#b91c1c" opacity="0.95">
                    <rect x="0" y="0" width="70" height="18" rx="4" />
                    <rect x="0" y="28" width="120" height="10" rx="4" opacity="0.9"/>
                    <circle cx="160" cy="40" r="16" fill="#ef4444" />
                    <rect x="0" y="54" width="160" height="14" rx="6" opacity="0.9"/>
                  </g>
                </svg>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <h4 class="font-semibold">Authentic Sellers</h4>
                  <p class="text-xs text-gray-500 mt-1">Curated makers & verified shops.</p>
                </div>
                <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <h4 class="font-semibold">Secure Payments</h4>
                  <p class="text-xs text-gray-500 mt-1">Escrow & dispute support.</p>
                </div>
                <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <h4 class="font-semibold">Training</h4>
                  <p class="text-xs text-gray-500 mt-1">Grow business & skills.</p>
                </div>
                <div class="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <h4 class="font-semibold">Community</h4>
                  <p class="text-xs text-gray-500 mt-1">Network with diaspora buyers.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <footer class="bg-gray-900 text-gray-300">
      <div class="container mx-auto px-6 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-center md:text-left">
            <p class="font-semibold text-white">A project of McBenLeo CIC (Company Number: SC859990)</p>
            <a href="mailto:info@africonnect-exchange.org" class="text-primary hover:underline mt-2 inline-block">info@africonnect-exchange.org</a>
          </div>
          <div class="text-sm text-gray-400">
            <nav class="flex gap-4 items-center justify-center">
              <a href="#" class="hover:text-white">Terms</a>
              <span>&middot;</span>
              <a href="#" class="hover:text-white">Privacy</a>
              <span>&middot;</span>
              <a href="#" class="hover:text-white">Cookies</a>
            </nav>
            <p class="mt-3 text-xs text-gray-500">&copy; 2025 AfriConnect Exchange. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <script>
    // Countdown timer (adjust launch date as needed)
    (function () {
      const launchDate = new Date('2025-12-01T09:00:00Z').getTime();
      const el = document.getElementById('countdown');
      function update() {
        const now = Date.now();
        let diff = Math.max(0, launchDate - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        const secs = Math.floor(diff / 1000);
        el.textContent = `${String(days).padStart(2,'0')}d ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
      }
      update();
      setInterval(update, 1000);
    })();

    // Subscription removed — contact via mailto available in the header/footer and CTA
  </script>
</body>

</html>

    