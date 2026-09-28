import { auth } from "@/auth";
import { database, toId } from "@/lib/mongodb";
import { checkVoteAllowed } from "@/lib/votingRules";
import config from "@/config/site.config";

import staticSubmissions from "@/data/submissions.json";

export async function POST(request) {
  const session = await auth();
  const voterEmail = session?.user?.email?.toLowerCase();
  if (!voterEmail) return Response.json({ error: "Sign in with Google to vote." }, { status: 401 });

  if (Date.now() > new Date(config.votingDeadline).getTime()) {
    return Response.json({ error: "Voting has closed." }, { status: 400 });
  }

  const { submissionId } = await request.json();
  if (!submissionId) return Response.json({ error: "submissionId is required." }, { status: 400 });

  const db = await database().catch(() => null);
  let submission = null;
  if (db) {
    let mongoId;
    try {
      mongoId = toId(submissionId);
    } catch {
      mongoId = submissionId;
    }
    submission = await db
      .collection("submissions")
      .findOne({
        $or: [{ _id: mongoId }, { id: submissionId }, { submissionCode: submissionId }],
        status: "approved",
      })
      .catch(() => null);
  }
  if (!submission) {
    submission = staticSubmissions.find(
      (s) => s.id === submissionId || s._id === submissionId || s.submissionCode === submissionId
    );
  }
  if (!submission) return Response.json({ error: "Entry not found." }, { status: 404 });

  const blocked = await checkVoteAllowed(voterEmail, submission.category);
  if (blocked) return Response.json({ error: blocked }, { status: 409 });

  if (!db) {
    return Response.json({ error: "Database temporarily unavailable. Please try again shortly." }, { status: 503 });
  }

  const targetId = toId(submission._id || submission.id);

  try {
    await db.collection("votes").insertOne({
      voterEmail,
      submissionId: targetId,
      category: submission.category,
      createdAt: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) return Response.json({ error: "You have already voted in this category." }, { status: 409 });
    throw err;
  }

  return Response.json({ ok: true, message: "Vote recorded — thank you!" });
}
