import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provide the base API URL. For local dev from an emulator, 10.0.2.2 is used for localhost.
/// For physical devices, this needs to be the computer's local IP (e.g., 192.168.x.x).
const String baseUrl = 'http://10.0.2.2:8000/api/v1';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  final secureStorage = ref.watch(secureStorageProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final accessToken = await secureStorage.read(key: 'access_token');
        if (accessToken != null) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Token expired or invalid. Attempt refresh.
          final refreshToken = await secureStorage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              // Note: Using a separate Dio instance to avoid interceptor loop
              final refreshDio = Dio(BaseOptions(baseUrl: baseUrl));
              final response = await refreshDio.post('/auth/refresh', data: {
                'refresh_token': refreshToken,
              });

              if (response.statusCode == 200 && response.data['success'] == true) {
                final newAccessToken = response.data['data']['access_token'];
                final newRefreshToken = response.data['data']['refresh_token'];
                
                await secureStorage.write(key: 'access_token', value: newAccessToken);
                await secureStorage.write(key: 'refresh_token', value: newRefreshToken);
                
                // Retry the original request
                e.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final retryResponse = await refreshDio.fetch(e.requestOptions);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh failed. Clear tokens.
              await secureStorage.delete(key: 'access_token');
              await secureStorage.delete(key: 'refresh_token');
            }
          }
        }
        return handler.next(e);
      },
    ),
  );

  return dio;
});
