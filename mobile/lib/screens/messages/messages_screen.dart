import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/auth_service.dart';
import '../../theme/app_theme.dart';

class MessagesScreen extends StatefulWidget {
  final String? otherUserId;
  final String? bookId;
  final String? wantedBookId;

  const MessagesScreen({
    super.key,
    this.otherUserId,
    this.bookId,
    this.wantedBookId,
  });

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> conversations = [];
  Map<String, dynamic>? activeConversation;
  List<Map<String, dynamic>> messages = [];
  bool loadingConvs = true;
  bool loadingMsgs = false;
  bool sendingMsg = false;
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _timer;
  bool _autoOpenDone = false;

  @override
  void initState() {
    super.initState();
    if (authService.isLoggedIn) {
      _loadConversations();
      _timer = Timer.periodic(const Duration(seconds: 30), (_) => _pollUnread());
    } else {
      setState(() => loadingConvs = false);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    try {
      final res = await api.get('/api/conversations');
      final data = res.data;
      final items = data is List ? data : (data is Map ? data['items'] ?? [] : []);
      setState(() {
        conversations = List<Map<String, dynamic>>.from(items);
        loadingConvs = false;
      });

      // Auto-open or auto-create conversation if query params provided
      if (!_autoOpenDone && widget.otherUserId != null) {
        _autoOpenDone = true;
        await _autoCreateOrOpenConversation();
      }
    } catch (_) {
      setState(() => loadingConvs = false);
    }
  }

  Future<void> _autoCreateOrOpenConversation() async {
    final otherUserId = int.tryParse(widget.otherUserId ?? '');
    if (otherUserId == null) return;

    // Check if conversation already exists
    final existing = conversations.where((c) {
      final other = c['other_user'] as Map<String, dynamic>?;
      return other?['id'] == otherUserId;
    }).firstOrNull;

    if (existing != null) {
      _openConversation(existing);
    } else {
      // Create new conversation
      try {
        final body = <String, dynamic>{'other_user_id': otherUserId};
        if (widget.bookId != null) body['book_id'] = int.tryParse(widget.bookId!);
        if (widget.wantedBookId != null) body['wanted_book_id'] = int.tryParse(widget.wantedBookId!);
        body['content'] = widget.bookId != null
            ? 'Bonjour, je suis intéressé par votre livre.'
            : 'Bonjour, j\'ai le livre que vous recherchez !';
        final res = await api.post('/api/conversations', data: body);
        final convId = res.data is Map ? res.data['id'] : null;
        if (convId != null) {
          // Reload list to get full conversation object then open it
          final listRes = await api.get('/api/conversations');
          final items = listRes.data is List ? listRes.data : (listRes.data['items'] ?? []);
          setState(() => conversations = List<Map<String, dynamic>>.from(items));
          final created = conversations.firstWhere((c) => c['id'] == convId, orElse: () => {});
          if (created.isNotEmpty) _openConversation(created);
        }
      } catch (_) {}
    }
  }

  Future<void> _openConversation(Map<String, dynamic> conv) async {
    setState(() {
      activeConversation = conv;
      loadingMsgs = true;
      messages = [];
    });
    await _loadMessages(conv['id']);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _pollMessages());
  }

  Future<void> _loadMessages(int convId) async {
    try {
      final res = await api.get('/api/conversations/$convId');
      final data = res.data;
      final msgs = data is Map ? data['messages'] ?? [] : [];
      setState(() {
        messages = List<Map<String, dynamic>>.from(msgs);
        loadingMsgs = false;
      });
      _scrollToBottom();
    } catch (_) {
      setState(() => loadingMsgs = false);
    }
  }

  Future<void> _pollMessages() async {
    if (activeConversation == null) return;
    try {
      final res = await api.get('/api/conversations/${activeConversation!['id']}');
      final data = res.data;
      final msgs = data is Map ? data['messages'] ?? [] : [];
      final newMsgs = List<Map<String, dynamic>>.from(msgs);
      if (newMsgs.length != messages.length) {
        setState(() => messages = newMsgs);
        _scrollToBottom();
      }
    } catch (_) {}
  }

