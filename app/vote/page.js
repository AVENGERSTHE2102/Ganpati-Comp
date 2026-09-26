import config from "@/config/site.config";
import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import { Mandala } from "@/app/components/Decor";
import VoteClient from "./VoteClient";

export const dynamic = "force-dynamic";

export default async function VotePage({ searchParams }) {
  const { c } = await searchParams;
  const session = await auth();
  const voterEmail = session?.user?.email?.toLowerCase() || null;

  const db = await database();
  const submissions = await db.collection("submissions").find({ status: "approved" }).sort({ createdAt: -1 }).toArray();
  const votes = config.showVoteCountsPublicly
    ? await db.collection("votes").aggregate([{ $group: { _id: "$submissionId", n: { $sum: 1 } } }]).toArray()
    : [];
  const voteCounts = Object.fromEntries(votes.map((v) => [v._id.toString(), v.n]));
  const myVotes = voterEmail ? await db.collection("votes").find({ voterEmail }).toArray() : [];

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
          submissions={submissions.map(({ _id, createdAt, updatedAt, email, collegeId, ...s }) => ({ id: _id.toString(), ...s }))}
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
