import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:savj_mobile/core/api/api_client.dart';
import 'package:savj_mobile/features/auth/domain/user_model.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthRepository(this._dio, this._storage);

  Future<User?> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        
        await _storage.write(key: 'access_token', value: tokens['access_token']);
        await _storage.write(key: 'refresh_token', value: tokens['refresh_token']);
        
        return User.fromJson(data['user']);
      }
    } catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
    return null;
  }

  Future<User?> register(String email, String password, String fullName) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'full_name': fullName,
      });

      if (response.statusCode == 201 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        
        await _storage.write(key: 'access_token', value: tokens['access_token']);
        await _storage.write(key: 'refresh_token', value: tokens['refresh_token']);
        
        return User.fromJson(data['user']);
      }
    } catch (e) {
      throw Exception('Registration failed: ${e.toString()}');
    }
    return null;
  }

  Future<User?> checkAuth() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return null;

    try {
      final response = await _dio.get('/auth/me');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return User.fromJson(response.data['data']);
      }
    } catch (e) {
      // Token might be invalid or expired (and refresh failed). Clear tokens.
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
    }
    return null;
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        await _dio.post('/auth/logout', data: {
          'refresh_token': refreshToken,
        });
      }
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
    }
  }
}
