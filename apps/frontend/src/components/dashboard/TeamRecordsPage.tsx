"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/RecentDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

type TeamSection = "team/members" | "team/roles" | "team/activity";

type TeamUser = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isActive: boolean;
};

type TeamTask = {
  id: string;
  assigneeId: string;
  title: string;
  description?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  dueDate?: string | null;
  createdAt: string;
  assignee?: TeamUser;
  latestReport?: {
    report: string;
    status: "OPEN" | "IN_PROGRESS" | "DONE";
    submittedAt: string;
    submittedBy: string | null;
  } | null;
};

type ActivityLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

const sectionCopy: Record<TeamSection, { eyebrow: string; title: string; description: string }> = {
  "team/members": {
    eyebrow: "Team management",
    title: "Team members",
    description: "Add admins and members, track active status, and manage access for this company.",
  },
  "team/roles": {
    eyebrow: "Roles and permissions",
    title: "Roles and assignments",
    description: "Review company roles and assign work to the right member.",
  },
  "team/activity": {
    eyebrow: "Activity logs",
    title: "Workspace activity",
    description: "Review team activity and task ownership from one place.",
  },
};

const queryClient = new QueryClient();

export function TeamRecordsPage({ section }: { section: TeamSection }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TeamRecordsContent section={section} />
    </QueryClientProvider>
  );
}

