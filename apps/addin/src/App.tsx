import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { sdk, PeoplePickerError, type OOOResult, type PresenceResult, type UsersResult } from '@people-picker/sdk';
import { useDebounce } from './hooks/useDebounce';
import { useAuth } from './hooks/useAuth';
import type { EnhancedUser, PublicConfig } from './types';

// Components
import { SearchInput } from './components/SearchInput';
import { UserCard } from './components/UserCard';
import { DetailPanel } from './components/DetailPanel';
import { EmptyState } from './components/EmptyState';
import { SkeletonUserCard } from './components/SkeletonLoader';
import { InlineNotificationContainer } from './components/InlineNotification';

interface OfficeContextState {
  isCompose: boolean;
  supportsRecipients: boolean;
  mailboxUser: {
    displayName: string | null;
    email: string | null;
  };
}

interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
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
      mailboxUser: { displayName: null, email: null },
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
    if (prev[key] === value) return prev;
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

  return `<div style="font-family: 'Inter', 'SF Pro Display', sans-serif; line-height: 1.6; padding: 12px 0;">
    <div style="margin-bottom: 8px;">${lines.join('<br />')}</div>
    <div style="color: #64748b; font-size: 14px;">${presenceLine}</div>
    ${
      oooLine
        ? `<div style="margin-top: 8px; padding: 12px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 8px; color: #92400e;">${oooLine}</div>`
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
        [{ displayName: user.displayName, emailAddress: user.email }],
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
  // Authentication - must be first to block rendering until auth completes
  const { jwt: accessToken, loading: authLoading, error: authError, userEmail } = useAuth();

  const [config, setConfig] = useState<PublicConfig>(defaultConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<EnhancedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [officeContext, setOfficeContext] = useState<OfficeContextState>(getInitialOfficeContext);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [presenceRefreshing, setPresenceRefreshing] = useState(false);
  const [oooError, setOooError] = useState<string | null>(null);
  const [inserting, setInserting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const photoCacheRef = useRef<Record<string, string | null>>({});
  const [photoCache, setPhotoCache] = useState<Record<string, string | null>>({});
  const presenceCacheRef = useRef<Record<string, PresenceResult | null>>({});
  const [presenceCache, setPresenceCache] = useState<Record<string, PresenceResult | null>>({});
  const oooCacheRef = useRef<Record<string, OOOResult | null>>({});
  const [oooCache, setOooCache] = useState<Record<string, OOOResult | null>>({});
  const prefillRef = useRef<string | null>(null);
  const selectedUserRef = useRef<EnhancedUser | null>(null);

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
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Notification utility
  const showNotification = (type: NotificationMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Bootstrap
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


  // Office context and prefill
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
    const sender = messageRead.from ?? messageRead.sender ?? messageRead.organizer ?? null;

    if (sender?.emailAddress) {
      prefillRef.current = sender.emailAddress;
      setSearchQuery(sender.emailAddress);
    } else if (sender?.displayName) {
      prefillRef.current = sender.displayName;
      setSearchQuery(sender.displayName);
    }
  }, []);

  // Search
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

        // Prefetch photos for all search results
        enhanced.forEach((user) => {
          if (!hasCacheValue(photoCacheRef, user.email)) {
            requestPhoto(user.email, accessToken)
              .then((photo) => {
                upsertState(setPhotoCache, user.email, photo);
              })
              .catch((error) => logDev('Photo prefetch failed', error));
          }
        });

        if (prefillRef.current) {
          const match = enhanced.find(
            (user) => user.email.toLowerCase() === prefillRef.current?.toLowerCase(),
          );
          if (match) {
            setSelectedUser(match);
            prefillRef.current = null;
          }
        } else if (selectedUserRef.current) {
          const stillPresent = enhanced.find((user) => user.email === selectedUserRef.current?.email);
          if (stillPresent) {
            setSelectedUser({ ...stillPresent });
          }
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
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

  // Update search results when photos are loaded
  useEffect(() => {
    if (searchResults.length === 0) return;

    setSearchResults((prevResults) => {
      let updated = false;
      const updatedResults = prevResults.map((user) => {
        // Check if photo is now available in cache
        if (Object.prototype.hasOwnProperty.call(photoCache, user.email)) {
          const cachedPhoto = photoCache[user.email] ?? undefined;
          // Only update if the photo value has changed
          if (user.photo !== cachedPhoto) {
            updated = true;
            return { ...user, photo: cachedPhoto };
          }
        }
        return user;
      });

      return updated ? updatedResults : prevResults;
    });
  }, [photoCache]);

  // Presence polling for selected user
  useEffect(() => {
    const email = selectedUser?.email;
    if (!email) return;

    let cancelled = false;
    const controller = new AbortController();

    const hydratePresence = async () => {
      setPresenceRefreshing(true);
      setPresenceError(null);
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
        if (controller.signal.aborted) return;
        logDev('Presence refresh failed', error);
        if (!cancelled) {
          setPresenceError('Presence unavailable');
        }
      } finally {
        if (!cancelled) {
          setPresenceRefreshing(false);
        }
      }
    };

    hydratePresence().catch((error) => logDev('Presence hydrate error', error));

    let timer: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
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
  }, [selectedUser?.email, accessToken]);

  // OOO for selected user
  useEffect(() => {
    const email = selectedUser?.email;
    if (!email) return;
    if (hasCacheValue(oooCacheRef, email)) return;

    let cancelled = false;

    requestOOO(email, accessToken)
      .then((result) => {
        if (!cancelled) {
          upsertState(setOooCache, email, result);
          setOooError(null);
        }
      })
      .catch((error) => {
        logDev('OOO fetch failed', error);
        if (!cancelled) {
          setOooError('Unable to check automatic replies.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser?.email, accessToken]);

  const selectedPresence = selectedUser ? presenceCache[selectedUser.email] : undefined;
  const selectedPhoto = selectedUser ? photoCache[selectedUser.email] ?? selectedUser.photo ?? null : null;
  const selectedOOO = selectedUser ? oooCache[selectedUser.email] : undefined;

  const handleSelectUser = (user: EnhancedUser) => {
    setSelectedUser(user);
    prefetchPhoto(user.email);
    prefetchPresence(user.email);
  };

  const prefetchPhoto = (email: string) => {
    if (hasCacheValue(photoCacheRef, email)) return;
    requestPhoto(email, accessToken)
      .then((photo) => {
        upsertState(setPhotoCache, email, photo);
      })
      .catch((error) => logDev('Photo prefetch failed', error));
  };

  const prefetchPresence = (email: string) => {
    if (hasCacheValue(presenceCacheRef, email)) return;
    requestPresence(email, { token: accessToken })
      .then((presenceResult) => {
        upsertState(setPresenceCache, email, presenceResult);
      })
      .catch((error) => logDev('Presence prefetch failed', error));
  };

  const handleInsert = async () => {
    if (!selectedUser) {
      showNotification('error', 'Select a person first.');
      return;
    }
    if (!officeContext.isCompose) {
      showNotification('error', 'Insert is only available when composing a message.');
      return;
    }

    setInserting(true);
    showNotification('info', 'Inserting details...');

    try {
      const markup = buildInsertMarkup(selectedUser, selectedPresence, selectedOOO);
      await insertHtmlAsync(markup);
      showNotification('success', 'Details inserted successfully!');
    } catch (error) {
      logDev('Insert failed', error);
      showNotification('error', error instanceof Error ? error.message : 'Unable to insert details.');
    } finally {
      setInserting(false);
    }
  };

  const handleAddRecipient = async (kind: 'to' | 'cc' | 'bcc') => {
    if (!selectedUser) {
      showNotification('error', 'Select a person first.');
      return;
    }
    if (!officeContext.supportsRecipients) {
      showNotification('error', 'Recipients can only be updated while composing.');
      return;
    }

    try {
      await addRecipientAsync(kind, selectedUser);
      showNotification('success', `${selectedUser.displayName} added to ${kind.toUpperCase()}.`);
    } catch (error) {
      logDev('Add recipient failed', error);
      showNotification('error', error instanceof Error ? error.message : 'Unable to add recipient.');
    }
  };

  const orderedResults = useMemo(() => {
    return searchResults.slice().sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
  }, [searchResults]);

  const trimmed = searchQuery.trim();
  const showEmptyState = !searching && trimmed.length >= MIN_QUERY_LENGTH && searchResults.length === 0 && !searchError;

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Authenticating...</p>
          <p className="text-slate-500 text-sm mt-2">Signing in with Office 365</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (authError || !accessToken) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-slate-600 text-center mb-4">
              {authError || 'Unable to authenticate with Office 365'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">
              If this issue persists, please contact your administrator or try restarting Outlook.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Main Container */}
      <div className="max-w-2xl mx-auto min-h-full flex flex-col">
        {/* Fixed Blue Header with Search */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 px-4 py-4 shadow-lg"
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            isSearching={searching}
            placeholder="Search by name, title, or email..."
            autoFocus
          />
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-4 space-y-4 custom-scrollbar overflow-y-auto">
          {/* Back Button (when user is selected) */}
          {selectedUser && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to search results</span>
            </motion.button>
          )}

          {/* Inline Notifications - positioned below back button */}
          <InlineNotificationContainer
            notifications={notifications}
            onRemove={removeNotification}
            maxVisible={3}
          />

          {/* Search Error */}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            >
              {searchError}
            </motion.div>
          )}

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {selectedUser ? (
              /* Detail View */
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <DetailPanel
                  user={selectedUser}
                  photo={selectedPhoto}
                  presence={selectedPresence}
                  presenceRefreshing={presenceRefreshing}
                  presenceError={presenceError}
                  ooo={selectedOOO}
                  oooError={oooError}
                  onRefreshPresence={() => {
                    if (!selectedUser) return;
                    setPresenceRefreshing(true);
                    requestPresence(selectedUser.email, { noCache: true, ttl: PRESENCE_TTL_SECONDS, token: accessToken })
                      .then((presenceResult) => {
                        upsertState(setPresenceCache, selectedUser.email, presenceResult);
                        setPresenceError(null);
                      })
                      .catch((error) => {
                        logDev('Manual presence refresh failed', error);
                        setPresenceError('Presence unavailable');
                      })
                      .finally(() => {
                        setPresenceRefreshing(false);
                      });
                  }}
                  isCompose={officeContext.isCompose}
                  supportsRecipients={officeContext.supportsRecipients}
                  inserting={inserting}
                  onInsert={handleInsert}
                  onAddTo={() => handleAddRecipient('to')}
                  onAddCc={() => handleAddRecipient('cc')}
                  onAddBcc={() => handleAddRecipient('bcc')}
                />
              </motion.div>
            ) : searching ? (
              /* Loading Skeletons */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[...Array(3)].map((_, i) => (
                  <SkeletonUserCard key={i} />
                ))}
              </motion.div>
            ) : trimmed.length < MIN_QUERY_LENGTH ? (
              /* Initial Empty State */
              <EmptyState type="initial" minQueryLength={MIN_QUERY_LENGTH} />
            ) : showEmptyState ? (
              /* No Results */
              <EmptyState type="no-results" query={trimmed} />
            ) : orderedResults.length > 0 ? (
              /* Search Results */
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {orderedResults.map((user, index) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={false}
                    onClick={() => handleSelectUser(user)}
                    onHover={() => {
                      prefetchPhoto(user.email);
                    }}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
