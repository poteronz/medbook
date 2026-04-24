export default function SectionHeading({ eyebrow, title, description, align = "left", action = null }) {
  const alignmentClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignmentClass}`}>
      {eyebrow && <span className="section-kicker">{eyebrow}</span>}
      <div className={`flex flex-col gap-3 ${align === "center" ? "items-center" : "items-start"} md:flex-row md:justify-between md:w-full md:gap-6`}>
        <div className={align === "center" ? "max-w-2xl" : "max-w-3xl"}>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">{title}</h2>
          {description && <p className="mt-3 text-base md:text-lg text-slate-600 leading-relaxed">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
