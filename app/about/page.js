import Image from "next/image";
import config from "@/config/site.config";
import { Mandala, LotusDivider } from "@/app/components/Decor";

export default function About() {
  return (
    <main>
      <section className="page-hero">
        <Mandala className="page-hero-mandala" />
        <div className="container">
          <p className="eyebrow gold">आमच्याबद्दल · About</p>
          <h1>The {config.clubName}</h1>
        </div>
      </section>

      <div className="container section">
        <section className="feature reveal">
          <div className="feature-art tall">
            <Image src="/images/about-ganesha.jpg" alt="Tulshibaug Ganpati, Pune" fill sizes="(max-width: 800px) 100vw, 50vw" />
          </div>
          <div className="feature-copy">
            <p className="deva cat-mr">आपला उत्सव</p>
            <h2>Our festival, our people</h2>
            <p>{config.aboutClub}</p>
            <blockquote className="quote deva">
              वक्रतुंड महाकाय सूर्यकोटि समप्रभ ।<br />
              निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥
            </blockquote>
            <p className="muted">Questions about {config.competitionName}? Reach out to any {config.clubName} core-team member.</p>
          </div>
        </section>

        <LotusDivider />

        <section id="credits" className="credits reveal">
          <h2>Photo credits</h2>
          <ul>
            {config.photoCredits.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer">{c.what}</a> — {c.author}, {c.license}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
