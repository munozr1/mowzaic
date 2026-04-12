import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/itinerary_provider.dart';
import '../../widgets/work_summary_card.dart';
import '../../widgets/stop_list_item.dart';
import '../../config/theme.dart';

class ItineraryScreen extends StatefulWidget {
  final void Function(int tabIndex) onTabSwitch;

  const ItineraryScreen({super.key, required this.onTabSwitch});

  @override
  State<ItineraryScreen> createState() => _ItineraryScreenState();
}

class _ItineraryScreenState extends State<ItineraryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ItineraryProvider>().loadTodayStops();
    });
  }

  @override
  Widget build(BuildContext context) {
    final itinerary = context.watch<ItineraryProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('ITINERARY LIST'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: itinerary.isLoading
                ? null
                : () => itinerary.loadTodayStops(),
          ),
        ],
      ),
      body: _buildBody(itinerary),
    );
  }

  Widget _buildBody(ItineraryProvider itinerary) {
    if (itinerary.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (itinerary.errorMessage != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(itinerary.errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF374151))),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: itinerary.loadTodayStops,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (itinerary.stops.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: kPrimary),
            SizedBox(height: 16),
            Text(
              'No stops today',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Check back later or claim available jobs.',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
      );
    }

    final currentStop = itinerary.currentStop;

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: itinerary.loadTodayStops,
      child: CustomScrollView(
        slivers: [
          // Summary header
          SliverToBoxAdapter(
            child: WorkSummaryCard(
              totalStops: itinerary.totalStops,
              completedStops: itinerary.completedCount,
            ),
          ),

          const SliverToBoxAdapter(
            child: Divider(height: 1),
          ),

          // Section label
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                'Stops',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
            ),
          ),

          // Stop list
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final stop = itinerary.stops[index];
                final isNext = currentStop?.booking.id == stop.booking.id;
                return StopListItem(
                  stop: stop,
                  isNext: isNext,
                  onTap: isNext
                      ? () => widget.onTabSwitch(0) // navigate to Current Stop
                      : null,
                );
              },
              childCount: itinerary.stops.length,
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }
}
