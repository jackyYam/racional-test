"use client";

import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { updateThemePreset } from "@/lib/theme-utils";
import { THEME_PRESET_OPTIONS, ThemePreset } from "@/types/preferences/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function ThemePresets() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);

  const handleThemeChange = async (key: string, value: any) => {
    if (key === "theme_preset") {
      updateThemePreset(value);
      setThemePreset(value as ThemePreset);
    }
  };

  return (
    <div className="flex w-full items-center gap-1">
      <Label className="hidden text-xs font-medium lg:block">Preset</Label>
      <Select value={themePreset} onValueChange={(value) => handleThemeChange("theme_preset", value)}>
        <SelectTrigger size="sm" className="w-full text-xs">
          <SelectValue placeholder="Preset" />
        </SelectTrigger>
        <SelectContent>
          {THEME_PRESET_OPTIONS.map((preset) => (
            <SelectItem key={preset.value} className="text-xs" value={preset.value}>
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: themeMode === "dark" ? preset.primary.dark : preset.primary.light,
                }}
              />
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
