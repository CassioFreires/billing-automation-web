import React, { useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardPaste,
} from "lucide-react";
import { isAxiosError } from "axios";
import { Modal } from "../../components/ui/Modal";
import { parseCsv } from "../../lib/csv";
import { useImportInvoices } from "../../hooks/useInvoices";
import type { ImportInvoiceRow, InvoiceImportResult } from "../../services/invoices.service";

type Step = "upload" | "map" | "done";

const TARGETS = [
  { key: "clientPhone", label: "Telefone do cliente", required: true },
  { key: "value", label: "Valor", required: true },
  { key: "dueDate", label: "Vencimento", required: true },
  { key: "description", label: "Descrição (opcional)", required: false },
] as const;

type TargetKey = (typeof TARGETS)[number]["key"];
const NONE = "__none__";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function guessMapping(headers: string[]): Record<TargetKey, string> {
  const find = (candidates: string[]) => {
    const idx = headers.findIndex((h) => {
      const n = norm(h);
      return candidates.some((c) => n.includes(c));
    });
    return idx >= 0 ? headers[idx] : NONE;
  };
  return {
    clientPhone: find(["telefone", "phone", "celular", "whatsapp", "fone", "tel"]),
    value: find(["valor", "value", "preco", "amount", "total"]),
    dueDate: find(["vencimento", "venc", "duedate", "data", "date"]),
    description: find(["descricao", "description", "desc", "item", "servico"]),
  };
}

/** Converte "1.234,56" ou "1234.56" em número. Retorna NaN se inválido. */
function parseMoney(raw: string): number {
  const s = raw.trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  // Se tem vírgula, assume pt-BR (ponto = milhar, vírgula = decimal).
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return Number(normalized);
}

/** Aceita AAAA-MM-DD ou DD/MM/AAAA. Retorna ISO (AAAA-MM-DD) ou "" se inválida. */
function parseDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(s))) return s.slice(0, 10);
  return "";
}

interface RowValidation {
  row: ImportInvoiceRow;
  errors: string[];
}

function validateRow(
  cells: string[],
  headers: string[],
  mapping: Record<TargetKey, string>
): RowValidation {
  const get = (key: TargetKey) => {
    const header = mapping[key];
    if (!header || header === NONE) return "";
    const idx = headers.indexOf(header);
    return idx >= 0 ? (cells[idx] ?? "").trim() : "";
  };

  const clientPhone = get("clientPhone");
  const value = parseMoney(get("value"));
  const dueDate = parseDate(get("dueDate"));
  const description = get("description") || undefined;

  const errors: string[] = [];
  if (clientPhone.replace(/\D/g, "").length < 10) errors.push("telefone < 10 dígitos");
  if (!Number.isFinite(value) || value <= 0) errors.push("valor inválido");
  if (!dueDate) errors.push("vencimento inválido");

  return { row: { clientPhone, value, dueDate, ...(description ? { description } : {}) }, errors };
}

