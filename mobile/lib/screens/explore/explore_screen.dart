import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/auth_service.dart';
import '../../models/book.dart';
import '../../widgets/book_card.dart';
import '../../widgets/book_bottom_sheet.dart';
import '../../theme/app_theme.dart';

class ExploreScreen extends StatefulWidget {
  final int? categoryId;
  const ExploreScreen({super.key, this.categoryId});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<Book> books = [];
  List<Map<String, dynamic>> categories = [];
  List<Map<String, dynamic>> wantedBooks = [];
  bool loading = false;
  bool wantedLoading = false;
  bool hasMore = true;
  int page = 1;
  static const int pageSize = 20;

  int? selectedCategory;
  String selectedCondition = '';
  String sortBy = 'recent';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    selectedCategory = widget.categoryId;
    _loadCategories();
    _loadBooks(reset: true);
    _loadWantedBooks();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
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

  Future<void> _loadWantedBooks() async {
    setState(() => wantedLoading = true);
    try {
      final params = <String, dynamic>{
        if (_searchCtrl.text.trim().isNotEmpty) 'search': _searchCtrl.text.trim(),
        if (selectedCategory != null) 'category_id': selectedCategory,
        'page_size': 50,
      };
      final res = await api.get('/api/wanted-books', queryParameters: params);
      final data = res.data;
      setState(() {
        wantedBooks = List<Map<String, dynamic>>.from(
          data is Map ? data['items'] ?? [] : data ?? [],
        );
        wantedLoading = false;
      });
    } catch (_) {
      setState(() => wantedLoading = false);
    }
  }

  void _applyFilters() {
    _loadBooks(reset: true);
    _loadWantedBooks();
  }

  void _resetFilters() {
    setState(() {
      selectedCategory = null;
      selectedCondition = '';
      _searchCtrl.clear();
    });
    _applyFilters();
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
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Livres disponibles'),
            Tab(text: 'Livres demandés'),
          ],
        ),
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

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBooksTab(),
                _buildWantedTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBooksTab() {
    return Column(
      children: [
        // Results count + reset
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
                      onTap: () => showBookBottomSheet(context, books[i].id),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildWantedTab() {
    if (wantedLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (wantedBooks.isEmpty) {
      return const Center(child: Text('Aucune demande trouvée', style: TextStyle(color: AppColors.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: wantedBooks.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final w = wantedBooks[i];
        final category = w['category'] as Map<String, dynamic>?;
        final requester = w['requester'] as Map<String, dynamic>?;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(w['title'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    if (w['author'] != null && (w['author'] as String).isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(w['author'], style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (category != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(category['name'] ?? '', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (requester != null)
                          Text('par ${requester['username'] ?? requester['first_name'] ?? 'Utilisateur'}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () {
                  if (!authService.isLoggedIn) { context.push('/login'); return; }
                  final userId = w['user']?['id'] ?? w['requester']?['id'];
                  if (userId != null) {
                    context.go('/messages?other_user_id=$userId&wanted_book_id=${w['id']}');
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text("J'ai ce livre →", style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        );
      },
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
