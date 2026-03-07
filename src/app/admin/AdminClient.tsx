'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Eye, EyeOff, Ban, Trash2, Clock, UserX, X, ShieldOff, CheckCircle, AlertTriangle } from 'lucide-react';
import type { FullProfile } from '@/types';
import type { ContentFlag } from '@/lib/content-flags';
import { deriveYearLabel } from '@/lib/year-utils';

interface FlaggedProfileData {
  profile: FullProfile;
  flags: ContentFlag[];
}

interface Props {
  currentUserId: string;
  profiles: FullProfile[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  suspendedUserIds: string[];
  bannedUserIds: string[];
  flaggedProfiles: FlaggedProfileData[];
  userRoles: Record<string, string>;
}

type Tab = 'profiles' | 'flagged' | 'lookup' | 'roles' | 'audit';

interface AuditEntry {
  id: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  target_user_id: string | null;
  target_name: string | null;
  target_table: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SuspensionStatus {
  isSuspended: boolean;
  suspendedUntil: string | null;
  reason: string | null;
  suspensionType?: string;
}

export default function AdminClient({
  currentUserId,
  profiles: initialProfiles,
  isAdmin,
  isSuperAdmin,
  suspendedUserIds: initialSuspendedUserIds,
  bannedUserIds,
  flaggedProfiles: initialFlagged,
  userRoles,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState(initialProfiles);
  const [suspendedUserIds, setSuspendedUserIds] = useState(initialSuspendedUserIds);
  const [flaggedProfiles, setFlaggedProfiles] = useState(initialFlagged);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [selectedProfile, setSelectedProfile] = useState<FullProfile | null>(null);

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

  const q = searchQuery.toLowerCase();
  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.email ?? '').toLowerCase().includes(q) ||
    (p.uni ?? '').toLowerCase().includes(q) ||
    p.clubs.some(c => c.toLowerCase().includes(q))
  );

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
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
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(prev => prev ? { ...prev, is_visible: !prev.is_visible } : null);
      }
      showMessage(`${profile.name}'s profile ${profile.is_visible ? 'hidden' : 'restored'}.`);
    } else {
      showMessage('Action failed. Please try again.', 'error');
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
      if (selectedProfile?.id === profile.id) setSelectedProfile(null);
      showMessage(`${profile.name}'s profile removed.`);
    } else {
      showMessage('Remove failed. Please try again.', 'error');
    }
    setActionLoading(null);
  };

  const handleDeleteAccount = async (profile: FullProfile) => {
    if (!isAdmin) return;
    if (!confirm(`Permanently delete ${profile.name}'s entire account? This removes their profile, photo, and all data and cannot be undone.`)) return;
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    if (res.ok) {
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      if (selectedProfile?.id === profile.id) setSelectedProfile(null);
      showMessage(`${profile.name}'s account has been deleted.`);
    } else {
      showMessage('Delete failed. Please try again.', 'error');
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
      if (selectedProfile?.id === profile.id) setSelectedProfile(null);
      showMessage(`${profile.name} has been banned.`);
    } else {
      showMessage('Ban failed. Please try again.', 'error');
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
    if (res.ok) {
      setSuspendedUserIds(prev => [...prev, profile.user_id]);
      showMessage(`${profile.name} suspended.`);
    } else {
      showMessage('Suspend failed.', 'error');
    }
    setActionLoading(null);
  };

  const handleLiftSuspension = async (profile: FullProfile) => {
    setActionLoading(profile.id);
    const res = await fetch('/api/admin/suspensions/lift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id }),
    });
    if (res.ok) {
      setSuspendedUserIds(prev => prev.filter(id => id !== profile.user_id));
      showMessage(`${profile.name}'s suspension lifted.`);
    } else {
      showMessage('Lift suspension failed.', 'error');
    }
    setActionLoading(null);
  };

  const handleDesignationChange = async (profile: FullProfile, designation: 'student' | 'faculty' | 'staff') => {
    const res = await fetch('/api/admin/profile/set-designation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id, designation }),
    });
    if (res.ok) {
      setProfiles(prev => prev.map(p =>
        p.id === profile.id ? { ...p, designation } : p
      ));
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(prev => prev ? { ...prev, designation } : null);
      }
      showMessage(`${profile.name} set to ${designation}.`);
    } else {
      showMessage('Failed to update designation.', 'error');
    }
  };

  const handleDismissFlag = async (fp: FlaggedProfileData, verdict: 'dismissed' | 'actioned') => {
    setActionLoading(fp.profile.id);
    const res = await fetch('/api/admin/moderation/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileUserId: fp.profile.user_id,
        verdict,
        flaggedTerms: fp.flags.map(f => f.term),
        flaggedFields: fp.flags.map(f => f.field),
      }),
    });
    if (res.ok) {
      setFlaggedProfiles(prev => prev.filter(f => f.profile.id !== fp.profile.id));
      showMessage(verdict === 'dismissed' ? `Flag dismissed for ${fp.profile.name}.` : `Flag marked as actioned for ${fp.profile.name}.`);
    } else {
      showMessage('Could not save review. Please try again.', 'error');
    }
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

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'profiles', label: 'All Profiles' },
    { id: 'flagged', label: 'Flagged', badge: flaggedProfiles.length || undefined },
    { id: 'lookup', label: 'User Lookup' },
    ...(isSuperAdmin ? [
      { id: 'roles' as Tab, label: 'Role Management' },
      { id: 'audit' as Tab, label: 'Audit Log' },
    ] : []),
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-mist)', marginBottom: '2rem' }}>
        {tabs.map(tab => (
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {tab.label}
            {tab.badge != null && (
              <span style={{
                background: '#e65100',
                color: '#fff',
                borderRadius: '100px',
                padding: '0.05rem 0.4rem',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.6,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className={`status-banner ${messageType === 'error' ? 'status-removed' : 'status-published'}`} style={{ marginBottom: '1.5rem' }}>
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
              placeholder="Search by name, email, UNI, or club…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
            />
          </div>

          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredProfiles.map(profile => {
              const isOwnProfile = profile.user_id === currentUserId;
              const isSuspended = suspendedUserIds.includes(profile.user_id);
              const isBanned = bannedUserIds.includes(profile.user_id);

              return (
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
                  {/* Clickable photo + info area */}
                  <div
                    onClick={() => setSelectedProfile(profile)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    {/* Photo */}
                    <div style={{ width: '44px', height: '56px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <Image src={profile.image_url} alt={profile.name} fill style={{ objectFit: 'cover' }} />
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-display), serif', fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {profile.name}
                        {userRoles[profile.user_id] === 'super_admin' && (
                          <span className="label-mono" style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>SUPER ADMIN</span>
                        )}
                        {userRoles[profile.user_id] === 'admin' && (
                          <span className="label-mono" style={{ background: '#6366f1', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>ADMIN</span>
                        )}
                        {userRoles[profile.user_id] === 'moderator' && (
                          <span className="label-mono" style={{ background: '#8b5cf6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>MOD</span>
                        )}
                        {!profile.is_visible && (
                          <span className="label-mono" style={{ color: 'var(--color-text-muted)' }}>HIDDEN</span>
                        )}
                        {isSuspended && (
                          <span className="label-mono" style={{ background: '#fff3e0', color: '#e65100', padding: '0.1rem 0.4rem', borderRadius: '2px' }}>SUSPENDED</span>
                        )}
                        {isBanned && (
                          <span className="label-mono" style={{ background: '#fce4ec', color: '#b71c1c', padding: '0.1rem 0.4rem', borderRadius: '2px' }}>BANNED</span>
                        )}
                      </p>
                      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
                        {profile.email} · {profile.school} · {deriveYearLabel(profile.year, profile.school, profile.designation, profile.degree)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, alignItems: 'center' }}>
                    {isOwnProfile ? (
                      <span className="label-mono" style={{ color: 'var(--color-text-muted)', padding: '0.3rem 0.55rem', fontSize: '0.7rem' }}>You</span>
                    ) : (
                      <>
                        {/* Mods can hide/unhide */}
                        <ActionBtn
                          onClick={() => handleToggleVisible(profile)}
                          disabled={actionLoading === profile.id}
                          icon={profile.is_visible ? <EyeOff size={12} /> : <Eye size={12} />}
                          label={profile.is_visible ? 'Hide' : 'Restore'}
                          variant="ghost"
                        />

                        {/* Suspend / Lift */}
                        {isSuspended ? (
                          <ActionBtn
                            onClick={() => handleLiftSuspension(profile)}
                            disabled={actionLoading === profile.id}
                            icon={<ShieldOff size={12} />}
                            label="Lift"
                            variant="ghost"
                          />
                        ) : (
                          <ActionBtn
                            onClick={() => handleSuspend(profile)}
                            disabled={actionLoading === profile.id}
                            icon={<Clock size={12} />}
                            label="Suspend"
                            variant="ghost"
                          />
                        )}

                        {/* Admin-only */}
                        {isAdmin && (
                          <>
                            <ActionBtn
                              onClick={() => handleRemove(profile)}
                              disabled={actionLoading === profile.id}
                              icon={<Trash2 size={12} />}
                              label="Remove"
                              variant="danger"
                            />
                            <ActionBtn
                              onClick={() => handleBan(profile)}
                              disabled={actionLoading === profile.id}
                              icon={<Ban size={12} />}
                              label="Ban"
                              variant="danger"
                            />
                            <ActionBtn
                              onClick={() => handleDeleteAccount(profile)}
                              disabled={actionLoading === profile.id}
                              icon={<UserX size={12} />}
                              label="Delete acct"
                              variant="danger"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ——— FLAGGED CONTENT TAB ——— */}
      {activeTab === 'flagged' && (
        <div style={{ maxWidth: '720px' }}>
          <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Profiles whose name or Q&amp;A responses contain potentially inappropriate language.
            Review and dismiss false positives, or take action. Dismissed profiles won&rsquo;t reappear unless their content changes.
          </p>

          {flaggedProfiles.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#2e7d32', fontFamily: 'var(--font-mono), monospace', fontSize: '0.8125rem' }}>
              <CheckCircle size={16} />
              No flagged profiles — all clear.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {flaggedProfiles.map(fp => (
              <div
                key={fp.profile.id}
                style={{
                  background: 'var(--color-limestone-dk)',
                  border: '1px solid #ffcc02',
                  borderLeft: '4px solid #e65100',
                  borderRadius: '4px',
                  padding: '1rem',
                }}
              >
                {/* Profile header */}
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div style={{ width: '44px', height: '56px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={fp.profile.image_url} alt={fp.profile.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display), serif', fontSize: '1.0625rem', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>
                      {fp.profile.name}
                    </p>
                    <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
                      {fp.profile.email} · {fp.profile.school} · {fp.profile.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProfile(fp.profile)}
                    className="btn-ghost"
                    style={{ fontSize: '0.7rem', flexShrink: 0 }}
                  >
                    View profile
                  </button>
                </div>

                {/* Flag details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  {fp.flags.map((flag, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'baseline' }}>
                      <AlertTriangle size={12} style={{ color: '#e65100', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <span className="label-mono" style={{ color: '#e65100', marginRight: '0.5rem' }}>
                          {flag.field}
                        </span>
                        <FlagSnippet snippet={flag.snippet} term={flag.term} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <ActionBtn
                    onClick={() => handleDismissFlag(fp, 'dismissed')}
                    disabled={actionLoading === fp.profile.id}
                    icon={<CheckCircle size={12} />}
                    label="Dismiss (false positive)"
                    variant="ghost"
                  />
                  <ActionBtn
                    onClick={() => handleToggleVisible(fp.profile)}
                    disabled={actionLoading === fp.profile.id}
                    icon={<EyeOff size={12} />}
                    label="Hide profile"
                    variant="ghost"
                  />
                  {isAdmin && (
                    <>
                      <ActionBtn
                        onClick={async () => { await handleBan(fp.profile); handleDismissFlag(fp, 'actioned'); }}
                        disabled={actionLoading === fp.profile.id}
                        icon={<Ban size={12} />}
                        label="Ban"
                        variant="danger"
                      />
                      <ActionBtn
                        onClick={async () => { await handleDeleteAccount(fp.profile); handleDismissFlag(fp, 'actioned'); }}
                        disabled={actionLoading === fp.profile.id}
                        icon={<UserX size={12} />}
                        label="Delete account"
                        variant="danger"
                      />
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
            Look up any user by name, email, or UNI to view their activity stats (requests sent/received, suspension and ban status) and take moderation actions.
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
                      <h3 style={{ fontFamily: 'var(--font-display), serif', fontSize: '1.375rem', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {lookupResult.profile.name}
                        {userRoles[lookupResult.profile.user_id] === 'super_admin' && (
                          <span className="label-mono" style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>SUPER ADMIN</span>
                        )}
                        {userRoles[lookupResult.profile.user_id] === 'admin' && (
                          <span className="label-mono" style={{ background: '#6366f1', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>ADMIN</span>
                        )}
                        {userRoles[lookupResult.profile.user_id] === 'moderator' && (
                          <span className="label-mono" style={{ background: '#8b5cf6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '2px', fontSize: '0.65rem' }}>MOD</span>
                        )}
                      </h3>
                      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        {lookupResult.profile.email} · {lookupResult.profile.uni}
                      </p>
                      <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                        {lookupResult.profile.school} · {deriveYearLabel(lookupResult.profile.year, lookupResult.profile.school, lookupResult.profile.designation, lookupResult.profile.degree)}
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
                      style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {lookupResult.profile.is_visible ? <><EyeOff size={12} /> Hide profile</> : <><Eye size={12} /> Restore profile</>}
                    </button>
                    {lookupResult.isSuspended ? (
                      <button
                        onClick={() => handleLiftSuspension(lookupResult.profile!)}
                        className="btn-ghost"
                        style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <ShieldOff size={12} /> Lift suspension
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspend(lookupResult.profile!)}
                        className="btn-ghost"
                        style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Clock size={12} /> Suspend requests
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => handleRemove(lookupResult.profile!)} className="btn-danger" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={12} /> Remove profile
                        </button>
                        <button onClick={() => handleBan(lookupResult.profile!)} className="btn-danger" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Ban size={12} /> Ban
                        </button>
                        <button onClick={() => handleDeleteAccount(lookupResult.profile!)} className="btn-danger" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <UserX size={12} /> Delete account
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

      {/* ——— AUDIT LOG (super admin only) ——— */}
      {activeTab === 'audit' && isSuperAdmin && (
        <AuditLogViewer profiles={profiles} onSelectProfile={setSelectedProfile} />
      )}

      {/* ——— PROFILE DETAIL MODAL ——— */}
      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          currentUserRole={userRoles[selectedProfile.user_id] ?? null}
          actionLoading={actionLoading}
          isOwnProfile={selectedProfile.user_id === currentUserId}
          isSuspended={suspendedUserIds.includes(selectedProfile.user_id)}
          onClose={() => setSelectedProfile(null)}
          onToggleVisible={handleToggleVisible}
          onSuspend={handleSuspend}
          onLiftSuspension={handleLiftSuspension}
          onRemove={handleRemove}
          onBan={handleBan}
          onDeleteAccount={handleDeleteAccount}
          onDesignationChange={handleDesignationChange}
        />
      )}
    </div>
  );
}

// ——— Small labeled action button ———
function ActionBtn({
  onClick, disabled, icon, label, variant,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  variant: 'ghost' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === 'danger' ? 'btn-danger' : 'btn-ghost'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.3rem 0.55rem',
        fontSize: '0.7rem',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ——— Profile detail modal ———
function ProfileDetailModal({
  profile, isAdmin, isSuperAdmin, currentUserRole, actionLoading, isOwnProfile, isSuspended, onClose,
  onToggleVisible, onSuspend, onLiftSuspension, onRemove, onBan, onDeleteAccount,
  onDesignationChange,
}: {
  profile: FullProfile;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  currentUserRole: string | null;
  actionLoading: string | null;
  isOwnProfile: boolean;
  isSuspended: boolean;
  onClose: () => void;
  onToggleVisible: (p: FullProfile) => void;
  onSuspend: (p: FullProfile) => void;
  onLiftSuspension: (p: FullProfile) => void;
  onRemove: (p: FullProfile) => void;
  onBan: (p: FullProfile) => void;
  onDeleteAccount: (p: FullProfile) => void;
  onDesignationChange: (p: FullProfile, designation: 'student' | 'faculty' | 'staff') => void;
}) {
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus | null>(null);
  const [roleStatus, setRoleStatus] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [liveRole, setLiveRole] = useState<string | null>(currentUserRole);

  useEffect(() => {
    if (isOwnProfile) return;
    fetch(`/api/admin/suspensions/status?userId=${profile.user_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSuspensionStatus(data); })
      .catch(() => { });
  }, [profile.user_id, isOwnProfile]);

  // Keep suspension status in sync with parent's isSuspended
  useEffect(() => {
    if (!isSuspended && suspensionStatus?.isSuspended) {
      setSuspensionStatus({ isSuspended: false, suspendedUntil: null, reason: null });
    }
  }, [isSuspended, suspensionStatus?.isSuspended]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(12, 26, 46, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-limestone)',
          border: '1px solid var(--color-mist)',
          borderRadius: '8px',
          maxWidth: '540px', width: '100%',
          maxHeight: '82vh',
          overflowY: 'auto',
          padding: '1.5rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ width: '64px', height: '80px', borderRadius: '3px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <Image src={profile.image_url} alt={profile.name} fill style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display), serif', fontSize: '1.5rem', margin: '0 0 0.2rem', color: 'var(--color-ink)' }}>
              {profile.name}
              {profile.pronouns && (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginLeft: '0.5rem', fontWeight: 400 }}>
                  ({profile.pronouns})
                </span>
              )}
            </h2>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              {profile.email}{profile.uni ? ` · ${profile.uni}` : ''}
            </p>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
              {[profile.school, profile.year, profile.degree].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--color-text-muted)', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span className="label-mono" style={{
            background: profile.is_visible ? '#e8f5e9' : '#fce4ec',
            color: profile.is_visible ? '#2e7d32' : '#c62828',
            padding: '0.2rem 0.5rem', borderRadius: '2px',
          }}>
            {profile.is_visible ? 'Visible' : 'Hidden'}
          </span>
          <span className="label-mono" style={{
            background: profile.is_public ? '#e3f2fd' : '#f3e5f5',
            color: profile.is_public ? '#1565c0' : '#6a1b9a',
            padding: '0.2rem 0.5rem', borderRadius: '2px',
          }}>
            {profile.is_public ? 'Public' : 'Private'}
          </span>
          {isOwnProfile && (
            <span className="label-mono" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
              Your account
            </span>
          )}
        </div>

        {/* Active suspension info */}
        {!isOwnProfile && suspensionStatus?.isSuspended && (
          <div style={{
            background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: '4px',
            padding: '0.875rem', marginBottom: '1.25rem',
          }}>
            <p className="label-mono" style={{ color: '#e65100', margin: '0 0 0.25rem' }}>ACTIVE SUSPENSION</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-ink)', margin: '0 0 0.25rem' }}>
              {suspensionStatus.reason}
            </p>
            {suspensionStatus.suspendedUntil && (
              <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                Until {new Date(suspensionStatus.suspendedUntil).toLocaleString()}
              </p>
            )}
            {!suspensionStatus.suspendedUntil && (
              <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>Indefinite</p>
            )}
          </div>
        )}

        {/* Major */}
        {profile.major?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>STUDYING</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', margin: 0, color: 'var(--color-ink)' }}>
              {profile.major.join(' · ')}
            </p>
          </div>
        )}

        {/* Clubs */}
        {profile.clubs?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>CBS CLUBS</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', margin: 0, color: 'var(--color-ink)' }}>
              {profile.clubs.join(' · ')}
            </p>
          </div>
        )}

        {/* Q&A */}
        {profile.responses?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {profile.responses.map((r, i) => (
              <div key={i} style={{ marginBottom: '0.875rem' }}>
                <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{r.question}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', margin: 0, color: 'var(--color-ink)', lineHeight: 1.55 }}>{r.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Social links */}
        {(profile.linkedin || profile.instagram || profile.twitter || profile.facebook || profile.youtube || profile.tiktok || profile.website) && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>SOCIAL</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>LinkedIn</a>}
              {profile.instagram && <a href={profile.instagram} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>Instagram</a>}
              {profile.twitter && <a href={profile.twitter} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>Twitter/X</a>}
              {profile.facebook && <a href={profile.facebook} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>Facebook</a>}
              {profile.youtube && <a href={profile.youtube} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>YouTube</a>}
              {profile.tiktok && <a href={profile.tiktok} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>TikTok</a>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-columbia)' }}>Website</a>}
            </div>
          </div>
        )}

        {/* Designation setter — admin only */}
        {isAdmin && !isOwnProfile && (
          <div style={{ borderTop: '1px solid var(--color-mist)', paddingTop: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>DESIGNATION</p>
            <select
              className="form-input"
              value={profile.designation}
              onChange={e => onDesignationChange(profile, e.target.value as 'student' | 'faculty' | 'staff')}
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: 'auto', cursor: 'pointer' }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
            {profile.designation !== 'student' && (
              <span className="label-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                Overrides graduation year display
              </span>
            )}
          </div>
        )}

        {/* Role management — super admin only */}
        {isSuperAdmin && !isOwnProfile && (
          <div style={{ borderTop: '1px solid var(--color-mist)', paddingTop: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>ROLE</p>
              {liveRole ? (
                <span className="label-mono" style={{ background: '#e3f2fd', color: '#1565c0', padding: '0.2rem 0.5rem', borderRadius: '2px', textTransform: 'capitalize' }}>
                  {liveRole}
                </span>
              ) : (
                <span className="label-mono" style={{ color: 'var(--color-text-muted)' }}>No system role</span>
              )}
              {liveRole ? (
                <button
                  className="btn-ghost"
                  disabled={roleLoading}
                  onClick={async () => {
                    setRoleLoading(true);
                    setRoleStatus(null);
                    const res = await fetch('/api/admin/roles/revoke', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: profile.email }),
                    });
                    const d = await res.json();
                    setRoleStatus(res.ok ? 'Role revoked' : (d.error ?? 'Failed'));
                    if (res.ok) setLiveRole(null);
                    setRoleLoading(false);
                  }}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                >
                  Revoke
                </button>
              ) : (
                <>
                  {(['moderator', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      className="btn-ghost"
                      disabled={roleLoading}
                      onClick={async () => {
                        setRoleLoading(true);
                        setRoleStatus(null);
                        const res = await fetch('/api/admin/roles/grant', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: profile.email, role: r }),
                        });
                        const d = await res.json();
                        setRoleStatus(res.ok ? `Granted ${r}` : (d.error ?? 'Failed'));
                        if (res.ok) setLiveRole(r);
                        setRoleLoading(false);
                      }}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', textTransform: 'capitalize' }}
                    >
                      Grant {r}
                    </button>
                  ))}
                </>
              )}
            </div>
            {roleStatus && (
              <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                {roleStatus}
              </p>
            )}
          </div>
        )}

        {/* Actions in modal */}
        <div style={{ borderTop: '1px solid var(--color-mist)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isOwnProfile ? (
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>This is your account — actions unavailable.</p>
          ) : (
            <>
              <ActionBtn
                onClick={() => onToggleVisible(profile)}
                disabled={actionLoading === profile.id}
                icon={profile.is_visible ? <EyeOff size={12} /> : <Eye size={12} />}
                label={profile.is_visible ? 'Hide profile' : 'Restore profile'}
                variant="ghost"
              />
              {suspensionStatus?.isSuspended ? (
                <ActionBtn
                  onClick={() => onLiftSuspension(profile)}
                  disabled={actionLoading === profile.id}
                  icon={<ShieldOff size={12} />}
                  label="Lift suspension"
                  variant="ghost"
                />
              ) : (
                <ActionBtn
                  onClick={() => onSuspend(profile)}
                  disabled={actionLoading === profile.id}
                  icon={<Clock size={12} />}
                  label="Suspend"
                  variant="ghost"
                />
              )}
              {isAdmin && (
                <>
                  <ActionBtn
                    onClick={() => onRemove(profile)}
                    disabled={actionLoading === profile.id}
                    icon={<Trash2 size={12} />}
                    label="Remove profile"
                    variant="danger"
                  />
                  <ActionBtn
                    onClick={() => onBan(profile)}
                    disabled={actionLoading === profile.id}
                    icon={<Ban size={12} />}
                    label="Ban user"
                    variant="danger"
                  />
                  <ActionBtn
                    onClick={() => onDeleteAccount(profile)}
                    disabled={actionLoading === profile.id}
                    icon={<UserX size={12} />}
                    label="Delete account"
                    variant="danger"
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Renders a snippet with the flagged term highlighted in amber
function FlagSnippet({ snippet, term }: { snippet: string; term: string }) {
  const idx = snippet.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) {
    return <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-ink)' }}>{snippet}</span>;
  }
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-ink)' }}>
      {snippet.slice(0, idx)}
      <mark style={{ background: '#ffe082', color: '#b71c1c', borderRadius: '2px', padding: '0 2px', fontWeight: 600 }}>
        {snippet.slice(idx, idx + term.length)}
      </mark>
      {snippet.slice(idx + term.length)}
    </span>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--color-limestone)', border: '1px solid var(--color-mist)', borderRadius: '4px', padding: '0.75rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '1.5rem', fontWeight: 700, color: color ?? 'var(--color-ink)', margin: 0 }}>{value}</p>
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

  // Suppress unused var warning — currentUserId kept in props for future use
  void currentUserId;

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

function AuditLogViewer({ profiles, onSelectProfile }: { profiles: FullProfile[]; onSelectProfile: (p: FullProfile) => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  const profileByUserId = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const fetchEntries = async (newOffset: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit-log?limit=${limit}&offset=${newOffset}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setOffset(newOffset);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(0); }, []);

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body), serif', fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        All moderation actions taken on the platform, newest first.
      </p>

      {loading && <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>No audit log entries yet.</p>
      )}

      {!loading && entries.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', fontFamily: 'var(--font-mono), monospace' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-mist)' }}>
                  {['Timestamp', 'Actor', 'Action', 'Target user', 'Details'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-mist)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {profileByUserId[entry.actor_id] ? (
                        <button
                          onClick={() => onSelectProfile(profileByUserId[entry.actor_id])}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-columbia)', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}
                        >
                          {entry.actor_name ?? entry.actor_id.slice(0, 8) + '…'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-ink)' }}>{entry.actor_name ?? entry.actor_id.slice(0, 8) + '…'}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{
                        background: entry.action.startsWith('ban') || entry.action === 'delete_account' ? '#fce4ec' :
                          entry.action.startsWith('grant') || entry.action === 'lift_suspension' ? '#e8f5e9' : '#e3f2fd',
                        color: entry.action.startsWith('ban') || entry.action === 'delete_account' ? '#b71c1c' :
                          entry.action.startsWith('grant') || entry.action === 'lift_suspension' ? '#2e7d32' : '#1565c0',
                        padding: '0.15rem 0.4rem', borderRadius: '2px', whiteSpace: 'nowrap',
                      }}>
                        {entry.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {entry.target_user_id ? (
                        profileByUserId[entry.target_user_id] ? (
                          <button
                            onClick={() => onSelectProfile(profileByUserId[entry.target_user_id!])}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-columbia)', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}
                          >
                            {entry.target_name ?? entry.target_user_id.slice(0, 8) + '…'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>{entry.target_name ?? entry.target_user_id.slice(0, 8) + '…'}</span>
                        )
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Object.keys(entry.metadata).length > 0
                        ? Object.entries(entry.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
            <button
              onClick={() => fetchEntries(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn-ghost"
              style={{ fontSize: '0.75rem' }}
            >
              Previous
            </button>
            <span className="label-mono" style={{ color: 'var(--color-text-muted)' }}>
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              onClick={() => fetchEntries(offset + limit)}
              disabled={offset + limit >= total}
              className="btn-ghost"
              style={{ fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
