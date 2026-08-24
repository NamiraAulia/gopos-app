import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrbiyepprhawkoqowffs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GO_BACKEND_URL = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;
    const authHeader = request.headers.get('Authorization');

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Nama, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    // STEP 1: Attempt creation via local GoPOS Backend (http://localhost:8080)
    try {
      const goResponse = await fetch(`${GO_BACKEND_URL}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ name, email, password, role: role || 'kasir' }),
      });

      if (goResponse.ok) {
        const goData = await goResponse.json();
        return NextResponse.json({
          success: true,
          message: goData.message || "User kasir baru berhasil dibuat via Backend GoPOS",
          data: goData.data,
        });
      }
    } catch (goErr) {
      // Go Backend is offline, continue to Supabase fallback
    }

    // STEP 2: Supabase Admin with Service Role Key (Bypasses RLS & Permission Denied)
    if (supabaseServiceKey && supabaseServiceKey !== 'placeholder-service-key') {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: role || 'kasir' },
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered')) {
          const { data: existingProfile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (!existingProfile) {
            const { data: repairedUser, error: repairError } = await supabaseAdmin
              .from('users')
              .insert({ name, email, role: role || 'kasir', is_active: true })
              .select()
              .single();

            if (!repairError) {
              return NextResponse.json({
                success: true,
                message: "Profil kasir berhasil dipulihkan di database Supabase",
                data: repairedUser,
              });
            }
          }
        }

        return NextResponse.json(
          { success: false, message: authError.message || "Gagal membuat user di Supabase Auth" },
          { status: 400 }
        );
      }

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          name,
          email,
          role: role || 'kasir',
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        if (authData?.user?.id) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        return NextResponse.json(
          { success: false, message: `Gagal menyimpan profil: ${insertError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User kasir baru berhasil dibuat",
        data: newUser,
      });

    } else {
      // STEP 3: Fallback using Anon Client & Admin JWT Header
      const clientHeaders: Record<string, string> = {};
      if (authHeader) {
        clientHeaders['Authorization'] = authHeader;
      }

      const supabaseIsolated = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: clientHeaders },
      });

      const { error: authError } = await supabaseIsolated.auth.signUp({
        email,
        password,
        options: { data: { name, role: role || 'kasir' } },
      });

      if (authError && authError.message?.toLowerCase().includes('already registered')) {
        const { data: existingProfile } = await supabaseIsolated
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (!existingProfile) {
          const { data: repairedUser, error: repairError } = await supabaseIsolated
            .from('users')
            .insert({ name, email, role: role || 'kasir', is_active: true })
            .select()
            .single();

          if (!repairError && repairedUser) {
            return NextResponse.json({
              success: true,
              message: "Profil kasir berhasil dipulihkan di database Supabase",
              data: repairedUser,
            });
          }
        }
      } else if (authError && !authError.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { success: false, message: authError.message },
          { status: 400 }
        );
      }

      const { data: newUser, error: insertError } = await supabaseIsolated
        .from('users')
        .insert({
          name,
          email,
          role: role || 'kasir',
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.message?.includes('permission denied') || insertError.message?.includes('row-level security')) {
          return NextResponse.json(
            {
              success: false,
              message: "Permission Denied di Supabase. Solusi: Jalankan Backend GoPOS di port 8080 (go run main.go) ATAU tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local ATAU jalankan SQL 'GRANT ALL ON TABLE users TO anon, authenticated;' di Supabase.",
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, message: `Gagal menyimpan profil: ${insertError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User kasir baru berhasil dibuat",
        data: newUser,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
