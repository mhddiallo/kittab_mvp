import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/book.dart';
import '../theme/app_theme.dart';

class BookCard extends StatelessWidget {
  final Book book;
  final VoidCallback? onTap;

  const BookCard({super.key, required this.book, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 150,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              child: Stack(
                children: [
                  book.displayImage.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: book.displayImage,
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            height: 180,
                            color: AppColors.background,
                            child: const Center(child: Icon(Icons.book, color: AppColors.textHint, size: 32)),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            height: 180,
                            color: AppColors.background,
                            child: const Center(child: Icon(Icons.book, color: AppColors.textHint, size: 32)),
                          ),
                        )
                      : Container(
                          height: 180,
                          color: AppColors.background,
                          child: const Center(child: Icon(Icons.book, color: AppColors.textHint, size: 32)),
                        ),
                  if (book.isBoosted)
                    Positioned(
                      top: 8, left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.boosted,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('⭐ Boosté', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                      ),
                    ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(book.author, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  const SizedBox(height: 6),
                  Text('${book.price.toStringAsFixed(0)} FCFA',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary)),
                  if (book.locationLabel != null) ...[
                    const SizedBox(height: 3),
                    Row(children: [
                      const Icon(Icons.location_on, size: 10, color: AppColors.textHint),
                      const SizedBox(width: 2),
                      Expanded(child: Text(book.locationLabel!, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10, color: AppColors.textHint))),
                    ]),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BookGridCard extends StatelessWidget {
  final Book book;
  final VoidCallback? onTap;

  const BookGridCard({super.key, required this.book, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: book.displayImage.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: book.displayImage,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.background,
                          child: const Center(child: Icon(Icons.book, color: AppColors.textHint, size: 28)),
                        ),
                      )
                    : Container(
                        color: AppColors.background,
                        child: const Center(child: Icon(Icons.book, color: AppColors.textHint, size: 28)),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  Text(book.author, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  Text('${book.price.toStringAsFixed(0)} FCFA',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
