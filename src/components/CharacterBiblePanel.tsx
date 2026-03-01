import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Plus, Trash2, ImageIcon, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { CharacterBibleEntry } from "@/types/character";

interface CharacterBiblePanelProps {
  open: boolean;
  onClose: () => void;
  timelineId: string;
  characters: CharacterBibleEntry[];
  onCharactersChange: (characters: CharacterBibleEntry[]) => void;
}

export function CharacterBiblePanel({
  open,
  onClose,
  timelineId,
  characters,
  onCharactersChange,
}: CharacterBiblePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const basePath = `/api/timelines/${timelineId}/characters`;

  async function handleCreate(data: {
    name: string;
    description: string;
    appearanceGuide: string;
    aliases: string;
  }) {
    const aliasArray = data.aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const entry = await api.post<CharacterBibleEntry>(basePath, {
      name: data.name,
      description: data.description || undefined,
      appearanceGuide: data.appearanceGuide || undefined,
      aliases: aliasArray.length > 0 ? aliasArray : undefined,
    });

    onCharactersChange([...characters, entry]);
    setShowAddForm(false);
    setExpandedId(entry.id);
  }

  async function handleUpdate(
    characterId: string,
    updates: Partial<{
      name: string;
      description: string | null;
      appearanceGuide: string | null;
      aliases: string[] | null;
    }>
  ) {
    const updated = await api.put<CharacterBibleEntry>(
      `${basePath}/${characterId}`,
      updates
    );
    onCharactersChange(
      characters.map((c) => (c.id === characterId ? updated : c))
    );
  }

  async function handleDelete(characterId: string) {
    await api.delete(`${basePath}/${characterId}`);
    onCharactersChange(characters.filter((c) => c.id !== characterId));
    setConfirmDeleteId(null);
    if (expandedId === characterId) setExpandedId(null);
  }

  async function handleGeneratePortrait(characterId: string) {
    setGeneratingPortrait(characterId);
    try {
      const updated = await api.post<CharacterBibleEntry>(
        `${basePath}/${characterId}/generate-portrait`
      );
      onCharactersChange(
        characters.map((c) => (c.id === characterId ? updated : c))
      );
    } catch {
      // Silently fail — user can retry
    } finally {
      setGeneratingPortrait(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-base border-l border-border-subtle overflow-hidden shrink-0 flex flex-col rounded-l-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-10 border-b border-border-subtle shrink-0">
            <span className="font-display text-xs text-fg-dim uppercase tracking-widest">
              CHARACTER BIBLE
            </span>
            <button
              onClick={onClose}
              className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {characters.length === 0 && !showAddForm && (
              <p className="text-fg-muted text-xs font-system text-center py-8">
                No characters yet. Add one to ensure consistent appearance across frames.
              </p>
            )}

            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                expanded={expandedId === char.id}
                onToggle={() =>
                  setExpandedId(expandedId === char.id ? null : char.id)
                }
                onUpdate={(updates) => handleUpdate(char.id, updates)}
                onDelete={() => {
                  if (confirmDeleteId === char.id) {
                    handleDelete(char.id);
                  } else {
                    setConfirmDeleteId(char.id);
                  }
                }}
                confirmingDelete={confirmDeleteId === char.id}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onGeneratePortrait={() => handleGeneratePortrait(char.id)}
                generatingPortrait={generatingPortrait === char.id}
              />
            ))}

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AddCharacterForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowAddForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add button */}
          {!showAddForm && (
            <div className="p-4 border-t border-border-subtle">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={12} />
                ADD CHARACTER
              </Button>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// --- Character Card ---

function CharacterCard({
  character,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  confirmingDelete,
  onCancelDelete,
  onGeneratePortrait,
  generatingPortrait,
}: {
  character: CharacterBibleEntry;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (
    updates: Partial<{
      name: string;
      description: string | null;
      appearanceGuide: string | null;
      aliases: string[] | null;
    }>
  ) => void;
  onDelete: () => void;
  confirmingDelete: boolean;
  onCancelDelete: () => void;
  onGeneratePortrait: () => void;
  generatingPortrait: boolean;
}) {
  const [editName, setEditName] = useState(character.name);
  const [editDescription, setEditDescription] = useState(character.description ?? "");
  const [editAppearance, setEditAppearance] = useState(character.appearanceGuide ?? "");
  const [editAliases, setEditAliases] = useState(character.aliases?.join(", ") ?? "");
  const [dirty, setDirty] = useState(false);

  function handleFieldChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      setDirty(true);
    };
  }

  function handleSave() {
    const aliasArray = editAliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    onUpdate({
      name: editName.trim(),
      description: editDescription.trim() || null,
      appearanceGuide: editAppearance.trim() || null,
      aliases: aliasArray.length > 0 ? aliasArray : null,
    });
    setDirty(false);
  }

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
      >
        {/* Portrait thumbnail or placeholder */}
        <div className="w-8 h-8 rounded-lg bg-bg-void border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center">
          {character.referenceImageUrl ? (
            <img
              src={character.referenceImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-fg-muted text-[10px] font-system">
              {character.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <DotMatrixText className="text-xs text-fg-bright truncate block">
            {character.name}
          </DotMatrixText>
          {character.description && (
            <span className="text-[10px] text-fg-muted font-system truncate block">
              {character.description}
            </span>
          )}
        </div>

        {expanded ? (
          <ChevronDown size={12} className="text-fg-muted shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-fg-muted shrink-0" />
        )}
      </button>

      {/* Expanded edit form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border-subtle pt-3">
              {/* Portrait */}
              {character.referenceImageUrl && (
                <div className="w-full rounded-lg overflow-hidden">
                  <img
                    src={character.referenceImageUrl}
                    alt={`Portrait of ${character.name}`}
                    className="w-full h-[140px] object-cover rounded-lg"
                  />
                </div>
              )}

              <FieldInput label="NAME" value={editName} onChange={handleFieldChange(setEditName)} />
              <FieldInput label="DESCRIPTION" value={editDescription} onChange={handleFieldChange(setEditDescription)} placeholder="Narrative role, personality..." />
              <FieldTextarea
                label="APPEARANCE GUIDE"
                value={editAppearance}
                onChange={handleFieldChange(setEditAppearance)}
                placeholder="Physical appearance for image model..."
                rows={4}
              />
              <FieldInput label="ALIASES" value={editAliases} onChange={handleFieldChange(setEditAliases)} placeholder="Comma-separated nicknames..." />

              <div className="flex items-center gap-2 flex-wrap">
                {dirty && (
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    SAVE
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGeneratePortrait}
                  disabled={generatingPortrait || !character.appearanceGuide}
                >
                  {generatingPortrait ? (
                    <><Loader2 size={10} className="animate-spin" /> GENERATING...</>
                  ) : (
                    <><ImageIcon size={10} /> PORTRAIT</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red hover:text-red"
                  onClick={onDelete}
                  onBlur={onCancelDelete}
                >
                  {confirmingDelete ? "CONFIRM?" : <><Trash2 size={10} /> DELETE</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Add Character Form ---

function AddCharacterForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    name: string;
    description: string;
    appearanceGuide: string;
    aliases: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [appearanceGuide, setAppearanceGuide] = useState("");
  const [aliases, setAliases] = useState("");

  return (
    <div className="border border-border-strong rounded-xl p-3 space-y-3">
      <DotMatrixText className="text-[10px] text-fg-dim tracking-[0.2em]">
        NEW CHARACTER
      </DotMatrixText>

      <FieldInput label="NAME" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <FieldInput label="DESCRIPTION" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Narrative role..." />
      <FieldTextarea
        label="APPEARANCE GUIDE"
        value={appearanceGuide}
        onChange={(e) => setAppearanceGuide(e.target.value)}
        placeholder="Physical appearance for image model..."
        rows={4}
      />
      <FieldInput label="ALIASES" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Comma-separated nicknames..." />

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSubmit({ name, description, appearanceGuide, aliases })}
          disabled={!name.trim()}
        >
          CREATE
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          CANCEL
        </Button>
      </div>
    </div>
  );
}

// --- Shared field components ---

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <DotMatrixText as="label" className="text-[10px] text-fg-dim mb-1 block tracking-[0.2em]">
        {label}
      </DotMatrixText>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-bg-void border border-border-subtle rounded-lg px-2.5 py-1.5 font-narrative text-xs text-fg-bright outline-none focus:border-border-strong transition-colors"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <DotMatrixText as="label" className="text-[10px] text-fg-dim mb-1 block tracking-[0.2em]">
        {label}
      </DotMatrixText>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-bg-void border border-border-subtle rounded-lg px-2.5 py-1.5 font-narrative text-xs text-fg-bright leading-relaxed outline-none focus:border-border-strong transition-colors resize-y"
      />
    </div>
  );
}
