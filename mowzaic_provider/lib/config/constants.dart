/// Runtime configuration.
///
/// Values are injected at build time via --dart-define flags:
///   flutter run \
///     --dart-define=SUPABASE_URL=https://xxx.supabase.co \
///     --dart-define=SUPABASE_ANON_KEY=eyJ... \
///     --dart-define=API_BASE_URL=https://your-backend.vercel.app \
///     --dart-define=MAPBOX_ACCESS_TOKEN=pk.eyJ...
///
/// Fallback empty strings will cause runtime errors — always supply values.
class AppConstants {
  AppConstants._();

  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');

  static const String supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  static const String apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static const String mapboxAccessToken =
      String.fromEnvironment('MAPBOX_ACCESS_TOKEN', defaultValue: '');
}
