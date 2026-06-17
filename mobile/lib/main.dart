import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'theme/app_theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/messages/messages_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KittabApp());
}

final _router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('kittab_token');
    final protectedRoutes = ['/publish', '/profile', '/my-listings'];
    final isProtected = protectedRoutes.any((r) => state.matchedLocation.startsWith(r));
    if (isProtected && token == null) return '/login';
    return null;
  },
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/explore', builder: (_, __) => const Placeholder()),
        GoRoute(path: '/community', builder: (_, __) => const CommunityScreen()),
        GoRoute(path: '/messages', builder: (_, __) => const MessagesScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const Placeholder()),
      ],
    ),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/books/:id', builder: (_, __) => const Placeholder()),
    GoRoute(path: '/publish', builder: (_, __) => const Placeholder()),
    GoRoute(path: '/my-listings', builder: (_, __) => const Placeholder()),
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
      localizationsDelegates: const [],
    );
  }
}

class MainShell extends StatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  final _tabs = [
    (path: '/', icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Accueil'),
    (path: '/explore', icon: Icons.search_outlined, activeIcon: Icons.search, label: 'Explorer'),
    (path: '/community', icon: Icons.people_outline, activeIcon: Icons.people, label: 'Communauté'),
    (path: '/messages', icon: Icons.chat_bubble_outline, activeIcon: Icons.chat_bubble, label: 'Messages'),
    (path: '/profile', icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) {
          setState(() => _index = i);
          context.go(_tabs[i].path);
        },
        items: _tabs.map((t) => BottomNavigationBarItem(
          icon: Icon(t.icon),
          activeIcon: Icon(t.activeIcon),
          label: t.label,
        )).toList(),
      ),
    );
  }
}
