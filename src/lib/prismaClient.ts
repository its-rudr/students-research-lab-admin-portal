// NOTE: Prisma should not be used in the browser!
// This is a stub to prevent import errors.
// All database queries should go through the backend API instead.

const stubPrisma = {
  students_details: { findMany: async () => [] },
  leaderboard_stats: { findMany: async () => [] },
  attendance: { findMany: async () => [] },
  debate_scores: { findMany: async () => [] },
  activities: { findMany: async () => [] },
};

export default stubPrisma;
