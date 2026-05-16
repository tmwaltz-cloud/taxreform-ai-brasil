// supabase/functions/monitor-tributario/index.ts
// Executa o Monitor Tributário automaticamente via pg_cron
// Chama Gemini 2.5 Flash com Google Search → salva em tax_news

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Fontes especializadas do monitor-tributario skill ─────────────────────────
const MONITOR_PROMPT = `DATA ATUAL: ${new Date().toLocaleDateString('pt-BR')}.
Você é o Monitor Tributário do TaxReform.ai Brasil.

MISSÃO: Buscar notícias e publicações legislativas REAIS dos últimos 3 dias sobre Reforma Tributária Brasileira.

FONTES OBRIGATÓRIAS — pesquise cada uma:
1. site:camaraibs.gov.br — publicações do Comitê Gestor IBS (CGIBS)
2. site:jota.info tributário reforma
3. site:conjur.com.br reforma tributária IBS CBS
4. site:gov.br/receitafederal reforma tributária
5. site:senado.leg.br reforma tributária
6. site:camara.leg.br reforma tributária
7. site:migalhas.com.br tributário reforma
8. site:portaltributario.com.br IBS CBS reforma

TEMAS PRIORITÁRIOS:
- IBS (Imposto sobre Bens e Serviços) — alíquotas, regulamentações CGIBS
- CBS (Contribuição sobre Bens e Serviços) — Receita Federal
- Split Payment — implementação, portarias, instruções normativas
- Simples Nacional e Simples Híbrido — transição, regulamentações
- LC 214/2025 — regulamentações, instruções normativas
- ICMS-ST — alterações estaduais na transição
- Monofásico PIS/COFINS — mudanças, setores afetados
- Prazos e cronogramas da reforma

REGRAS:
- Retorne APENAS notícias REAIS encontradas na busca — NUNCA invente
- Janela: últimos 3 dias
- Máximo 10 itens, mínimo 3
- Se não encontrar notícias recentes de um tema, omita-o

Retorne APENAS JSON válido (sem markdown, sem texto extra):
{
  "news": [
    {
      "title": "título da notícia",
      "summary": "resumo em 2-3 frases com impacto prático para empresas",
      "source": "nome da fonte (ex: CGIBS, JOTA, Receita Federal)",
      "source_url": "URL completa da notícia",
      "date_pub": "YYYY-MM-DD",
      "category": "IBS|CBS|Split Payment|Simples Nacional|LC 214|ICMS|PIS/COFINS|Reforma Tributária",
      "urgency": "low|medium|high",
      "impact_level": "Alto|Médio|Baixo",
      "tags": ["tag1", "tag2"]
    }
  ],
  "sources_consulted": 8,
  "monitor_date": "YYYY-MM-DD"
}`;

// ── Chamar Gemini via REST (sem SDK, compatível com Deno) ─────────────────────
async function callGemini(apiKey: string): Promise<any[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: MONITOR_PROMPT }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.1 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Limpar markdown se vier com ```json
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Tentar extrair JSON de dentro do texto
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error('Gemini não retornou JSON válido: ' + clean.slice(0, 200));
  }

  return parsed?.news ?? [];
}

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('VITE_GEMINI_API_KEY') ?? '';

  const body = await req.json().catch(() => ({}));
  const triggeredBy = body.triggered_by ?? 'manual';

  // ── Registrar início da execução ──────────────────────────────────────────
  const { data: run, error: runErr } = await supabase
    .from('monitor_runs')
    .insert({ triggered_by: triggeredBy, status: 'running' })
    .select('id')
    .single();

  if (runErr) {
    return new Response(JSON.stringify({ error: 'Erro ao registrar run: ' + runErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const runId = run.id;

  try {
    if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada no Supabase');

    // ── Chamar Gemini com Google Search ───────────────────────────────────
    const news = await callGemini(geminiKey);

    if (!Array.isArray(news) || news.length === 0) {
      throw new Error('Gemini não retornou notícias válidas');
    }

    // ── Validar e normalizar cada notícia ─────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const rows = news
      .filter(n => n.title && n.summary && n.source)
      .map(n => ({
        title:        String(n.title).slice(0, 500),
        summary:      String(n.summary).slice(0, 1000),
        source:       String(n.source).slice(0, 200),
        source_url:   n.source_url ? String(n.source_url).slice(0, 500) : null,
        date_pub:     n.date_pub ?? today,
        category:     n.category ?? 'Reforma Tributária',
        urgency:      ['low', 'medium', 'high'].includes(n.urgency) ? n.urgency : 'medium',
        impact_level: ['Alto', 'Médio', 'Baixo'].includes(n.impact_level) ? n.impact_level : 'Médio',
        tags:         Array.isArray(n.tags) ? n.tags.slice(0, 10) : [],
        run_id:       runId,
      }));

    // ── Inserir no Supabase ───────────────────────────────────────────────
    // Evitar duplicatas: deletar notícias do mesmo run_id se já existir
    await supabase.from('tax_news').delete().eq('run_id', runId);

    const { error: insertErr } = await supabase.from('tax_news').insert(rows);
    if (insertErr) throw new Error('Erro ao inserir notícias: ' + insertErr.message);

    // ── Manter apenas os últimos 30 dias de notícias ──────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    await supabase
      .from('tax_news')
      .delete()
      .lt('date_pub', cutoff.toISOString().split('T')[0]);

    // ── Atualizar run como sucesso ────────────────────────────────────────
    await supabase
      .from('monitor_runs')
      .update({ status: 'success', finished_at: new Date().toISOString(), news_count: rows.length, sources_count: 8 })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ ok: true, news_count: rows.length, run_id: runId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    // Registrar erro no log
    await supabase
      .from('monitor_runs')
      .update({ status: 'error', finished_at: new Date().toISOString(), error_msg: err.message })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ error: err.message, run_id: runId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
