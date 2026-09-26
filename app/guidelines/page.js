import config from "@/config/site.config";
import { Mandala, LotusDivider } from "@/app/components/Decor";

function fmt(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export default function Guidelines() {
  const g = config.guidelines;
  const timeline = [
    ["🌺", "Entries collected", `Until ${fmt(config.submissionDeadline)}`],
    ["🪔", "Voting open", "Sign in with Google and vote"],
    ["🏆", "Voting closes", fmt(config.votingDeadline)],
    ["🎉", "Winners announced", "On Marathi Club channels"],
  ];
  const groups = [
    ["🙏", "Who can take part", [g.whoCanParticipate]],
    ["📸", "Entries", g.submissionRules],
    ["🗳️", "Voting", g.votingRules],
    ["📜", "General", g.generalInstructions],
  ];

  return (
    <main>
      <section className="page-hero">
        <Mandala className="page-hero-mandala" />
        <div className="container">
          <p className="eyebrow gold">नियमावली · Guidelines</p>
          <h1>How it all works</h1>
          <p>Simple rules so everyone gets a fair chance.</p>
        </div>
      </section>

      <div className="container section">
        <ol className="timeline reveal">
          {timeline.map(([icon, title, sub]) => (
            <li key={title}>
              <span className="timeline-dot">{icon}</span>
              <h3>{title}</h3>
              <p className="muted">{sub}</p>
            </li>
          ))}
        </ol>

        <LotusDivider />

        <div className="rule-grid">
          {groups.map(([icon, title, items]) => (
            <article key={title} className="rule-card reveal">
              <span className="rule-icon">{icon}</span>
              <h2>{title}</h2>
              <ul>{items.map((r) => <li key={r}>{r}</li>)}</ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
