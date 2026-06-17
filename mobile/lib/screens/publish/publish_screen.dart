import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/api.dart';
import '../../theme/app_theme.dart';

class PublishScreen extends StatefulWidget {
  final int? editId;
  const PublishScreen({super.key, this.editId});
  @override
  State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  int _step = 0;
  bool _loading = false;
  bool _scanLoading = false;
  String _error = '';

  // Step 1
  File? _photo;
  final _titleCtrl = TextEditingController();
  final _authorCtrl = TextEditingController();
  String _selectedCategory = '';
  int? _categoryId;
  List<Map<String, dynamic>> _categories = [];
  String? _coverUrl;

  // Step 2
  String _condition = 'good';
  String _language = 'fr';
  final _descCtrl = TextEditingController();

  // Step 3
  String _transactionType = 'sell';
  final _priceCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  List<Map<String, dynamic>> _locationSuggestions = [];
  double? _lat, _lng;

  final _categories_list = [
    'Romans', 'Sciences', 'Histoire', 'Arts', 'Philosophie',
    'Biographie', 'Jeunesse', 'Cuisine', 'Dev. perso', 'Autre'
  ];

  final _conditions = [
    ('new', 'Neuf', 'Jamais utilisé'),
    ('like_new', 'Très bon', 'Parfait état'),
    ('good', 'Bon', 'Quelques traces'),
    ('fair', 'Acceptable', 'Usure visible'),
  ];

