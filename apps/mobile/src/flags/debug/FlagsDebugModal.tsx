import { Modal, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { useState } from 'react';
import { getDiagnostics } from '..';
import { Box, Button, Text } from '../../theme/components';
import type { AppTheme } from '../../theme/themes';
import { getApiBaseUrl } from '../../shared/api/config';
import { requestMagicLink, exchangeMagicLink, logout } from '../../shared/auth/api';
import { apiRequest } from '../../shared/api/client';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { useEntitlements } from '../../shared/entitlements/useEntitlements';

type FlagsDebugModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function FlagsDebugModal({ visible, onClose }: FlagsDebugModalProps) {
  const insets = useSafeAreaInsets();
  const diagnostics = visible ? getDiagnostics() : null;
  const theme = useTheme<AppTheme>();
  const { isAuthenticated } = useAuthSession();
  const entitlements = useEntitlements();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deviceId = diagnostics?.deviceId ?? 'Unavailable';
  const fetchedAt = diagnostics?.remote.fetchedAt ?? null;
  const source = diagnostics
    ? diagnostics.remote.hasRemote
      ? diagnostics.remote.stale
        ? 'cache'
        : 'remote'
      : 'default'
    : 'unknown';

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  } as const;

  const handleRequestLink = async () => {
    setBusy(true);
    setStatus(null);
    const ok = await requestMagicLink(email);
    setStatus(ok ? 'Magic link requested (check server logs in dev).' : 'Request failed.');
    setBusy(false);
  };

  const handleExchange = async () => {
    setBusy(true);
    setStatus(null);
    const ok = await exchangeMagicLink(token);
    setStatus(ok ? 'Signed in.' : 'Exchange failed.');
    setBusy(false);
  };

  const handleLogout = async () => {
    setBusy(true);
    await logout();
    setStatus('Signed out.');
    setBusy(false);
  };

  const handleRefreshCertificate = async () => {
    setBusy(true);
    await entitlements.refreshCertificate();
    setStatus('Certificate refreshed.');
    setBusy(false);
  };

  const handlePing = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await apiRequest<{ ok: boolean; time?: string }>({
        path: '/healthz',
        method: 'GET',
        retryOnUnauthorized: false,
      });
      if (response.ok) {
        setStatus(`API reachable${response.data?.time ? ` (${response.data.time})` : ''}.`);
      } else {
        setStatus(`API ping failed (${response.status}).`);
      }
    } catch (error) {
      console.warn('Failed to ping API', error);
      setStatus('API ping failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: -insets.top,
          left: 0,
          right: 0,
          bottom: -insets.bottom,
          zIndex: 6,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 1,
          }}
          backgroundColor="overlay"
        />
        <Pressable onPress={() => {}} style={{ minWidth: 280, alignSelf: 'center' }}>
          <Box
            marginHorizontal="l"
            backgroundColor="card"
            borderRadius="l"
            borderWidth={1}
            borderColor="borderSubtle"
            padding="l"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <Text variant="heading2" color="text">
              Flags Debug
            </Text>
            <Box marginTop="m">
              <Text variant="caption" color="muted">
                API Base URL
              </Text>
              <Box marginTop="xs">
                <Text variant="body" color="textSecondary" selectable>
                  {getApiBaseUrl()}
                </Text>
              </Box>
            </Box>
            <Box marginTop="m">
              <Text variant="caption" color="muted">
                Device ID
              </Text>
              <Box marginTop="xs">
                <Text variant="body" color="textSecondary" selectable>
                  {deviceId}
                </Text>
              </Box>
            </Box>
            <Box marginTop="m">
              <Text variant="caption" color="muted">
                Source
              </Text>
              <Box marginTop="xs">
                <Text variant="body" color="textSecondary">
                  {source}
                </Text>
              </Box>
            </Box>
            <Box marginTop="m">
              <Text variant="caption" color="muted">
                Last Fetch
              </Text>
              <Box marginTop="xs">
                <Text variant="body" color="textSecondary">
                  {fetchedAt ? new Date(fetchedAt).toISOString() : 'Never'}
                </Text>
              </Box>
            </Box>

            <Box marginTop="l">
              <Text variant="subtitle">Auth Debug</Text>
              <Box marginTop="s">
                <Text variant="caption" color="muted">
                  Status
                </Text>
                <Box marginTop="xs">
                  <Text variant="body" color="textSecondary">
                    {isAuthenticated ? 'Signed in' : 'Signed out'}
                  </Text>
                </Box>
              </Box>
              <Box marginTop="s">
                <Text variant="caption" color="muted">
                  Email
                </Text>
                <Box marginTop="xs">
                  <TextInput
                    style={inputStyle}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </Box>
              </Box>
              <Box marginTop="s">
                <Text variant="caption" color="muted">
                  Magic Token
                </Text>
                <Box marginTop="xs">
                  <TextInput
                    style={inputStyle}
                    value={token}
                    onChangeText={setToken}
                    placeholder="paste token"
                    placeholderTextColor={theme.colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </Box>
              </Box>
              <Box marginTop="s" flexDirection="row" justifyContent="space-between">
                <Button label="Request" size="sm" onPress={handleRequestLink} disabled={busy} />
                <Box width={theme.spacing.s} />
                <Button label="Exchange" size="sm" onPress={handleExchange} disabled={busy} />
              </Box>
              <Box marginTop="s" flexDirection="row" justifyContent="space-between">
                <Button label="Ping API" size="sm" onPress={handlePing} disabled={busy} />
                <Box width={theme.spacing.s} />
                <Button label="Logout" size="sm" onPress={handleLogout} disabled={busy} />
              </Box>
              <Box marginTop="s" flexDirection="row" justifyContent="space-between">
                <Button
                  label="Refresh Cert"
                  size="sm"
                  onPress={handleRefreshCertificate}
                  disabled={busy || !isAuthenticated}
                />
              </Box>
              {status ? (
                <Box marginTop="s">
                  <Text variant="caption" color="muted">
                    {status}
                  </Text>
                </Box>
              ) : null}
            </Box>

            <Box marginTop="m">
              <Text variant="caption" color="muted">
                Entitlements
              </Text>
              <Box marginTop="xs">
                <Text variant="body" color="textSecondary">
                  {entitlements.entitlements.length > 0
                    ? entitlements.entitlements.join(', ')
                    : 'none'}
                </Text>
                <Text variant="caption" color="muted" marginTop="xs">
                  Offline valid until: {entitlements.offlineValidUntil ?? 'n/a'}
                </Text>
              </Box>
            </Box>

            <Box marginTop="l" flexDirection="row" justifyContent="flex-end">
              <Button label="Close" size="sm" onPress={onClose} />
            </Box>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
