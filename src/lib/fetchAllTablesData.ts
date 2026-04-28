import prisma from "@/lib/prismaClient";

export async function fetchAllTablesData() {
  // Fetch all data from each table/model
  const achievements = await prisma.achievement_content.findMany();
  const activities = await prisma.activities.findMany();
  const debateScores = await prisma.debate_scores.findMany();
  const joinUs = await prisma.join_us.findMany();
  const leaderboardStats = await prisma.leaderboard_stats.findMany();
  const memberCVProfiles = await prisma.member_cv_profiles.findMany();
  const paperAuthors = await prisma.paper_authors.findMany();
  const publications = await prisma.publications.findMany();
  const researchPapers = await prisma.research_papers.findMany();
  const researchProjectMembers = await prisma.research_project_members.findMany();
  const researchProjects = await prisma.research_projects.findMany();
  const sessionContent = await prisma.session_content.findMany();
  const srlSessions = await prisma.srl_sessions.findMany();
  const studentsDetails = await prisma.students_details.findMany();
  const timelineEntries = await prisma.timeline_entries.findMany();

  return {
    achievements,
    activities,
    debateScores,
    joinUs,
    leaderboardStats,
    memberCVProfiles,
    paperAuthors,
    publications,
    researchPapers,
    researchProjectMembers,
    researchProjects,
    sessionContent,
    srlSessions,
    studentsDetails,
    timelineEntries,
  };
}
