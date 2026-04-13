import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated, providerOnly }

class AuthProvider extends ChangeNotifier {
  final AuthService _auth = AuthService.instance;
  final ApiService _api = ApiService.instance;

  AuthStatus _status = AuthStatus.unknown;
  String? _errorMessage;
  bool _isLoading = false;
  String? _role;
  User? _user;

  AuthStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  User? get user => _user;
  String? get role => _role;
  String? get accessToken => _auth.accessToken;

  String get displayName {
    final meta = _user?.userMetadata;
    if (meta == null) return _user?.email ?? 'Provider';
    final first = meta['first_name'] ?? meta['firstName'] ?? '';
    final last = meta['last_name'] ?? meta['lastName'] ?? '';
    final full = '$first $last'.trim();
    return full.isNotEmpty ? full : _user?.email ?? 'Provider';
  }

  String get email => _user?.email ?? '';

  AuthProvider() {
    _init();
  }

  void _init() {
    // Check existing session on startup
    final session = _auth.currentSession;
    if (session != null) {
      _user = _auth.currentUser;
      _verifyProviderRole();
    } else {
      _status = AuthStatus.unauthenticated;
    }

    // Listen for auth state changes (token refresh, sign out)
    _auth.authStateChanges.listen((authState) {
      if (authState.event == AuthChangeEvent.signedIn ||
          authState.event == AuthChangeEvent.tokenRefreshed) {
        _user = authState.session?.user;
        _verifyProviderRole();
      } else if (authState.event == AuthChangeEvent.signedOut) {
        _status = AuthStatus.unauthenticated;
        _user = null;
        _role = null;
        notifyListeners();
      }
    });
  }

  Future<void> _verifyProviderRole() async {
    try {
      final token = _auth.accessToken;
      if (token == null) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }
      _role = await _api.getRole(token);
      if (_role == 'provider' || _role == 'admin') {
        _status = AuthStatus.authenticated;
      } else {
        // Signed-in user but not a provider — block access
        _status = AuthStatus.providerOnly;
        await _auth.signOut();
      }
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> signIn({required String email, required String password}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _auth.signIn(email: email, password: password);
      if (response.user == null) {
        _errorMessage = 'Sign-in failed. Please try again.';
        _status = AuthStatus.unauthenticated;
        return false;
      }
      _user = response.user;
      await _verifyProviderRole();
      if (_status == AuthStatus.providerOnly) {
        _errorMessage =
            'This account does not have provider access. Contact your administrator.';
        return false;
      }
      return _status == AuthStatus.authenticated;
    } on AuthException catch (e) {
      _errorMessage = e.message;
      _status = AuthStatus.unauthenticated;
      return false;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred. Please try again.';
      _status = AuthStatus.unauthenticated;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
