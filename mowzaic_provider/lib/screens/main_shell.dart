import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/itinerary_provider.dart';
import '../config/theme.dart';
import 'current_stop/current_stop_screen.dart';
import 'itinerary/itinerary_screen.dart';
import 'map/map_screen.dart';
import 'settings/settings_screen.dart';
import 'customers/add_customer_screen.dart';
import 'jobs/available_jobs_screen.dart';
import '../widgets/bottom_bar.dart';

// Tab indices for the 4 main sections
const _kCurrentStop = 0;
const _kItinerary = 1;
const _kMap = 2;
const _kSettings = 3;

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedTab = _kItinerary; // Default to itinerary list on launch
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ItineraryProvider>().loadTodayStops();
    });
  }

  void _switchTab(int index) {
    setState(() => _selectedTab = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: _AppDrawer(
        selectedTab: _selectedTab,
        onTabSelected: (index) {
          _scaffoldKey.currentState?.closeDrawer();
          _switchTab(index);
        },
      ),
      body: Column(
        children: [
          Expanded(
            child: IndexedStack(
              index: _selectedTab,
              children: [
                const CurrentStopScreen(),
                ItineraryScreen(onTabSwitch: _switchTab),
                const MapScreen(),
                const SettingsScreen(),
              ],
            ),
          ),
          // Persistent bottom bar (hidden on settings tab)
          if (_selectedTab != _kSettings)
            CurrentStopBottomBar(
              onTap: () => _switchTab(_kCurrentStop),
              label: 'Current stop',
            ),
        ],
      ),
    );
  }
}

// ── Drawer ─────────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  final int selectedTab;
  final void Function(int) onTabSelected;

  const _AppDrawer({
    required this.selectedTab,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Drawer(
      child: Column(
        children: [
          // Profile header
          Container(
            color: kPrimaryLight,
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 20,
              bottom: 20,
              left: 20,
              right: 20,
            ),
            child: Column(
              children: [
                // Close button
                Align(
                  alignment: Alignment.topLeft,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Icon(Icons.close,
                        color: kPrimaryDeep, size: 22),
                  ),
                ),
                const SizedBox(height: 12),
                CircleAvatar(
                  radius: 36,
                  backgroundColor: kPrimaryMid,
                  child: Text(
                    _initials(auth.displayName),
                    style: const TextStyle(
                      color: kPrimaryDeep,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  auth.displayName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: kPrimaryDeep,
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                const SizedBox(height: 8),

                // Primary navigation
                _DrawerItem(
                  icon: Icons.location_on_outlined,
                  label: 'Current stop',
                  selected: selectedTab == _kCurrentStop,
                  onTap: () => onTabSelected(_kCurrentStop),
                ),
                _DrawerItem(
                  icon: Icons.format_list_numbered,
                  label: "Today's itinerary",
                  selected: selectedTab == _kItinerary,
                  onTap: () => onTabSelected(_kItinerary),
                ),
                _DrawerItem(
                  icon: Icons.map_outlined,
                  label: 'Map',
                  selected: selectedTab == _kMap,
                  onTap: () => onTabSelected(_kMap),
                ),
                _DrawerItem(
                  icon: Icons.settings_outlined,
                  label: 'Settings',
                  selected: selectedTab == _kSettings,
                  onTap: () => onTabSelected(_kSettings),
                ),

                const Divider(height: 24, indent: 16, endIndent: 16),

                // Secondary actions
                _DrawerItem(
                  icon: Icons.work_outline,
                  label: 'Available jobs',
                  selected: false,
                  onTap: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AvailableJobsScreen(),
                      ),
                    );
                  },
                ),
                _DrawerItem(
                  icon: Icons.person_add_outlined,
                  label: 'Add customer',
                  selected: false,
                  onTap: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AddCustomerScreen(),
                      ),
                    );
                  },
                ),

                const Divider(height: 24, indent: 16, endIndent: 16),

                // Support links
                _DrawerActionItem(
                  icon: Icons.headset_mic_outlined,
                  label: 'Driver Support',
                  color: kPrimary,
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
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
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? kPrimaryLight : Colors.transparent,
      child: ListTile(
        leading: Icon(
          icon,
          color: selected ? kPrimary : const Color(0xFF374151),
          size: 22,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? kPrimary : const Color(0xFF111827),
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}

class _DrawerActionItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _DrawerActionItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
