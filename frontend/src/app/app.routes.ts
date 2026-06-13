import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'catalogue', loadComponent: () => import('./pages/catalogue/catalogue.component').then(m => m.CatalogueComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'books/:id', loadComponent: () => import('./pages/book-detail/book-detail.component').then(m => m.BookDetailComponent) },
  { path: 'publish', loadComponent: () => import('./pages/publish/publish.component').then(m => m.PublishComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
