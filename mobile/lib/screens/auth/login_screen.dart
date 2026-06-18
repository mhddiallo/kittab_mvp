import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth_service.dart';
import '../../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _step = 'phone'; // phone | otp
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';
  String? _devCode;

  String _normalizePhone(String phone) {
    return phone.replaceAll(' ', '').replaceAll('-', '');
  }

  bool _isValidPhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    return digits.length >= 7 && digits.length <= 15;
  }

  Future<void> _requestOtp() async {
    final phone = _normalizePhone(_phoneCtrl.text.trim());
    if (!_isValidPhone(phone)) {
      setState(() => _error = 'Numéro de téléphone invalide');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await authService.requestOtp(phone);
      _devCode = data['dev_code']?.toString();
      setState(() { _step = 'otp'; _loading = false; });
    } catch (e) {
      setState(() { _error = 'Erreur lors de l\'envoi du code'; _loading = false; });
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _normalizePhone(_phoneCtrl.text.trim());
    final code = _otpCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Code à 6 chiffres requis');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      await authService.verifyOtp(phone, code);
      if (!mounted) return;
      final user = authService.user;
      if (user != null && user['is_profile_complete'] == false) {
        context.go('/profile?nouveau=1');
      } else {
        context.go('/');
      }
    } catch (e) {
      setState(() { _error = 'Code incorrect ou expiré'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: () {
              if (context.canPop()) context.pop();
              else context.go('/');
            },
            child: const Text('Passer →', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            children: [
              // Logo
              Image.asset('assets/images/logo.png', height: 64),
              const SizedBox(height: 8),
              const Text('KITTAB', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 2)),
              const SizedBox(height: 4),
              const Text('Votre bibliothèque africaine', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 48),

              // Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: _step == 'phone' ? _buildPhoneStep() : _buildOtpStep(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Connexion', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        const Text('Entre ton numéro pour recevoir un code', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        const SizedBox(height: 24),

        if (_error.isNotEmpty) _errorBox(_error),

        const Text('Numéro de téléphone', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            hintText: '+221 XX XXX XX XX',
            prefixIcon: Icon(Icons.phone_outlined, size: 18, color: AppColors.textHint),
          ),
          onSubmitted: (_) => _requestOtp(),
        ),
        const SizedBox(height: 8),
        const Text('Vous recevrez un code par WhatsApp ou SMS', style: TextStyle(fontSize: 11, color: AppColors.textHint)),
        const SizedBox(height: 20),

        ElevatedButton(
          onPressed: _loading ? null : _requestOtp,
          child: _loading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Connexion par téléphone'),
        ),

        const SizedBox(height: 16),
        Center(
          child: Text.rich(
            TextSpan(
              text: 'En continuant, tu acceptes nos ',
              style: const TextStyle(fontSize: 11, color: AppColors.textHint),
              children: [
                TextSpan(text: 'CGU', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                const TextSpan(text: ' et notre '),
                TextSpan(text: 'Politique de confidentialité', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
              ],
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildOtpStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => setState(() { _step = 'phone'; _error = ''; }),
          child: const Row(children: [
            Icon(Icons.arrow_back_ios, size: 14, color: AppColors.textSecondary),
            SizedBox(width: 4),
            Text('Retour', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          ]),
        ),
        const SizedBox(height: 20),

        const Text('Vérifiez votre téléphone', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Code envoyé au ${_phoneCtrl.text}',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        const SizedBox(height: 24),

        if (_devCode != null) _devCodeBox(_devCode!),
        if (_error.isNotEmpty) _errorBox(_error),

        const Text('Code à 6 chiffres', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: _otpCtrl,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 12),
          decoration: const InputDecoration(counterText: '', hintText: '000000'),
          onSubmitted: (_) => _verifyOtp(),
        ),
        const SizedBox(height: 20),

        ElevatedButton(
          onPressed: _loading ? null : _verifyOtp,
          child: _loading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Valider le code'),
        ),

        const SizedBox(height: 12),
        Center(
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Text('Code valable 10 min. ', style: TextStyle(fontSize: 12, color: AppColors.textHint)),
            GestureDetector(
              onTap: _requestOtp,
              child: const Text('Renvoyer', style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
            ),
          ]),
        ),
      ],
    );
  }

  Widget _errorBox(String msg) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFECACA))),
    child: Text(msg, style: const TextStyle(color: AppColors.primary, fontSize: 13)),
  );

  Widget _devCodeBox(String code) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFBFDBFE))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Mode test — utilisez ce code :', style: TextStyle(fontSize: 11, color: Color(0xFF1D4ED8))),
      Text(code, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E40AF), letterSpacing: 8)),
    ]),
  );
}
