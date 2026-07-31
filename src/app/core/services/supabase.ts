import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/** Provides the configured Supabase client for the rest of the app. */
@Service()
export class Supabase {
  /** Client-only Supabase connection, authenticated via the public anon key. */
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );
}
