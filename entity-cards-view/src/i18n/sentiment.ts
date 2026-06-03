import type { BlueprintPropertyMeta, StatusTone } from "../types";
import { normalizeForComparison } from "../utils/normalizeText";

function tokenSet(...groups: string[][]): Set<string> {
  const out = new Set<string>();
  for (const group of groups) {
    for (const token of group) {
      const raw = normalizeForComparison(token);
      if (!raw) continue;
      out.add(raw);
    }
  }
  return out;
}

/** Terminal / completed success */
const SUCCESS_DONE = tokenSet(
  [
    "done",
    "closed",
    "resolved",
    "complete",
    "completed",
    "finished",
    "merged",
    "released",
    "shipped",
    "approved",
    "success",
    "passed",
    "fulfilled",
  ],
  [
    "terminé",
    "termine",
    "fermé",
    "ferme",
    "résolu",
    "resolu",
    "fait",
    "validé",
    "valide",
  ],
  [
    "erledigt",
    "abgeschlossen",
    "geschlossen",
    "gelöst",
    "gelost",
    "fertig",
    "freigegeben",
  ],
  ["hecho", "completado", "cerrado", "resuelto", "finalizado", "aprobado"],
  ["concluído", "concluido", "fechado", "resolvido", "aprovado"],
  ["הושלם", "סגור", "פתור", "מוכן", "מאושר"]
);

/** Healthy / running / enabled — positive operational (green) */
const SUCCESS_ACTIVE = tokenSet(
  [
    "active",
    "enabled",
    "enable",
    "on",
    "run",
    "running",
    "runs",
    "live",
    "up",
    "online",
    "healthy",
    "operational",
    "operating",
    "operate",
    "available",
    "connected",
    "deployed",
    "deploying",
    "started",
    "start",
    "ready",
    "production",
    "prod",
    "serving",
    "served",
    "ok",
    "okay",
    "true",
    "yes",
    "valid",
    "validated",
    "green",
  ],
  [
    "actif",
    "activé",
    "active",
    "en ligne",
    "en service",
    "opérationnel",
    "operationnel",
    "disponible",
    "connecté",
    "connecte",
  ],
  [
    "aktiv",
    "aktiviert",
    "ein",
    "an",
    "läuft",
    "lauft",
    "laufend",
    "betrieb",
    "online",
    "verfügbar",
    "verfugbar",
    "bereit",
  ],
  [
    "activo",
    "habilitado",
    "encendido",
    "en línea",
    "en linea",
    "operativo",
    "disponible",
    "conectado",
    "ejecutando",
  ],
  [
    "ativo",
    "habilitado",
    "ligado",
    "em execução",
    "em execucao",
    "operacional",
    "disponível",
    "disponivel",
    "conectado",
  ],
  ["פעיל", "מופעל", "פועל", "רץ", "דולק", "מחובר", "זמין", "תקין", "מוכן", "באוויר"]
);

const TODO = tokenSet(
  [
    "to do",
    "todo",
    "open",
    "new",
    "backlog",
    "planned",
    "queued",
    "draft",
    "not started",
    "not_started",
    "backlog",
    "icebox",
  ],
  ["à faire", "a faire", "ouvert", "nouveau", "planifié", "planifie", "brouillon"],
  ["offen", "neu", "geplant", "entwurf"],
  ["por hacer", "abierto", "nuevo", "planificado", "borrador"],
  ["a fazer", "aberto", "novo", "planejado", "rascunho"],
  ["לעשות", "פתוח", "חדש", "מתוכנן", "טיוטה", "באקלוג", "לא התחיל"]
);

/** Work in flight — blue (not the same as operational "active") */
const IN_PROGRESS = tokenSet(
  [
    "in progress",
    "in review",
    "in development",
    "in testing",
    "in qa",
    "in staging",
    "doing",
    "working",
    "review",
    "testing",
    "progress",
    "developing",
    "building",
    "implementing",
    "investigating",
    "analyzing",
    "analysing",
  ],
  [
    "en cours",
    "en revue",
    "en développement",
    "en developpement",
    "en test",
    "en cours de",
  ],
  [
    "in bearbeitung",
    "in prüfung",
    "in prufung",
    "in entwicklung",
    "in arbeit",
  ],
  [
    "en progreso",
    "en curso",
    "en revisión",
    "en revision",
    "en desarrollo",
  ],
  ["em progresso", "em andamento", "em revisão", "em revisao", "em desenvolvimento"],
  ["בתהליך", "בביצוע", "בבדיקה", "בפיתוח", "בעבודה"]
);

