import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'theme/app_theme.dart';
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
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
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
        GoRoute(path: '/community', builder: (_, __) => const CommunityScreen()),
        GoRoute(path: '/messages', builder: (_, __) => const MessagesScreen()),
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

class MainShell extends StatelessWidget {
  final Widget child;
  final String location;
  const MainShell({super.key, required this.child, required this.location});

  int get _index {
    if (location.startsWith('/explore')) return 1;
    if (location.startsWith('/community')) return 2;
    if (location.startsWith('/messages')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) {
          const paths = ['/', '/explore', '/community', '/messages', '/profile'];
          context.go(paths[i]);
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Accueil'),
          BottomNavigationBarItem(icon: Icon(Icons.search_outlined), activeIcon: Icon(Icons.search), label: 'Explorer'),
          BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Communauté'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Messages'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
