import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';

@Component({ selector: 'app-home', standalone: true, imports: [RouterLink, CommonModule, NavbarComponent, FooterComponent, BookCardComponent], templateUrl: './home.component.html' })
export class HomeComponent implements OnInit {
  trendingBooks: BookCard[] = [];
  popularBooks: BookCard[] = [];
  ngOnInit() { this.trendingBooks = this.mock(4); this.popularBooks = this.mock(6, 10); }
  mock(count: number, offset = 0): BookCard[] {
    const data = [
      { t: 'Les Contes de Leuk-le-Lièvre', a: 'L. S. Senghor', p: 8000, c: 'good' },
      { t: 'Le Ventre de l\'Atlantique', a: 'Fatou Diome', p: 12000, c: 'like_new' },
      { t: 'Une si longue lettre', a: 'Mariama Bâ', p: 6000, c: 'new' },
      { t: 'Soundjata ou l\'épopée', a: 'D. T. Niane', p: 9500, c: 'fair' },
      { t: 'Mathématiques Terminale S', a: 'Seydou Traoré', p: 8500, c: 'like_new' },
      { t: 'L\'enfant noir', a: 'Camara Laye', p: 7500, c: 'good' },
      { t: 'Choses qui ne repartent pas', a: 'Safi Ama', p: 8300, c: 'good' },
      { t: 'Introduction à la Physique', a: 'Aminata Diallo', p: 15000, c: 'new' },
      { t: 'Histoire de l\'Afrique', a: 'Ousmane Tall', p: 18000, c: 'good' },
      { t: 'Programmation Python', a: 'Samir Amin', p: 22000, c: 'new' },
    ];
    return Array.from({ length: count }, (_, i) => {
      const d = data[(i + offset) % data.length];
      return { id: i + offset + 1, title: d.t, author: d.a, price: d.p, condition: d.c, book_type: 'novel',
        images: [{ url: `https://picsum.photos/seed/b${i+offset}/300/400`, is_primary: true }],
        seller: { first_name: 'Fatou', last_name: 'Seck', phone: '+224000000', address: ['Conakry', 'Dakar', 'Bamako', 'Abidjan'][i % 4] }, is_available: true };
    });
  }
}
