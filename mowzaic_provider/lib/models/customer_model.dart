class CustomerModel {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;

  const CustomerModel({
    required this.id,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] as String,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
    );
  }

  String get displayName {
    final parts = [firstName, lastName].where((s) => s != null && s.isNotEmpty);
    return parts.isNotEmpty ? parts.join(' ') : email ?? 'Unknown';
  }

  String get initials {
    final f = firstName?.isNotEmpty == true ? firstName![0] : '';
    final l = lastName?.isNotEmpty == true ? lastName![0] : '';
    return '$f$l'.toUpperCase().isEmpty ? '?' : '$f$l'.toUpperCase();
  }
}
