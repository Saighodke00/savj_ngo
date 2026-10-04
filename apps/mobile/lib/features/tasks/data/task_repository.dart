import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:savj_mobile/core/api/api_client.dart';
import 'package:savj_mobile/features/tasks/domain/task_model.dart';

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepository(ref.watch(dioProvider));
});

class TaskRepository {
  final Dio _dio;

  TaskRepository(this._dio);

  Future<List<TaskModel>> fetchNearbyTasks(double lat, double lon, {int radiusKm = 10}) async {
    try {
      final response = await _dio.post('/tasks/nearby', data: {
        'lat': lat,
        'lon': lon,
        'radius_km': radiusKm,
        'page': 1,
        'page_size': 20,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List items = response.data['data'];
        return items.map((e) => TaskModel.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch tasks: ${e.toString()}');
    }
  }

  Future<TaskModel> createTask(Map<String, dynamic> payload) async {
    try {
      final response = await _dio.post('/tasks', data: payload);
      if (response.statusCode == 201 && response.data['success'] == true) {
        return TaskModel.fromJson(response.data['data']);
      }
      throw Exception('Failed to create task');
    } catch (e) {
      throw Exception('Failed to create task: ${e.toString()}');
    }
  }
}
