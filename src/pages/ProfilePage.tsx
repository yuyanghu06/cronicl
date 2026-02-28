import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { useAuth } from "@/lib/auth.tsx";
import { api } from "@/lib/api.ts";
import { Save, Loader2 } from "lucide-react";

interface CreatorProfile {
  stylePreferences: string[];
  favoriteThemes: string[];
  preferredTone: string;
  explorationRatio: number;
  dislikedElements: string[];
}

const DEFAULTS: CreatorProfile = {
  stylePreferences: [],
  favoriteThemes: [],
  preferredTone: "",
  explorationRatio: 0.3,
  dislikedElements: [],
};

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable string versions of array fields (comma-separated)
  const [styleText, setStyleText] = useState("");
  const [themesText, setThemesText] = useState("");
  const [dislikedText, setDislikedText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<CreatorProfile>("/me/profile");
        setProfile(data);
        setStyleText(data.stylePreferences.join(", "));
        setThemesText(data.favoriteThemes.join(", "));
        setDislikedText(data.dislikedElements.join(", "));
      } catch {
        // Use defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    const payload: Partial<CreatorProfile> = {
      stylePreferences: styleText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      favoriteThemes: themesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      preferredTone: profile.preferredTone,
      explorationRatio: profile.explorationRatio,
      dislikedElements: dislikedText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const updated = await api.put<CreatorProfile>("/me/profile", payload);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Stay on current values
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full bg-bg-void border border-border-subtle rounded-xl px-3 py-2 text-fg-bright text-sm font-mono focus:outline-none focus:border-red transition-colors";

  return (
    <AppShell
      statusLeft="PROFILE"
      statusCenter={user?.name ?? user?.email ?? ""}
      statusRight={saved ? "SAVED" : "EDIT"}
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-xl mx-auto space-y-6">
          <DotMatrixText
            as="h1"
            className="text-lg text-fg-bright tracking-widest"
          >
            CREATOR PROFILE
          </DotMatrixText>

          {isLoading ? (
            <SyntMonoText className="text-sm text-fg-muted">
              LOADING...
            </SyntMonoText>
          ) : (
            <>
              {/* User info (read-only) */}
              <Card>
                <SyntMonoText className="text-[10px] text-fg-muted mb-3 block">
                  ACCOUNT
                </SyntMonoText>
                <div className="flex items-center gap-3">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-bg-void border border-border-subtle flex items-center justify-center">
                      <SyntMonoText className="text-sm text-fg-bright">
                        {(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? "U"}
                      </SyntMonoText>
                    </div>
                  )}
                  <div>
                    <SyntMonoText className="text-sm text-fg-bright block">
                      {user?.name ?? "—"}
                    </SyntMonoText>
                    <SyntMonoText className="text-xs text-fg-muted block">
                      {user?.email}
                    </SyntMonoText>
                  </div>
                </div>
              </Card>

              {/* Creator preferences */}
              <Card>
                <SyntMonoText className="text-[10px] text-fg-muted mb-4 block">
                  CREATIVE PREFERENCES
                </SyntMonoText>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">
                      <SyntMonoText className="text-[10px] text-fg-dim">
                        STYLE PREFERENCES
                      </SyntMonoText>
                    </label>
                    <input
                      type="text"
                      value={styleText}
                      onChange={(e) => setStyleText(e.target.value)}
                      placeholder="dark fantasy, nonlinear, surreal..."
                      className={inputClass}
                    />
                    <SyntMonoText className="text-[9px] text-fg-muted mt-1 block">
                      Comma-separated
                    </SyntMonoText>
                  </div>

                  <div>
                    <label className="block mb-1">
                      <SyntMonoText className="text-[10px] text-fg-dim">
                        FAVORITE THEMES
                      </SyntMonoText>
                    </label>
                    <input
                      type="text"
                      value={themesText}
                      onChange={(e) => setThemesText(e.target.value)}
                      placeholder="redemption, isolation, identity..."
                      className={inputClass}
                    />
                    <SyntMonoText className="text-[9px] text-fg-muted mt-1 block">
                      Comma-separated
                    </SyntMonoText>
                  </div>

                  <div>
                    <label className="block mb-1">
                      <SyntMonoText className="text-[10px] text-fg-dim">
                        PREFERRED TONE
                      </SyntMonoText>
                    </label>
                    <input
                      type="text"
                      value={profile.preferredTone}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferredTone: e.target.value,
                        }))
                      }
                      placeholder="literary, cinematic, playful..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      <SyntMonoText className="text-[10px] text-fg-dim">
                        EXPLORATION RATIO
                      </SyntMonoText>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={profile.explorationRatio}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            explorationRatio: parseFloat(e.target.value),
                          }))
                        }
                        className="flex-1 accent-red"
                      />
                      <SyntMonoText className="text-sm text-fg-bright w-10 text-right">
                        {(profile.explorationRatio * 100).toFixed(0)}%
                      </SyntMonoText>
                    </div>
                    <SyntMonoText className="text-[9px] text-fg-muted mt-1 block">
                      0% = fully aligned suggestions // 100% = fully
                      exploratory
                    </SyntMonoText>
                  </div>

                  <div>
                    <label className="block mb-1">
                      <SyntMonoText className="text-[10px] text-fg-dim">
                        DISLIKED ELEMENTS
                      </SyntMonoText>
                    </label>
                    <input
                      type="text"
                      value={dislikedText}
                      onChange={(e) => setDislikedText(e.target.value)}
                      placeholder="deus ex machina, love triangles..."
                      className={inputClass}
                    />
                    <SyntMonoText className="text-[9px] text-fg-muted mt-1 block">
                      Comma-separated — AI will avoid these
                    </SyntMonoText>
                  </div>
                </div>
              </Card>

              {/* Save */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saved ? "SAVED" : "SAVE PROFILE"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
