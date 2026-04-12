import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/constants.dart';
import '../models/stop_model.dart';
import '../models/customer_model.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  const ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  final String _base = AppConstants.apiBaseUrl;

  // ── Private helpers ──────────────────────────────────────────────────────

  Map<String, String> _headers(String token) => {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

  Future<Map<String, dynamic>> _get(String path, String token) async {
    final uri = Uri.parse('$_base$path');
    final response = await http.get(uri, headers: _headers(token));
    return _handle(response);
  }

  Future<Map<String, dynamic>> _post(
    String path,
    String token, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$_base$path');
    final response = await http.post(
      uri,
      headers: _headers(token),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(response);
  }

  Future<Map<String, dynamic>> _patch(
    String path,
    String token, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$_base$path');
    final response = await http.patch(
      uri,
      headers: _headers(token),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(response);
  }

  Map<String, dynamic> _handle(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    String message = 'Request failed';
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      message = (body['message'] ?? body['error'] ?? message).toString();
    } catch (_) {}
    throw ApiException(response.statusCode, message);
  }

  // ── Provider role ────────────────────────────────────────────────────────

  /// Returns the role string ('user' | 'provider' | 'admin').
  Future<String> getRole(String token) async {
    final data = await _get('/providers/role', token);
    return data['role'] as String? ?? 'user';
  }

  // ── Itinerary ────────────────────────────────────────────────────────────

  /// Returns today's ordered stops for this provider.
  Future<List<StopModel>> getTodayStops(String token) async {
    final data = await _get('/providers/today', token);
    final list = data['stops'] as List<dynamic>;
    return list
        .map((e) => StopModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Booking status ───────────────────────────────────────────────────────

  /// Marks a booking as completed.
  Future<void> markComplete(String token, String bookingId) async {
    await _patch(
      '/book/status/$bookingId',
      token,
      body: {'service_status': 'completed'},
    );
  }

  // ── Available jobs ───────────────────────────────────────────────────────

  /// Returns unassigned, paid upcoming bookings.
  Future<List<Map<String, dynamic>>> getAvailableJobs(String token) async {
    final data = await _get('/providers/available-jobs', token);
    return List<Map<String, dynamic>>.from(data['jobs'] as List);
  }

  /// Claims an unassigned booking.
  Future<void> claimJob(String token, String bookingId) async {
    await _post('/providers/claim-job/$bookingId', token);
  }

  // ── Customers ────────────────────────────────────────────────────────────

  /// Returns the provider's customer roster.
  Future<List<CustomerModel>> getCustomers(String token) async {
    final data = await _get('/providers/customers', token);
    final list = data['customers'] as List<dynamic>;
    return list
        .map((e) => CustomerModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Adds a customer to the provider's roster by email or phone.
  Future<CustomerModel> addCustomer(
    String token, {
    String? email,
    String? phone,
  }) async {
    final body = <String, dynamic>{};
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;

    final data = await _post('/providers/customers/add', token, body: body);
    return CustomerModel.fromJson(data['customer'] as Map<String, dynamic>);
  }
}
