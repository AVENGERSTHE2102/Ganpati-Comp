import Link from "next/link";
import Image from "next/image";
import config from "@/config/site.config";
import { Mandala } from "@/app/components/Decor";

export default function Competitions() {
  return (
    <main>
      <section className="page-hero">
        <Mandala className="page-hero-mandala" />
        <div className="container">
          <p className="eyebrow gold">स्पर्धा · Competitions</p>
          <h1>Celebrate Bappa your way</h1>
          <p>Four categories, one festival. Here&apos;s what each one is about.</p>
        </div>
      </section>

      <div className="container section">
        {config.categories.map((c, i) => (
          <section key={c.key} className={`feature reveal ${i % 2 ? "flip" : ""}`}>
            <div className="feature-art">
              <Image src={c.image} alt={c.label} fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
            <div className="feature-copy">
              <span className="feature-num">0{i + 1}</span>
              <p className="deva cat-mr">{c.marathi}</p>
              <h2>{c.label}</h2>
              <p>{c.description}</p>
              <p className="muted">{c.instructions}</p>
              <Link className="btn" href={`/vote?c=${c.key}`}>View &amp; vote →</Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
