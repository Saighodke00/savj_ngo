class User {
  final String id;
  final String email;
  final String fullName;
  final List<String> roles;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.roles,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      roles: List<String>.from(json['roles']),
    );
  }
}
