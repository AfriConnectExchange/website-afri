<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AfriConnect Exchange - Coming Soon</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --primary: 346.8 77.2% 49.8%;
            --primary-foreground: 355.7 100% 97.3%;
            --secondary: 210 40% 96.1%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
        }

        .bg-primary {
            background-color: hsl(var(--primary));
        }

        .text-primary-foreground {
            color: hsl(var(--primary-foreground));
        }
    </style>
</head>

<body class="bg-gray-50 text-gray-800">

    <div class="flex flex-col min-h-screen">

        <!-- Header -->
        <header class="p-4">
            <div class="container mx-auto flex justify-center">
                 <div class="flex items-center justify-center gap-3">
                    <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-lg">AE</span>
                    </div>
                    <span class="text-xl font-bold text-gray-800">AfriConnect Exchange</span>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-grow flex items-center justify-center">
            <div class="container mx-auto px-6 py-12 md:py-20 text-center">
                <div class="max-w-3xl mx-auto">
                    <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                        Connecting the Diaspora, One Exchange at a Time.
                    </h1>
                    <p class="mt-6 text-lg md:text-xl text-gray-600">
                        Our new marketplace is under construction! We're working hard to create a vibrant platform for authentic African products, skills training, and seamless money transfers.
                    </p>

                    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Feature 1 -->
                        <div class="p-6 bg-white rounded-xl shadow-md border">
                            <div
                                class="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                    <path d="M2 12h20" />
                                </svg>
                            </div>
                            <h3 class="font-semibold text-lg">Authentic Marketplace</h3>
                            <p class="text-sm text-gray-500 mt-2">Discover and sell unique products from across the African diaspora.</p>
                        </div>
                        <!-- Feature 2 -->
                        <div class="p-6 bg-white rounded-xl shadow-md border">
                             <div
                                class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                </svg>
                            </div>
                            <h3 class="font-semibold text-lg">Secure Escrow Payments</h3>
                            <p class="text-sm text-gray-500 mt-2">Trade with confidence. Your funds are protected until you are satisfied.</p>
                        </div>
                        <!-- Feature 3 -->
                        <div class="p-6 bg-white rounded-xl shadow-md border">
                            <div
                                class="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3 class="font-semibold text-lg">Community Empowerment</h3>
                            <p class="text-sm text-gray-500 mt-2">Join a network that supports growth, learning, and cultural exchange.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-100 border-t">
            <div class="container mx-auto px-6 py-8">
                <div class="text-center text-gray-500">
                    <p class="font-semibold text-gray-700">A project of McBenLeo CIC (Company Number: SC859990)</p>
                    <a href="mailto:info@africonnect-exchange.org" class="mt-1 inline-block hover:text-rose-600">info@africonnect-exchange.org</a>
                    <div class="mt-4 space-x-4 text-sm">
                        <a href="#" class="hover:text-gray-900">Terms</a>
                        <span>&middot;</span>
                        <a href="#" class="hover:text-gray-900">Privacy</a>
                        <span>&middot;</span>
                        <a href="#" class="hover:text-gray-900">Cookies</a>
                    </div>
                    <p class="mt-4 text-xs">&copy; 2025 AfriConnect Exchange. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>

</body>
</html>
