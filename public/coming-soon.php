<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coming Soon - AfriConnect Exchange</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        :root {
            --primary-hsl: 346.8 77.2% 49.8%;
            --primary: hsl(var(--primary-hsl));
            --background: hsl(0 0% 100%);
            --foreground: hsl(222.2 84% 4.9%);
            --muted-foreground: hsl(215.4 16.3% 46.9%);
            --card: hsl(0 0% 100%);
            --card-foreground: hsl(222.2 84% 4.9%);
        }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .bg-background { background-color: var(--background); }
        .text-foreground { color: var(--foreground); }
        .text-muted-foreground { color: var(--muted-foreground); }
        .bg-card { background-color: var(--card); }
        .text-card-foreground { color: var(--card-foreground); }
        .border-primary-hsl { border-color: var(--primary); }
        .shadow-primary { box-shadow: 0 10px 15px -3px hsla(var(--primary-hsl), 0.2), 0 4px 6px -4px hsla(var(--primary-hsl), 0.2); }
    </style>
</head>
<body class="bg-background text-foreground antialiased">

    <main class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        
        <div class="w-full max-w-2xl mx-auto">
            
            <!-- Logo -->
            <div class="flex items-center justify-center gap-3 mb-8">
                <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <h1 class="text-3xl font-bold tracking-tight text-foreground">
                  AfriConnect Exchange
                </h1>
            </div>

            <div class="bg-card border rounded-2xl shadow-lg p-8">
                <!-- Headline -->
                <h2 class="text-4xl font-bold text-primary mb-4">Launching Soon!</h2>
                <p class="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    Our new platform is under construction. We're working hard to bring you a seamless marketplace experience.
                </p>

                <!-- Progress Bar -->
                <div class="mb-8">
                    <p class="text-sm font-medium mb-2">Development Progress</p>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div class="bg-primary h-4 rounded-full" style="width: 75%"></div>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">75% Complete</p>
                </div>

                <!-- Email Subscription -->
                <div>
                    <h3 class="text-lg font-semibold mb-3">Be the first to know!</h3>
                    <p class="text-sm text-muted-foreground mb-4">
                        Enter your email below to receive a notification when we go live.
                    </p>
                    <form action="#" method="POST" class="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input type="email" name="email" placeholder="Enter your email address" required class="flex-1 w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                        <button type="submit" class="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-primary">
                            Notify Me
                        </button>
                    </form>
                </div>
            </div>
        </div>

    </main>

    <footer class="bg-card border-t py-8">
        <div class="container mx-auto px-4 text-center text-xs text-muted-foreground">
            <p class="font-semibold text-foreground/90">A project of McBenLeo CIC (Company Number: SC859990)</p>
            <a href="mailto:info@africonnect-exchange.org" class="hover:text-primary mt-1 inline-block">info@africonnectexchange.org</a>
            <div class="mt-4 space-x-3">
                <a href="#" class="hover:text-primary">Terms</a>
                <span>&middot;</span>
                <a href="#" class="hover:text-primary">Privacy</a>
                <span>&middot;</span>
                <a href="#" class="hover:text-primary">Cookies</a>
            </div>
            <p class="mt-4">&copy; <?php echo date("Y"); ?> AfriConnect Exchange. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
