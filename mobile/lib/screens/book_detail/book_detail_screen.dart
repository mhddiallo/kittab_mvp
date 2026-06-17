import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api.dart';
import '../../core/auth_service.dart';
import '../../models/book.dart';
import '../../theme/app_theme.dart';

class BookDetailScreen extends StatefulWidget {
  final int bookId;
  const BookDetailScreen({super.key, required this.bookId});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  Book? book;
  bool loading = true;
  int selectedImage = 0;
  bool markingSold = false;

  @override
  void initState() {
    super.initState();
    _loadBook();
  }

  Future<void> _loadBook() async {
    try {
      final res = await api.get('/api/books/${widget.bookId}');
      setState(() { book = Book.fromJson(res.data); loading = false; });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  bool get isOwner => authService.user != null && book?.seller.id == authService.user!['id'];

  Future<void> _markSold() async {
    if (book == null) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Marquer comme vendu'),
        content: Text('Confirmer que "${book!.title}" a été vendu ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Confirmer', style: TextStyle(color: AppColors.primary))),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => markingSold = true);
    try {
      await api.patch('/api/books/${book!.id}/mark-sold');
      setState(() { book = Book.fromJson({...?book?.toJson(), 'is_sold': true, 'is_available': false}); });
    } catch (_) {}
    setState(() => markingSold = false);
  }

  Future<void> _contactWhatsApp() async {
    if (book == null) return;
    final phone = book!.seller.phone.replaceAll('+', '').replaceAll(' ', '');
    final msg = Uri.encodeComponent('Bonjour, je suis intéressé(e) par votre livre "${book!.title}" sur KITTAB. Est-il toujours disponible ?');
    final url = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  Future<void> _callSeller() async {
    if (book == null) return;
    final url = Uri.parse('tel:${book!.seller.phone}');
    if (await canLaunchUrl(url)) await launchUrl(url);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (book == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Livre introuvable')));

    final images = book!.displayImage.isNotEmpty ? [book!.displayImage] : <String>[];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Image header
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppColors.surface,
            leading: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), shape: BoxShape.circle),
                child: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.textPrimary),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: images.isNotEmpty
                  ? CachedNetworkImage(imageUrl: images[0], fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const Center(child: Icon(Icons.book, size: 64, color: AppColors.textHint)))
                  : const Center(child: Icon(Icons.book, size: 64, color: AppColors.textHint)),
            ),
          ),

          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title + badges
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (book!.isSold)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(20)),
                                  child: const Text('VENDU', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey)),
                                ),
                              Text(book!.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
                              const SizedBox(height: 4),
                              Text('par ${book!.author}', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _conditionColor(book!.condition).$2,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(book!.conditionLabel,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _conditionColor(book!.condition).$1)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Price
                    Text('${book!.price.toStringAsFixed(0)} FCFA',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.primary)),

                    const SizedBox(height: 16),

                    // Meta info
                    Wrap(spacing: 12, runSpacing: 8, children: [
                      if (book!.locationLabel != null) _metaChip(Icons.location_on_outlined, book!.locationLabel!),
                      if (book!.language != null) _metaChip(Icons.language, book!.language!),
                      if (book!.views > 0) _metaChip(Icons.visibility_outlined, '${book!.views} vues'),
                      if (book!.category != null) _metaChip(Icons.category_outlined, book!.category!['name'] ?? ''),
                    ]),

                    // Description
                    if (book!.description != null && book!.description!.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(book!.description!, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.6)),
                    ],

                    const SizedBox(height: 24),

                    // Owner: mark sold
                    if (isOwner && !book!.isSold) ...[
                      OutlinedButton.icon(
                        onPressed: markingSold ? null : _markSold,
                        icon: markingSold
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.check_circle_outline, size: 18),
                        label: Text(markingSold ? 'Enregistrement...' : 'Marquer comme vendu'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.green[700],
                          side: BorderSide(color: Colors.green[300]!),
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (isOwner && book!.isSold) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(14)),
                        child: const Text('✓ Ce livre a été marqué comme vendu',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Seller card
                    if (!isOwner && !book!.isSold) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Contacter le vendeur', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(book!.seller.fullName.isNotEmpty ? book!.seller.fullName : 'Vendeur Kittab',
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            if (book!.seller.address != null) ...[
                              const SizedBox(height: 2),
                              Text('📍 ${book!.seller.address}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            ],
                            const SizedBox(height: 14),
                            Row(children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _contactWhatsApp,
                                  icon: const Icon(Icons.chat, size: 16),
                                  label: const Text('WhatsApp'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF25D366),
                                    minimumSize: const Size(0, 44),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _callSeller,
                                  icon: const Icon(Icons.phone, size: 16),
                                  label: const Text('Appeler'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.primary,
                                    side: const BorderSide(color: AppColors.primary),
                                    minimumSize: const Size(0, 44),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                ),
                              ),
                            ]),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      // Owner edit button
      bottomNavigationBar: isOwner
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/publish/edit/${book!.id}'),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Modifier l\'annonce'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _metaChip(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.border)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 13, color: AppColors.textSecondary),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
    ]),
  );

  (Color, Color) _conditionColor(String condition) {
    switch (condition) {
      case 'new': return (Colors.green[700]!, Colors.green[50]!);
      case 'like_new': return (Colors.blue[700]!, Colors.blue[50]!);
      case 'good': return (Colors.orange[700]!, Colors.orange[50]!);
      default: return (Colors.grey[700]!, Colors.grey[100]!);
    }
  }
}

extension on Book {
  Map<String, dynamic>? toJson() => null;
}
