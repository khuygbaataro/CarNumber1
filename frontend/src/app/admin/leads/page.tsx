'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Lead } from '@/types';
import { t } from '@/lib/labels';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    adminApi
      .listLeads()
      .then(setLeads)
      .catch(() => setError(t.admin.leads.loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (lead: Lead) => {
    setBusyId(lead._id);
    const next = lead.status === 'new' ? 'contacted' : 'new';
    try {
      const updated = await adminApi.setLeadStatus(lead._id, next);
      setLeads((list) => list.map((x) => (x._id === lead._id ? updated : x)));
    } catch {
      /* ignore */
    } finally {
      setBusyId('');
    }
  };

  const remove = async (lead: Lead) => {
    if (!window.confirm(t.admin.leads.confirmDelete)) return;
    setBusyId(lead._id);
    try {
      await adminApi.deleteLead(lead._id);
      setLeads((list) => list.filter((x) => x._id !== lead._id));
    } catch {
      /* ignore */
    } finally {
      setBusyId('');
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {t.admin.leads.title}
        {newCount > 0 && (
          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-sm font-semibold text-white">
            {newCount}
          </span>
        )}
      </h1>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <p className="p-6 text-center text-gray-500">{t.common.loading}</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-center text-gray-500">{t.admin.leads.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t.admin.leads.colName}</th>
                  <th className="px-4 py-3">{t.admin.leads.colPhone}</th>
                  <th className="px-4 py-3">{t.admin.leads.colVehicle}</th>
                  <th className="px-4 py-3">{t.admin.leads.colMessage}</th>
                  <th className="px-4 py-3">{t.admin.leads.colDate}</th>
                  <th className="px-4 py-3">{t.admin.leads.colStatus}</th>
                  <th className="px-4 py-3 text-right">{t.admin.leads.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className={lead.status === 'new' ? 'bg-blue-50/40' : ''}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.phone}`} className="text-brand hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.vehicleName || '—'}</td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      <span className="line-clamp-2">{lead.message || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {fmtDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === lead._id}
                        onClick={() => toggleStatus(lead)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          lead.status === 'new'
                            ? 'bg-accent/10 text-accent hover:bg-accent/20'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {lead.status === 'new'
                          ? t.admin.leads.statusNew
                          : t.admin.leads.statusContacted}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === lead._id}
                        onClick={() => remove(lead)}
                        className="rounded-md border border-accent/30 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
                      >
                        {t.admin.leads.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
