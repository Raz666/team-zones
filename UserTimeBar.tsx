import { Pressable, StyleSheet, Text, View } from 'react-native';

type UserTimeBarProps = {
  time: Date;
  onChange: () => void;
  onReset: () => void;
};

export function UserTimeBar({ time, onChange, onReset }: UserTimeBarProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.dayBadge}>
        <Text style={styles.dayText}>{formatUserDay(time)}</Text>
      </View>

      <View style={styles.footerContent}>
        <Pressable style={[styles.button, styles.ghost]} onPress={onReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>

        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatUserTime(time)}</Text>
        </View>

        <Pressable style={styles.button} onPress={onChange}>
          <Text style={styles.buttonText}>Change</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatUserTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatUserDay(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBlockStart: 10,
    paddingBlockEnd: 26,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#5f0f40',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    color: '#e0fbfc',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1c2541',
  },
  dayText: {
    color: '#98c1d9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
