class BookImage {
  final int id;
  final String url;
  final bool isPrimary;
  BookImage({required this.id, required this.url, required this.isPrimary});
  factory BookImage.fromJson(Map<String, dynamic> j) =>
      BookImage(id: j['id'], url: j['url'], isPrimary: j['is_primary'] ?? false);
}

class Seller {
  final int id;
  final String? username;
  final String? firstName;
  final String? lastName;
  final String phone;
  final String? address;
  Seller({required this.id, this.username, this.firstName, this.lastName, required this.phone, this.address});
  factory Seller.fromJson(Map<String, dynamic> j) => Seller(
        id: j['id'],
        username: j['username'],
        firstName: j['first_name'],
        lastName: j['last_name'],
        phone: j['phone'],
        address: j['address'],
      );
  String get displayName {
    if (username != null && username!.isNotEmpty) return username!;
    final full = '${firstName ?? ''} ${lastName ?? ''}'.trim();
    return full.isNotEmpty ? full : 'Vendeur Kittab';
  }
}

class Book {
  final int id;
  final String title;
  final String author;
  final double price;
  final String condition;
  final String bookType;
  final String? description;
  final String? coverUrl;
  final String? language;
  final bool isAvailable;
  final bool isSold;
  final bool isBoosted;
  final bool ispack;
  final bool acceptsExchange;
  final int views;
  final String? locationLabel;
  final double? latitude;
  final double? longitude;
  final List<BookImage> images;
  final Seller seller;
  final Map<String, dynamic>? category;
  final String createdAt;

  Book({
    required this.id, required this.title, required this.author,
    required this.price, required this.condition, required this.bookType,
    this.description, this.coverUrl, this.language,
    required this.isAvailable, required this.isSold, required this.isBoosted,
    required this.ispack, required this.acceptsExchange, required this.views,
    this.locationLabel, this.latitude, this.longitude,
    required this.images, required this.seller, this.category,
    required this.createdAt,
  });

  factory Book.fromJson(Map<String, dynamic> j) => Book(
        id: j['id'],
        title: j['title'],
        author: j['author'],
        price: (j['price'] as num).toDouble(),
        condition: j['condition'],
        bookType: j['book_type'] ?? 'other',
        description: j['description'],
        coverUrl: j['cover_url'],
        language: j['language'],
        isAvailable: j['is_available'] ?? true,
        isSold: j['is_sold'] ?? false,
        isBoosted: j['is_boosted'] ?? false,
        ispack: j['is_pack'] ?? false,
        acceptsExchange: j['accepts_exchange'] ?? false,
        views: j['views'] ?? 0,
        locationLabel: j['location_label'],
        latitude: j['latitude']?.toDouble(),
        longitude: j['longitude']?.toDouble(),
        images: (j['images'] as List? ?? []).map((i) => BookImage.fromJson(i)).toList(),
        seller: Seller.fromJson(j['seller']),
        category: j['category'],
        createdAt: j['created_at'] ?? '',
      );

  String get displayImage {
    final uploaded = images.where((i) => i.url.isNotEmpty).toList();
    if (uploaded.isNotEmpty) {
      final url = uploaded.first.url;
      return url.startsWith('http') ? url : '$kBaseUrl$url';
    }
    if (coverUrl != null && coverUrl!.isNotEmpty) return coverUrl!;
    return '';
  }

  String get conditionLabel {
    const map = {'new': 'Neuf', 'like_new': 'Très bon', 'good': 'Bon', 'fair': 'Acceptable'};
    return map[condition] ?? condition;
  }
}

const String kBaseUrl = 'https://kittab-backend.onrender.com';
