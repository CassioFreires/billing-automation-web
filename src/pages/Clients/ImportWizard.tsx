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
import { useImportClients } from "../../hooks/useClients";
import type { ImportClientRow, ImportResult } from "../../services/clientes.service";

type Step = "upload" | "map" | "done";

/** Campos-alvo do modelo. name/phone/document são obrigatórios; status opcional. */
const TARGETS = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", required: true },
  { key: "document", label: "Documento (CPF/CNPJ)", required: true },
  { key: "email", label: "E-mail (opcional)", required: false },
  { key: "status", label: "Status (opcional)", required: false },
] as const;

type TargetKey = (typeof TARGETS)[number]["key"];
const NONE = "__none__";

/** Palpite de mapeamento automático por nome de coluna. */
function guessMapping(headers: string[]): Record<TargetKey, string> {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const find = (candidates: string[]) => {
    const idx = headers.findIndex((h) => {
      const n = norm(h);
      return candidates.some((c) => n.includes(c));
    });
    return idx >= 0 ? headers[idx] : NONE;
  };
  return {
    name: find(["nome", "name", "cliente", "razao"]),
    phone: find(["telefone", "phone", "celular", "whatsapp", "fone", "tel"]),
    document: find(["documento", "document", "cpf", "cnpj", "doc"]),
    email: find(["email", "e-mail", "mail"]),
    status: find(["status", "situacao"]),
  };
}

function normalizeStatus(raw: string): "EM_DIA" | "EM_ATRASO" | undefined {
  const n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  if (!n) return undefined;
  if (n.includes("atras") || n === "em_atraso" || n.includes("vencid") || n.includes("inadimpl"))
    return "EM_ATRASO";
  return "EM_DIA";
}

interface RowValidation {
  row: ImportClientRow;
  errors: string[];
}

/** Valida uma linha mapeada segundo as mesmas regras do backend (spec 0008). */
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

  const name = get("name");
  const phone = get("phone");
  const document = get("document");
  const email = get("email");
  const status = normalizeStatus(get("status"));

  const errors: string[] = [];
  if (name.length < 3) errors.push("nome < 3 caracteres");
  if (phone.replace(/\D/g, "").length < 10) errors.push("telefone < 10 dígitos");
  if (document.length < 11) errors.push("documento < 11 caracteres");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("e-mail inválido");

  return {
    row: { name, phone, document, ...(email ? { email } : {}), ...(status ? { status } : {}) },
    errors,
  };
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

export const ImportWizard: React.FC<Props> = ({ open, onClose }) => {
  const importClients = useImportClients();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawText, setRawText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({
    name: NONE,
    phone: NONE,
    document: NONE,
    email: NONE,
    status: NONE,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

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
    setMapping({ name: NONE, phone: NONE, document: NONE, status: NONE });
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
      const res = await importClients.mutateAsync(validRows.map((v) => v.row));
      setResult(res);
      setStep("done");
    } catch (err) {
      setSubmitError(apiError(err, "Erro ao importar os clientes."));
    }
  };

  const selectClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm";
  const previewRows = parsed.rows.slice(0, 5);

  return (
    <Modal open={open} onClose={close} title="Importar clientes (CSV)">
      {/* Passos */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
        {(["upload", "map", "done"] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={
                step === s
                  ? "text-brand-primary font-semibold"
                  : (["upload", "map", "done"].indexOf(step) > i ? "text-brand-success" : "")
              }
            >
              {i + 1}. {s === "upload" ? "Arquivo" : s === "map" ? "Mapear" : "Concluído"}
            </span>
            {i < 2 && <span className="text-text-faint">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 — upload / paste */}
      {step === "upload" && (
        <div className="space-y-4">
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
            placeholder={"nome,telefone,documento,status\nAna Souza,5511999998888,12345678901,em dia"}
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

      {/* STEP 2 — mapping + preview */}
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

          {/* Preview */}
          <div className="rounded-xl border border-border-subtle/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-bg-card/80 text-text-muted uppercase tracking-wider">
                    {TARGETS.map((t) => (
                      <th key={t.key} className="p-2.5 font-semibold whitespace-nowrap">{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {previewRows.map((_cells, ri) => {
                    const v = validations[ri];
                    return (
                      <tr key={ri} className={v.errors.length ? "bg-rose-500/5" : ""}>
                        <td className="p-2.5">{v.row.name || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5 font-mono">{v.row.phone || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5 font-mono">{v.row.document || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5">{v.row.email || <span className="text-text-faint">—</span>}</td>
                        <td className="p-2.5">{v.row.status ?? <span className="text-text-faint">EM_DIA</span>}</td>
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

          {/* Resumo de validação */}
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
                mapeie nome, telefone e documento
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
              disabled={!requiredMapped || validRows.length === 0 || importClients.isPending}
              className="focus-ring flex-1 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {importClients.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Importar {validRows.length} cliente(s)
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — resultado */}
      {step === "done" && result && (
        <div className="space-y-5 text-center py-2">
          <CheckCircle2 className="h-12 w-12 text-brand-success mx-auto" />
          <div>
            <h3 className="text-lg font-bold">Importação concluída</h3>
            <p className="text-sm text-text-muted mt-1">Os clientes já aparecem na sua lista.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-3">
              <div className="text-2xl font-bold text-brand-success">{result.criados}</div>
              <div className="text-xs text-text-muted mt-0.5">criados</div>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl py-3">
              <div className="text-2xl font-bold text-brand-primary">{result.atualizados}</div>
              <div className="text-xs text-text-muted mt-0.5">atualizados</div>
            </div>
            <div className="bg-bg-card/60 border border-border-subtle rounded-xl py-3">
              <div className="text-2xl font-bold text-text-muted">{result.ignorados}</div>
              <div className="text-xs text-text-muted mt-0.5">ignorados</div>
            </div>
          </div>
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
