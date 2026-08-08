import { motion } from 'framer-motion';
import { AlertTriangle, Check, Database, Download, Library, Server, TrendingUp, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { Tabs } from '../components/ui/Tabs';
import { adminModerationQueue, adminStats, growthAnalytics } from '../data/mockData';

const periods = ['Last 30 Days', 'This Quarter', 'This Year'] as const;

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>('Last 30 Days');
  const [queue, setQueue] = useState(adminModerationQueue);
  const maxValue = Math.max(...growthAnalytics);

  const resolve = (id: string) => setQueue((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Admin Dashboard</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Users size={18} />}
          label="Total Students"
          value={adminStats.totalStudents.toLocaleString()}
          trend="+5% this week"
          trendTone="positive"
        />
        <StatTile
          icon={<Library size={18} />}
          label="Total Materials"
          value={adminStats.totalMaterials.toLocaleString()}
          trend="+2% this week"
          trendTone="positive"
        />
        <StatTile
          icon={<Download size={18} />}
          label="Active Downloads"
          value={adminStats.activeDownloads.toLocaleString()}
          trend="In the last 24h"
        />
        <StatTile
          icon={<AlertTriangle size={18} />}
          label="Pending Approvals"
          value={adminStats.pendingApprovals}
          trend="High priority"
          trendTone="warning"
          highlight
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card hoverable={false}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-md text-on-surface">Growth Analytics</h2>
            <Tabs tabs={periods as unknown as string[]} active={period} onChange={(tab) => setPeriod(tab as (typeof periods)[number])} />
          </div>
          <div className="flex items-end gap-3">
            {growthAnalytics.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / maxValue) * 100}%` }}
                    transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
                    className="w-full rounded-t-md bg-primary-container/60"
                  />
                </div>
                <span className="text-label-sm text-outline">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card hoverable={false}>
          <h2 className="mb-4 text-headline-md text-on-surface">System Health</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-body-sm">
              <span className="flex items-center gap-2 text-on-surface-variant">
                <Server size={16} /> Server
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-label-sm font-medium text-emerald-700">Online</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="flex items-center gap-2 text-on-surface-variant">
                <Database size={16} /> Database
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-label-sm font-medium text-emerald-700">Healthy</span>
            </div>
          </div>

          <h3 className="mb-2 mt-6 text-label-md font-semibold text-on-surface">Recent Logs</h3>
          <ul className="flex flex-col gap-3 text-body-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <TrendingUp size={14} className="shrink-0 text-emerald-600" />
              <span className="flex-1">Moderator A approved Document X</span>
              <span className="shrink-0 text-label-sm text-outline">10 mins ago</span>
            </li>
            <li className="flex items-center gap-2">
              <Server size={14} className="shrink-0 text-outline" />
              <span className="flex-1">System backup completed</span>
              <span className="shrink-0 text-label-sm text-outline">1 hr ago</span>
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-error" />
              <span className="flex-1">Failed login attempt (Admin)</span>
              <span className="shrink-0 text-label-sm text-outline">3 hrs ago</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card hoverable={false} padded={false}>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="flex items-center gap-2 text-headline-md text-on-surface">
            Content Moderation Queue
            <span className="rounded-full bg-tertiary-container/20 px-2.5 py-0.5 text-label-sm font-medium text-tertiary">
              {queue.length} Pending
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-body-sm">
            <thead>
              <tr className="border-y border-card-border text-label-sm text-on-surface-variant">
                <th className="px-6 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Uploader</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-6 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b border-card-border last:border-b-0">
                  <td className="px-6 py-3 font-medium text-on-surface">{item.title}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{item.uploader}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{item.date}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{item.subject}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-tertiary-container/20 px-2.5 py-0.5 text-label-sm font-medium text-tertiary">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Approve ${item.title}`}
                        onClick={() => resolve(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Reject ${item.title}`}
                        onClick={() => resolve(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-error-container text-error hover:bg-error-container/80 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                    No items awaiting moderation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