  final _languages = [
    ('fr', 'Français'), ('en', 'Anglais'), ('ar', 'Arabe'), ('wo', 'Wolof'), ('ff', 'Peul'),
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _authorCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await api.get('/api/categories');
      setState(() => _categories = List<Map<String, dynamic>>.from(res.data ?? []));
    } catch (_) {}
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _photo = File(img.path));
  }

  Future<void> _scanBarcode() async {
    final result = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => const _BarcodeScannerScreen()));
    if (result == null || !mounted) return;
    setState(() => _scanLoading = true);
    try {
      final res = await api.get('/api/books/info', queryParameters: {'isbn': result});
      if (res.data != null) {
        _titleCtrl.text = res.data['title'] ?? '';
        _authorCtrl.text = res.data['author'] ?? '';
        _coverUrl = res.data['cover_url'];
        setState(() {});
      }
    } catch (_) {}
    setState(() => _scanLoading = false);
  }

  Future<void> _searchLocation(String query) async {
    if (query.length < 3) { setState(() => _locationSuggestions = []); return; }
    try {
      final res = await api.get('https://nominatim.openstreetmap.org/search', queryParameters: {
        'q': query, 'format': 'json', 'limit': '5', 'countrycodes': 'sn,gn,ci,ml,fr',
      });
      setState(() => _locationSuggestions = List<Map<String, dynamic>>.from(res.data ?? []));
    } catch (_) {}
  }

  bool get _step1Valid => _titleCtrl.text.trim().isNotEmpty && _authorCtrl.text.trim().isNotEmpty;
  bool get _step3Valid => _priceCtrl.text.trim().isNotEmpty && _locationCtrl.text.trim().isNotEmpty;

  Future<void> _publish() async {
    if (!_step3Valid) { setState(() => _error = 'Remplis tous les champs obligatoires'); return; }
    setState(() { _loading = true; _error = ''; });
    try {
      final body = {
        'title': _titleCtrl.text.trim(),
        'author': _authorCtrl.text.trim(),
        'condition': _condition,
        'language': _language,
        'description': _descCtrl.text.trim().isNotEmpty ? _descCtrl.text.trim() : null,
        'price': double.tryParse(_priceCtrl.text.trim()) ?? 0,
        'book_type': 'other',
        'accepts_exchange': _transactionType == 'exchange',
        if (_categoryId != null) 'category_id': _categoryId,
        if (_coverUrl != null) 'cover_url': _coverUrl,
        if (_locationCtrl.text.trim().isNotEmpty) 'location_label': _locationCtrl.text.trim(),
        if (_lat != null) 'latitude': _lat,
        if (_lng != null) 'longitude': _lng,
      };

      await api.post('/api/books', data: body);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Livre publié avec succès !'), backgroundColor: Colors.green),
      );
      context.go('/my-listings');
    } catch (e) {
      setState(() { _error = 'Erreur lors de la publication'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Ajouter un livre${widget.editId != null ? ' (modification)' : ''}'),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop()),
      ),
      body: Column(
        children: [
          _buildStepper(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: [_buildStep1, _buildStep2, _buildStep3][_step](),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildStepper() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(children: List.generate(3, (i) => Expanded(
        child: Container(
          margin: EdgeInsets.only(right: i < 2 ? 6 : 0),
          height: 4,
          decoration: BoxDecoration(
            color: i <= _step ? AppColors.primary : AppColors.border,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ))),
    );
  }

  Widget _buildStep1() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _label('Étape 1 sur 3', sub: 'Informations du livre'),
      const SizedBox(height: 20),

      // Photo
      GestureDetector(
        onTap: _pickPhoto,
        child: Container(
          width: double.infinity, height: 160,
          decoration: BoxDecoration(
            color: AppColors.surface, borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border, style: BorderStyle.solid),
          ),
          child: _photo != null
              ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(_photo!, fit: BoxFit.cover))
              : _coverUrl != null
                  ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.network(_coverUrl!, fit: BoxFit.cover))
                  : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.camera_alt_outlined, size: 36, color: AppColors.textHint),
                      const SizedBox(height: 8),
                      const Text('Ajouter une photo', style: TextStyle(color: AppColors.textHint, fontSize: 13)),
                    ]),
        ),
      ),

      const SizedBox(height: 12),

      // Scan button
      OutlinedButton.icon(
        onPressed: _scanLoading ? null : _scanBarcode,
        icon: _scanLoading
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
            : const Icon(Icons.qr_code_scanner, size: 18, color: AppColors.primary),
        label: Text(_scanLoading ? 'Recherche...' : 'Scanner le code-barres (ISBN)',
            style: const TextStyle(color: AppColors.primary, fontSize: 13)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.primary),
          minimumSize: const Size(double.infinity, 44),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),

      const SizedBox(height: 20),
      _fieldLabel('Titre du livre *'),
      const SizedBox(height: 8),
      TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'Ex : L\'Art de la guerre'),
          onChanged: (_) => setState(() {})),

      const SizedBox(height: 16),
      _fieldLabel('Auteur *'),
      const SizedBox(height: 8),
      TextField(controller: _authorCtrl, decoration: const InputDecoration(hintText: 'Ex : Sun Tzu')),

      const SizedBox(height: 16),
      _fieldLabel('Catégorie'),
      const SizedBox(height: 10),
      Wrap(spacing: 8, runSpacing: 8, children: _categories_list.map((cat) {
        final sel = _selectedCategory == cat;
        return GestureDetector(
          onTap: () => setState(() => _selectedCategory = sel ? '' : cat),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: sel ? AppColors.primary : AppColors.border),
            ),
            child: Text(cat, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                color: sel ? Colors.white : AppColors.textSecondary)),
          ),
        );
      }).toList()),
    ]);
  }

  Widget _buildStep2() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _label('Étape 2 sur 3', sub: 'État et description'),
      const SizedBox(height: 20),

      _fieldLabel('État du livre *'),
      const SizedBox(height: 12),
      GridView.count(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.5,
        children: _conditions.map((c) {
          final sel = _condition == c.$1;
          return GestureDetector(
            onTap: () => setState(() => _condition = c.$1),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: sel ? AppColors.primaryLight : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: sel ? AppColors.primary : AppColors.border, width: sel ? 1.5 : 1),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(c.$2, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: sel ? AppColors.primary : AppColors.textPrimary)),
                Text(c.$3, style: const TextStyle(fontSize: 10, color: AppColors.textHint)),
              ]),
            ),
          );
        }).toList(),
      ),

      const SizedBox(height: 20),
      _fieldLabel('Langue'),
      const SizedBox(height: 10),
      Wrap(spacing: 8, children: _languages.map((l) {
        final sel = _language == l.$1;
        return GestureDetector(
          onTap: () => setState(() => _language = l.$1),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: sel ? AppColors.primary : AppColors.border),
            ),
            child: Text(l.$2, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                color: sel ? Colors.white : AppColors.textSecondary)),
          ),
        );
      }).toList()),

      const SizedBox(height: 20),
      _fieldLabel('Description (optionnel)'),
      const SizedBox(height: 8),
      TextField(controller: _descCtrl, maxLines: 4,
          decoration: const InputDecoration(hintText: 'État du livre, annotations, particularités...',
              contentPadding: EdgeInsets.all(14))),
    ]);
  }

  Widget _buildStep3() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _label('Étape 3 sur 3', sub: 'Transaction et lieu'),
      const SizedBox(height: 20),

      _fieldLabel('Que souhaitez-vous faire ?'),
      const SizedBox(height: 12),

      for (final t in [('sell', 'Vendre', 'Céder définitivement le livre'), ('exchange', 'Échanger', 'Proposer un échange')])
        GestureDetector(
          onTap: () => setState(() => _transactionType = t.$1),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _transactionType == t.$1 ? AppColors.primaryLight : AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _transactionType == t.$1 ? AppColors.primary : AppColors.border,
                  width: _transactionType == t.$1 ? 1.5 : 1),
            ),
            child: Row(children: [
              Icon(_transactionType == t.$1 ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: _transactionType == t.$1 ? AppColors.primary : AppColors.textHint),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t.$2, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                    color: _transactionType == t.$1 ? AppColors.primary : AppColors.textPrimary)),
                Text(t.$3, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ]),
            ]),
          ),
        ),

      const SizedBox(height: 16),
      _fieldLabel('Prix de vente *'),
      const SizedBox(height: 8),
      TextField(controller: _priceCtrl, keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: '5 000', suffixText: 'FCFA'),
          onChanged: (_) => setState(() {})),

      const SizedBox(height: 16),
      _fieldLabel('Lieu de récupération *'),
      const SizedBox(height: 8),
      TextField(
        controller: _locationCtrl,
        decoration: InputDecoration(
          hintText: 'Ex: Dakar, Plateau',
          prefixIcon: const Icon(Icons.location_on_outlined, size: 18, color: AppColors.textHint),
          suffixIcon: _lat != null ? const Icon(Icons.check_circle, color: Colors.green, size: 18) : null,
        ),
        onChanged: (v) { setState(() { _lat = null; _lng = null; }); _searchLocation(v); },
      ),

      if (_locationSuggestions.isNotEmpty) ...[
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Column(children: _locationSuggestions.take(4).map((s) => ListTile(
            dense: true,
            leading: const Icon(Icons.location_on, size: 16, color: AppColors.primary),
            title: Text(s['display_name'] ?? '', style: const TextStyle(fontSize: 12)),
            onTap: () {
              _locationCtrl.text = s['display_name'] ?? '';
              _lat = double.tryParse(s['lat'] ?? '');
              _lng = double.tryParse(s['lon'] ?? '');
              setState(() => _locationSuggestions = []);
            },
          )).toList()),
        ),
      ],

      if (_error.isNotEmpty) ...[
        const SizedBox(height: 12),
        Container(padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA))),
            child: Text(_error, style: const TextStyle(color: AppColors.primary, fontSize: 13))),
      ],

      const SizedBox(height: 8),
      Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10)),
          child: const Text('ℹ️ Les acheteurs vous contacteront pour négocier et organiser la transaction.',
              style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8)))),
    ]);
  }

  Widget _buildBottomBar() {
    final isLast = _step == 2;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Row(children: [
          if (_step > 0) ...[
            OutlinedButton(
              onPressed: () => setState(() => _step--),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                minimumSize: const Size(80, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Retour', style: TextStyle(color: AppColors.textSecondary)),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: ElevatedButton(
              onPressed: _loading ? null : () {
                if (isLast) { _publish(); return; }
                if (_step == 0 && !_step1Valid) { setState(() => _error = 'Titre et auteur requis'); return; }
                setState(() { _step++; _error = ''; });
              },
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(isLast ? '✓ Publier le livre' : 'Continuer',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _label(String title, {String? sub}) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
    if (sub != null) Text(sub, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
  ]);

  Widget _fieldLabel(String label) => Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary));
}

// Barcode scanner screen
class _BarcodeScannerScreen extends StatefulWidget {
  const _BarcodeScannerScreen();
  @override
  State<_BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<_BarcodeScannerScreen> {
  bool _detected = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner le code-barres'), backgroundColor: Colors.black, foregroundColor: Colors.white),
      body: Stack(children: [
        MobileScanner(
          onDetect: (capture) {
            if (_detected) return;
            final barcode = capture.barcodes.firstOrNull;
            if (barcode?.rawValue != null) {
              _detected = true;
              Navigator.pop(context, barcode!.rawValue);
            }
          },
        ),
        Center(
          child: Container(
            width: 250, height: 150,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.primary, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        Positioned(
          bottom: 40, left: 0, right: 0,
          child: const Text('Pointez sur le code-barres ISBN', textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}
