import 'package:flutter/material.dart';
import '../models/stop_model.dart';
import '../config/theme.dart';
import 'stop_pin.dart';

class StopListItem extends StatelessWidget {
  final StopModel stop;
  final bool isNext;
  final VoidCallback? onTap;

  const StopListItem({
    super.key,
    required this.stop,
    this.isNext = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final property = stop.property;
    final customer = stop.customer;
    final completed = stop.isCompleted;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isNext ? kPrimaryLight : Colors.white,
          border: Border(
            bottom: BorderSide(color: const Color(0xFFE5E7EB)),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stop pin
            StopPin(
              number: stop.stopNumber,
              isActive: isNext,
              isCompleted: completed,
              size: 38,
            ),
            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // "Next Stop:" label
                  if (isNext)
                    const Text(
                      'Next Stop:',
                      style: TextStyle(
                        color: kPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),

                  // Address
                  Text(
                    property.address.toUpperCase(),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: completed
                          ? const Color(0xFF9CA3AF)
                          : const Color(0xFF111827),
                      decoration: completed
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  Text(
                    property.city.toUpperCase(),
                    style: TextStyle(
                      fontSize: 13,
                      color: completed
                          ? const Color(0xFF9CA3AF)
                          : const Color(0xFF374151),
                      decoration: completed
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Sub-info row
                  Row(
                    children: [
                      if (customer != null) ...[
                        Icon(Icons.person_outline,
                            size: 13, color: Colors.grey.shade500),
                        const SizedBox(width: 3),
                        Text(
                          customer.displayName,
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade600),
                        ),
                        const SizedBox(width: 10),
                      ],
                      if (stop.property.hasPets) ...[
                        Icon(Icons.pets,
                            size: 13, color: Colors.amber.shade600),
                        const SizedBox(width: 3),
                        Text('Pets',
                            style: TextStyle(
                                fontSize: 12,
                                color: Colors.amber.shade700)),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Chevron / checkmark
            if (completed)
              const Icon(Icons.check_circle,
                  color: kPrimary, size: 20)
            else
              const Icon(Icons.chevron_right,
                  color: Color(0xFFD1D5DB), size: 20),
          ],
        ),
      ),
    );
  }
}
