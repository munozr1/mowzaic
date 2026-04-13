import 'package:flutter/foundation.dart';
import '../models/stop_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class ItineraryProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;
  final AuthService _auth = AuthService.instance;

  List<StopModel> _stops = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<StopModel> get stops => _stops;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  int get totalStops => _stops.length;
  int get completedCount => _stops.where((s) => s.isCompleted).length;
  int get remainingCount => _stops.where((s) => s.isScheduled).length;

  /// The first scheduled (not yet completed) stop — the active job.
  StopModel? get currentStop {
    try {
      return _stops.firstWhere((s) => s.isScheduled);
    } catch (_) {
      return null;
    }
  }

  /// Load today's stops from the API.
  Future<void> loadTodayStops() async {
    final token = _auth.accessToken;
    if (token == null) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _stops = await _api.getTodayStops(token);
    } catch (e) {
      _errorMessage = e is ApiException ? e.message : 'Failed to load stops';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Mark the current stop as complete, then reload.
  Future<bool> markCurrentStopComplete() async {
    final stop = currentStop;
    final token = _auth.accessToken;
    if (stop == null || token == null) return false;

    try {
      await _api.markComplete(token, stop.booking.id);
      await loadTodayStops();
      return true;
    } catch (e) {
      _errorMessage = e is ApiException ? e.message : 'Failed to complete stop';
      notifyListeners();
      return false;
    }
  }
}
