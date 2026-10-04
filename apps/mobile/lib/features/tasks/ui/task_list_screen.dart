import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:savj_mobile/features/auth/providers/auth_provider.dart';
import 'package:savj_mobile/features/tasks/providers/task_provider.dart';

class TaskListScreen extends ConsumerWidget {
  const TaskListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Hardcoded location for demo purposes (e.g. MG Road, Bangalore)
    const currentLoc = (lat: 12.9716, lon: 77.5946);
    final tasksAsync = ref.watch(nearbyTasksProvider(currentLoc));
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SAVJ Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          )
        ],
      ),
      body: tasksAsync.when(
        data: (tasks) {
          if (tasks.isEmpty) {
            return const Center(child: Text('No nearby tasks found.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(nearbyTasksProvider(currentLoc).future),
            child: ListView.builder(
              itemCount: tasks.length,
              itemBuilder: (context, index) {
                final task = tasks[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    title: Text(task.title),
                    subtitle: Text('${task.locationLabel ?? "Unknown"} • ₹${task.budgetPaise ~/ 100}'),
                    trailing: Chip(label: Text(task.status)),
                    onTap: () {
                      // Navigate to details
                    },
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/tasks/create'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
