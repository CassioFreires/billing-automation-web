import React, { useEffect, useRef, useState } from "react";
import { FileSignature, Loader2, CheckCircle2, Upload, FileText, Eye } from "lucide-react";
import { useContractSettings, useUpdateContractSettings, useUploadContractFile } from "../../hooks/useContract";
import contractService from "../../services/contract.service";

/**
 * Contrato no Celular (spec 0040/0041, F14). O dono escreve o contrato OU envia um
 * PDF; o cliente assina no Portal. Editar o texto/arquivo sobe a versão.
 */
export const ContractSettings: React.FC = () => {
  const { data, isLoading } = useContractSettings();
  const update = useUpdateContractSettings();
  const upload = useUploadContractFile();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{ enabled: boolean; title: string; body: string; mode: "text" | "file" }>({
    enabled: false,
    title: "",
    body: "",
    mode: "text",
  });
  const [saved, setSaved] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm({ enabled: data.enabled, title: data.title, body: data.body, mode: data.mode });
  }, [data]);

  const inputClass =
    "focus-ring w-full bg-bg-main/60 border border-border-subtle rounded-xl px-3 py-2.5 text-sm placeholder-text-faint";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      await update.mutateAsync(form);
      setSaved(true);
    } catch {
      /* silencioso */
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadErr("Envie um arquivo PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr("O PDF é muito grande (máx. 5 MB).");
      return;
    }
    try {
      await upload.mutateAsync(file);
      setForm((f) => ({ ...f, mode: "file", enabled: true }));
    } catch {
      setUploadErr("Não foi possível enviar o PDF. Tente de novo.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const viewFile = async () => {
    try {
      const blob = await contractService.getFileBlob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch {
      /* silencioso */
    }
  };

  const fmtKb = (n?: number | null) => (n ? `${Math.round(n / 1024)} KB` : "");

  return (
    <div className="bg-bg-card border border-border-subtle/80 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
          <FileSignature className="h-4 w-4" />
          Contrato no celular
        </div>
        {data && <span className="text-xs text-text-faint">versão {data.version}</span>}
      </div>
      <p className="text-xs text-text-muted mb-5">
        Escreva o contrato <strong>ou envie um PDF</strong>. O cliente assina no <strong>Portal</strong>, pelo
        celular, com registro de prova (nome, data, versão). Base legal para cobrar, reter e bloquear acesso.
      </p>

      {isLoading ? (
        <div className="h-56 rounded-xl bg-bg-main/60 animate-pulse" />
      ) : (
        <form onSubmit={save} className="space-y-4">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-brand-primary h-4 w-4"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            <div>
              <div className="text-sm font-medium">Exigir aceite do contrato</div>
              <div className="text-xs text-text-muted">Com ativado, o contrato aparece no Portal do pagador para assinatura.</div>
            </div>
          </label>

          {/* Toggle: texto x PDF */}
          <div className="inline-flex bg-bg-main/50 border border-border-subtle/80 rounded-xl p-1">
            {([
              { v: "text", label: "Escrever texto", icon: FileText },
              { v: "file", label: "Enviar PDF", icon: Upload },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setForm({ ...form, mode: o.v })}
                className={`focus-ring px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  form.mode === o.v ? "bg-brand-primary text-white" : "text-text-muted hover:text-white"
                }`}
              >
                <o.icon className="h-3.5 w-3.5" /> {o.label}
              </button>
            ))}
          </div>

          {form.mode === "text" ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Título</span>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contrato de prestação de serviço" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Texto do contrato</span>
                <textarea
                  className={`${inputClass} min-h-[180px] resize-y font-mono text-xs leading-relaxed`}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={"1. Do objeto...\n2. Do pagamento...\n3. Do bloqueio de acesso..."}
                />
                <span className="text-xs text-text-faint">Ao alterar o texto, a versão sobe — quem já assinou continua válido na versão anterior.</span>
              </label>
            </>
          ) : (
            <div className="space-y-3">
              {data?.mode === "file" && data.fileName ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-main/50 border border-border-subtle/60 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-brand-primary shrink-0" />
                    <span className="text-sm truncate">{data.fileName}</span>
                    <span className="text-xs text-text-faint shrink-0">{fmtKb(data.fileSize)}</span>
                  </div>
                  <button type="button" onClick={viewFile} className="focus-ring inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline shrink-0">
                    <Eye className="h-3.5 w-3.5" /> Ver
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Nenhum PDF enviado ainda.</p>
              )}

              <input ref={fileInput} type="file" accept="application/pdf" onChange={onPickFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={upload.isPending}
                className="focus-ring inline-flex items-center gap-2 border border-border-subtle hover:bg-bg-elevated rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              >
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {data?.mode === "file" && data.fileName ? "Trocar PDF" : "Enviar PDF"}
              </button>
              {uploadErr && <p className="text-xs text-rose-300">{uploadErr}</p>}
              <p className="text-xs text-text-faint">PDF de até 5 MB. Enviar um novo arquivo sobe a versão do contrato.</p>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-sm rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Contrato salvo.
            </div>
          )}

          <button
            type="submit"
            disabled={update.isPending}
            className="focus-ring bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl py-2.5 px-6 text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar configurações
          </button>
        </form>
      )}
    </div>
  );
};
