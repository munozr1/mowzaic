import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Teardrop-shaped stop number badge — mirrors Amazon Flex map pins.
class StopPin extends StatelessWidget {
  final int number;
  final bool isActive;
  final bool isCompleted;
  final double size;

  const StopPin({
    super.key,
    required this.number,
    this.isActive = false,
    this.isCompleted = false,
    this.size = 36,
  });

  Color get _bg {
    if (isActive) return kPinActive;
    if (isCompleted) return kPinDone;
    return kPinDefault;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size * 1.3,
      child: CustomPaint(
        painter: _TearPainter(color: _bg),
        child: Align(
          alignment: const Alignment(0, -0.25),
          child: Text(
            '$number',
            style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.38,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

class _TearPainter extends CustomPainter {
  final Color color;
  _TearPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final w = size.width;
    final h = size.height;
    final r = w / 2;

    final path = Path()
      ..addOval(Rect.fromCircle(center: Offset(r, r), radius: r))
      ..moveTo(r, h)
      ..lineTo(r - r * 0.4, r * 1.1)
      ..lineTo(r + r * 0.4, r * 1.1)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_TearPainter old) => old.color != color;
}
