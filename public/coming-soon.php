<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coming Soon | AfriConnect Exchange</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .theme-primary { color: #e11d48; }
    .bg-theme-primary { background-color: #e11d48; }
    .border-theme-primary { border-color: #e11d48; }
  </style>
</head>
<body class="bg-gray-50 flex flex-col min-h-screen">

  <!-- Main Content -->
  <main class="flex-grow flex items-center justify-center py-12 px-4">
    <div class="text-center">
      <!-- Logo -->
      <div class="inline-flex items-center justify-center gap-2 mb-8">
        <div class="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.53 3.81a2 2 0 0 0 1.74 0l8.53-3.81a1 1 0 0 0 0-1.84Z"/><path d="m22 17.65-8.53 3.81a2 2 0 0 1-1.74 0L3.2 17.65a1 1 0 0 1 0-1.84l8.53-3.81a2 2 0 0 1 1.74 0l8.53 3.81a1 1 0 0 1 0 1.84Z"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">AfriConnect Exchange</h1>
      </div>

      <!-- Main Message -->
      <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Something New is Coming</h2>
      <p class="max-w-2xl mx-auto text-lg text-gray-600 mb-8">
        We are working hard behind the scenes to bring you a revolutionary marketplace. Our platform is currently under construction, but we're excited to launch soon!
      </p>

      <!-- Progress Bar -->
      <div class="max-w-md mx-auto w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-semibold text-gray-700">Development Progress</span>
          <span class="text-sm font-semibold text-rose-600">75%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-rose-600 h-2.5 rounded-full" style="width: 75%"></div>
        </div>
      </div>

    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-gray-100 border-t border-gray-200">
    <div class="container mx-auto py-6 px-4 text-center text-gray-500">
      <p class="font-semibold text-gray-700 text-sm">A project of McBenLeo CIC (Company Number: SC859990)</p>
      <a href="mailto:info@africonnect-exchange.org" class="text-sm text-rose-600 hover:underline mt-1 inline-block">info@africonnect-exchange.org</a>
      <div class="mt-4 space-x-4 text-xs">
        <a href="#" class="hover:underline">Terms</a>
        <span>&middot;</span>
        <a href="#" class="hover:underline">Privacy</a>
        <span>&middot;</span>
        <a href="#" class="hover:underline">Cookies</a>
      </div>
      <p class="mt-4 text-xs">&copy; <?php echo date("Y"); ?> AfriConnect Exchange. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>
