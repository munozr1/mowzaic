import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/itinerary_provider.dart';
import '../../config/theme.dart';

class AvailableJobsScreen extends StatefulWidget {
  const AvailableJobsScreen({super.key});

  @override
  State<AvailableJobsScreen> createState() => _AvailableJobsScreenState();
}

class _AvailableJobsScreenState extends State<AvailableJobsScreen> {
  List<Map<String, dynamic>> _jobs = [];
  bool _isLoading = false;
  String? _errorMessage;
  final Set<String> _claiming = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthProvider>().accessToken;
    if (token == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final jobs = await ApiService.instance.getAvailableJobs(token);
      setState(() => _jobs = jobs);
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Failed to load available jobs');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _claim(String bookingId) async {
    final token = context.read<AuthProvider>().accessToken;
    if (token == null) return;

    setState(() => _claiming.add(bookingId));

    try {
      await ApiService.instance.claimJob(token, bookingId);
      // Remove from list and reload itinerary
      setState(() => _jobs.removeWhere((j) => j['id'] == bookingId));
      if (mounted) {
        context.read<ItineraryProvider>().loadTodayStops();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Job claimed! Check your itinerary.'),
            backgroundColor: kPrimary,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      setState(() => _claiming.remove(bookingId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AVAILABLE JOBS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _load,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(_errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF374151))),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _load,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_jobs.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.work_off_outlined, size: 64, color: Color(0xFFD1D5DB)),
            SizedBox(height: 16),
            Text(
              'No available jobs right now',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Check back later for new bookings.',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _jobs.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (_, index) {
          final job = _jobs[index];
          final property = job['properties'] as Map<String, dynamic>?;
          final dateStr = job['date_of_service'] as String?;
          DateTime? date;
          if (dateStr != null) date = DateTime.tryParse(dateStr);

          final bookingId = job['id'] as String;
          final isClaiming = _claiming.contains(bookingId);

          return ListTile(
            tileColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: kPrimaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.grass_rounded, color: kPrimary, size: 22),
            ),
            title: Text(
              property?['address']?.toString().toUpperCase() ?? 'Address N/A',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${property?['city'] ?? ''}, ${property?['state'] ?? ''}'
                      .toUpperCase(),
                  style: const TextStyle(fontSize: 12),
                ),
                if (date != null)
                  Text(
                    DateFormat('EEE, MMM d').format(date),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
            trailing: isClaiming
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: kPrimary),
                  )
                : ElevatedButton(
                    onPressed: () => _claim(bookingId),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(72, 36),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: const Text('Claim', style: TextStyle(fontSize: 13)),
                  ),
          );
        },
      ),
    );
  }
}
