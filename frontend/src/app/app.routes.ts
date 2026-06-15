import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'catalogue', loadComponent: () => import('./pages/catalogue/catalogue.component').then(m => m.CatalogueComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'books/:id', loadComponent: () => import('./pages/book-detail/book-detail.component').then(m => m.BookDetailComponent) },
  { path: 'how-it-works', loadComponent: () => import('./pages/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'community', loadComponent: () => import('./pages/community/community.component').then(m => m.CommunityComponent) },
  { path: 'publish', loadComponent: () => import('./pages/publish/publish.component').then(m => m.PublishComponent), canActivate: [authGuard] },
  { path: 'publish/edit/:id', loadComponent: () => import('./pages/publish/edit/edit-book.component').then(m => m.EditBookComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'my-listings', loadComponent: () => import('./pages/my-listings/my-listings.component').then(m => m.MyListingsComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
