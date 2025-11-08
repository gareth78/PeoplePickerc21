import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  users as usersApi,
  presence as presenceApi,
  photo as photoApi,
  ooo as oooApi,
  getBaseUrl,
  type User,
  type UsersResult,
  type PresenceResult,
  type OOOResult
} from '@peoplepicker/sdk';

type TabKey = 'search' | 'details' | 'insert';

type OrgConfig = {
  appName: string;
  orgName: string;
  orgLogoUrl?: string | null;
  featureFlags?: Record<string, boolean>;
};

type PublicConfigResponse = OrgConfig & {
  status?: 'ok' | 'error';
};

const PRESENCE_POLL_INTERVAL_MS = 60_000;

function classForPresence(p: PresenceResult | undefined): string {
  if (!p || !p.availability) {
    return 'status-pill presence-unknown';
  }

  switch (p.availability) {
    case 'Available':
    case 'AvailableIdle':
      return 'status-pill presence-available';
    case 'Busy':
    case 'BusyIdle':
    case 'DoNotDisturb':
    case 'InACall':
    case 'InAMeeting':
    case 'Presenting':
      return 'status-pill presence-busy';
    case 'Away':
    case 'BeRightBack':
    case 'Inactive':
      return 'status-pill presence-away';
    case 'OutOfOffice':
      return 'status-pill presence-oof';
    default:
      return 'status-pill presence-unknown';
  }
}

function labelForPresence(p: PresenceResult | undefined): string {
  if (!p || !p.availability) {
    return 'Presence unavailable';
  }

  const activity = p.activity ?? p.availability;
  switch (activity) {
    case 'InAMeeting':
      return 'In a meeting';
    case 'InACall':
      return 'On a call';
    case 'BeRightBack':
      return 'Be right back';
    case 'DoNotDisturb':
      return 'Do not disturb';
    case 'OutOfOffice':
      return 'Out of office';
    default:
      return activity;
  }
}