const DANGER = tokenSet(
  [
    "disabled",
    "disable",
    "inactive",
    "inactivate",
    "off",
    "down",
    "stop",
    "stopped",
    "halted",
    "unhealthy",
    "failed",
    "failure",
    "error",
    "critical",
    "offline",
    "blocked",
    "block",
    "cancelled",
    "canceled",
    "rejected",
    "declined",
    "false",
    "no",
    "invalid",
    "terminated",
    "killed",
    "dead",
    "outage",
  ],
  [
    "désactivé",
    "desactive",
    "inactif",
    "échoué",
    "echoue",
    "erreur",
    "critique",
    "hors ligne",
    "bloqué",
    "bloque",
    "annulé",
    "annule",
    "rejeté",
    "rejete",
  ],
  [
    "deaktiviert",
    "inaktiv",
    "aus",
    "fehlgeschlagen",
    "fehler",
    "kritisch",
    "offline",
    "blockiert",
    "abgebrochen",
    "abgelehnt",
  ],
  [
    "deshabilitado",
    "inactivo",
    "apagado",
    "fallido",
    "error",
    "crítico",
    "critico",
    "desconectado",
    "bloqueado",
    "cancelado",
    "rechazado",
  ],
  [
    "desativado",
    "inativo",
    "desligado",
    "falhou",
    "erro",
    "offline",
    "bloqueado",
    "cancelado",
    "rejeitado",
  ],
  ["מושבת", "לא פעיל", "כבוי", "נכשל", "שגיאה", "חסום", "בוטל", "נדחה", "לא תקין", "מנותק"]
);

const WARNING = tokenSet(
  [
    "warning",
    "warn",
    "degraded",
    "pending",
    "partial",
    "waiting",
    "on hold",
    "on_hold",
    "paused",
    "pause",
    "delayed",
    "at risk",
    "at_risk",
  ],
  ["avertissement", "dégradé", "degrade", "en attente", "partiel", "en pause"],
  ["warnung", "degradiert", "ausstehend", "teilweise", "pausiert", "wartend"],
  ["advertencia", "degradado", "pendiente", "parcial", "en espera", "pausado"],
  ["aviso", "degradado", "pendente", "parcial", "em espera", "pausado"],
  ["אזהרה", "מוחלש", "ממתין", "חלקי", "מושהה", "בסיכון"]
);

const TYPE_BUG = tokenSet(
  ["bug", "incident", "defect", "hotfix", "blocker"],
  ["bogue", "incident", "défaut", "defaut"],
  ["fehler", "vorfall", "mangel"],
  ["error", "incidente", "defecto"],
  ["erro", "incidente", "defeito"],
  ["באג", "תקלה", "חסימה"]
);

const TYPE_TASK = tokenSet(
  ["task", "subtask", "sub-task", "sub task", "chore", "maintenance", "support"],
  ["tâche", "tache", "sous-tâche", "sous tache"],
  ["aufgabe", "unteraufgabe"],
  ["tarea", "subtarea"],
  ["tarefa", "subtarefa"],
  ["משימה", "תת-משימה"]
);

const TYPE_FEATURE = tokenSet(
  ["story", "epic", "feature", "improvement", "enhancement"],
  [
    "histoire",
    "epopee",
    "épopée",
    "fonctionnalité",
    "fonctionnalite",
    "amélioration",
    "amelioration",
  ],
  ["geschichte", "epos", "funktion", "verbesserung"],
  ["historia", "épica", "epica", "funcionalidad", "mejora"],
  ["história", "épico", "epico", "funcionalidade", "melhoria"],
  ["סיפור", "אפיק", "פיצ'ר", "שיפור"]
);

