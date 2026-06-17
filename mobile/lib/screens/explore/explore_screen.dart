import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../models/book.dart';
import '../../widgets/book_card.dart';
import '../../theme/app_theme.dart';

class ExploreScreen extends StatefulWidget {
  final int? categoryId;
  const ExploreScreen({super.key, this.categoryId});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<Book> books = [];
  List<Map<String, dynamic>> categories = [];
  bool loading = false;
  bool hasMore = true;
  int page = 1;
  static const int pageSize = 20;

  int? selectedCategory;
  String selectedCondition = '';
  String sortBy = 'recent';

  @override
  void initState() {
    super.initState();
    selectedCategory = widget.categoryId;
    _loadCategories();
    _loadBooks(reset: true);
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200 && !loading && hasMore) {
      _loadBooks();
    }
  }

  Future<void> _loadCategories() async {
    try {
      final res = await api.get('/api/categories');
      setState(() => categories = List<Map<String, dynamic>>.from(res.data ?? []));
    } catch (_) {}
  }

  Future<void> _loadBooks({bool reset = false}) async {
    if (loading) return;
    if (reset) { page = 1; hasMore = true; }
    setState(() => loading = true);

    try {
      final params = <String, dynamic>{
        'page': page,
        'page_size': pageSize,
        if (_searchCtrl.text.trim().isNotEmpty) 'search': _searchCtrl.text.trim(),
        if (selectedCategory != null) 'category_id': selectedCategory,
        if (selectedCondition.isNotEmpty) 'condition': selectedCondition,
      };

      final res = await api.get('/api/books', queryParameters: params);
      final data = res.data;
      final items = (data is Map ? data['items'] ?? [] : data ?? []) as List;
      final newBooks = items.map((j) => Book.fromJson(j)).toList();

      setState(() {
        if (reset) books = newBooks; else books.addAll(newBooks);
        hasMore = newBooks.length == pageSize;
        page++;
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  void _applyFilters() => _loadBooks(reset: true);

  void _resetFilters() {
    setState(() {
      selectedCategory = null;
      selectedCondition = '';
      _searchCtrl.clear();
    });
    _loadBooks(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Explorer'),
        actions: [
          IconButton(icon: const Icon(Icons.tune), onPressed: _showFilters),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Rechercher un livre, auteur...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textHint, size: 20),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () { _searchCtrl.clear(); _applyFilters(); })
                    : null,
              ),
              onSubmitted: (_) => _applyFilters(),
              onChanged: (_) => setState(() {}),
            ),
          ),

          // Category chips
          if (categories.isNotEmpty)
            SizedBox(
              height: 40,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  if (i == 0) {
                    final selected = selectedCategory == null;
                    return _chip('Tous', selected, () { setState(() => selectedCategory = null); _applyFilters(); });
                  }
                  final cat = categories[i - 1];
                  final selected = selectedCategory == cat['id'];
                  return _chip(cat['name'], selected, () {
                    setState(() => selectedCategory = selected ? null : cat['id']);
                    _applyFilters();
                  });
                },
              ),
            ),

          const SizedBox(height: 8),

          // Results count
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${books.length} livre${books.length > 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                if (selectedCategory != null || selectedCondition.isNotEmpty)
                  GestureDetector(
                    onTap: _resetFilters,
                    child: const Text('Réinitialiser', style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Grid
          Expanded(
            child: books.isEmpty && !loading
                ? const Center(child: Text('Aucun livre trouvé', style: TextStyle(color: AppColors.textSecondary)))
                : GridView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.62,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: books.length + (loading ? 2 : 0),
                    itemBuilder: (_, i) {
                      if (i >= books.length) return _shimmerCard();
                      return BookGridCard(
                        book: books[i],
                        onTap: () => context.push('/books/${books[i].id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.textSecondary)),
      ),
    );
  }

  Widget _shimmerCard() => Container(
    decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(14)),
  );

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Filtres', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 20),
              const Text('État du livre', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Wrap(spacing: 8, children: [
                for (final c in [('', 'Tous'), ('new', 'Neuf'), ('like_new', 'Très bon'), ('good', 'Bon'), ('fair', 'Acceptable')])
                  GestureDetector(
                    onTap: () { setModal(() => selectedCondition = c.$1); setState(() {}); },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: selectedCondition == c.$1 ? AppColors.primary : AppColors.background,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: selectedCondition == c.$1 ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(c.$2, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                          color: selectedCondition == c.$1 ? Colors.white : AppColors.textSecondary)),
                    ),
                  ),
              ]),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () { Navigator.pop(ctx); _applyFilters(); },
                child: const Text('Appliquer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