function TeamRecordsContent({ section }: { section: TeamSection }) {
  const copy = sectionCopy[section];
  const [userForm, setUserForm] = useState({
    email: "",
    role: "MEMBER",
    password: "",
    isActive: "true",
  });
  const [taskForm, setTaskForm] = useState({
    assigneeId: "",
    title: "",
    description: "",
    status: "OPEN",
    dueDate: "",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [userError, setUserError] = useState("");
  const [taskError, setTaskError] = useState("");

  const usersQuery = useQuery({
    queryKey: ["team-users"],
    queryFn: async () => (await api.get<TeamUser[]>("/team/users")).data,
  });
  const tasksQuery = useQuery({
    queryKey: ["team-tasks"],
    queryFn: async () => (await api.get<TeamTask[]>("/team/tasks")).data,
  });
  const activityQuery = useQuery({
    queryKey: ["team-activity"],
    queryFn: async () => (await api.get<ActivityLog[]>("/activity-log")).data,
    enabled: section === "team/activity",
  });

  const users = usersQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const activities = activityQuery.data ?? [];
  const visibleUsers = useMemo(() => {
    if (section === "team/roles") {
      return [...users].sort((a, b) => a.role.localeCompare(b.role));
    }

    return users;
  }, [section, users]);

  const refreshTeam = () => {
    usersQuery.refetch();
    tasksQuery.refetch();
  };

  const saveUser = useMutation({
    mutationFn: async () => {
      const payload = {
        email: userForm.email,
        role: userForm.role,
        password: userForm.password || undefined,
        isActive: userForm.isActive === "true",
      };

      if (editingUserId) {
        return api.patch(`/team/users/${editingUserId}`, payload);
      }

      return api.post("/team/users", payload);
    },
    onMutate: () => {
      setUserError("");
    },
    onSuccess: () => {
      setUserForm({ email: "", role: "MEMBER", password: "", isActive: "true" });
      setEditingUserId(null);
      refreshTeam();
    },
    onError: (error) => {
      setUserError(readApiError(error, "Could not save this team member."));
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (user: TeamUser) => api.delete(`/team/users/${user.id}`),
    onSuccess: () => refreshTeam(),
    onError: (error) => {
      setUserError(readApiError(error, "Could not delete this team member."));
    },
  });

  const saveTask = useMutation({
    mutationFn: async () => {
      const payload = {
        assigneeId: taskForm.assigneeId,
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        dueDate: taskForm.dueDate || null,
      };

      if (editingTaskId) {
        return api.patch(`/team/tasks/${editingTaskId}`, payload);
      }

      return api.post("/team/tasks", payload);
    },
    onMutate: () => {
      setTaskError("");
    },
    onSuccess: () => {
      setTaskForm({ assigneeId: "", title: "", description: "", status: "OPEN", dueDate: "" });
      setEditingTaskId(null);
      refreshTeam();
    },
    onError: (error) => {
      setTaskError(readApiError(error, "Could not save this task assignment."));
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (task: TeamTask) => api.delete(`/team/tasks/${task.id}`),
    onSuccess: () => refreshTeam(),
    onError: (error) => {
      setTaskError(readApiError(error, "Could not delete this task assignment."));
    },
  });

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveUser.mutate();
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveTask.mutate();
  }

  function editUser(user: TeamUser) {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email,
      role: user.role,
      password: "",
      isActive: String(user.isActive),
    });
  }

  function editTask(task: TeamTask) {
    setEditingTaskId(task.id);
    setTaskForm({
      assigneeId: task.assigneeId,
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
  }

  return (
    <DashboardShell active="Team">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.description}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Total users" value={String(users.length)} />
          <Metric label="Active users" value={String(users.filter((user) => user.isActive).length)} />
          <Metric label="Open tasks" value={String(tasks.filter((task) => task.status !== "DONE").length)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <form onSubmit={submitUser} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">
              {editingUserId ? "Edit team user" : "Add admin or member"}
            </h2>
            <div className="mt-5 grid gap-4">
              <Field label="Email">
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((form) => ({ ...form, email: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Role">
                <Select
                  value={userForm.role}
                  onChange={(event) => setUserForm((form) => ({ ...form, role: event.target.value }))}
                  options={[
                    { value: "MEMBER", label: "Member" },
                    { value: "ADMIN", label: "Admin" },
                  ]}
                />
              </Field>
              <Field label="Active status">
                <Select
                  value={userForm.isActive}
                  onChange={(event) => setUserForm((form) => ({ ...form, isActive: event.target.value }))}
                  options={[
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]}
                />
              </Field>
              <Field label="Temporary password">
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((form) => ({ ...form, password: event.target.value }))}
                  placeholder={editingUserId ? "Leave blank to keep password" : "Optional"}
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveUser.isPending}>
                  {saveUser.isPending ? "Saving..." : editingUserId ? "Update user" : "Add user"}
                </Button>
                {editingUserId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingUserId(null);
                      setUserForm({ email: "", role: "MEMBER", password: "", isActive: "true" });
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              {userError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {userError}
                </p>
              ) : null}
            </div>
          </form>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Team users</h2>
              <p className="mt-1 text-sm text-slate-500">
                Owners, admins, members, and active status for this company.
              </p>
            </div>
            {usersQuery.isLoading ? (
              <div className="p-5 text-sm text-slate-500">Loading team users...</div>
            ) : visibleUsers.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No team users found" description="Add an admin or member to start building your team." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-5 py-4 font-semibold">{user.email}</td>
                        <td className="px-5 py-4">{user.role}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editUser(user)}
                              className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser.mutate(user)}
                              disabled={user.role === "OWNER" || deleteUser.isPending}
                              className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <form onSubmit={submitTask} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">
              {editingTaskId ? "Edit assigned task" : "Assign task to member"}
            </h2>
            <div className="mt-5 grid gap-4">
              <Field label="Member">
                <Select
                  value={taskForm.assigneeId}
                  onChange={(event) => setTaskForm((form) => ({ ...form, assigneeId: event.target.value }))}
                  options={[
                    { value: "", label: "Select member" },
                    ...users
                      .filter((user) => user.isActive && user.role !== "OWNER")
                      .map((user) => ({ value: user.id, label: `${user.email} (${user.role})` })),
                  ]}
                />
              </Field>
              <Field label="Task title">
                <Input
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((form) => ({ ...form, title: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Description">
                <Input
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((form) => ({ ...form, description: event.target.value }))}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={taskForm.status}
                  onChange={(event) => setTaskForm((form) => ({ ...form, status: event.target.value }))}
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "DONE", label: "Done" },
                  ]}
                />
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((form) => ({ ...form, dueDate: event.target.value }))}
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveTask.isPending || !taskForm.assigneeId}>
                  {saveTask.isPending ? "Saving..." : editingTaskId ? "Update task" : "Assign task"}
                </Button>
                {editingTaskId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingTaskId(null);
                      setTaskForm({ assigneeId: "", title: "", description: "", status: "OPEN", dueDate: "" });
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              {taskError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {taskError}
                </p>
              ) : null}
            </div>
          </form>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Assigned tasks</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tasks assigned by the company owner to active team members.
              </p>
            </div>
            {tasks.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No tasks assigned" description="Assign a task to an admin or member to track ownership." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <div key={task.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {task.assignee?.email ?? task.assigneeId} - Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "not set"}
                      </p>
                      {task.description ? (
                        <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                      ) : null}
                      {task.latestReport ? (
                        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Latest member report - {new Date(task.latestReport.submittedAt).toLocaleString()}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{task.latestReport.report}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <button
                        type="button"
                        onClick={() => editTask(task)}
                        className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask.mutate(task)}
                        disabled={deleteTask.isPending}
                        className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        {section === "team/activity" ? (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Activity records</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest company activity from the audit log.
              </p>
            </div>
            {activities.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No activity found" description="Activity appears here after workspace records change." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map((activity) => (
                  <div key={activity.id} className="px-5 py-4">
                    <p className="font-semibold">{activity.action.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.entityType} {activity.entityId.slice(0, 8)} - {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function readApiError(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? fallback;
    if (data.message) return data.message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
