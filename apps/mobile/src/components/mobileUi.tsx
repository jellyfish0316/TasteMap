import { colors } from "@tastemap/tokens";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-2">
      <View className="flex-1">
        <Text className="font-sans text-2xl font-extrabold text-ink">{title}</Text>
        {subtitle && (
          <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

export function IconButton({
  label,
  icon,
  onPress,
  variant = "surface",
  disabled,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: "surface" | "accent" | "danger";
  disabled?: boolean;
}) {
  const bg =
    variant === "accent" ? "bg-accent" : variant === "danger" ? "bg-danger-bg" : "bg-surface";
  const fg =
    variant === "accent" ? "text-on-accent" : variant === "danger" ? "text-danger" : "text-ink";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={`h-11 min-w-11 items-center justify-center rounded-pill px-4 shadow-sh-1 ${bg}`}
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <Text className={`font-sans text-base font-extrabold ${fg}`}>{icon}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  tone = "accent",
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: "accent" | "neutral" | "danger";
}) {
  const bg =
    tone === "accent" ? "bg-accent" : tone === "danger" ? "bg-danger-bg" : "bg-surface-3";
  const fg =
    tone === "accent" ? "text-on-accent" : tone === "danger" ? "text-danger" : "text-ink";

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      className={`h-12 items-center justify-center rounded-md px-4 ${bg}`}
      style={{ opacity: busy || disabled ? 0.55 : 1 }}
    >
      {busy ? (
        <ActivityIndicator color={tone === "accent" ? colors["on-accent"] : colors.ink.DEFAULT} />
      ) : (
        <Text className={`font-sans text-sm font-extrabold ${fg}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.ink[3]}
      className="min-h-12 rounded-md border border-line-2 bg-surface px-4 py-3 font-sans text-base text-ink"
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
}) {
  const cls =
    tone === "accent"
      ? "bg-accent-tint text-accent-ink"
      : tone === "ok"
        ? "bg-ok-bg text-ok"
        : tone === "warn"
          ? "bg-warn-bg text-warn"
          : tone === "danger"
            ? "bg-danger-bg text-danger"
            : "bg-surface-3 text-ink-2";
  return (
    <View className={`rounded-pill px-2.5 py-1 ${cls.split(" ")[0]}`}>
      <Text className={`font-sans text-xs font-bold ${cls.split(" ")[1]}`}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View className="rounded-md border border-dashed border-line-2 bg-surface-2 p-4">
      <Text className="font-sans text-base font-extrabold text-ink">{title}</Text>
      {body && <Text className="mt-1 font-sans text-sm leading-5 text-ink-3">{body}</Text>}
    </View>
  );
}

export function Avatar({ label, size = 44 }: { label: string; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-full bg-accent"
      style={{ width: size, height: size }}
    >
      <Text className="font-sans text-lg font-extrabold text-on-accent">
        {(label || "?").slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
