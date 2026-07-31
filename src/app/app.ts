import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header';

/** Routes that use the dark theme (orange logo); all other routes use the light theme. */
const DARK_ROUTES = ['/', '/surveys/new'];

/** Routes that hide the site header entirely, per the Create Survey Figma frame. */
const HEADER_HIDDEN_ROUTES = ['/surveys/new'];

/** Root component: hosts the router outlet and switches the site header theme by route. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  /** True on Home and Create Survey (dark theme); false on all other pages. */
  readonly isDarkTheme = signal(DARK_ROUTES.includes(this.router.url));

  /** True on routes where the site header/logo should not be shown. */
  readonly isHeaderHidden = signal(HEADER_HIDDEN_ROUTES.includes(this.router.url));

  constructor() {
    /** Keeps isDarkTheme/isHeaderHidden in sync with the current route on every navigation. */
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isDarkTheme.set(DARK_ROUTES.includes(event.urlAfterRedirects));
        this.isHeaderHidden.set(HEADER_HIDDEN_ROUTES.includes(event.urlAfterRedirects));
      }
    });
  }
}
