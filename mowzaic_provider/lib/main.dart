import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/constants.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/itinerary_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConstants.supabaseUrl,
    anonKey: AppConstants.supabaseAnonKey,
  );

  runApp(const MowzaicProviderApp());
}

class MowzaicProviderApp extends StatelessWidget {
  const MowzaicProviderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ItineraryProvider()),
      ],
      child: MaterialApp(
        title: 'Mowzaic Provider',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const _AuthGate(),
      ),
    );
  }
}

/// Routes the user to Login or the main app based on auth state.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    switch (auth.status) {
      case AuthStatus.unknown:
        // Splash / loading state while we check the session
        return const Scaffold(
          backgroundColor: kPrimaryLight,
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.grass_rounded, size: 64, color: kPrimary),
                SizedBox(height: 16),
                CircularProgressIndicator(color: kPrimary),
              ],
            ),
          ),
        );

      case AuthStatus.authenticated:
        return const MainShell();

      case AuthStatus.unauthenticated:
      case AuthStatus.providerOnly:
        return const LoginScreen();
    }
  }
}
