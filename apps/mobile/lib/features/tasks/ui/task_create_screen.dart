import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:savj_mobile/features/tasks/data/task_repository.dart';
import 'package:savj_mobile/features/tasks/providers/task_provider.dart';

class TaskCreateScreen extends ConsumerStatefulWidget {
  const TaskCreateScreen({super.key});

  @override
  ConsumerState<TaskCreateScreen> createState() => _TaskCreateScreenState();
}

class _TaskCreateScreenState extends ConsumerState<TaskCreateScreen> {
  final titleCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final budgetCtrl = TextEditingController();
  final formKey = GlobalKey<FormState>();
  bool isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Task')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Task Title'),
                validator: (v) => v == null || v.length < 5 ? 'Min 5 chars' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 4,
                validator: (v) => v == null || v.length < 20 ? 'Min 20 chars' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: budgetCtrl,
                decoration: const InputDecoration(labelText: 'Budget (₹)'),
                keyboardType: TextInputType.number,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 32),
              if (isSubmitting)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Create Task'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!formKey.currentState!.validate()) return;
    
    setState(() => isSubmitting = true);
    try {
      final repository = ref.read(taskRepositoryProvider);
      await repository.createTask({
        'title': titleCtrl.text,
        'description': descCtrl.text,
        'budget_paise': int.parse(budgetCtrl.text) * 100, // convert rupees to paise
        // Mocking user location for demo
        'location_lat': 12.9716,
        'location_lon': 77.5946,
        'location_label': 'MG Road, Bangalore',
        'visibility_radius_km': 5,
        'urgency': 'NORMAL',
      });
      
      if (mounted) {
        // Refresh the tasks feed
        ref.invalidate(nearbyTasksProvider);
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Task created successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }
}