function presenceTimestamp(p: PresenceResult | undefined): string | null {
  if (!p?.fetchedAt) {
    return null;
  }
  try {
    const date = new Date(p.fetchedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleTimeString();
  } catch {
    return null;
  }
}

const DEFAULT_ORG: OrgConfig = {
  appName: 'People Picker',
  orgName: 'Plan International',
  orgLogoUrl: null,
  featureFlags: {}
};

const recipientTargets = ['to', 'cc', 'bcc'] as const;

type RecipientTarget = (typeof recipientTargets)[number];

export default function App(): JSX.Element {
  const [orgConfig, setOrgConfig] = useState<OrgConfig>(DEFAULT_ORG);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UsersResult | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [presenceCache, setPresenceCache] = useState<Record<string, PresenceResult>>({});
  const [photoCache, setPhotoCache] = useState<Record<string, string | null>>({});
  const [oooCache, setOooCache] = useState<Record<string, OOOResult | null>>({});
  const [presenceRefreshing, setPresenceRefreshing] = useState(false);

  const presencePrefetchedRef = useRef(new Set<string>());
  const presenceInFlightRef = useRef(new Set<string>());
  const photoLoadedRef = useRef(new Set<string>());
  const visibilityHandlerRef = useRef<() => void>();
  const pollIntervalRef = useRef<number>();

  const trimmedQuery = query.trim();
  const searchUsers = useMemo(() => usersApi, []);
  const presenceClient = useMemo(() => presenceApi, []);
  const photoClient = useMemo(() => photoApi, []);
  const oooClient = useMemo(() => oooApi, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl ? baseUrl.replace(/\/$/, '') : ''}/api/config/public` || '/api/config/public';
    (async () => {
      try {
        const response = await fetch(endpoint || '/api/config/public', {
          signal: controller.signal,
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload: PublicConfigResponse = await response.json();
        if (!cancelled) {
          setOrgConfig({
            appName: payload.appName ?? DEFAULT_ORG.appName,
            orgName: payload.orgName ?? DEFAULT_ORG.orgName,
            orgLogoUrl: payload.orgLogoUrl ?? null,
            featureFlags: payload.featureFlags ?? {}
          });
        }
      } catch (error) {
        console.error('[addin] Failed to load public config', error);
        if (!cancelled) {
          setOrgError('Unable to reach People Picker backend. Some features may be unavailable.');
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const item = Office?.context?.mailbox?.item as any;
    if (!item) {
      return;
    }

    try {
      const sender = item.from || item.sender;
      if (sender?.emailAddress) {
        console.log('[addin] Prefilling search for sender', sender.emailAddress);
        setQuery(sender.emailAddress);
        return;
      }

      if (Array.isArray(item.to) && item.to.length > 0) {
        const target = item.to[0];
        if (target?.emailAddress) {
          console.log('[addin] Prefilling search using first recipient', target.emailAddress);
          setQuery(target.emailAddress);
        }
      }
    } catch (error) {
      console.warn('[addin] Unable to inspect mailbox item for prefilling', error);
    }
  }, []);

  useEffect(() => {
    if (trimmedQuery.length === 0) {
      setSearchResult(null);
      setSearchError(null);
      setSearching(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setSearchError('Please enter at least two characters.');
      setSearchResult(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await searchUsers.search(trimmedQuery);
        if (cancelled) {
          return;
        }
        setSearchResult(result);
        setSearchError(null);
        if (!selectedUser && result.users.length > 0) {
          setSelectedUser(result.users[0]);
        }
      } catch (error) {
        console.error('[addin] Search failed', error);
        if (!cancelled) {
          setSearchError('Search failed. Please try again.');
          setSearchResult(null);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, searchUsers, selectedUser]);

  const ensurePhoto = useCallback(
    (email: string) => {
      const normalized = email.toLowerCase();
      if (photoLoadedRef.current.has(normalized)) {
        return;
      }
      photoLoadedRef.current.add(normalized);
      photoClient
        .get(email)
        .then((data) => {
          setPhotoCache((prev) => ({ ...prev, [email]: data }));
        })
        .catch((error) => {
          console.warn('[addin] Unable to load photo', error);
          photoLoadedRef.current.delete(normalized);
          setPhotoCache((prev) => ({ ...prev, [email]: null }));
        });
    },
    [photoClient]
  );

  const ensurePresence = useCallback(
    (email: string, options?: { force?: boolean; noCache?: boolean; ttl?: number; setLoading?: (state: boolean) => void }) => {
      const normalized = email.toLowerCase();
      if (!options?.force) {
        if (presencePrefetchedRef.current.has(normalized) || presenceInFlightRef.current.has(normalized)) {
          return;
        }
      }

      presenceInFlightRef.current.add(normalized);
      options?.setLoading?.(true);

      presenceClient
        .get(email, options?.noCache || options?.ttl ? { noCache: options.noCache, ttl: options.ttl } : undefined)
        .then((data) => {
          setPresenceCache((prev) => ({ ...prev, [email]: data }));
          presencePrefetchedRef.current.add(normalized);
        })
        .catch((error) => {
          console.warn('[addin] Presence lookup failed', error);
          setPresenceCache((prev) => ({ ...prev, [email]: { activity: null, availability: null, fetchedAt: null } }));
        })
        .finally(() => {
          presenceInFlightRef.current.delete(normalized);
          options?.setLoading?.(false);
          if (options?.force) {
            presencePrefetchedRef.current.delete(normalized);
          }
        });
    },
    [presenceClient]
  );

  useEffect(() => {
    const email = selectedUser?.email;
    if (!email) {
      return;
    }

    ensurePhoto(email);

    if (!(email in oooCache)) {
      let cancelled = false;
      oooClient
        .get(email)
        .then((result) => {
          if (!cancelled) {
            setOooCache((prev) => ({ ...prev, [email]: result }));
          }
        })
        .catch((error) => {
          console.warn('[addin] OOO lookup failed', error);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [selectedUser, ensurePhoto, oooClient, oooCache]);

  useEffect(() => {
    if (!selectedUser || activeTab !== 'details') {
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = undefined;
      }
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = undefined;
      }
      return;
    }

    const email = selectedUser.email;

    const fetchPresence = () => {
      ensurePresence(email, {
        force: true,
        noCache: true,
        ttl: 60,
        setLoading: setPresenceRefreshing
      });
    };

    fetchPresence();

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        fetchPresence();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    visibilityHandlerRef.current = visibilityHandler;

    pollIntervalRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPresence();
      }
    }, PRESENCE_POLL_INTERVAL_MS);

    return () => {
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = undefined;
      }
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = undefined;
      }
    };
  }, [selectedUser, activeTab, ensurePresence]);

  const handleSelectUser = useCallback(
    (user: User) => {
      setSelectedUser(user);
      ensurePhoto(user.email);
      ensurePresence(user.email);
      setActiveTab('details');
    },
    [ensurePhoto, ensurePresence]
  );

  const handleInsert = useCallback(() => {
    if (!selectedUser) {
      return;
    }

    const email = selectedUser.email;
    const presenceState = presenceCache[email];
    const oooState = oooCache[email];

    const presenceLabel = labelForPresence(presenceState);
    const oooMessage = oooState?.isOOO
      ? `<p><strong>Out of office:</strong> ${oooState.message ?? 'The recipient is currently away.'}</p>`
      : '';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif;">
        <p><strong>${selectedUser.displayName}</strong></p>
        <p>${selectedUser.title ?? 'Title unavailable'}<br/>${selectedUser.email}</p>
        <p><strong>Presence:</strong> ${presenceLabel}</p>
        ${oooMessage}
      </div>
    `;

    const body = Office?.context?.mailbox?.item?.body;
    if (!body) {
      console.warn('[addin] Compose body unavailable');
      return;
    }

    body.setSelectedDataAsync(
      html,
      { coercionType: Office.CoercionType.Html },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          console.error('[addin] Failed to insert block', result.error?.message);
        }
      }
    );
  }, [selectedUser, presenceCache, oooCache]);

  const handleRecipient = useCallback(
    (target: RecipientTarget) => {
      if (!selectedUser) {
        return;
      }
      const item = Office?.context?.mailbox?.item as any;
      const collection = item?.[target];
      if (!collection || typeof collection.addAsync !== 'function') {
        console.warn(`[addin] ${target.toUpperCase()} collection unavailable`);
        return;
      }
      collection.addAsync(
        [
          {
            displayName: selectedUser.displayName,
            emailAddress: selectedUser.email
          }
        ],
        (result: Office.AsyncResult<void>) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            console.error(`[addin] Failed to add ${target} recipient`, result.error?.message);
          }
        }
      );
    },
    [selectedUser]
  );

  const results = searchResult?.users ?? [];
  const selectedPresence = selectedUser ? presenceCache[selectedUser.email] : undefined;
  const selectedPhoto = selectedUser ? photoCache[selectedUser.email] : null;
  const selectedOOO = selectedUser ? oooCache[selectedUser.email] : null;
  const presenceTime = presenceTimestamp(selectedPresence);

  return (
    <div className="app-container">
      <header className="app-header">
        {orgConfig.orgLogoUrl ? (
          <img src={orgConfig.orgLogoUrl} alt={orgConfig.orgName} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#1d4ed8' }} />
        )}
        <div>
          <strong>{orgConfig.appName}</strong>
          <div className="helper-text">{orgConfig.orgName}</div>
        </div>
      </header>

      {orgError ? <div className="error-banner">{orgError}</div> : null}

      <div className="tab-bar">
        {(['search', 'details', 'insert'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button${activeTab === tab ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'search' && 'Search'}
            {tab === 'details' && 'Details'}
            {tab === 'insert' && 'Insert'}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div className="section-card">
          <input
            className="search-input"
            type="search"
            placeholder="Search people by name, email, or title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="helper-text" style={{ marginTop: 8 }}>
            Results update automatically. Hover to preview presence and photos.
          </div>
          {searchError ? <div className="error-banner" style={{ marginTop: 12 }}>{searchError}</div> : null}
          {searching && <div className="helper-text" style={{ marginTop: 12 }}>Searching…</div>}
          <div className="results-list" style={{ marginTop: 12 }}>
            {results.map((user) => {
              const cacheKey = user.email;
              const avatar = photoCache[cacheKey];
              const presenceState = presenceCache[cacheKey];
              return (
                <div
                  key={user.id}
                  className="result-card"
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => {
                    ensurePhoto(user.email);
                    ensurePresence(user.email);
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt={user.displayName} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1d5db' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div><strong>{user.displayName}</strong></div>
                    <div className="helper-text">{user.title ?? 'Title unavailable'}</div>
                    <div className="helper-text">{user.email}</div>
                  </div>
                  <span className={classForPresence(presenceState)}>{labelForPresence(presenceState)}</span>
                </div>
              );
            })}
            {!searching && results.length === 0 && trimmedQuery.length >= 2 && (
              <div className="helper-text">No people found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="section-card">
          {!selectedUser ? (
            <div className="helper-text">Select a person from the Search tab to see their details.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {selectedPhoto ? (
                  <img src={selectedPhoto} alt={selectedUser.displayName} style={{ width: 72, height: 72, borderRadius: '12px' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: '#d1d5db' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 4px 0' }}>{selectedUser.displayName}</h2>
                  <div className="helper-text">{selectedUser.title ?? 'Title unavailable'}</div>
                  <div className="helper-text">{selectedUser.department ?? selectedUser.organization ?? 'Department unavailable'}</div>
                  <div className="helper-text">{selectedUser.email}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={classForPresence(selectedPresence)}>{labelForPresence(selectedPresence)}</span>
                    {presenceRefreshing && <span className="helper-text">Refreshing…</span>}
                    {presenceTime && <span className="helper-text">Updated {presenceTime}</span>}
                  </div>
                </div>
              </div>

              {selectedOOO?.isOOO ? (
                <div className="error-banner" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  <strong>Out of office</strong>
                  <div>{selectedOOO.message ?? 'The recipient is currently away.'}</div>
                </div>
              ) : (
                <div className="helper-text">No automatic replies are currently active.</div>
              )}

              <div className="actions-row">
                {recipientTargets.map((target) => (
                  <button key={target} type="button" className="tab-button" onClick={() => handleRecipient(target)}>
                    Add to {target.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insert' && (
        <div className="section-card">
          {!selectedUser ? (
            <div className="helper-text">Select someone first to insert their details into the compose body.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p>
                  Insert <strong>{selectedUser.displayName}</strong> into the compose window with presence and out-of-office status.
                </p>
              </div>
              <button type="button" className="tab-button active" onClick={handleInsert}>
                Insert into email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
