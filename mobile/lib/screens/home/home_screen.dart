import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api.dart';
import '../../models/book.dart';
import '../../widgets/book_card.dart';
import '../../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Book> boostedBooks = [];
  List<Book> topBooks = [];
  List<Book> newBooks = [];
  List<Map<String, dynamic>> categories = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        api.get('/api/books', queryParameters: {'is_boosted': true, 'page_size': 5}),
        api.get('/api/books', queryParameters: {'sort': 'views', 'page_size': 10}),
        api.get('/api/books', queryParameters: {'sort': 'recent', 'page_size': 10}),
        api.get('/api/categories'),
      ]);
      setState(() {
        boostedBooks = _parseBooks(results[0].data);
        topBooks = _parseBooks(results[1].data);
        newBooks = _parseBooks(results[2].data);
        categories = List<Map<String, dynamic>>.from(results[3].data ?? []);
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  List<Book> _parseBooks(dynamic data) {
    final items = data is Map ? data['items'] ?? [] : data ?? [];
    return (items as List).map((j) => Book.fromJson(j)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _loadData,
          child: CustomScrollView(
            slivers: [
              _buildAppBar(),
              if (loading)
                const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
              else ...[
                if (boostedBooks.isNotEmpty) _buildSection('⭐ Livres mis en avant', boostedBooks, showAll: false),
                if (topBooks.isNotEmpty) _buildSection('🔥 Top de la semaine', topBooks),
                _buildCategoriesSection(),
                if (newBooks.isNotEmpty) _buildSection('🆕 Nouveaux livres', newBooks),
                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/publish'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Vendre un livre', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: AppColors.surface,
      title: Image.asset('assets/images/logo.png', height: 32),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: AppColors.textPrimary),
          onPressed: () => context.push('/explore'),
        ),
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
          onPressed: () {},
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildSection(String title, List<Book> books, {bool showAll = true}) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                if (showAll)
                  GestureDetector(
                    onTap: () => context.push('/explore'),
                    child: const Text('Tout voir', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
          SizedBox(
            height: 260,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: books.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => BookCard(
                book: books[i],
                onTap: () => context.push('/books/${books[i].id}'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesSection() {
    final colors = [
      const Color(0xFFDC2626), const Color(0xFF2563EB),
      const Color(0xFF16A34A), const Color(0xFF9333EA),
      const Color(0xFFD97706), const Color(0xFF0891B2),
    ];

    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('📚 Catégories', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                GestureDetector(
                  onTap: () => context.push('/explore'),
                  child: const Text('Tout voir', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final cat = categories[i];
                final color = colors[i % colors.length];
                return GestureDetector(
                  onTap: () => context.push('/explore?category_id=${cat['id']}'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: color.withOpacity(0.3)),
                    ),
                    child: Text(cat['name'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