function tokenize(value: string): string[] {
  const raw = normalizeForComparison(value);
  if (!raw) return [];
  const parts = raw.split(/[\s_,\-/|.:;()[\]{}]+/).filter(Boolean);
  return [...new Set([raw, ...parts.map(normalizeForComparison)])];
}

function matchesSet(set: Set<string>, value: string): boolean {
  for (const token of tokenize(value)) {
    if (set.has(token)) return true;
  }
  return false;
}

/** Phrase patterns — checked after token sets */
function matchesActivePhrase(value: string): boolean {
  const v = normalizeForComparison(value);
  if (!v || v === "—") return false;
  if (/\bon hold\b/.test(v)) return false;
  if (/\b(in progress|in review|in development|in testing|to do|todo)\b/.test(v)) {
    return false;
  }

  return /\b(active|enabled|enable|online|healthy|operational|operating|available|connected|deployed|live|running|runs?)\b/.test(
    v
  );
}

function matchesOffPhrase(value: string): boolean {
  const v = normalizeForComparison(value);
  return /\b(disabled|inactive|offline|down|stopped|halted|terminated|outage)\b/.test(
    v
  );
}

function isTypeProperty(prop: BlueprintPropertyMeta): boolean {
  const id = prop.identifier.toLowerCase();
  const title = prop.title.toLowerCase();
  return id === "type" || title === "type" || id.endsWith("_type");
}

function isPriorityProperty(prop: BlueprintPropertyMeta): boolean {
  const id = prop.identifier.toLowerCase();
  const title = prop.title.toLowerCase();
  return /priority|severity/.test(id) || /priority|severity/.test(title);
}

function isStatusLikeProperty(prop: BlueprintPropertyMeta): boolean {
  const id = prop.identifier.toLowerCase();
  const title = prop.title.toLowerCase();
  return (
    /status|state|health|phase|stage|lifecycle|availability|operational/.test(
      id
    ) ||
    /status|state|health|phase|stage/.test(title) ||
    id.endsWith("_status") ||
    id.endsWith("_state")
  );
}

function priorityTone(value: string): StatusTone {
  const v = normalizeForComparison(value);
  if (/highest|critical|blocker|p0|p1|urgent|sev.?0|sev.?1/.test(v)) {
    return "danger";
  }
  if (/high|major|p2|sev.?2/.test(v)) return "warning";
  if (/medium|normal|p3|moderate/.test(v)) return "info";
  return "neutral";
}

/** Standalone "on" only when value is exactly on/yes (avoid "on hold", "ontario") */
function isStandaloneOn(value: string): boolean {
  const v = normalizeForComparison(value);
  return v === "on" || v === "yes";
}

export function enumStatusTone(
  value: string,
  prop?: BlueprintPropertyMeta
): StatusTone {
  const raw = value.trim();
  if (!raw || raw === "—") return "neutral";

  if (prop && isTypeProperty(prop)) {
    if (matchesSet(TYPE_BUG, raw)) return "danger";
    if (matchesSet(TYPE_FEATURE, raw)) return "info";
    if (matchesSet(TYPE_TASK, raw)) return "violet";
    return "neutral";
  }

  if (prop && isPriorityProperty(prop)) {
    return priorityTone(raw);
  }

  // Negative before positive (inactive before active)
  if (matchesSet(DANGER, raw) || matchesOffPhrase(raw)) return "danger";
  if (matchesSet(WARNING, raw)) return "warning";

  if (
    matchesSet(SUCCESS_DONE, raw) ||
    matchesSet(SUCCESS_ACTIVE, raw) ||
    matchesActivePhrase(raw) ||
    isStandaloneOn(raw)
  ) {
    return "success";
  }

  if (matchesSet(IN_PROGRESS, raw)) return "info";
  if (matchesSet(TODO, raw)) return "backlog";

  // Status-like fields: lone "run" / short operational tokens → green
  if (prop && isStatusLikeProperty(prop)) {
    const v = normalizeForComparison(raw);
    if (v === "run" || v === "on" || v === "up") return "success";
  }

  return "neutral";
}
