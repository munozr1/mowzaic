class PropertyModel {
  final String id;
  final String address;
  final String city;
  final String state;
  final String postal;
  final bool hasPets;
  final List<AccessCode> codes;
  final double? lat;
  final double? lng;

  const PropertyModel({
    required this.id,
    required this.address,
    required this.city,
    required this.state,
    required this.postal,
    required this.hasPets,
    required this.codes,
    this.lat,
    this.lng,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    // Supabase returns coordinates as "(lat,lng)" string for point type
    double? lat;
    double? lng;
    final raw = json['coordinates'];
    if (raw != null && raw is String) {
      final cleaned = raw.replaceAll('(', '').replaceAll(')', '');
      final parts = cleaned.split(',');
      if (parts.length == 2) {
        lat = double.tryParse(parts[0].trim());
        lng = double.tryParse(parts[1].trim());
      }
    } else if (raw is Map) {
      lat = double.tryParse(raw['x']?.toString() ?? '');
      lng = double.tryParse(raw['y']?.toString() ?? '');
    }

    final rawCodes = json['codes'];
    List<AccessCode> codes = [];
    if (rawCodes is List) {
      codes = rawCodes
          .map((c) => AccessCode.fromJson(c as Map<String, dynamic>))
          .toList();
    }

    return PropertyModel(
      id: json['id'] as String,
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      postal: json['postal'] as String? ?? '',
      hasPets: json['has_pets'] as bool? ?? false,
      codes: codes,
      lat: lat,
      lng: lng,
    );
  }

  String get fullAddress => '$address, $city, $state $postal';
  bool get hasCoordinates => lat != null && lng != null;
}

class AccessCode {
  final String id;
  final String code;
  final String label;

  const AccessCode({required this.id, required this.code, required this.label});

  factory AccessCode.fromJson(Map<String, dynamic> json) {
    return AccessCode(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
    );
  }
}
