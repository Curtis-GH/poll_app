import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type SiteHeaderVariant = 'dark' | 'light';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  readonly variant = input<SiteHeaderVariant>('dark');
}
