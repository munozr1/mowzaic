import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Persistent bottom bar — "Current stop →" — navigates to the Current Stop tab.
class CurrentStopBottomBar extends StatelessWidget {
  final VoidCallback onTap;
  final String? label;

  const CurrentStopBottomBar({
    super.key,
    required this.onTap,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: kPrimaryDark,
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 16,
          bottom: 16 + MediaQuery.of(context).padding.bottom,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label ?? 'Current stop',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_forward,
                  color: kPrimaryDark, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
