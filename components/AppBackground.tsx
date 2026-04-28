import { StyleSheet, View } from 'react-native';

type Props = {
  dark: boolean;
};

export function AppBackground({ dark }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.blob,
          styles.blobOne,
          { backgroundColor: dark ? 'rgba(47,149,220,0.16)' : 'rgba(47,149,220,0.14)' },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobTwo,
          { backgroundColor: dark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.11)' },
        ]}
      />
      <View
        style={[
          styles.grid,
          { borderColor: dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobOne: {
    width: 220,
    height: 220,
    top: -90,
    right: -80,
  },
  blobTwo: {
    width: 180,
    height: 180,
    top: 190,
    left: -110,
  },
  grid: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 18,
    height: 220,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 28,
    opacity: 0.8,
    transform: [{ rotate: '-2deg' }],
  },
});
