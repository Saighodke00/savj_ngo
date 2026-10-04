import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:savj_mobile/features/auth/providers/auth_provider.dart';
import 'package:savj_mobile/features/auth/ui/login_screen.dart';
import 'package:savj_mobile/features/tasks/ui/task_list_screen.dart';
import 'package:savj_mobile/features/tasks/ui/task_create_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggingIn = state.uri.path == '/login';

      return authState.when(
        data: (user) {
          if (user == null) {
            return isLoggingIn ? null : '/login';
          }
          if (isLoggingIn) {
            return '/';
          }
          return null;
        },
        loading: () => null, // Wait for checkAuth
        error: (_, __) => '/login',
      );
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const TaskListScreen(),
        routes: [
          GoRoute(
            path: 'tasks/create',
            builder: (context, state) => const TaskCreateScreen(),
          ),
        ],
      ),
    ],
  );
});
