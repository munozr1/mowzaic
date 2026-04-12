import 'booking_model.dart';
import 'property_model.dart';
import 'customer_model.dart';

/// A Stop represents one delivery/service entry in today's itinerary.
/// It combines a Booking, its Property, and the Customer.
class StopModel {
  final int stopNumber;
  final BookingModel booking;
  final PropertyModel property;
  final CustomerModel? customer;

  const StopModel({
    required this.stopNumber,
    required this.booking,
    required this.property,
    this.customer,
  });

  factory StopModel.fromJson(Map<String, dynamic> json) {
    return StopModel(
      stopNumber: json['stop_number'] as int,
      booking: BookingModel.fromJson(json['booking'] as Map<String, dynamic>),
      property: PropertyModel.fromJson(json['property'] as Map<String, dynamic>),
      customer: json['customer'] != null
          ? CustomerModel.fromJson(json['customer'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get isCompleted => booking.isCompleted;
  bool get isScheduled => booking.isScheduled;
}
