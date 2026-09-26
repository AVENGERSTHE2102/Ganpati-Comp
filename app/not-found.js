import Link from "next/link";
import { Mandala, Petals, Diya } from "@/app/components/Decor";

export const metadata = { title: "Page not found · Ganpati Agman 2026" };

export default function NotFound() {
  return (
    <main className="notfound">
      <Petals />
      <Mandala className="notfound-mandala" />
      <div className="notfound-inner">
        <p className="notfound-code">
          4<Diya className="notfound-diya" />4
        </p>
        <h1 className="deva">अरेरे! वाट चुकली</h1>
        <p>Looks like this page went for visarjan. Even Bappa&apos;s mooshak couldn&apos;t find it.</p>
        <div className="hero-ctas">
          <Link className="btn btn-lg" href="/">Back to home</Link>
          <Link className="btn btn-ghost btn-lg" href="/vote">Go to voting</Link>
        </div>
      </div>
    </main>
  );
}
