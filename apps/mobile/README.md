# Afri Mobile (Flutter)

This folder will contain the Flutter mobile app that targets Android and iOS.

## Bootstrap

1. Ensure Flutter is installed and working:

```powershell
flutter --version
flutter doctor
```

1. Create the app here (only once):

```powershell
# From repo root
flutter create apps/mobile --org com.afri.exchange --project-name afri_mobile
```

1. Wire Firebase using FlutterFire:

```powershell
# Install FlutterFire CLI once
dart pub global activate flutterfire_cli

# From apps/mobile
cd apps/mobile
flutterfire configure
```

1. Add Firebase packages in `pubspec.yaml`:

- firebase_core
- firebase_auth
- cloud_firestore
- firebase_messaging
- firebase_analytics
- firebase_crashlytics
- firebase_remote_config
- firebase_dynamic_links

Then install:

```powershell
flutter pub get
```

1. Initialize Firebase in `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Afri Mobile',
      home: const Scaffold(
        body: Center(child: Text('Hello Afri + Firebase')),
      ),
    );
  }
}
```

## Run

```powershell
flutter run -d android
```

## Build

```powershell
flutter build appbundle   # Android (Play Store)
# For iOS builds, run on macOS: flutter build ipa
```

## Notes

- Auth persistence and Firestore offline cache are enabled by default on mobile (via native SDKs).
- Push notifications need Apple APNs setup for iOS and normal FCM setup for Android.
