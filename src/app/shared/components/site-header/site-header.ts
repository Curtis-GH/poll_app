import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Which logo/color variant the header renders. */
export type SiteHeaderVariant = 'dark' | 'light';

/** App-wide header with the logo, shown in either the dark or light theme variant. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  /** 'dark' shows the orange logo (homescreen), 'light' shows the dark logo (light pages). */
  readonly variant = input<SiteHeaderVariant>('dark');
  /** Shows a "Create survey" button next to the logo (desktop only). */
  readonly showCreateButton = input<boolean>(false);
  /** Hides the whole header on desktop while keeping it visible on mobile. */
  readonly hideOnDesktop = input<boolean>(false);
}
