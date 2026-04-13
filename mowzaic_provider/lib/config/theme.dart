import 'package:flutter/material.dart';

// ── Brand colours ──────────────────────────────────────────────────────────
const Color kPrimary = Color(0xFF2EB966);
const Color kPrimaryDark = Color(0xFF1a6b43);
const Color kPrimaryDeep = Color(0xFF14532d);
const Color kPrimaryLight = Color(0xFFf0fdf4);
const Color kPrimaryMid = Color(0xFFdcfce7);

// Stop-pin colours
const Color kPinActive = Color(0xFF2EB966);   // current stop
const Color kPinDefault = Color(0xFF1C1C1C);  // future stop
const Color kPinDone = Color(0xFFa3a3a3);     // completed stop

// ── App theme ──────────────────────────────────────────────────────────────
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kPrimary,
      primary: kPrimary,
      onPrimary: Colors.white,
      secondary: kPrimaryDark,
      onSecondary: Colors.white,
      surface: Colors.white,
      background: const Color(0xFFF9FAFB),
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: const Color(0xFFF9FAFB),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: kPrimaryDeep,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: kPrimaryDeep,
        letterSpacing: 1.2,
      ),
      iconTheme: IconThemeData(color: kPrimaryDeep),
    ),

    // Drawer
    drawerTheme: const DrawerThemeData(
      backgroundColor: Colors.white,
      elevation: 8,
    ),

    // ElevatedButton (primary action)
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        elevation: 0,
      ),
    ),

    // OutlinedButton
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kPrimary,
        side: const BorderSide(color: kPrimary),
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // InputDecoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kPrimary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFEF4444)),
      ),
      labelStyle: const TextStyle(color: Color(0xFF6B7280)),
      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
    ),

    // Card
    cardTheme: CardTheme(
      elevation: 2,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),

    // Divider
    dividerTheme: const DividerThemeData(
      color: Color(0xFFE5E7EB),
      thickness: 1,
      space: 1,
    ),

    // Progress indicator
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: kPrimary,
      linearTrackColor: Color(0xFFE5E7EB),
    ),
  );
}
