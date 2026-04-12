import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/itinerary_provider.dart';
import '../../models/stop_model.dart';
import '../../models/property_model.dart';
import '../../config/theme.dart';

class CurrentStopScreen extends StatelessWidget {
  const CurrentStopScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final itinerary = context.watch<ItineraryProvider>();

    if (itinerary.isLoading) {
      return const Scaffold(
        appBar: _StopAppBar(),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final stop = itinerary.currentStop;

    return Scaffold(
      appBar: const _StopAppBar(),
      body: stop == null ? _AllDoneView() : _StopDetail(stop: stop),
    );
  }
}

class _StopAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _StopAppBar();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(title: const Text('CURRENT STOP'));
  }
}

class _AllDoneView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.celebration_rounded, size: 72, color: kPrimary),
            const SizedBox(height: 20),
            const Text(
              'All done for today!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: kPrimaryDeep,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Great work. All stops have been completed.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StopDetail extends StatefulWidget {
  final StopModel stop;
  const _StopDetail({required this.stop});

  @override
  State<_StopDetail> createState() => _StopDetailState();
}

class _StopDetailState extends State<_StopDetail> {
  bool _completing = false;

  Future<void> _markComplete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Mark as Complete?'),
        content: Text(
          'Confirm that you have finished servicing ${widget.stop.property.address}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary, foregroundColor: Colors.white),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _completing = true);
    final success =
        await context.read<ItineraryProvider>().markCurrentStopComplete();
    if (mounted) {
      setState(() => _completing = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stop marked as complete'),
            backgroundColor: kPrimary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                context.read<ItineraryProvider>().errorMessage ??
                    'Failed to complete stop'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final stop = widget.stop;
    final property = stop.property;
    final customer = stop.customer;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Stop number + address header
          _SectionCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Big stop badge
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: kPrimary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      '${stop.stopNumber}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property.address.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        '${property.city}, ${property.state} ${property.postal}'
                            .toUpperCase(),
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF374151),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Customer info
          if (customer != null)
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SectionLabel(label: 'Customer'),
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.person_outline,
                    text: customer.displayName,
                  ),
                  if (customer.phone != null)
                    _InfoRow(
                      icon: Icons.phone_outlined,
                      text: customer.phone!,
                    ),
                  if (customer.email != null)
                    _InfoRow(
                      icon: Icons.email_outlined,
                      text: customer.email!,
                    ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // Property details
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionLabel(label: 'Property Details'),
                const SizedBox(height: 8),
                _InfoRow(
                  icon: Icons.pets,
                  text: property.hasPets ? 'Pets on property' : 'No pets',
                  iconColor: property.hasPets ? Colors.amber.shade600 : null,
                ),
              ],
            ),
          ),

          // Access codes
          if (property.codes.isNotEmpty) ...[
            const SizedBox(height: 12),
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SectionLabel(label: 'Access Codes'),
                  const SizedBox(height: 8),
                  ...property.codes.map(
                    (code) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          const Icon(Icons.lock_outline,
                              size: 16, color: Color(0xFF6B7280)),
                          const SizedBox(width: 8),
                          Text(
                            '${code.label}: ',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          Text(
                            code.code,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF111827),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Mark complete button
          ElevatedButton.icon(
            onPressed: _completing ? null : _markComplete,
            icon: _completing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check_circle_outline),
            label: Text(_completing ? 'Completing…' : 'Mark as Complete'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final Widget child;
  const _SectionCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: Color(0xFF9CA3AF),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? iconColor;

  const _InfoRow({
    required this.icon,
    required this.text,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: iconColor ?? const Color(0xFF6B7280)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
            ),
          ),
        ],
      ),
    );
  }
}
