class TaskModel {
  final String id;
  final String title;
  final String? description;
  final int budgetPaise;
  final double locationLat;
  final double locationLon;
  final String? locationLabel;
  final String status;
  final String urgency;

  TaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.budgetPaise,
    required this.locationLat,
    required this.locationLon,
    this.locationLabel,
    required this.status,
    required this.urgency,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      budgetPaise: json['budget_paise'] as int,
      locationLat: (json['location_lat'] as num).toDouble(),
      locationLon: (json['location_lon'] as num).toDouble(),
      locationLabel: json['location_label'] as String?,
      status: json['status'] as String,
      urgency: json['urgency'] as String,
    );
  }
}
