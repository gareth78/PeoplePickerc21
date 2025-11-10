import { useEffect, useMemo, useRef, useState } from 'react';
import { sdk, PeoplePickerError, type OOOResult, type PresenceResult, type UsersResult } from '@people-picker/sdk';
import { useDebounce } from './hooks/useDebounce';
import { SearchBar } from './components/SearchBar';
import { ResultCard } from './components/ResultCard';
import { DetailPanel } from './components/DetailPanel';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { SearchSkeleton } from './components/SkeletonLoader';
import type { EnhancedUser, PublicConfig } from './types';
import { Building2, Search as SearchIcon } from 'lucide-react';

interface OfficeContextState {
  isCompose: boolean;
  supportsRecipients: boolean;
  mailboxUser: {
    displayName: string | null;
    email: string | null;
  };
}

const MIN_QUERY_LENGTH = 2;
const PRESENCE_TTL_SECONDS = 60;

const logDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[addin]', ...args);
  }
};

const defaultConfig: PublicConfig = {
  appName: 'People Picker',
  orgName: 'Plan International',
};

const safeFetch = async <T,>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const getInitialOfficeContext = (): OfficeContextState => {
  if (typeof Office === 'undefined' || !Office.context?.mailbox?.item) {
    return {
      isCompose: false,
      supportsRecipients: false,
      mailboxUser: {
        displayName: null,
        email: null,
      },
    };
  }

  const item = Office.context.mailbox.item as Office.MessageCompose | Office.MessageRead;
  const compose =
    typeof (item as Office.MessageCompose).body?.setSelectedDataAsync === 'function' ||
    typeof Office.context.mailbox.addHandlerAsync === 'function';
  const recipientsSupported =
    compose &&
    typeof (item as Office.MessageCompose).to?.addAsync === 'function' &&
    typeof (item as Office.MessageCompose).cc?.addAsync === 'function';

  return {
    isCompose: compose,
    supportsRecipients: recipientsSupported,
    mailboxUser: {
      displayName: Office.context.mailbox.userProfile?.displayName ?? null,
      email: Office.context.mailbox.userProfile?.emailAddress ?? null,
    },
  };
};

const upsertState = <T,>(setter: React.Dispatch<React.SetStateAction<Record<string, T>>>, key: string, value: T) => {
  setter((prev) => {
    if (prev[key] === value) {
      return prev;
    }
    return { ...prev, [key]: value };
  });
};

const hasCacheValue = <T,>(map: React.MutableRefObject<Record<string, T>>, key: string) =>
  Object.prototype.hasOwnProperty.call(map.current, key);

const htmlEscape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildInsertMarkup = (user: EnhancedUser, presence: PresenceResult | null | undefined, ooo: OOOResult | null | undefined) => {
  const lines = [
    `<strong>${htmlEscape(user.displayName)}</strong>`,
    user.title ? htmlEscape(user.title) : null,
    htmlEscape(user.email),
  ].filter(Boolean);

  const presenceLine = presence?.availability
    ? `Presence: ${htmlEscape(presence.availability)}${presence.activity ? ` (${htmlEscape(presence.activity)})` : ''}`
    : 'Presence: Not available';

  const oooLine =
    ooo && ooo.isOOO
      ? `Out of office: ${ooo.message ? htmlEscape(ooo.message) : 'Enabled'}`
      : null;

  return `<div style="font-family: 'Segoe UI', sans-serif; line-height: 1.5; padding: 8px 0;">
    <div>${lines.join('<br />')}</div>
    <div style="margin-top: 6px; color: #555;">${presenceLine}</div>
    ${
      oooLine
        ? `<div style="margin-top: 6px; padding: 8px; background-color: #f1f5f9; border-radius: 6px;">${oooLine}</div>`
        : ''
    }
  </div>`;
};

const addRecipientAsync = (kind: 'to' | 'cc' | 'bcc', user: EnhancedUser) =>
  new Promise<void>((resolve, reject) => {
    try {
      const item = Office.context?.mailbox?.item as Office.MessageCompose | undefined;
      const targetCollection = item?.[kind];
      if (!targetCollection || typeof targetCollection.addAsync !== 'function') {
        reject(new Error('Recipient collection unavailable.'));
        return;
      }

      targetCollection.addAsync(
        [
          {
            displayName: user.displayName,
            emailAddress: user.email,
          },
        ],
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            reject(result.error ?? new Error('Failed to add recipient'));
          }
        },
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to add recipient'));
    }
  });

