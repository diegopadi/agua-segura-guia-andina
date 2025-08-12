-- Create app_configs table for persistent, versioned app-wide configuration
create table if not exists public.app_configs (
  key text primary key,
  version text not null default 'v1',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

-- Enable RLS
alter table public.app_configs enable row level security;

-- Policies: authenticated users can read and write (adjust later if admin roles are added)
create policy "Authenticated can read app configs"
  on public.app_configs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert app configs"
  on public.app_configs for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update app configs"
  on public.app_configs for update
  using (auth.role() = 'authenticated');

-- Trigger to keep updated_at fresh
create trigger update_app_configs_updated_at
before update on public.app_configs
for each row execute procedure public.update_updated_at_column();

-- Seed initial APP_CONFIG_A4 row if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_configs WHERE key = 'APP_CONFIG_A4') THEN
    INSERT INTO public.app_configs (key, version, data)
    VALUES (
      'APP_CONFIG_A4',
      'v1',
      '{
        "version": "v1",
        "estrategias_repo": {
          "version": "pending",
          "items": []
        },
        "plantilla_informe_ac4": {
          "version": "pending",
          "estructura": {}
        }
      }'::jsonb
    );
  END IF;
END $$;

-- Upsert plantilla6_estrategias_ac4 in templates with unified prompts fields
DO $$
DECLARE
  existing_id uuid;
  content_json jsonb := '{
    "system_prompt": "Eres un especialista en metodologías activas y diseño curricular del Ministerio de Educación del Perú.\n\nIMPORTANTE: Responde ÚNICAMENTE con un array JSON válido de 6 estrategias metodológicas, sin texto adicional.\n\nEl formato debe ser exactamente así:\n[\n  {\n    \"momento\": \"inicio\",\n    \"estrategia\": \"descripción de la estrategia\",\n    \"referencia\": \"documento específico del MINEDU\"\n  }\n]\n\nDebes generar exactamente 6 estrategias: 2 para \"inicio\", 2 para \"desarrollo\", 2 para \"cierre\".",
    "user_prompt": "Genera 6 estrategias metodológicas activas para:\n\nCONTEXTO EDUCATIVO:\n- Grado: {{grado}}\n- Área: {{area}}\n- Competencia: {{competencia}}\n- Tipo de aula: {{tipo_aula}}\n- Modalidad: {{modalidad}}\n- Recursos TIC: {{recursos_tic}}\n\nREQUERIMIENTOS:\n1. 2 estrategias para el momento de INICIO\n2. 2 estrategias para el momento de DESARROLLO  \n3. 2 estrategias para el momento de CIERRE\n4. Cada estrategia debe estar alineada con documentos oficiales del MINEDU\n5. Considera el uso de los recursos TIC disponibles\n6. Las estrategias deben ser específicas para el grado y área indicados\n\nResponde SOLO con el array JSON, sin explicaciones adicionales.",
    "chat_context": ""
  }'::jsonb;
BEGIN
  SELECT id INTO existing_id FROM public.templates WHERE name = 'plantilla6_estrategias_ac4' LIMIT 1;
  IF existing_id IS NULL THEN
    INSERT INTO public.templates (name, content) VALUES ('plantilla6_estrategias_ac4', content_json);
  ELSE
    UPDATE public.templates SET content = content_json, updated_at = now() WHERE id = existing_id;
  END IF;
END $$;
