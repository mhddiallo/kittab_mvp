import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/auth_service.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? get user => authService.user;
  bool _regenerating = false;

  Future<void> _regenerateUsername() async {
    setState(() => _regenerating = true);
    try {
      await api.post('/api/auth/me/regenerate-username');
      await authService.loadUser();
      if (mounted) setState(() {});
    } catch (_) {}
    if (mounted) setState(() => _regenerating = false);
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Déconnexion', style: TextStyle(color: AppColors.primary))),
        ],
      ),
    );
    if (confirm == true) {
      await authService.logout();
      if (mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Profil')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.person_outline, size: 64, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text('Connecte-toi pour accéder à ton profil',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: () => context.push('/login'), child: const Text('Se connecter')),
            ]),
          ),
        ),
      );
    }

    final username = user!['username'] as String? ?? '';
    final phone = user!['phone'] as String? ?? '';
    final initial = username.isNotEmpty ? username[0].toUpperCase() : '?';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Profil')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: Column(children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(initial,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
                ),
                const SizedBox(height: 12),
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(username.isNotEmpty ? username : 'Utilisateur',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _regenerating ? null : _regenerateUsername,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                      child: _regenerating
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('🎲', style: TextStyle(fontSize: 14)),
                    ),
                  ),
                ]),
                const SizedBox(height: 4),
                Text(phone, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8))),
              ]),
            ),

            const SizedBox(height: 16),

            // Menu
            _section([
              _tile(Icons.book_outlined, 'Mes livres', () => context.push('/my-listings')),
              _tile(Icons.notifications_outlined, 'Notifications', () {}),
            ]),

            const SizedBox(height: 12),

            _section([
              _tile(Icons.person_outline, 'Informations personnelles', () => context.push('/profile/edit')),
              _tile(Icons.help_outline, 'Aide', () {}),
              _tile(Icons.info_outline, 'À propos · v1.0.0', () {}),
            ]),

            const SizedBox(height: 12),

            _section([
              _tile(Icons.logout, 'Déconnexion', _logout, color: AppColors.primary),
            ]),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _section(List<Widget> children) => Container(
    margin: const EdgeInsets.symmetric(horizontal: 16),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(children: children),
  );

  Widget _tile(IconData icon, String label, VoidCallback onTap, {Color? color}) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(16),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: (color ?? AppColors.primary).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color ?? AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color ?? AppColors.textPrimary))),
        Icon(Icons.chevron_right, size: 18, color: color ?? AppColors.textHint),
      ]),
    ),
  );
}
