import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const profileGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!localStorage.getItem('kittab_token')) {
    router.navigate(['/login']);
    return false;
  }

  if (!auth.user) await auth.loadUser();

  const user = auth.user;
  if (!user || !user.is_profile_complete) {
    router.navigate(['/profile'], { queryParams: { incomplet: '1' } });
    return false;
  }

  if (user.phone?.startsWith('google_')) {
    router.navigate(['/profile'], { queryParams: { incomplet: '1' } });
    return false;
  }

  return true;
};