const insertHtmlAsync = (markup: string) =>
  new Promise<void>((resolve, reject) => {
    try {
      const item = Office.context?.mailbox?.item as Office.MessageCompose | undefined;
      if (!item?.body || typeof item.body.setSelectedDataAsync !== 'function') {
        reject(new Error('Compose body unavailable.'));
        return;
      }

      item.body.setSelectedDataAsync(
        markup,
        { coercionType: Office.CoercionType.Html },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            reject(result.error ?? new Error('Failed to insert content'));
          }
        },
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to insert content'));
    }
  });

const resolvePublicConfig = async (): Promise<PublicConfig> => {
  try {
    const base = sdk.baseUrl || '';
    const url = `${base}/api/config/public`;
    return await safeFetch<PublicConfig>(url);
  } catch (error) {
    logDev('Failed to load public config', error);
    return defaultConfig;
  }
};

const enhanceUsers = (
  result: UsersResult,
  photoCache: Record<string, string | null>,
  presenceCache: Record<string, PresenceResult | null>,
): EnhancedUser[] =>
  result.users.map((user) => ({
    ...user,
    photo: Object.prototype.hasOwnProperty.call(photoCache, user.email) ? photoCache[user.email] ?? undefined : user.avatarUrl,
    presence: presenceCache[user.email],
  }));

const requestPhoto = async (email: string, token?: string | null): Promise<string | null> => {
  try {
    return await sdk.photo.get(email, { token: token ?? undefined });
  } catch (error) {
    logDev('Photo request failed', error);
    return null;
  }
};

const requestPresence = async (
  email: string,
  opts?: { noCache?: boolean; ttl?: number; token?: string | null },
): Promise<PresenceResult | null> => {
  try {
    return await sdk.presence.get(email, { ...opts, token: opts?.token ?? undefined });
  } catch (error) {
    if (error instanceof PeoplePickerError) {
      logDev('Presence request failed', error);
      return null;
    }
    throw error;
  }
};

const requestOOO = async (email: string, token?: string | null): Promise<OOOResult | null> => {
  try {
    return await sdk.ooo.get(email, { token: token ?? undefined });
  } catch (error) {
    logDev('OOO request failed', error);
    return null;
  }
};

