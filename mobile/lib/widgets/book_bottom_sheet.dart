import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api.dart';
import '../core/auth_service.dart';
import '../models/book.dart';
import '../theme/app_theme.dart';

void showBookBottomSheet(BuildContext context, int bookId) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _BookBottomSheetContent(bookId: bookId),
  );
}

class _BookBottomSheetContent extends StatefulWidget {
  final int bookId;
  const _BookBottomSheetContent({required this.bookId});

  @override
  State<_BookBottomSheetContent> createState() => _BookBottomSheetContentState();
}

class _BookBottomSheetContentState extends State<_BookBottomSheetContent> {
  Book? book;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadBook();
  }

  Future<void> _loadBook() async {
    try {
      final res = await api.get('/api/books/${widget.bookId}');
      setState(() {
        book = Book.fromJson(res.data);
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Impossible de charger le livre';
        loading = false;
      });
    }
  }

  Future<void> _call() async {
    if (book == null) return;
    final uri = Uri(scheme: 'tel', path: book!.seller.phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _whatsapp() async {
    if (book == null) return;
    final phone = book!.seller.phone.replaceAll(RegExp(r'[^\d+]'), '');
    final msg = Uri.encodeComponent('Bonjour, je suis intéressé par votre livre "${book!.title}" sur Kittab.');
    final uri = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _sendMessage() async {
    if (book == null) return;
    if (!authService.isLoggedIn) {
      Navigator.pop(context);
      context.push('/login');
      return;
    }
    Navigator.pop(context);
    context.push(Uri(path: '/messages', queryParameters: {
      'other_user_id': book!.seller.id.toString(),
      'book_id': book!.id.toString(),
    }).toString());
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : error != null
                ? Center(child: Text(error!, style: const TextStyle(color: AppColors.textSecondary)))
                : _buildContent(scrollCtrl),
      ),
    );
  }

  Widget _buildContent(ScrollController scrollCtrl) {
    final b = book!;
    return ListView(
      controller: scrollCtrl,
      padding: const EdgeInsets.all(20),
      children: [
        // Drag handle
        Center(
          child: Container(
            width: 40, height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
          ),
        ),

        // Book info row
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: b.displayImage.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: b.displayImage,
                      width: 90, height: 130,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(width: 90, height: 130, color: AppColors.border),
                      errorWidget: (_, __, ___) => _noImage(),
                    )
                  : _noImage(),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(b.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  Text(b.author, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Text('${b.price.toStringAsFixed(0)} FCFA',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(b.conditionLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ),
                  if (b.category != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Text(b.category!['name'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // Seller
        Row(
          children: [
            const Icon(Icons.person_outline, size: 16, color: AppColors.textHint),
            const SizedBox(width: 6),
            Text('Vendu par ', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            Text(b.seller.displayName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            if (b.seller.address != null && b.seller.address!.isNotEmpty) ...[
              const SizedBox(width: 8),
              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textHint),
              Flexible(child: Text(b.seller.address!, style: const TextStyle(fontSize: 12, color: AppColors.textHint), overflow: TextOverflow.ellipsis)),
            ],
          ],
        ),

        const SizedBox(height: 20),
        const Divider(color: AppColors.border),
        const SizedBox(height: 16),

        // Action buttons
        Row(
          children: [
            Expanded(
              child: _actionButton(
                icon: Icons.phone_outlined,
                label: 'Appeler',
                color: AppColors.success,
                onTap: _call,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _actionButton(
                icon: Icons.chat_outlined,
                label: 'WhatsApp',
                color: const Color(0xFF25D366),
                onTap: _whatsapp,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _actionButton(
                icon: Icons.message_outlined,
                label: 'Message',
                color: AppColors.primary,
                onTap: _sendMessage,
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Voir tous les détails
        GestureDetector(
          onTap: () {
            Navigator.pop(context);
            context.push('/books/${b.id}');
          },
          child: const Center(
            child: Text('Voir tous les détails →',
                style: TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _noImage() => Container(
    width: 90, height: 130,
    color: AppColors.border,
    child: const Icon(Icons.book_outlined, color: AppColors.textHint, size: 32),
  );

  Widget _actionButton({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}
