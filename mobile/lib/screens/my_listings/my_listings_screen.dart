import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api.dart';
import '../../core/auth_service.dart';
import '../../models/book.dart';
import '../../theme/app_theme.dart';

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});
  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen> {
  List<Book> books = [];
  bool loading = true;
  int? actionId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await api.get('/api/books/me/listings');
      setState(() {
        books = (res.data as List).map((j) => Book.fromJson(j)).toList();
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Future<void> _markSold(Book book) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Marquer comme vendu'),
        content: Text('Confirmer que "${book.title}" a été vendu ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Confirmer', style: TextStyle(color: Colors.green))),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => actionId = book.id);
    try {
      await api.patch('/api/books/${book.id}/mark-sold');
      await _load();
    } catch (_) {}
    setState(() => actionId = null);
  }

  Future<void> _delete(Book book) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer'),
        content: Text('Supprimer "${book.title}" ? Cette action est irréversible.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Supprimer', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => actionId = book.id);
    try {
      await api.delete('/api/books/${book.id}');
      setState(() => books.removeWhere((b) => b.id == book.id));
    } catch (_) {}
    setState(() => actionId = null);
  }

  void _showOptions(Book book) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 8),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          _option(Icons.visibility_outlined, 'Voir l\'annonce', () { Navigator.pop(context); context.push('/books/${book.id}'); }),
          if (!book.isSold) ...[
            _option(Icons.edit_outlined, 'Modifier', () { Navigator.pop(context); context.push('/publish/edit/${book.id}'); }),
            _option(Icons.check_circle_outline, 'Marquer vendu', () { Navigator.pop(context); _markSold(book); }, color: Colors.green),
          ],
          _option(Icons.delete_outline, 'Supprimer', () { Navigator.pop(context); _delete(book); }, color: Colors.red),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Mes livres${books.isNotEmpty ? ' (${books.length})' : ''}'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : books.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.book_outlined, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  const Text('Aucune annonce publiée', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  const Text('Publie ton premier livre !', style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(onPressed: () => context.push('/publish'), child: const Text('Publier un livre')),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  itemCount: books.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _bookTile(books[i]),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/publish'),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _bookTile(Book book) {
    final imgUrl = book.displayImage;
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
            child: imgUrl.isNotEmpty
                ? CachedNetworkImage(imageUrl: imgUrl, width: 80, height: 96, fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(width: 80, height: 96, color: AppColors.background,
                        child: const Icon(Icons.book, color: AppColors.textHint)))
                : Container(width: 80, height: 96, color: AppColors.background,
                    child: const Icon(Icons.book, color: AppColors.textHint)),
          ),
          // Info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  if (book.isBoosted && !book.isSold)
                    Container(margin: const EdgeInsets.only(right: 6), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.boosted, borderRadius: BorderRadius.circular(20)),
                        child: const Text('⭐ Boosté', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white))),
                  if (book.isSold)
                    Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(20)),
                        child: const Text('Vendu', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.grey))),
                  if (!book.isSold)
                    Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                            color: book.isAvailable ? Colors.green[50] : Colors.orange[50],
                            borderRadius: BorderRadius.circular(20)),
                        child: Text(book.isAvailable ? 'Disponible' : 'Masqué',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                                color: book.isAvailable ? Colors.green[700] : Colors.orange[700]))),
                ]),
                const SizedBox(height: 4),
                Text(book.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                Text(book.author, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                Row(children: [
                  Text('${book.price.toStringAsFixed(0)} FCFA',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary)),
                  const SizedBox(width: 8),
                  Icon(Icons.visibility_outlined, size: 12, color: AppColors.textHint),
                  const SizedBox(width: 2),
                  Text('${book.views}', style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                ]),
              ]),
            ),
          ),
          // Options button
          if (actionId == book.id)
            const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)))
          else
            IconButton(icon: const Icon(Icons.more_vert, color: AppColors.textHint), onPressed: () => _showOptions(book)),
        ],
      ),
    );
  }

  Widget _option(IconData icon, String label, VoidCallback onTap, {Color? color}) => ListTile(
    leading: Icon(icon, color: color ?? AppColors.textPrimary, size: 20),
    title: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color ?? AppColors.textPrimary)),
    onTap: onTap,
  );
}
