import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'julen.sistemas@gmail.com';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const clean = (key: string) => formData.get(key)?.toString().trim() || null;

    const name = clean('name');
    const company = clean('company');
    const email = clean('email');
    const phone = clean('phone');
    const plan = clean('plan');
    const message = clean('message');
    const nextFollowUpDate = clean('next_follow_up_date');
    const note = clean('note');
    const statusRaw = clean('status');
    const status = ['nuevo', 'contactado', 'convertido', 'descartado'].includes(statusRaw || '')
      ? statusRaw!
      : 'nuevo';

    if (!name && !email && !phone) {
      return redirect('/aula/admin/leads/nuevo?error=' + encodeURIComponent('Rellena al menos el nombre, el email o el teléfono.'));
    }

    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);

    const { data: newLead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        source: 'manual',
        lang: 'es',
        name,
        company,
        email,
        phone,
        plan,
        message,
        status,
        next_follow_up_date: nextFollowUpDate,
        extra: {},
      })
      .select('id')
      .single();

    if (insertError || !newLead) {
      console.error('Error creando lead manual:', insertError);
      return new Response(JSON.stringify({ error: 'Error al crear el lead' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (note) {
      const { error: noteError } = await supabaseAdmin
        .from('lead_notes')
        .insert({ lead_id: newLead.id, note });

      if (noteError) {
        console.error('Error guardando nota inicial:', noteError);
      }
    }

    return redirect(`/aula/admin/leads/${newLead.id}?updated=1`);
  } catch (error) {
    console.error('Error en lead-create:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
