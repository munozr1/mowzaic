import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../providers/itinerary_provider.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  MapboxMap? _mapboxMap;

  @override
  void initState() {
    super.initState();
    MapboxOptions.setAccessToken(AppConstants.mapboxAccessToken);
  }

  void _onMapCreated(MapboxMap map) async {
    _mapboxMap = map;
    await _drawRoute();
  }

  Future<void> _drawRoute() async {
    final itinerary = context.read<ItineraryProvider>();
    final stops = itinerary.stops
        .where((s) => s.property.hasCoordinates)
        .toList();

    if (stops.isEmpty || _mapboxMap == null) return;

    // Fit camera to all stop coordinates
    final coords = stops
        .map((s) => Point(
              coordinates: Position(s.property.lng!, s.property.lat!),
            ))
        .toList();

    // Add polyline through all stops
    if (coords.length >= 2) {
      final geoJson = {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'LineString',
              'coordinates': stops
                  .where((s) => s.property.hasCoordinates)
                  .map((s) => [s.property.lng!, s.property.lat!])
                  .toList(),
            },
            'properties': {},
          }
        ],
      };

      await _mapboxMap!.style.addSource(
        GeoJsonSource(id: 'route-source', data: geoJson.toString()),
      );

      await _mapboxMap!.style.addLayer(
        LineLayer(
          id: 'route-layer',
          sourceId: 'route-source',
          lineColor: kPrimary.value,
          lineWidth: 4.0,
          lineCap: LineCap.ROUND,
          lineJoin: LineJoin.ROUND,
        ),
      );
    }

    // Add circle annotations for each stop
    final annotationManager =
        await _mapboxMap!.annotations.createCircleAnnotationManager();

    final annotations = stops.map((s) {
      final isActive = itinerary.currentStop?.booking.id == s.booking.id;
      return CircleAnnotationOptions(
        geometry: Point(
          coordinates: Position(s.property.lng!, s.property.lat!),
        ),
        circleRadius: isActive ? 14.0 : 10.0,
        circleColor: isActive ? kPrimary.value : kPinDefault.value,
        circleStrokeWidth: 2.0,
        circleStrokeColor: Colors.white.value,
      );
    }).toList();

    await annotationManager.createMulti(annotations);

    // Fly to first stop
    final first = stops.first;
    await _mapboxMap!.flyTo(
      CameraOptions(
        center: Point(
          coordinates: Position(first.property.lng!, first.property.lat!),
        ),
        zoom: 12.0,
      ),
      MapAnimationOptions(duration: 1000),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ITINERARY MAP')),
      body: Stack(
        children: [
          MapWidget(
            onMapCreated: _onMapCreated,
            styleUri: MapboxStyles.MAPBOX_STREETS,
          ),

          // Reload button
          Positioned(
            bottom: 90,
            right: 16,
            child: FloatingActionButton.small(
              onPressed: _drawRoute,
              backgroundColor: Colors.white,
              foregroundColor: kPrimaryDeep,
              child: const Icon(Icons.refresh),
            ),
          ),

          // Location button
          Positioned(
            bottom: 140,
            right: 16,
            child: FloatingActionButton.small(
              onPressed: _centerOnLocation,
              backgroundColor: Colors.white,
              foregroundColor: kPrimaryDeep,
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _centerOnLocation() async {
    // In a real app, get GPS coordinates via geolocator and fly to them
    // For now just reset to current stop
    await _drawRoute();
  }
}
