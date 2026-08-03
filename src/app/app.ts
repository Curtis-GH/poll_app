import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header';

/** Routes that use the dark theme (orange logo); all other routes use the light theme. */
const DARK_ROUTES = ['/'];

/** Routes where the site header is hidden on desktop but shown (with the dark logo) on mobile. */
const HEADER_HIDDEN_ON_DESKTOP_ROUTES = ['/surveys/new'];

/** Matches a survey detail route (`/surveys/:id`), excluding the create-survey route itself. */
const SURVEY_DETAIL_ROUTE = /^\/surveys\/(?!new$)[^/]+$/;

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

  /** True on routes where the site header is desktop-only-hidden (still shown on mobile). */
  readonly isHeaderHiddenOnDesktop = signal(
    HEADER_HIDDEN_ON_DESKTOP_ROUTES.includes(this.router.url),
  );

  /** True on a survey detail page, where the header shows a "Create survey" button (desktop only). */
  readonly showHeaderCreateButton = signal(SURVEY_DETAIL_ROUTE.test(this.router.url));

  constructor() {
    /** Keeps the route-derived header/theme signals in sync on every navigation. */
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isDarkTheme.set(DARK_ROUTES.includes(event.urlAfterRedirects));
        this.isHeaderHiddenOnDesktop.set(
          HEADER_HIDDEN_ON_DESKTOP_ROUTES.includes(event.urlAfterRedirects),
        );
        this.showHeaderCreateButton.set(SURVEY_DETAIL_ROUTE.test(event.urlAfterRedirects));
      }
    });
  }
}
