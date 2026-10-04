import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:savj_mobile/features/tasks/data/task_repository.dart';
import 'package:savj_mobile/features/tasks/domain/task_model.dart';

final nearbyTasksProvider = FutureProvider.family<List<TaskModel>, ({double lat, double lon})>((ref, coords) async {
  final repository = ref.watch(taskRepositoryProvider);
  return repository.fetchNearbyTasks(coords.lat, coords.lon);
});
