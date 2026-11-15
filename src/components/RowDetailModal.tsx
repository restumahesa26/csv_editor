"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Pencil,
  Trash2,
  Search,
  Columns3,
} from "lucide-react";
import { RowData } from "@/types/csv";

interface RowDetailModalProps {
  row: RowData | null;
  headers: string[];
  rowNumber: number;
  totalRows: number;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrevRow: () => void;
  onNextRow: () => void;
  onSaveCell: (rowId: string, columnKey: string, value: string) => void;
  onDeleteRow: (rowId: string) => void;
}

export default function RowDetailModal({
  row,
  headers,
  rowNumber,
  totalRows,
  hasPrev,
  hasNext,
  onClose,
  onPrevRow,
  onNextRow,
  onSaveCell,
  onDeleteRow,
}: RowDetailModalProps) {
  const [columnSearch, setColumnSearch] = useState("");
  const [editingState, setEditingState] = useState<{ rowId: string; column: string } | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [copiedState, setCopiedState] = useState<{ rowId: string; column: string } | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const editingColumn =
    row && editingState?.rowId === row._row_id ? editingState.column : null;

  // Autofocus textarea when entering edit mode for a column card
  useEffect(() => {
    if (editingColumn && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [editingColumn]);

  // Lock background page scroll and handle keyboard shortcuts
  useEffect(() => {
    if (!row) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingColumn) {
          setEditingState(null);
        } else {
          onClose();
        }
        return;
      }

      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

      if (e.key === "ArrowLeft" && hasPrev) {
        onPrevRow();
      } else if (e.key === "ArrowRight" && hasNext) {
        onNextRow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [row, editingColumn, hasPrev, hasNext, onClose, onPrevRow, onNextRow]);

  const visibleColumns = useMemo(() => {
    const query = columnSearch.trim().toLowerCase();
    return headers
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => {
        if (!query) return true;
        const cellVal = String(row?.[header] ?? "").toLowerCase();
        return header.toLowerCase().includes(query) || cellVal.includes(query);
      });
  }, [headers, columnSearch, row]);

  if (!row) return null;

  const handleCopy = async (header: string, value: string) => {
    const targetRowId = row._row_id;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedState({ rowId: targetRowId, column: header });
      setTimeout(() => {
        setCopiedState((current) =>
          current && current.rowId === targetRowId && current.column === header
            ? null
            : current
        );
      }, 1500);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  const startEditing = (header: string, currentValue: string) => {
    setEditingState({ rowId: row._row_id, column: header });
    setDraftValue(currentValue);
  };

  const saveEdit = (header: string) => {
    onSaveCell(row._row_id, header, draftValue);
    setEditingState(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Row ${rowNumber} Details`}
    >
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Columns3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Row Detail
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  Row #{rowNumber} of {totalRows}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {headers.length} columns
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each card displays one column in full. Click Edit on any card to modify its value.
              </p>
            </div>
          </div>

          {/* Modal Header Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={onPrevRow}
                disabled={!hasPrev}
                className="p-2 text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:bg-slate-50/40 disabled:cursor-not-allowed transition-colors border-r border-slate-200"
                title="Previous Row (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextRow}
                disabled={!hasNext}
                className="p-2 text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:bg-slate-50/40 disabled:cursor-not-allowed transition-colors"
                title="Next Row (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete row #${rowNumber}?`)) {
                  onDeleteRow(row._row_id);
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
              title="Delete Row"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Close Modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Column Filter Bar */}
        {headers.length > 4 && (
          <div className="px-5 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Filter columns by name or value..."
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
              {columnSearch && (
                <button
                  type="button"
                  onClick={() => setColumnSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs font-medium text-slate-500 shrink-0">
              Showing {visibleColumns.length} of {headers.length} columns
            </span>
          </div>
        )}

        {/* Modal Body: 1 Card = 1 Column (Single-column vertical stack) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70">
          {visibleColumns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
              No columns match &ldquo;{columnSearch}&rdquo;.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleColumns.map(({ header, index }) => {
                const value = row[header] ?? "";
                const isEditing = editingColumn === header;
                const isCopied =
                  copiedState?.rowId === row._row_id && copiedState.column === header;
                const charCount = value.length;

                return (
                  <div
                    key={`${row._row_id}-card-${header}-${index}`}
                    className={`bg-white rounded-xl border shadow-2xs overflow-hidden transition-colors ${
                      isEditing
                        ? "border-blue-400 ring-2 ring-blue-100"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-slate-200/70 text-slate-600 text-[11px] font-bold shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 break-all">
                          {header}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {charCount > 0 && (
                          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 px-2 py-0.5 bg-white border border-slate-200/80 rounded-md">
                            {charCount.toLocaleString()} chars
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopy(header, value)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                          title="Copy value"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditing(header, value)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 rounded-md transition-colors"
                            title="Edit value"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            ref={editTextareaRef}
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                saveEdit(header);
                              }
                            }}
                            rows={Math.min(12, Math.max(4, draftValue.split("\n").length + 1))}
                            className="w-full p-3 text-sm text-slate-800 bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y leading-relaxed font-sans"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                              Press Ctrl+Enter to save · Esc to cancel
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingState(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(header)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : value === "" ? (
                        <p className="text-sm text-slate-400 italic select-none">
                          Empty
                        </p>
                      ) : (
                        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words max-h-[420px] overflow-y-auto pr-1">
                          {value}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Use <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono">←</kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono">→</kbd> to switch rows
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
