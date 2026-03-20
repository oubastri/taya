import { SECTION_LABEL, SETTINGS_GLASS_CARD } from "./settingsChrome";

interface SettingsGroupProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SettingsGroup({ title, children, style }: SettingsGroupProps) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {title ? <h2 style={SECTION_LABEL}>{title}</h2> : null}
      <div style={SETTINGS_GLASS_CARD}>{children}</div>
    </div>
  );
}
