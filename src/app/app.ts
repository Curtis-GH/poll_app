import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header';

const DARK_ROUTES = ['/', '/surveys/new'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  readonly isDarkTheme = signal(DARK_ROUTES.includes(this.router.url));

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isDarkTheme.set(DARK_ROUTES.includes(event.urlAfterRedirects));
      }
    });
  }
}
