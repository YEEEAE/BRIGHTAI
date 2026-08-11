import { getDb } from './db';
import { getEmployeeWorkload } from './workload';
import type { AssignmentRecommendation, TaskPriority } from './types';

function skillsOf(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).map((s) => s.toLowerCase()) : Object.keys(parsed).map((s) => s.toLowerCase());
  } catch { return []; }
}

export function suggestTaskAssignees(task: { department: string; taskType?: string | null; priority?: TaskPriority | null }, db = getDb()): AssignmentRecommendation[] {
  const users = db.prepare("SELECT id, full_name, department, skills_json FROM users WHERE role = 'employee' AND is_active = 1").all() as any[];
  const requestedSkills = [task.taskType, task.priority].filter(Boolean).map((v) => String(v).toLowerCase());
  return users.map((user) => {
    const workload = getEmployeeWorkload(user.id, db) as any;
    const skills = skillsOf(user.skills_json);
    const sameDepartment = user.department === task.department;
    const matchingSkills = requestedSkills.filter((skill) => skills.includes(skill)).length;
    const strongHistory = workload.completion_rate >= 80;
    const noCriticalSla = workload.critical === 0;
    const score = Math.max(0, Math.round(100 - workload.workload_score + (sameDepartment ? 18 : 0) + matchingSkills * 12 + (strongHistory ? 10 : 0) + (noCriticalSla ? 8 : -8)));
    const whyRecommended = [
      ...(workload.workload_score < 30 ? ['Low workload'] : []),
      ...(sameDepartment ? ['Same department'] : []),
      ...(matchingSkills ? ['Matching skills'] : []),
      ...(strongHistory ? ['Strong completion history'] : []),
      ...(noCriticalSla ? ['No critical SLA'] : []),
    ];
    return { user_id: user.id, full_name: user.full_name, score, factors: { workload: workload.workload_score, department: sameDepartment ? 1 : 0, skills: matchingSkills, completion_history: strongHistory ? 1 : 0, sla_pressure: workload.critical }, whyRecommended, workload };
  }).sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name)).slice(0, 3);
}