  Future<void> _pollUnread() async {
    if (activeConversation != null) {
      _pollMessages();
    } else {
      _loadConversations();
    }
  }

  Future<void> _sendMessage() async {
    final content = _msgCtrl.text.trim();
    if (content.isEmpty || activeConversation == null) return;

    setState(() => sendingMsg = true);
    _msgCtrl.clear();

    try {
      await api.post('/api/conversations/${activeConversation!['id']}/messages', data: {'content': content});
      await _loadMessages(activeConversation!['id']);
    } catch (_) {
      setState(() => sendingMsg = false);
    }
    setState(() => sendingMsg = false);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _backToList() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _pollUnread());
    setState(() {
      activeConversation = null;
      messages = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!authService.isLoggedIn) {
      return _buildLoginPrompt();
    }

    if (activeConversation != null) {
      return _buildChatView();
    }

    return _buildConversationList();
  }

  Widget _buildLoginPrompt() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Messages')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text('Connexion requise', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              const Text('Connectez-vous pour accéder à vos messages.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.push('/login'),
                child: const Text('Se connecter'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConversationList() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Messages')),
      body: loadingConvs
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : conversations.isEmpty
              ? _buildEmptyState()
              : ListView.separated(
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
                  itemBuilder: (_, i) {
                    final conv = conversations[i];
                    final other = conv['other_user'] as Map<String, dynamic>?;
                    final book = conv['book'] as Map<String, dynamic>?;
                    final lastMsg = conv['last_message'] as Map<String, dynamic>?;
                    final unread = (conv['unread_count'] ?? 0) as int;
                    final otherName = other?['username'] ?? other?['first_name'] ?? 'Utilisateur';
                    return ListTile(
                      onTap: () => _openConversation(conv),
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primaryLight,
                        child: Text(otherName.isNotEmpty ? otherName[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                      ),
                      title: Row(
                        children: [
                          Expanded(child: Text(otherName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                          if (unread > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
                              child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                            ),
                        ],
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (book != null) Text(book['title'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.primary), maxLines: 1, overflow: TextOverflow.ellipsis),
                          if (lastMsg != null) Text(lastMsg['content'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                      isThreeLine: book != null,
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.textHint),
            SizedBox(height: 16),
            Text('Aucun message', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            SizedBox(height: 8),
            Text('Vos conversations apparaîtront ici.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildChatView() {
    final conv = activeConversation!;
    final other = conv['other_user'] as Map<String, dynamic>?;
    final book = conv['book'] as Map<String, dynamic>?;
    final otherName = other?['username'] ?? other?['first_name'] ?? 'Utilisateur';
    final myId = authService.user?['id'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: _backToList,
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(otherName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            if (book != null)
              Text(book['title'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: loadingMsgs
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : messages.isEmpty
                    ? const Center(child: Text('Commencez la conversation !', style: TextStyle(color: AppColors.textSecondary)))
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: messages.length,
                        itemBuilder: (_, i) {
                          final msg = messages[i];
                          final sender = msg['sender'] as Map<String, dynamic>?;
                          final isMine = sender?['id'] == myId;
                          return _buildBubble(msg['content'] ?? '', isMine, msg['created_at']);
                        },
                      ),
          ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildBubble(String content, bool isMine, String? time) {
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: isMine ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMine ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMine ? const Radius.circular(4) : const Radius.circular(16),
          ),
          border: isMine ? null : Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(content, style: TextStyle(fontSize: 14, color: isMine ? Colors.white : AppColors.textPrimary)),
            if (time != null) ...[
              const SizedBox(height: 4),
              Text(_formatTime(time), style: TextStyle(fontSize: 11, color: isMine ? Colors.white70 : AppColors.textHint)),
            ],
          ],
        ),
      ),
    );
  }

  String _formatTime(String isoTime) {
    try {
      final dt = DateTime.parse(isoTime).toLocal();
      final now = DateTime.now();
      if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
        return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      }
      return '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _msgCtrl,
                minLines: 1,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Écrire un message...',
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: sendingMsg ? null : _sendMessage,
              child: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: sendingMsg
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
