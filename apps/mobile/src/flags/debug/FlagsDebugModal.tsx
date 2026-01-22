import { Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDiagnostics } from '..';
import { Box, Button, Text } from '../../theme/components';

type FlagsDebugModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function FlagsDebugModal({ visible, onClose }: FlagsDebugModalProps) {
  const insets = useSafeAreaInsets();
  const diagnostics = visible ? getDiagnostics() : null;

  const deviceId = diagnostics?.deviceId ?? 'Unavailable';
  const fetchedAt = diagnostics?.remote.fetchedAt ?? null;
  const source = diagnostics
    ? diagnostics.remote.hasRemote
      ? diagnostics.remote.stale
        ? 'cache'
        : 'remote'
      : 'default'
    : 'unknown';

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
        <Pressable onPress={() => {}} style={{ minWidth: 260, alignSelf: 'center' }}>
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
            <Box marginTop="l" flexDirection="row" justifyContent="flex-end">
              <Button label="Close" size="sm" onPress={onClose} />
            </Box>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
