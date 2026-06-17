import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../theme/app_theme.dart';
import '../../core/auth_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _ctrl, curve: const Interval(0, 0.6, curve: Curves.easeOut)));
    _scaleAnim = Tween<double>(begin: 0.7, end: 1).animate(CurvedAnimation(parent: _ctrl, curve: const Interval(0, 0.6, curve: Curves.elasticOut)));
    _ctrl.forward();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('kittab_token');
    if (token != null) {
      await authService.loadUser();
    }
    if (!mounted) return;
    context.go('/');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) => FadeTransition(
            opacity: _fadeAnim,
            child: ScaleTransition(
              scale: _scaleAnim,
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Image.asset('assets/images/logo.png', height: 90),
                const SizedBox(height: 16),
                const Text('KITTAB',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 4)),
                const SizedBox(height: 6),
                const Text('Votre bibliothèque africaine',
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 48, height: 3, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 8),
            Container(width: 32, height: 3, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ]),
        ),
      ),
    );
  }
}
