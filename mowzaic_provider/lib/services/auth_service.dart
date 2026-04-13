import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  SupabaseClient get _client => Supabase.instance.client;

  /// Sign in with email + password. Throws [AuthException] on failure.
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  /// Sign out the current session.
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Current session, or null if not authenticated.
  Session? get currentSession => _client.auth.currentSession;

  /// Current user, or null.
  User? get currentUser => _client.auth.currentUser;

  /// The JWT access token for the current session, or null.
  String? get accessToken => _client.auth.currentSession?.accessToken;

  /// Stream of auth state changes.
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}