function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error) return String(err.response.data.error);
  if (isAxiosError(err) && !err.response) return "Sem conexão com o servidor.";
  return fallback;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ImportInvoicesWizard: React.FC<Props> = ({ open, onClose }) => {
  const importInvoices = useImportInvoices();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawText, setRawText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({
    clientPhone: NONE,
    value: NONE,
    dueDate: NONE,
    description: NONE,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceImportResult | null>(null);

  const parsed = useMemo(() => {
    if (!rawText.trim()) return { headers: [], rows: [] };
    try {
      return parseCsv(rawText);
    } catch {
      return { headers: [], rows: [] };
    }
  }, [rawText]);

  const validations = useMemo(
    () => parsed.rows.map((cells) => validateRow(cells, parsed.headers, mapping)),
    [parsed, mapping]
  );

  const validRows = validations.filter((v) => v.errors.length === 0);
  const invalidCount = validations.length - validRows.length;
  const requiredMapped = TARGETS.filter((t) => t.required).every(
    (t) => mapping[t.key] && mapping[t.key] !== NONE
  );

  const reset = () => {
    setStep("upload");
    setRawText("");
    setParseError(null);
    setMapping({ clientPhone: NONE, value: NONE, dueDate: NONE, description: NONE });
    setSubmitError(null);
    setResult(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const loadText = (text: string) => {
    setRawText(text);
    setParseError(null);
    const { headers, rows } = (() => {
      try {
        return parseCsv(text);
      } catch {
        return { headers: [] as string[], rows: [] as string[][] };
      }
    })();
    if (headers.length === 0 || rows.length === 0) {
      setParseError("Não consegui ler linhas de dados. Confira se o arquivo tem cabeçalho e ao menos uma linha.");
      return;
    }
    setMapping(guessMapping(headers));
    setStep("map");
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ""));
    reader.onerror = () => setParseError("Falha ao ler o arquivo.");
    reader.readAsText(file);
  };

  const doImport = async () => {
    setSubmitError(null);
    if (validRows.length === 0) {
      setSubmitError("Nenhuma linha válida para importar.");
      return;
    }
    try {
      const res = await importInvoices.mutateAsync(validRows.map((v) => v.row));
      setResult(res);
      setStep("done");
    } catch (err) {
      setSubmitError(apiError(err, "Erro ao importar as faturas."));
    }
  };

  const selectClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm";
  const previewRows = parsed.rows.slice(0, 5);

  return (
    <Modal open={open} onClose={close} title="Importar faturas (CSV)">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
        {(["upload", "map", "done"] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={
                step === s
                  ? "text-brand-primary font-semibold"
                  : ["upload", "map", "done"].indexOf(step) > i
                  ? "text-brand-success"
                  : ""
              }
            >
              {i + 1}. {s === "upload" ? "Arquivo" : s === "map" ? "Mapear" : "Concluído"}
            </span>
            {i < 2 && <span className="text-text-faint">→</span>}
          </React.Fragment>
        ))}
      </div>

      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-sky-500/10 border border-sky-500/20 text-brand-primary text-xs rounded-xl px-3.5 py-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              O cliente é identificado pelo <strong>telefone</strong> — cadastre/importe os clientes
              antes. Linhas sem cliente correspondente são ignoradas.
            </span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring w-full border-2 border-dashed border-border-subtle hover:border-brand-primary/60 rounded-2xl py-10 flex flex-col items-center gap-3 transition-colors group"
          >
            <UploadCloud className="h-9 w-9 text-text-faint group-hover:text-brand-primary transition-colors" />
            <span className="text-sm font-medium">Clique para escolher um arquivo .csv</span>
            <span className="text-xs text-text-faint">exportado do Excel / Google Sheets</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />

          <div className="flex items-center gap-3 text-xs text-text-faint">
            <div className="h-px flex-1 bg-border-subtle" />
            ou cole o conteúdo
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder={"telefone,valor,vencimento,descricao\n5511999998888,199.90,2026-08-10,Mensalidade"}
            className="focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-xs font-mono placeholder-text-faint"
          />

          {parseError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={close} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button
              onClick={() => loadText(rawText)}
              disabled={!rawText.trim()}
              className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <ClipboardPaste className="h-4 w-4" /> Continuar
            </button>
          </div>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-5">
          <p className="text-xs text-text-muted flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-brand-primary" />
            {parsed.rows.length} linha(s) detectada(s). Associe cada campo à coluna do seu arquivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGETS.map((t) => (
              <label key={t.key} className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {t.label} {t.required && <span className="text-rose-400">*</span>}
                </span>
                <select
                  className={selectClass}
                  value={mapping[t.key]}
                  onChange={(e) => setMapping({ ...mapping, [t.key]: e.target.value })}
                >
                  <option value={NONE}>— não importar —</option>
                  {parsed.headers.map((h, i) => (
                    <option key={`${h}-${i}`} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="rounded-xl border border-border-subtle/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-bg-card/80 text-text-muted uppercase tracking-wider">
                    <th className="p-2.5 font-semibold whitespace-nowrap">Telefone</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Valor</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Vencimento</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {previewRows.map((_cells, ri) => {
                    const v = validations[ri];
                    return (
                      <tr key={ri} className={v.errors.length ? "bg-rose-500/5" : ""}>
                        <td className="p-2.5 font-mono">{v.row.clientPhone || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5 font-mono">{Number.isFinite(v.row.value) && v.row.value > 0 ? v.row.value.toFixed(2) : <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5 font-mono">{v.row.dueDate || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5">{v.row.description ?? <span className="text-text-faint">Cobrança</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > previewRows.length && (
              <p className="text-[11px] text-text-faint px-2.5 py-2 bg-bg-card/40">
                Mostrando {previewRows.length} de {parsed.rows.length} linhas.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-brand-success bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {validRows.length} válida(s)
            </span>
            {invalidCount > 0 && (
              <span className="text-brand-warning bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                {invalidCount} ignorada(s) por erro
              </span>
            )}
            {!requiredMapped && (
              <span className="text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                mapeie telefone, valor e vencimento
              </span>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 bg-brand-danger/10 border border-brand-danger/20 text-rose-300 text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep("upload")}
              className="focus-ring flex items-center justify-center gap-2 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 px-4 text-sm font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              onClick={doImport}
              disabled={!requiredMapped || validRows.length === 0 || importInvoices.isPending}
              className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {importInvoices.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Importar {validRows.length} fatura(s)
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="space-y-5 py-2">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-brand-success mx-auto" />
            <h3 className="text-lg font-bold mt-3">Importação concluída</h3>
            <p className="text-sm text-text-muted mt-1">As faturas criadas já aparecem na lista.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-3">
              <div className="text-2xl font-bold text-brand-success">{result.criados}</div>
              <div className="text-xs text-text-muted mt-0.5">criadas</div>
            </div>
            <div className="bg-bg-card/60 border border-border-subtle rounded-xl py-3">
              <div className="text-2xl font-bold text-text-muted">{result.ignorados}</div>
              <div className="text-xs text-text-muted mt-0.5">ignoradas</div>
            </div>
          </div>

          {result.erros.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-brand-warning mb-2">Linhas ignoradas</p>
              <ul className="space-y-1 text-xs text-text-muted">
                {result.erros.slice(0, 20).map((e, i) => (
                  <li key={i}>
                    Linha {e.linha} ({e.clientPhone}): {e.motivo}
                  </li>
                ))}
                {result.erros.length > 20 && <li>…e mais {result.erros.length - 20}.</li>}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="focus-ring flex-1 border border-border-subtle hover:bg-bg-elevated rounded-xl py-2.5 text-sm font-medium transition-all">
              Importar outro
            </button>
            <button onClick={close} className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm transition-all active:scale-[0.98]">
              Concluir
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
