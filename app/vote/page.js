import config from "@/config/site.config";
import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import { Mandala } from "@/app/components/Decor";
import VoteClient from "./VoteClient";
import staticSubmissions from "@/data/submissions.json";

export const dynamic = "force-dynamic";

export default async function VotePage({ searchParams }) {
  const { c } = await searchParams;
  const session = await auth();
  const voterEmail = session?.user?.email?.toLowerCase() || null;

  const db = await database().catch(() => null);
  // Submissions directly hardcoded from staticSubmissions (verified 34 entries from CSV & media)
  const submissions = staticSubmissions;

  const votes = config.showVoteCountsPublicly && db
    ? await db.collection("votes").aggregate([{ $group: { _id: "$submissionId", n: { $sum: 1 } } }]).toArray().catch(() => [])
    : [];
  const voteCounts = Object.fromEntries(votes.map((v) => [v._id.toString(), v.n]));
  const myVotes = voterEmail && db ? await db.collection("votes").find({ voterEmail }).toArray().catch(() => []) : [];

  return (
    <main>
      <section className="page-hero">
        <Mandala className="page-hero-mandala" />
        <div className="container">
          <p className="eyebrow gold">मतदान · Voting</p>
          <h1>Choose your favourites</h1>
          <p>One vote in each category. Tap an entry to see it up close.</p>
        </div>
      </section>
      <div className="container section">
        <VoteClient
          submissions={submissions.map(({ _id, createdAt, updatedAt, ...s }) => ({
            id: _id ? _id.toString() : s.id,
            ...s,
          }))}
          categories={config.categories.map(({ key, label, marathi }) => ({ key, label, marathi }))}
          voteCounts={voteCounts}
          showVoteCounts={config.showVoteCountsPublicly}
          pastDeadline={Date.now() > new Date(config.votingDeadline).getTime()}
          voterEmail={voterEmail}
          initialVotes={Object.fromEntries(myVotes.map((v) => [v.category, v.submissionId.toString()]))}
          initialCategory={config.categories.some((x) => x.key === c) ? c : config.categories[0].key}
        />
      </div>
    </main>
  );
}
