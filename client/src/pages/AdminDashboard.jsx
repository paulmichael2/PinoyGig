import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  Crown,
  Eye,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';
import Loader from '../components/Loader';
import { adminAPI } from '../services/api';
import { formatPesoAmount } from '../utils/currency';

const statCards = (stats) => [
  {
    key: 'users',
    label: 'Total users',
    value: stats?.totalUsers || 0,
    icon: Users,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    key: 'online',
    label: 'Online now',
    value: stats?.onlineUsers || 0,
    icon: Wifi,
    tone: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    key: 'gigs',
    label: 'Open gigs',
    value: stats?.openGigs || 0,
    icon: BriefcaseBusiness,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    key: 'tax-balance',
    label: 'Tax balance',
    value: formatPesoAmount(stats?.taxBalance || 0),
    icon: Wallet,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
  },
];

const statusStyles = {
  open: 'bg-emerald-100 text-emerald-700',
  assigned: 'bg-sky-100 text-sky-700',
  completed: 'bg-slate-200 text-slate-700',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingGigId, setDeletingGigId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [gigQuery, setGigQuery] = useState('');

  const loadAdminData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setActionError('');

      const [dashboardResponse, usersResponse, gigsResponse] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        adminAPI.getGigs(),
      ]);

      setStats(dashboardResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setGigs(gigsResponse.data.gigs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      setError(err.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const target = `${user.name} ${user.email} ${user.role}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [userQuery, users]);

  const filteredGigs = useMemo(() => {
    const normalizedQuery = gigQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return gigs;
    }

    return gigs.filter((gig) => {
      const ownerName = gig.owner?.name || '';
      const target = `${gig.title} ${gig.category} ${gig.status} ${ownerName}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [gigQuery, gigs]);

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.name}'s account and all related gigs, bids, chats, and reviews?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user._id);
      setActionError('');
      await adminAPI.deleteUser(user._id);
      await loadAdminData(true);
    } catch (err) {
      console.error('Failed to delete user', err);
      setActionError(err.response?.data?.message || 'Failed to delete the account.');
    } finally {
      setDeletingUserId('');
    }
  };

  const handleDeleteGig = async (gig) => {
    const confirmed = window.confirm(`Delete the gig \"${gig.title}\" and its related bids, chats, and reviews?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingGigId(gig._id);
      setActionError('');
      await adminAPI.deleteGig(gig._id);
      await loadAdminData(true);
    } catch (err) {
      console.error('Failed to delete gig', err);
      setActionError(err.response?.data?.message || 'Failed to delete the gig.');
    } finally {
      setDeletingGigId('');
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f6f4] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(1,93,42,0.09),_transparent_30%),linear-gradient(180deg,#f7faf8_0%,#eef4f0_100%)] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                <Crown className="h-4 w-4" />
                Admin Dashboard
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Admin Control</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review accounts, moderate gig posts, monitor live usage, and track the verified admin tax wallet from a single page.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Verified tax wallet</p>
                  <p className="mt-2 text-3xl font-black text-white">{formatPesoAmount(stats?.taxBalance || 0)}</p>
                </div>
                <ShieldCheck className="h-10 w-10 text-emerald-300" />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Revenue collected: <span className="font-semibold text-white">{formatPesoAmount(stats?.taxRevenue || 0)}</span></p>
                <p>Wallet admin: <span className="font-semibold text-white">{stats?.verifiedWalletAdmin?.name || 'Not configured'}</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards(stats).map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.key} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold opacity-80">{card.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Moderation overview</h2>
                <p className="mt-1 text-sm text-slate-500">Quick health checks for accounts, gigs, and platform activity.</p>
              </div>
              <button
                type="button"
                onClick={() => loadAdminData(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Assigned gigs</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{stats?.assignedGigs || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Completed gigs</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{stats?.completedGigs || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Total bids</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{stats?.totalBids || 0}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Extra features included here: live online-user count from Socket.IO presence, recent account activity, recent gig activity, and search filters for faster moderation.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-bold">Recent activity</h2>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Newest users</p>
                <div className="mt-3 space-y-3">
                  {(stats && users.slice(0, 4)).map((user) => (
                    <div key={user._id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Newest gigs</p>
                <div className="mt-3 space-y-3">
                  {gigs.slice(0, 4).map((gig) => (
                    <div key={gig._id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{gig.title}</p>
                          <p className="text-sm text-slate-500">{gig.owner?.name || 'Unknown owner'}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[gig.status] || 'bg-slate-200 text-slate-700'}`}>
                          {gig.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {actionError}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Accounts</h2>
                  <p className="mt-1 text-sm text-slate-500">View users, see who is online, and remove accounts when required.</p>
                </div>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 sm:max-w-xs"
                />
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const locked = user.role === 'admin' || user.isWalletAdmin;

                  return (
                    <article key={user._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {user.isOnline ? 'Online' : 'Offline'}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                              {user.role}
                            </span>
                            {user.isWalletAdmin && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                Tax wallet admin
                              </span>
                            )}
                          </div>
                          <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            <span>Rating {Number(user.averageRating || 0).toFixed(1)} ({user.totalReviews || 0})</span>
                            <span>Wallet {formatPesoAmount(user.walletBalance || 0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${user._id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={locked || deletingUserId === user._id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingUserId === user._id ? 'Deleting...' : locked ? 'Protected' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No users match the current search.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Gig posts</h2>
                  <p className="mt-1 text-sm text-slate-500">Review and remove gig posts directly from the admin panel.</p>
                </div>
                <input
                  type="text"
                  value={gigQuery}
                  onChange={(event) => setGigQuery(event.target.value)}
                  placeholder="Search gigs"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 sm:max-w-xs"
                />
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {filteredGigs.map((gig) => (
                  <article key={gig._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{gig.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[gig.status] || 'bg-slate-100 text-slate-700'}`}>
                            {gig.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{gig.category}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>Owner {gig.owner?.name || 'Unknown owner'}</span>
                          <span>Budget {formatPesoAmount(gig.budget || 0)}</span>
                          <span>Posted {new Date(gig.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteGig(gig)}
                        disabled={deletingGigId === gig._id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingGigId === gig._id ? 'Deleting...' : 'Delete gig'}
                      </button>
                    </div>
                  </article>
                ))}

                {filteredGigs.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No gigs match the current search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;