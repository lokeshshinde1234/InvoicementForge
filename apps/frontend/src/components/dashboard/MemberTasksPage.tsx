"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/RecentDocuments";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";

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
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  assignee?: TeamUser;
  latestReport?: {
    report: string;
    status: TaskStatus;
    submittedAt: string;
    submittedBy: string | null;
  } | null;
};

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

export function MemberTasksPage() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, { status: TaskStatus; report: string }>>({});

  useEffect(() => {
    let active = true;

    api
      .get<TeamTask[]>("/team/my-tasks")
      .then((response) => {
        if (!active) return;
        setTasks(response.data);
        setForms(
          Object.fromEntries(
            response.data.map((task) => [
              task.id,
              { status: task.status, report: "" },
            ]),
          ),
        );
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(readApiError(requestError, "Could not load your assigned tasks."));
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(
    () => ({
      total: tasks.length,
      open: tasks.filter((task) => task.status !== "DONE").length,
      overdue: tasks.filter((task) => isOverdue(task)).length,
    }),
    [tasks],
  );

  async function submitReport(event: FormEvent<HTMLFormElement>, task: TeamTask) {
    event.preventDefault();
    setError("");
    setSavingTaskId(task.id);

    try {
      const form = forms[task.id] ?? { status: task.status, report: "" };
      const response = await api.post<TeamTask>(`/team/my-tasks/${task.id}/report`, {
        status: form.status,
        report: form.report,
      });

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? response.data : item)),
      );
      setForms((currentForms) => ({
        ...currentForms,
        [task.id]: { status: response.data.status, report: "" },
      }));
    } catch (requestError) {
      setError(readApiError(requestError, "Could not submit this task report."));
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <DashboardShell active="My Tasks">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Member workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            My assigned tasks
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review work assigned by your company owner, update progress, and send timely reports back to the company.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Assigned tasks" value={String(metrics.total)} />
          <Metric label="Open work" value={String(metrics.open)} />
          <Metric label="Overdue" value={String(metrics.overdue)} />
        </section>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">Task queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a short report whenever progress changes or work is completed.
            </p>
          </div>

          {status === "loading" ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : status === "error" ? (
            <div className="p-5">
              <EmptyState title="Could not load tasks" description="Please refresh this page or sign in again." />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No tasks assigned" description="Assigned company tasks will appear here." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const form = forms[task.id] ?? { status: task.status, report: "" };

                return (
                  <article key={task.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">{task.title}</h3>
                        <StatusBadge status={task.status} />
                        {isOverdue(task) ? <StatusBadge status="OVERDUE" /> : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "not set"}
                      </p>
                      {task.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700">{task.description}</p>
                      ) : null}
                      {task.latestReport ? (
                        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Latest report - {new Date(task.latestReport.submittedAt).toLocaleString()}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{task.latestReport.report}</p>
                        </div>
                      ) : null}
                    </div>

                    <form onSubmit={(event) => submitReport(event, task)} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Progress status
                        <Select
                          value={form.status}
                          onChange={(event) =>
                            setForms((currentForms) => ({
                              ...currentForms,
                              [task.id]: { ...form, status: event.target.value as TaskStatus },
                            }))
                          }
                          options={statusOptions}
                        />
                      </label>
                      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                        Report to company
                        <textarea
                          required
                          value={form.report}
                          onChange={(event) =>
                            setForms((currentForms) => ({
                              ...currentForms,
                              [task.id]: { ...form, report: event.target.value },
                            }))
                          }
                          placeholder="Write progress, blockers, completion notes, or next steps."
                          className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none transition focus:ring-2 focus:ring-cyan-500"
                        />
                      </label>
                      <Button type="submit" className="mt-4 w-full" disabled={savingTaskId === task.id}>
                        {savingTaskId === task.id ? "Submitting..." : "Submit report"}
                      </Button>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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

function isOverdue(task: TeamTask): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime() < Date.now();
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
