import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  firstName = ''; lastName = ''; email = ''; subject = ''; message = '';
  accepted = false; sent = false; loading = false;

  submit() {
    if (!this.firstName || !this.email || !this.message || !this.accepted) return;
    this.loading = true;
    setTimeout(() => { this.sent = true; this.loading = false; }, 800);
  }
}
