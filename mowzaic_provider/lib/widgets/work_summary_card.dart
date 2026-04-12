import 'package:flutter/material.dart';
import '../config/theme.dart';

class WorkSummaryCard extends StatelessWidget {
  final int totalStops;
  final int completedStops;

  const WorkSummaryCard({
    super.key,
    required this.totalStops,
    required this.completedStops,
  });

  int get remaining => totalStops - completedStops;

  @override
  Widget build(BuildContext context) {
    final progress = totalStops > 0 ? completedStops / totalStops : 0.0;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Work remaining',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
              const Spacer(),
              Icon(Icons.info_outline,
                  size: 20, color: Colors.grey.shade400),
            ],
          ),
          const SizedBox(height: 12),
          _StatRow(
            label: 'Stops',
            value: '$remaining',
            progress: 1 - progress,
          ),
          const SizedBox(height: 8),
          _StatRow(
            label: 'Completed',
            value: '$completedStops',
            progress: progress,
          ),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  final double progress;

  const _StatRow({
    required this.label,
    required this.value,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF111827),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress.clamp(0.0, 1.0),
            minHeight: 6,
            backgroundColor: const Color(0xFFE5E7EB),
            valueColor: const AlwaysStoppedAnimation<Color>(kPrimary),
          ),
        ),
      ],
    );
  }
}
