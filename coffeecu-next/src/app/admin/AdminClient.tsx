'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Eye, EyeOff, Ban, Trash2, Clock, User } from 'lucide-react';
import type { FullProfile } from '@/types';

interface Props {
  currentUserId: string;
  profiles: FullProfile[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

type Tab = 'profiles' | 'lookup' | 'roles';

export default function AdminClient({ currentUserId, profiles: initialProfiles, isAdmin, isSuperAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState(initialProfiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // User lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<null | {
    profile: FullProfile | null;
    meetingsSent: { receiver_id: string; created_at: string }[];
    meetingsReceived: { sender_id: string; created_at: string }[];
    isSuspended: boolean;
    isBlacklisted: boolean;
  }>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.uni ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // ——— Admin actions ———
  const handleToggleVisible = async (profile: FullProfile) => {
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/toggle-visible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, isVisible: !profile.is_visible }),
    });
    if (res.ok) {
      setProfiles(prev => prev.map(p =>
        p.id === profile.id ? { ...p, is_visible: !p.is_visible } : p
      ));
      showMessage(`${profile.name}'s profile ${profile.is_visible ? 'hidden' : 'restored'}.`);
    } else {
      showMessage('Action failed. Please try again.');
    }
    setActionLoading(null);
  };

  const handleRemove = async (profile: FullProfile) => {
    if (!isAdmin) return;
    if (!confirm(`Permanently remove ${profile.name}'s profile? This cannot be undone.`)) return;
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    if (res.ok) {
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      showMessage(`${profile.name}'s profile removed.`);
    } else {
      showMessage('Remove failed. Please try again.');
    }
    setActionLoading(null);
  };

  const handleBan = async (profile: FullProfile) => {
    if (!isAdmin) return;
    const reason = prompt(`Reason for banning ${profile.name}:`);
    if (reason === null) return;
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id, reason }),
    });
    if (res.ok) {
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      showMessage(`${profile.name} has been banned.`);
    } else {
      showMessage('Ban failed. Please try again.');
    }
    setActionLoading(null);
  };

  const handleSuspend = async (profile: FullProfile) => {
    const hours = prompt(`Suspend ${profile.name} from sending requests for how many hours? (leave blank for indefinite)`);
    if (hours === null) return;
    const suspendedUntil = hours
      ? new Date(Date.now() + parseInt(hours) * 3600 * 1000).toISOString()
      : null;
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id, suspendedUntil, reason: `Suspended by admin` }),
    });
    showMessage(res.ok ? `${profile.name} suspended.` : 'Suspend failed.');
    setActionLoading(null);
  };

  // ——— User lookup ———
  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    const res = await fetch(`/api/admin/user-lookup?q=${encodeURIComponent(lookupQuery.trim())}`);
    if (res.ok) {
      setLookupResult(await res.json());
    }
    setLookupLoading(false);
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-mist)', marginBottom: '2rem' }}>
        {[
          { id: 'profiles' as Tab, label: 'All Profiles' },
          { id: 'lookup' as Tab, label: 'User Lookup' },
          ...(isSuperAdmin ? [{ id: 'roles' as Tab, label: 'Role Management' }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="label-mono"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-columbia)' : '2px solid transparent',
              marginBottom: '-2px',
              padding: '0.75rem 1.25rem',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--color-columbia)' : 'var(--color-text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="status-banner status-published" style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      {/* ——— PROFILES TAB ——— */}
      {activeTab === 'profiles' && (
        <div>
          <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '1.5rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="search"
              className="form-input"
              placeholder="Search by name, email, UNI…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
            />
          </div>

          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: profile.is_visible ? 'var(--color-limestone-dk)' : 'var(--color-limestone-md)',
                  border: '1px solid var(--color-mist)',
                  borderRadius: '4px',
                  padding: '0.875rem 1rem',
                  opacity: profile.is_visible ? 1 : 0.7,
                }}
              >
                {/* Photo */}
                <div style={{ width: '44px', height: '56px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <Image src={profile.image_url} alt={profile.name} fill style={{ objectFit: 'cover' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>
                    {profile.name}
                    {!profile.is_visible && (
                      <span className="label-mono" style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)' }}>HIDDEN</span>
                    )}
                  </p>
                  <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
                    {profile.email} · {profile.school} · {profile.year}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {/* Mods can hide/unhide */}
                  <button
                    onClick={() => handleToggleVisible(profile)}
                    disabled={actionLoading === profile.id}
                    title={profile.is_visible ? 'Hide profile' : 'Restore profile'}
                    className="btn-ghost"
                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.65rem' }}
                  >
                    {profile.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  {/* Suspend — mods and above */}
                  <button
                    onClick={() => handleSuspend(profile)}
                    disabled={actionLoading === profile.id}
                    title="Suspend from sending requests"
                    className="btn-ghost"
                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.65rem' }}
                  >
                    <Clock size={13} />
                  </button>

                  {/* Admin-only: permanent remove + ban */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleRemove(profile)}
                        disabled={actionLoading === profile.id}
                        title="Remove profile permanently"
                        className="btn-danger"
                        style={{ padding: '0.375rem 0.625rem', fontSize: '0.65rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => handleBan(profile)}
                        disabled={actionLoading === profile.id}
                        title="Ban user"
                        className="btn-danger"
                        style={{ padding: '0.375rem 0.625rem', fontSize: '0.65rem' }}
                      >
                        <Ban size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ——— USER LOOKUP TAB ——— */}
      {activeTab === 'lookup' && (
        <div style={{ maxWidth: '640px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: '0.9375rem',
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              marginBottom: '1.25rem',
            }}
          >
            Look up any user by name, email, or UNI to view their activity and take moderation actions.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input
              type="search"
              className="form-input"
              placeholder="Name, email, or UNI…"
              value={lookupQuery}
              onChange={e => setLookupQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{ flex: 1 }}
            />
            <button onClick={handleLookup} disabled={lookupLoading} className="btn-primary">
              {lookupLoading ? 'Searching…' : 'Look up'}
            </button>
          </div>

          {lookupResult && (
            <div style={{ background: 'var(--color-limestone-dk)', border: '1px solid var(--color-mist)', borderRadius: '4px', padding: '1.25rem' }}>
              {lookupResult.profile ? (
                <>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '60px', height: '80px', borderRadius: '2px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <Image src={lookupResult.profile.image_url} alt={lookupResult.profile.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.375rem', margin: '0 0 0.25rem' }}>
                        {lookupResult.profile.name}
                      </h3>
                      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        {lookupResult.profile.email} · {lookupResult.profile.uni}
                      </p>
                      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                        {lookupResult.profile.school} · {lookupResult.profile.year}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <StatBox label="Requests sent" value={lookupResult.meetingsSent.length} />
                    <StatBox label="Requests received" value={lookupResult.meetingsReceived.length} />
                    <StatBox
                      label="Status"
                      value={lookupResult.isSuspended ? 'Suspended' : lookupResult.isBlacklisted ? 'Banned' : 'Active'}
                      color={lookupResult.isSuspended || lookupResult.isBlacklisted ? 'var(--color-error)' : 'var(--color-success)'}
                    />
                  </div>

                  {/* Quick actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleToggleVisible(lookupResult.profile!)}
                      className="btn-ghost"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {lookupResult.profile.is_visible ? <><EyeOff size={12} /> Hide profile</> : <><Eye size={12} /> Restore profile</>}
                    </button>
                    <button
                      onClick={() => handleSuspend(lookupResult.profile!)}
                      className="btn-ghost"
                      style={{ fontSize: '0.7rem' }}
                    >
                      <Clock size={12} /> Suspend requests
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleRemove(lookupResult.profile!)} className="btn-danger" style={{ fontSize: '0.7rem' }}>
                          <Trash2 size={12} /> Remove
                        </button>
                        <button onClick={() => handleBan(lookupResult.profile!)} className="btn-danger" style={{ fontSize: '0.7rem' }}>
                          <Ban size={12} /> Ban
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--font-body), serif', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No profile found for &ldquo;{lookupQuery}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ——— ROLE MANAGEMENT (super admin only) ——— */}
      {activeTab === 'roles' && isSuperAdmin && (
        <RoleManagement currentUserId={currentUserId} />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--color-limestone)', border: '1px solid var(--color-mist)', borderRadius: '4px', padding: '0.75rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-courier), monospace', fontSize: '1.5rem', fontWeight: 700, color: color ?? 'var(--color-ink)', margin: 0 }}>{value}</p>
      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
    </div>
  );
}

function RoleManagement({ currentUserId }: { currentUserId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('moderator');
  const [status, setStatus] = useState('');

  const handleGrant = async () => {
    if (!email.trim()) return;
    const res = await fetch('/api/admin/roles/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Role granted to ${email}` : data.error ?? 'Failed');
    if (res.ok) setEmail('');
  };

  const handleRevoke = async () => {
    if (!email.trim()) return;
    const res = await fetch('/api/admin/roles/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Role revoked for ${email}` : data.error ?? 'Failed');
    if (res.ok) setEmail('');
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      <p style={{ fontFamily: 'var(--font-body), serif', fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Grant or revoke moderator and admin roles. Only super admins can manage roles.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label className="form-label">User email</label>
          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@columbia.edu" />
        </div>
        <div>
          <label className="form-label">Role</label>
          <select className="form-input" value={role} onChange={e => setRole(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleGrant} className="btn-primary">Grant role</button>
          <button onClick={handleRevoke} className="btn-danger">Revoke role</button>
        </div>
        {status && <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>{status}</p>}
      </div>
    </div>
  );
}
