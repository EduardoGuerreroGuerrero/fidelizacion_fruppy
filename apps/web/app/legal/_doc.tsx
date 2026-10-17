// Render compartido para las páginas legales del sitio público.
export type LegalSection = { title: string; body: string };

export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <article>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-xs text-ink-soft">
        Última actualización: {updated}
      </p>
      {intro && (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{intro}</p>
      )}
      <div className="mt-8 space-y-6">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-sm font-bold text-ink">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
