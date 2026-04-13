class BookingModel {
  final String id;
  final DateTime dateOfService;
  final String serviceStatus; // scheduled | completed | canceled
  final String paymentStatus; // paid | pending | canceled
  final String? subscriptionId;

  const BookingModel({
    required this.id,
    required this.dateOfService,
    required this.serviceStatus,
    required this.paymentStatus,
    this.subscriptionId,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as String,
      dateOfService: DateTime.parse(json['date_of_service'] as String),
      serviceStatus: json['service_status'] as String,
      paymentStatus: json['payment_status'] as String,
      subscriptionId: json['subscription_id']?.toString(),
    );
  }

  bool get isScheduled => serviceStatus == 'scheduled';
  bool get isCompleted => serviceStatus == 'completed';
  bool get isCanceled => serviceStatus == 'canceled';
}
