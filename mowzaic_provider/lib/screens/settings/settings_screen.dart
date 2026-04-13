import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('SETTINGS')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Profile header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: kPrimaryMid,
                    child: Text(
                      _initials(auth.displayName),
                      style: const TextStyle(
                        color: kPrimaryDeep,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          auth.displayName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                        Text(
                          auth.email,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: kPrimaryMid,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            (auth.role ?? 'provider').toUpperCase(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: kPrimaryDeep,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),
            const SizedBox(height: 16),

            // Menu section
            const _SectionHeader(title: 'Account'),
            _SettingsTile(
              icon: Icons.person_outline,
              label: 'Your Profile',
              onTap: () {},
            ),
            _SettingsTile(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              onTap: () {},
            ),

            const SizedBox(height: 8),
            const _SectionHeader(title: 'App'),
            _SettingsTile(
              icon: Icons.info_outline,
              label: 'About Mowzaic Provider',
              onTap: () => _showAbout(context),
            ),

            const SizedBox(height: 24),
            const Divider(height: 1),

            // Sign out
            _SettingsTile(
              icon: Icons.logout,
              label: 'Sign Out',
              iconColor: const Color(0xFFEF4444),
              labelColor: const Color(0xFFEF4444),
              onTap: () => _confirmSignOut(context, auth),
            ),

            const SizedBox(height: 40),

            // Version
            const Center(
              child: Text(
                'Mowzaic Provider v1.0.0',
                style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  void _showAbout(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Mowzaic Provider',
      applicationVersion: '1.0.0',
      applicationLegalese: '© 2025 Mowzaic',
    );
  }

  void _confirmSignOut(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              auth.signOut();
            },
            style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFEF4444)),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: Color(0xFF9CA3AF),
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? labelColor;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.labelColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      tileColor: Colors.white,
      leading: Icon(icon, color: iconColor ?? const Color(0xFF374151), size: 22),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          color: labelColor ?? const Color(0xFF111827),
        ),
      ),
      trailing: const Icon(Icons.chevron_right,
          color: Color(0xFFD1D5DB), size: 20),
      onTap: onTap,
    );
  }
}
