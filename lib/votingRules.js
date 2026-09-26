import { database } from "@/lib/mongodb";
import config from "@/config/site.config";

/**
 * Friendly pre-check; the unique index on votes (voterEmail, category) is
 * the real enforcement for "one_per_category" (see db/database.js README
 * note — matching index must be created for whichever rule is active).
 */
export async function checkVoteAllowed(voterEmail, category) {
  const rule = config.votingRule;
  const db = await database();

  if (rule === "one_per_category") {
    const existing = await db.collection("votes").findOne({ voterEmail, category });
    return existing ? "You have already voted in this category." : null;
  }

  if (rule === "one_total") {
    const existing = await db.collection("votes").findOne({ voterEmail });
    return existing ? "You have already used your one vote for this competition." : null;
  }

  if (rule === "unlimited") {
    return null; // uniqueness per submission enforced by the unique index instead
  }

  return "Voting is not configured correctly. Please contact the Marathi Club team.";
}
