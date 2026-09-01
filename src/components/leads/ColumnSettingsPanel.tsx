"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { columnLabel } from "@/lib/leads/columns";
import type { LeadCustomField, TableColumnPref } from "@/lib/types";
import styles from "./ColumnSettingsPanel.module.css";

type Props = {
  open: boolean;
  columns: TableColumnPref[];
  customFields: LeadCustomField[];
  canManageFields: boolean;
  onClose: () => void;
  onSave: (columns: TableColumnPref[]) => void;
  onCreateField: (body: {
    field_key: string;
    label: string;
    field_type: string;
  }) => Promise<void>;
  onDeleteField: (id: string) => Promise<void>;
};

function SortableRow({
  col,
  customFields,
  onChange,
}: {
  col: TableColumnPref;
  customFields: LeadCustomField[];
  onChange: (next: TableColumnPref) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.row}>
      <button type="button" className={styles.drag} {...attributes} {...listeners} aria-label="Drag">
        <span className="material-symbols-outlined">drag_indicator</span>
      </button>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={col.visible}
          onChange={(e) => onChange({ ...col, visible: e.target.checked })}
        />
        <span>{columnLabel(col, customFields)}</span>
      </label>
      <input
        type="range"
        min={80}
        max={400}
        value={col.width}
        className={styles.range}
        onChange={(e) => onChange({ ...col, width: Number(e.target.value) })}
        aria-label="Column width"
      />
      <input
        type="text"
        className={styles.rename}
        placeholder="Rename…"
        value={col.label_override ?? ""}
        onChange={(e) =>
          onChange({ ...col, label_override: e.target.value || null })
        }
      />
    </div>
  );
}

export function ColumnSettingsPanel({
  open,
  columns,
  customFields,
  canManageFields,
  onClose,
  onSave,
  onCreateField,
  onDeleteField,
}: Props) {
  const [draft, setDraft] = useState(columns);
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setDraft(columns);
  }, [open, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const oldIndex = prev.findIndex((c) => c.key === active.id);
      const newIndex = prev.findIndex((c) => c.key === over.id);
      const moved = arrayMove(prev, oldIndex, newIndex).map((c, i) => ({
        ...c,
        order: i,
      }));
      return moved;
    });
  }, []);

  if (!open) return null;

  async function addField() {
    if (!fieldKey.trim() || !fieldLabel.trim()) return;
    setBusy(true);
    try {
      await onCreateField({
        field_key: fieldKey.trim().toLowerCase().replace(/\s+/g, "_"),
        label: fieldLabel.trim(),
        field_type: fieldType,
      });
      setFieldKey("");
      setFieldLabel("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        aria-label="Column settings"
      >
        <header className={styles.header}>
          <h2>Table columns</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <p className={styles.hint}>
          Show, hide, reorder, resize, and rename columns. Saved for you only.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={draft.map((c) => c.key)} strategy={verticalListSortingStrategy}>
            <div className={styles.list}>
              {draft.map((col) => (
                <SortableRow
                  key={col.key}
                  col={col}
                  customFields={customFields}
                  onChange={(next) =>
                    setDraft((prev) => prev.map((c) => (c.key === next.key ? next : c)))
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {canManageFields ? (
          <section className={styles.customSection}>
            <h3>Custom fields</h3>
            <div className={styles.fieldForm}>
              <Field
                label="Key"
                name="field_key"
                value={fieldKey}
                placeholder="e.g. company"
                onChange={setFieldKey}
              />
              <Field
                label="Label"
                name="field_label"
                value={fieldLabel}
                placeholder="Company name"
                onChange={setFieldLabel}
              />
              <label className={styles.selectWrap}>
                <span>Type</span>
                <Select
                  value={fieldType}
                  onChange={setFieldType}
                  options={[
                    { value: "text", label: "Text" },
                    { value: "number", label: "Number" },
                    { value: "date", label: "Date" },
                    { value: "boolean", label: "Yes/No" },
                    { value: "url", label: "URL" },
                    { value: "phone", label: "Phone" },
                    { value: "select", label: "Select" },
                  ]}
                />
              </label>
              <Button type="button" loading={busy} onClick={() => void addField()}>
                Add field
              </Button>
            </div>
            {customFields.length ? (
              <ul className={styles.cfList}>
                {customFields.map((f) => (
                  <li key={f.id}>
                    <span>{f.label}</span>
                    <code>{f.field_key}</code>
                    <button
                      type="button"
                      className={styles.removeCf}
                      onClick={() => void onDeleteField(f.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <footer className={styles.footer}>
          <Button type="button" onClick={() => onSave(draft)}>
            Save view
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </footer>
      </aside>
    </div>
  );
}
