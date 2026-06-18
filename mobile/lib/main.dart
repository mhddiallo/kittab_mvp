import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'theme/app_theme.dart';
import 'core/api.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/explore/explore_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/messages/messages_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/book_detail/book_detail_screen.dart';
import 'screens/my_listings/my_listings_screen.dart';
import 'screens/publish/publish_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KittabApp());
}

final _router = GoRouter(
  initialLocation: '/splash',
  redirect: (context, state) async {
    if (state.matchedLocation == '/splash') return null;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('kittab_token');
    final protectedRoutes = ['/publish', '/my-listings', '/profile/edit'];
    final isProtected = protectedRoutes.any((r) => state.matchedLocation.startsWith(r));
    if (isProtected && token == null) return '/login?redirect=${state.matchedLocation}';
    return null;
  },
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(
      path: '/books/:id',
      builder: (_, state) => BookDetailScreen(bookId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(path: '/publish', builder: (_, __) => const PublishScreen()),
    GoRoute(
      path: '/publish/edit/:id',
      builder: (_, state) => PublishScreen(editId: int.tryParse(state.pathParameters['id'] ?? '')),
    ),
    GoRoute(path: '/my-listings', builder: (_, __) => const MyListingsScreen()),
    GoRoute(path: '/profile/edit', builder: (_, __) => const Placeholder()),
    ShellRoute(
      builder: (context, state, child) => MainShell(location: state.matchedLocation, child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(
          path: '/explore',
          builder: (_, state) => ExploreScreen(
            categoryId: state.uri.queryParameters['category_id'] != null
                ? int.tryParse(state.uri.queryParameters['category_id']!)
                : null,
          ),
        ),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/community', builder: (_, __) => const CommunityScreen()),
        GoRoute(
          path: '/messages',
          builder: (_, state) => MessagesScreen(
            otherUserId: state.uri.queryParameters['other_user_id'],
            bookId: state.uri.queryParameters['book_id'],
            wantedBookId: state.uri.queryParameters['wanted_book_id'],
          ),
        ),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
  ],
);

class KittabApp extends StatelessWidget {
  const KittabApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Kittab',
      theme: AppTheme.light,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainShell extends StatefulWidget {
  final Widget child;
  final String location;
  const MainShell({super.key, required this.child, required this.location});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _unreadCount = 0;
  Timer? _timer;

  int get _index {
    if (widget.location.startsWith('/explore')) return 1;
    if (widget.location.startsWith('/community')) return 2;
    if (widget.location.startsWith('/messages')) return 3;
    if (widget.location.startsWith('/profile')) return 4;
    if (widget.location.startsWith('/login')) return -1;
    return 0;
  }

  @override
  void initState() {
    super.initState();
    _pollUnread();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _pollUnread());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _pollUnread() async {
    try {
      final res = await api.get('/api/conversations/unread-count');
      final count = res.data is Map ? (res.data['count'] ?? 0) : 0;
      if (mounted) setState(() => _unreadCount = count as int);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index < 0 ? 0 : _index,
        onTap: (i) {
          const paths = ['/', '/explore', '/community', '/messages', '/profile'];
          context.go(paths[i]);
        },
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Accueil'),
          const BottomNavigationBarItem(icon: Icon(Icons.search_outlined), activeIcon: Icon(Icons.search), label: 'Explorer'),
          const BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Communauté'),
          BottomNavigationBarItem(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble_outline),
                if (_unreadCount > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        _unreadCount > 99 ? '99+' : '$_unreadCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
            activeIcon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble),
                if (_unreadCount > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        _unreadCount > 99 ? '99+' : '$_unreadCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
            label: 'Messages',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
