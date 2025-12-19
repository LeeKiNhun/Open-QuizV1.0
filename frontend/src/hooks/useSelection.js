// src/hooks/useSelection.js
import { useState } from "react";
import { useClipboard } from "../context/ClipboardContext";

export function useSelection(items, setItems, options = {}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { clipboard, copyItems, cutItems, clearClipboard } = useClipboard();

  const {
    canDelete = () => true,   // function check xem item có được xóa không
    canCut = () => true,       // function check xem item có được cắt không
    onDeleteSuccess,           // callback sau khi xóa thành công
    onCopySuccess,
    onCutSuccess,
    onPasteSuccess,
  } = options;

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  // Toggle chọn 1 item
  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Chọn tất cả
  const toggleSelectAll = (filteredItems) => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((r) => r.id)));
    }
  };

  // Xóa
  const handleDelete = () => {
    const deletableItems = items.filter(
      (item) => selectedIds.has(item.id) && canDelete(item)
    );

    if (deletableItems.length === 0) {
      alert("Không có mục nào để xóa!");
      return;
    }

    if (!window.confirm(`Xóa ${deletableItems.length} mục đã chọn?`)) return;

    const deletableIds = new Set(deletableItems.map((it) => it.id));
    setItems((prev) => prev.filter((f) => !deletableIds.has(f.id)));
    setSelectedIds(new Set());
    clearClipboard();

    onDeleteSuccess?.();
  };

  // Sao chép
  const handleCopy = () => {
    const selected = items.filter((item) => selectedIds.has(item.id));

    if (selected.length === 0) {
      alert("Chọn ít nhất 1 mục để sao chép!");
      return;
    }

    copyItems(selected);
    onCopySuccess?.(selected.length);
  };

  // Cắt
  const handleCut = () => {
    const selected = items.filter(
      (item) => selectedIds.has(item.id) && canCut(item)
    );

    if (selected.length === 0) {
      alert("Chọn ít nhất 1 mục để cắt!");
      return;
    }

    cutItems(selected);
    onCutSuccess?.(selected.length);
  };

  // Dán
  const handlePaste = () => {
    if (!clipboard?.items?.length) {
      alert("Không có gì để dán!");
      return;
    }

    const now = Date.now();

    if (clipboard.mode === "copy") {
      const newItems = clipboard.items.map((it, idx) => ({
        ...it,
        id: `${it.id}-copy-${now}-${idx}`,
        name: `${it.name} - Copy`,
      }));

      setItems((prev) => [...newItems, ...prev]);
    }

    if (clipboard.mode === "cut") {
      const cutIds = new Set(clipboard.items.map((it) => it.id));
      setItems((prev) => {
        const remaining = prev.filter((f) => !cutIds.has(f.id));
        return [...clipboard.items, ...remaining];
      });
    }

    clearClipboard();
    setSelectedIds(new Set());
    onPasteSuccess?.();
  };

  return {
    selectedIds,
    selectedCount,
    hasSelection,
    clipboard,
    toggleSelect,
    toggleSelectAll,
    handleDelete,
    handleCopy,
    handleCut,
    handlePaste,
    clearSelection: () => setSelectedIds(new Set()),
  };
}