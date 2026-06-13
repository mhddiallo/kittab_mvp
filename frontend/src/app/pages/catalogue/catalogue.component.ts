import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BookCardComponent, BookCard } from '../../components/book-card/book-card.component';

@Component({ selector: 'app-catalogue', standalone: true, imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, FooterComponent, BookCardComponent], templateUrl: './catalogue.component.html' })
export class CatalogueComponent implements OnInit {
  searchQuery = ''; selectedCategory = 'Tous'; books: BookCard[] = []; filteredBooks: BookCard[] = []; total = 0; alertPhone = '';
  categories = ['Tous (12)', 'Littérature (156)', 'Éducation (234)', 'Sciences (89)', 'Histoire (87)', 'Technologie (78)', 'Art & Culture (45)', 'Philosophie (34)', 'Économie (56)'];
  ngOnInit() { this.books = this.mock(12); this.filteredBooks = this.books; this.total = 12; }
  filter() { this.filteredBooks = this.books.filter(b => !this.searchQuery || b.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || b.author.toLowerCase().includes(this.searchQuery.toLowerCase())); this.total = this.filteredBooks.length; }
  mock(count: number): BookCard[] {
    const d = [
      { t: 'Mathématiques Terminale S', a: 'Seydou Traoré', p: 12000, c: 'like_new' }, { t: 'L\'enfant noir', a: 'Camara Laye', p: 8500, c: 'good' },
      { t: 'Le Monde s\'effondre', a: 'Chinua Achebe', p: 7500, c: 'new' }, { t: 'Histoire Générale de l\'Afrique', a: 'Joseph Ki-Zerbo', p: 18000, c: 'good' },
      { t: 'Une si longue lettre', a: 'Mariama Bâ', p: 6500, c: 'fair' }, { t: 'Médecine Traditionnelle', a: 'Dr. Anta Diop', p: 25000, c: 'new' },
      { t: 'Introduction à la Biologie', a: 'Prof. Aminata Diallo', p: 15000, c: 'good' }, { t: 'Programmation Python', a: 'Ousmane Tall', p: 22000, c: 'new' },
      { t: 'Art Contemporain Africain', a: 'Fatou Ndiaye', p: 16500, c: 'like_new' }, { t: 'Physique-Chimie 1ère S', a: 'Dr. Mamadou Fall', p: 9800, c: 'good' },
      { t: 'Philosophie Africaine', a: 'Kwame Nkrumah', p: 13500, c: 'good' }, { t: 'Économie du Développement', a: 'Samir Amin', p: 19500, c: 'fair' },
    ];
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, title: d[i].t, author: d[i].a, price: d[i].p, condition: d[i].c, book_type: i < 2 ? 'textbook' : 'novel',
      images: [{ url: `https://picsum.photos/seed/cat${i+20}/300/400`, is_primary: true }],
      seller: { first_name: 'Vendeur', last_name: `${i+1}`, phone: '+224000000', address: ['Dakar, Sénégal', 'Conakry', 'Bamako', 'Ouagadougou'][i % 4] }, is_available: true }));
  }
}
