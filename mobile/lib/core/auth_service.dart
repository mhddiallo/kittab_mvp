import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  Map<String, dynamic>? _user;
  Map<String, dynamic>? get user => _user;
  bool get isLoggedIn => _user != null;

  Future<String?> get token async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('kittab_token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('kittab_token', token);
    await loadUser();
  }

  Future<void> loadUser() async {
    try {
      final res = await api.get('/api/auth/me');
      _user = res.data;
    } catch (_) {}
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('kittab_token');
    _user = null;
  }

  Future<Map<String, dynamic>> requestOtp(String phone) async {
    final res = await api.post('/api/auth/request-otp', data: {'phone': phone});
    return res.data;
  }

  Future<String> verifyOtp(String phone, String code) async {
    final res = await api.post('/api/auth/verify-otp', data: {'phone': phone, 'code': code});
    final token = res.data['access_token'];
    await saveToken(token);
    return token;
  }
}

final authService = AuthService();
