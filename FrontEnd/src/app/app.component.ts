import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from './services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly sidebarOpen = signal(false);

  readonly nav: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/movimientos', label: 'Movimientos', icon: '💸' },
    { path: '/cuentas', label: 'Cuentas', icon: '🏦' },
    { path: '/instrumentos', label: 'Instrumentos', icon: '📈' },
    { path: '/divisas', label: 'Divisas', icon: '💱' },
    { path: '/instituciones', label: 'Instituciones', icon: '🏛️' },
    { path: '/personas', label: 'Personas', icon: '👤' },
  ];

  constructor(public theme: ThemeService) {}

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