export default function App() {
  const [config, setConfig] = useState<PublicConfig>(defaultConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<EnhancedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [officeContext, setOfficeContext] = useState<OfficeContextState>(getInitialOfficeContext);
  const [presenceRefreshing, setPresenceRefreshing] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const photoCacheRef = useRef<Record<string, string | null>>({});
  const [photoCache, setPhotoCache] = useState<Record<string, string | null>>({});
  const presenceCacheRef = useRef<Record<string, PresenceResult | null>>({});
  const [presenceCache, setPresenceCache] = useState<Record<string, PresenceResult | null>>({});
  const oooCacheRef = useRef<Record<string, OOOResult | null>>({});
  const [oooCache, setOooCache] = useState<Record<string, OOOResult | null>>({});
  const prefillRef = useRef<string | null>(null);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    photoCacheRef.current = photoCache;
  }, [photoCache]);

  useEffect(() => {
    presenceCacheRef.current = presenceCache;
  }, [presenceCache]);

  useEffect(() => {
    oooCacheRef.current = oooCache;
  }, [oooCache]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const publicConfig = await resolvePublicConfig();
        setConfig(publicConfig);
      } catch (error) {
        logDev('Public config failed', error);
      }
    };

    bootstrap().catch((error) => logDev('Bootstrap error', error));
  }, []);

  useEffect(() => {
    const getToken = async () => {
      if (typeof Office === 'undefined' || !Office.context?.mailbox) {
        logDev('Office.js not available, skipping SSO');
        return;
      }

      try {
        if (typeof Office.auth?.getAccessToken === 'function') {
          const token = await Office.auth.getAccessToken({
            allowSignInPrompt: true,
            allowConsentPrompt: true,
            forMSGraphAccess: true,
          });
          setAccessToken(token);
          logDev('SSO token obtained successfully');
        } else {
          logDev('Office.auth.getAccessToken not available');
        }
      } catch (error) {
        logDev('Failed to get SSO token', error);
      }
    };

    getToken().catch((error) => logDev('SSO error', error));
  }, []);

  useEffect(() => {
    const ctx = getInitialOfficeContext();
    setOfficeContext(ctx);

    if (typeof Office === 'undefined' || !Office.context?.mailbox?.item) {
      return;
    }

    const item = Office.context.mailbox.item as Office.MessageRead | Office.MessageCompose;
    const messageRead = item as Office.MessageRead & {
      organizer?: Office.EmailAddressDetails;
    };
    const sender =
      messageRead.from ??
      messageRead.sender ??
      messageRead.organizer ??
      null;

    if (sender?.emailAddress) {
      prefillRef.current = sender.emailAddress;
      setSearchQuery(sender.emailAddress);
    } else if (sender?.displayName) {
      prefillRef.current = sender.displayName;
      setSearchQuery(sender.displayName);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    sdk.users
      .search(debouncedQuery.trim(), { signal: controller.signal, token: accessToken ?? undefined })
      .then((result) => {
        const enhanced = enhanceUsers(result, photoCacheRef.current, presenceCacheRef.current);
        setSearchResults(enhanced);

        if (prefillRef.current) {
          const match = enhanced.find(
            (user) => user.email.toLowerCase() === prefillRef.current?.toLowerCase(),
          );
          if (match) {
            setSelectedUser(match);
            setShowDetailPanel(true);
            prefillRef.current = null;
          }
        } else if (selectedUser) {
          const stillPresent = enhanced.find((user) => user.email === selectedUser.email);
          if (stillPresent) {
            setSelectedUser({ ...stillPresent });
          }
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        logDev('Search failed', error);
        setSearchError(error instanceof PeoplePickerError ? error.message : 'Search failed.');
      })
      .finally(() => {
        setSearching(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, accessToken]);

  useEffect(() => {
    const email = selectedUser?.email;
    if (!email || !showDetailPanel) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const hydratePresence = async () => {
      setPresenceRefreshing(true);
      try {
        const result = await requestPresence(email, {
          noCache: true,
          ttl: PRESENCE_TTL_SECONDS,
          token: accessToken,
        });
        if (!cancelled) {
          upsertState(setPresenceCache, email, result);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        logDev('Presence refresh failed', error);
      } finally {
        if (!cancelled) {
          setPresenceRefreshing(false);
        }
      }
    };

    hydratePresence().catch((error) => logDev('Presence hydrate error', error));

    let timer: number | undefined;

    const schedule = () => {
      if (cancelled) {
        return;
      }
      if (document.visibilityState !== 'visible') {
        return;
      }
      timer = window.setTimeout(() => {
        hydratePresence()
          .then(() => schedule())
          .catch((error) => logDev('Presence poll error', error));
      }, PRESENCE_TTL_SECONDS * 1000);
    };

    schedule();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        hydratePresence()
          .then(() => schedule())
          .catch((error) => logDev('Visibility refresh error', error));
      } else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showDetailPanel, selectedUser?.email, accessToken]);

  useEffect(() => {
    const email = selectedUser?.email;
    if (!email || !showDetailPanel) {
      return;
    }

    if (hasCacheValue(oooCacheRef, email)) {
      return;
    }

    let cancelled = false;

    requestOOO(email, accessToken)
      .then((result) => {
        if (!cancelled) {
          upsertState(setOooCache, email, result);
        }
      })
      .catch((error) => {
        logDev('OOO fetch failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [showDetailPanel, selectedUser?.email, accessToken]);

  const selectedPresence = selectedUser ? presenceCache[selectedUser.email] : undefined;
  const selectedPhoto = selectedUser ? photoCache[selectedUser.email] ?? selectedUser.photo ?? null : null;
  const selectedOOO = selectedUser ? oooCache[selectedUser.email] : undefined;

  const handleSelectUser = (user: EnhancedUser) => {
    setSelectedUser(user);
    prefetchPhoto(user.email);
    prefetchPresence(user.email);
    setShowDetailPanel(true);
  };

  const prefetchPhoto = (email: string) => {
    if (hasCacheValue(photoCacheRef, email)) {
      return;
    }
    requestPhoto(email, accessToken)
      .then((photo) => {
        upsertState(setPhotoCache, email, photo);
      })
      .catch((error) => logDev('Photo prefetch failed', error));
  };

  const prefetchPresence = (email: string) => {
    if (hasCacheValue(presenceCacheRef, email)) {
      return;
    }
    requestPresence(email, { token: accessToken })
      .then((presenceResult) => {
        upsertState(setPresenceCache, email, presenceResult);
      })
      .catch((error) => logDev('Presence prefetch failed', error));
  };

  const handleInsert = async () => {
    if (!selectedUser) {
      addToast('error', 'Select a person first.');
      return;
    }
    if (!officeContext.isCompose) {
      addToast('error', 'Insert is only available when composing a message.');
      return;
    }

    setInserting(true);

    try {
      const markup = buildInsertMarkup(selectedUser, selectedPresence, selectedOOO);
      await insertHtmlAsync(markup);
      addToast('success', 'Details inserted successfully!');
    } catch (error) {
      logDev('Insert failed', error);
      addToast('error', error instanceof Error ? error.message : 'Unable to insert details.');
    } finally {
      setInserting(false);
    }
  };

  const handleAddRecipient = async (kind: 'to' | 'cc' | 'bcc') => {
    if (!selectedUser) {
      addToast('error', 'Select a person first.');
      return;
    }
    if (!officeContext.supportsRecipients) {
      addToast('error', 'Recipients can only be updated while composing.');
      return;
    }

    try {
      await addRecipientAsync(kind, selectedUser);
      addToast('success', `${selectedUser.displayName} added to ${kind.toUpperCase()}.`);
    } catch (error) {
      logDev('Add recipient failed', error);
      addToast('error', error instanceof Error ? error.message : 'Unable to add recipient.');
    }
  };

  const handleRefreshPresence = () => {
    if (!selectedUser) return;
    
    setPresenceRefreshing(true);
    requestPresence(selectedUser.email, { noCache: true, ttl: PRESENCE_TTL_SECONDS, token: accessToken })
      .then((presenceResult) => {
        upsertState(setPresenceCache, selectedUser.email, presenceResult);
        addToast('success', 'Presence updated!');
      })
      .catch((error) => {
        logDev('Manual presence refresh failed', error);
        addToast('error', 'Failed to refresh presence.');
      })
      .finally(() => {
        setPresenceRefreshing(false);
      });
  };

  const orderedResults = useMemo(() => {
    return searchResults.slice().sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
  }, [searchResults]);

  const trimmed = searchQuery.trim();
  const showEmptyState = !searching && trimmed.length >= MIN_QUERY_LENGTH && searchResults.length === 0 && !searchError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            {config.orgLogoUrl ? (
              <img src={config.orgLogoUrl} alt={`${config.orgName} logo`} className="w-10 h-10 rounded-full shadow-md ring-2 ring-white/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-md ring-2 ring-white/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{config.appName}</h1>
              <p className="text-sm text-blue-100">{config.orgName}</p>
            </div>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} isSearching={searching} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Helper text */}
        {trimmed.length < MIN_QUERY_LENGTH && !searching && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <SearchIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Find People Instantly</h2>
            <p className="text-slate-600">
              Start typing a name, email, or job title to search your directory
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Minimum {MIN_QUERY_LENGTH} characters required
            </p>
          </div>
        )}

        {/* Loading */}
        {searching && <SearchSkeleton />}

        {/* Error */}
        {searchError && (
          <div className="text-center py-8">
            <div className="inline-block bg-red-50 text-red-800 px-6 py-4 rounded-xl border border-red-200">
              {searchError}
            </div>
          </div>
        )}

        {/* Empty state */}
        {showEmptyState && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <SearchIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Results Found</h2>
            <p className="text-slate-600">Try a different search term</p>
          </div>
        )}

        {/* Results */}
        {!searching && orderedResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-medium">
              {orderedResults.length} {orderedResults.length === 1 ? 'person' : 'people'} found
            </p>
            {orderedResults.map((user) => (
              <ResultCard
                key={user.id}
                user={user}
                isSelected={selectedUser?.email === user.email}
                onClick={() => handleSelectUser(user)}
                onHover={() => {
                  prefetchPhoto(user.email);
                  prefetchPresence(user.email);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail Panel */}
      {showDetailPanel && selectedUser && (
        <DetailPanel
          user={selectedUser}
          photo={selectedPhoto}
          presence={selectedPresence}
          presenceRefreshing={presenceRefreshing}
          ooo={selectedOOO}
          isCompose={officeContext.isCompose}
          supportsRecipients={officeContext.supportsRecipients}
          onClose={() => setShowDetailPanel(false)}
          onRefreshPresence={handleRefreshPresence}
          onInsert={handleInsert}
          onAddRecipient={handleAddRecipient}
          inserting={inserting}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
