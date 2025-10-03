import { listAuditEvents } from "@/lib/audit-log"

export async function AuditFeed({ orgId }: { orgId: string }) {
  const events = listAuditEvents(orgId, 10)

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 p-4 text-sm text-muted-foreground">
        No orchestration activity recorded yet.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{event.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Actor: {event.actor}
              {event.target ? ` • Target: ${event.target}` : null}
            </div>
            {event.metadata ? (
              <pre className="overflow-auto rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
