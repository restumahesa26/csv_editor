"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Check, 
  X, 
  RefreshCw, 
  HelpCircle,
  PlusCircle,
  FileCode2
} from "lucide-react";
import Papa from "papaparse";

// Interfaces
interface RowData {
  _row_id: string;
  [key: string]: string;
}

interface EditCellState {
  rowId: string;
  columnKey: string;
}

interface EditHeaderState {
  index: number;
  value: string;
}

export default function CSVEditor() {
  // State variables
  const [data, setData] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingCell, setEditingCell] = useState<EditCellState | null>(null);
  const [editingHeader, setEditingHeader] = useState<EditHeaderState | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  
  // Input references for autofocusing
  const cellInputRef = useRef<any>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const addColumnInputRef = useRef<HTMLInputElement>(null);

  // New column state
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [isAddingColumn, setIsAddingColumn] = useState<boolean>(false);

  // Reset pagination when data changes or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchQuery]);

  // Focus inputs when entering edit mode
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (editingHeader && headerInputRef.current) {
      headerInputRef.current.focus();
      headerInputRef.current.select();
    }
  }, [editingHeader]);

  // Load Demo Data
  const loadDemoData = () => {
    const demoHeaders = ["ID", "Title", "Sentiment", "Source", "Review Text", "Rating"];
    const demoRows = [
      {
        _row_id: "demo-1",
        ID: "1",
        Title: "Sangat Membantu",
        Sentiment: "Positive",
        Source: "Google Play Store",
        "Review Text": "Aplikasi ini sangat mempermudah saya mengedit data CSV hasil crawl di mana saja.",
        Rating: "5"
      },
      {
        _row_id: "demo-2",
        ID: "2",
        Title: "Biasa saja",
        Sentiment: "Neutral",
        Source: "App Store",
        "Review Text": "UI bersih tapi fiturnya masih standar. Semoga ke depan lebih baik untuk ekspor file besar.",
        Rating: "3"
      },
      {
        _row_id: "demo-3",
        ID: "3",
        Title: "Error saat loading",
        Sentiment: "Negative",
        Source: "Google Play Store",
        "Review Text": "Sering terjadi format berantakan saat diekspor dari web scraper lama saya.",
        Rating: "1"
      },
      {
        _row_id: "demo-4",
        ID: "4",
        Title: "Desain Keren",
        Sentiment: "Positive",
        Source: "Direct Feedback",
        "Review Text": "Tema putihnya sangat premium dan minimalis. Sangat menyukai font dan micro-animations.",
        Rating: "5"
      },
      {
        _row_id: "demo-5",
        ID: "5",
        Title: "Format Tanggal Bermasalah",
        Sentiment: "Negative",
        Source: "Web Scraper",
        "Review Text": "Tanggal terformat sebagai string aneh, untung ada editor ini untuk merapikannya secara manual.",
        Rating: "2"
      }
    ];
    setHeaders(demoHeaders);
    setData(demoRows);
    setFileName("demo_sentiment_data.csv");
  };

  // Parse CSV file
  const handleParseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        let parsedHeaders = results.meta.fields || [];
        if (parsedHeaders.length === 0 && results.data.length > 0) {
          parsedHeaders = Object.keys(results.data[0] as any);
        }
        
        // Map data to include a unique _row_id
        const parsedData = (results.data as any[]).map((row, index) => {
          const rowId = `row-${index}-${Date.now()}`;
          const cleanedRow: RowData = { _row_id: rowId };
          parsedHeaders.forEach(header => {
            cleanedRow[header] = String(row[header] ?? "");
          });
          return cleanedRow;
        });

        setHeaders(parsedHeaders);
        setData(parsedData);
        setFileName(file.name);
      },
      error: (error) => {
        alert("Error parsing CSV file: " + error.message);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleParseCSV(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      handleParseCSV(file);
    } else {
      alert("Please upload a valid CSV file (.csv)");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (data.length === 0) return;

    // Remove internal _row_id keys before exporting
    const exportData = data.map(({ _row_id, ...rest }) => rest);
    
    // Unparse to CSV string
    const csvString = Papa.unparse({
      fields: headers,
      data: exportData
    });

    // Create Blob and trigger download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Set file name (append _edited if name exists, otherwise default)
    const exportName = fileName 
      ? fileName.replace(/\.csv$/, "_edited.csv")
      : "edited_data.csv";
      
    link.setAttribute("download", exportName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear data
  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data and start fresh?")) {
      setData([]);
      setHeaders([]);
      setFileName("");
      setSearchQuery("");
      setEditingCell(null);
      setEditingHeader(null);
    }
  };

  // Row Management
  const handleAddRow = () => {
    const rowId = `row-new-${Date.now()}`;
    const newRow: RowData = { _row_id: rowId };
    headers.forEach(h => {
      newRow[h] = "";
    });
    
    // Append at the end of the table
    setData([...data, newRow]);
    
    // Scroll to new row and highlight it if paginated
    const totalPages = Math.ceil((data.length + 1) / rowsPerPage);
    setCurrentPage(totalPages);
  };

  const handleDeleteRow = (rowId: string) => {
    setData(data.filter(row => row._row_id !== rowId));
    if (editingCell?.rowId === rowId) {
      setEditingCell(null);
    }
  };

  // Cell Editing
  const handleCellSave = (rowId: string, columnKey: string, value: string) => {
    setData(prevData => 
      prevData.map(row => 
        row._row_id === rowId ? { ...row, [columnKey]: value } : row
      )
    );
    setEditingCell(null);
  };

  // Column Management
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newColumnName.trim();
    if (!name) return;
    
    if (headers.includes(name)) {
      alert("A column with this name already exists.");
      return;
    }

    setHeaders([...headers, name]);
    setData(prevData => 
      prevData.map(row => ({ ...row, [name]: "" }))
    );
    setNewColumnName("");
    setIsAddingColumn(false);
  };

  const handleDeleteColumn = (colName: string) => {
    if (window.confirm(`Are you sure you want to delete column "${colName}"?`)) {
      setHeaders(headers.filter(h => h !== colName));
      setData(prevData => 
        prevData.map(row => {
          const { [colName]: _, ...rest } = row;
          return rest as RowData;
        })
      );
      if (editingCell?.columnKey === colName) {
        setEditingCell(null);
      }
    }
  };

  const handleHeaderRenameSave = (index: number, newName: string) => {
    const cleanedNewName = newName.trim();
    const oldName = headers[index];
    
    if (!cleanedNewName) {
      setEditingHeader(null);
      return;
    }

    if (oldName === cleanedNewName) {
      setEditingHeader(null);
      return;
    }

    if (headers.includes(cleanedNewName) && headers.indexOf(cleanedNewName) !== index) {
      alert("A column with this name already exists.");
      return;
    }

    // Update headers array
    const updatedHeaders = [...headers];
    updatedHeaders[index] = cleanedNewName;
    setHeaders(updatedHeaders);

    // Update keys in data objects
    setData(prevData => 
      prevData.map(row => {
        const { [oldName]: val, ...rest } = row;
        return { ...rest, [cleanedNewName]: val ?? "" } as RowData;
      })
    );

    setEditingHeader(null);
  };

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = String(a[sortConfig.key] || "").toLowerCase();
      const bValue = String(b[sortConfig.key] || "").toLowerCase();
      
      // Handle numerical sort if values are numbers
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Filtering / Search Logic
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sortedData;
    
    const query = searchQuery.toLowerCase().trim();
    return sortedData.filter(row => {
      return headers.some(header => {
        const value = String(row[header] || "");
        return value.toLowerCase().includes(query);
      });
    });
  }, [sortedData, searchQuery, headers]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;

  return (
    <div className="flex flex-col flex-1 bg-[#fcfcfc] text-slate-800 font-sans min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Antigravity CSV Editor</h1>
            <p className="text-xs text-slate-500 font-medium">
              {fileName ? (
                <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  {fileName}
                </span>
              ) : (
                "Lightweight data viewer & editor for clean web scraping reviews"
              )}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {data.length === 0 ? (
            <button
              onClick={loadDemoData}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-sm font-semibold bg-slate-50/50 hover:bg-slate-50 transition-all duration-150"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Load Demo CSV
            </button>
          ) : (
            <>
              <button
                onClick={handleClearData}
                className="flex items-center gap-1.5 px-4 py-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-sm font-semibold transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Clear Table
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-150"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {data.length === 0 ? (
          /* Empty State / Upload Screen */
          <div className="flex flex-col flex-1 justify-center items-center py-20">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-xl p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                isDragging 
                  ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="p-4 bg-slate-50 rounded-full mb-5 text-slate-400">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Scraped CSV Data</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                Drag and drop your <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono font-bold text-slate-700">.csv</code> file here or browse files to start cleaning.
              </p>
              
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-all duration-150">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={loadDemoData}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all duration-150"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  Try Sample Data
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mt-12 w-full px-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Double-Click to Edit</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Change headers, reviews, or classification values on the fly easily.</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Row Management</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Add new samples or wipe out scraping noise and empty rows in one click.</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Unparse & Download</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Perfect CSV structure export that works out of the box in Excel and Python.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor Dashboard View */
          <div className="flex flex-col flex-1 gap-6">
            
            {/* Stats Dashboard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Rows</p>
                  <h3 className="text-2xl font-bold text-slate-950 mt-1">{data.length}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Columns</p>
                  <h3 className="text-2xl font-bold text-slate-950 mt-1">{headers.length}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <FileCode2 className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filtered Items</p>
                  <h3 className="text-2xl font-bold text-slate-950 mt-1">{filteredData.length}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Workspace</p>
                  <h3 className="text-sm font-bold text-blue-600 mt-2 truncate max-w-[180px]">{fileName}</h3>
                </div>
                <button 
                  onClick={handleClearData}
                  className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-105 rounded-xl transition-all"
                  title="Clear Table"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Local Toolbar: Search, Add Row/Col, Pagination Settings */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative min-w-[280px] max-w-md w-full sm:w-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search table values..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Data Modifiers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                  Add Row
                </button>

                {/* Add Column Button / Form Inline */}
                {isAddingColumn ? (
                  <form onSubmit={handleAddColumnSubmit} className="flex items-center gap-1">
                    <input
                      ref={addColumnInputRef}
                      type="text"
                      placeholder="Col Name"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="px-3 py-1.5 border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 rounded-lg text-sm w-36"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Confirm Add"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnName("");
                      }}
                      className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    Add Column
                  </button>
                )}
              </div>
            </div>

            {/* Editable Data Table Container */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1">
              
              {/* Full Width Table Scroll Area */}
              <div className="overflow-x-auto custom-table-container">
                <table className="w-full border-collapse text-left relative">
                  
                  {/* Table Header */}
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      
                      {/* Action column header */}
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-12 border-r border-slate-200/50 bg-slate-50">
                        #
                      </th>
                      
                      {/* Dynamic CSV headers */}
                      {headers.map((header, idx) => (
                        <th 
                          key={`header-${idx}`}
                          className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200/50 last:border-r-0 hover:bg-slate-100/50 transition-colors bg-slate-50"
                        >
                          <div className="flex items-center justify-between group">
                            
                            {/* Editable Header Name */}
                            {editingHeader?.index === idx ? (
                              <input
                                ref={headerInputRef}
                                type="text"
                                defaultValue={editingHeader.value}
                                onBlur={(e) => handleHeaderRenameSave(idx, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleHeaderRenameSave(idx, e.currentTarget.value);
                                  } else if (e.key === "Escape") {
                                    setEditingHeader(null);
                                  }
                                }}
                                className="px-2 py-0.5 text-xs border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 rounded bg-white text-slate-800 uppercase font-bold w-full"
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => setEditingHeader({ index: idx, value: header })}
                                className="cursor-pointer select-none hover:text-blue-600 transition-colors flex-1"
                                title="Double-click to rename column"
                              >
                                {header}
                              </span>
                            )}

                            {/* Column action triggers */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                              <button
                                onClick={() => handleSort(header)}
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                                title="Sort Column"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteColumn(header)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Delete Column"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td 
                          colSpan={headers.length + 1}
                          className="px-6 py-16 text-center text-sm text-slate-400"
                        >
                          No matching records found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row, rowIndex) => {
                        const globalIndex = (currentPage - 1) * rowsPerPage + rowIndex + 1;
                        return (
                          <tr 
                            key={row._row_id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            
                            {/* Action / Index cell */}
                            <td className="px-2 py-2 text-xs font-semibold text-slate-400 text-center bg-slate-50/40 border-r border-slate-100/80">
                              <div className="flex items-center justify-center group-hover:hidden">
                                {globalIndex}
                              </div>
                              <div className="hidden group-hover:flex items-center justify-center">
                                <button
                                  onClick={() => handleDeleteRow(row._row_id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Data Cells */}
                            {headers.map((header) => {
                              const cellValue = row[header] ?? "";
                              const isEditing = 
                                editingCell?.rowId === row._row_id && 
                                editingCell?.columnKey === header;

                              return (
                                <td 
                                  key={`${row._row_id}-${header}`}
                                  className={`px-4 py-2 text-sm text-slate-600 border-r border-slate-100/50 last:border-r-0 relative min-w-[160px] max-w-md cursor-pointer hover:bg-blue-50/20 hover:text-slate-900 transition-colors ${
                                    isEditing ? "bg-blue-50/40" : ""
                                  }`}
                                  onDoubleClick={() => setEditingCell({ rowId: row._row_id, columnKey: header })}
                                >
                                  {isEditing ? (
                                    <textarea
                                      ref={cellInputRef}
                                      defaultValue={cellValue}
                                      onBlur={(e) => handleCellSave(row._row_id, header, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleCellSave(row._row_id, header, e.currentTarget.value);
                                        } else if (e.key === "Escape") {
                                          setEditingCell(null);
                                        }
                                      }}
                                      className="absolute inset-0 px-4 py-2 text-sm text-slate-800 bg-white border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 w-full h-full z-10 resize-none font-sans"
                                    />
                                  ) : (
                                    <div 
                                      className="w-full h-full whitespace-pre-wrap break-words"
                                      title={cellValue ? String(cellValue) : "Double-click to edit"}
                                    >
                                      {cellValue === "" ? (
                                        <span className="text-slate-300 italic select-none">empty</span>
                                      ) : (
                                        cellValue
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Bottom Action bar & Pagination */}
              <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Stats and Help Tips */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    Double click headers or cells to edit them directly.
                  </span>
                  <span className="hidden sm:inline border-r border-slate-300 h-3.5"></span>
                  <span>
                    Showing <strong className="text-slate-800">{Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)}</strong> to <strong className="text-slate-800">{Math.min(filteredData.length, currentPage * rowsPerPage)}</strong> of <strong className="text-slate-800">{filteredData.length}</strong> items
                  </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-3">
                  
                  {/* Rows Per Page Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 bg-white px-2 py-1 rounded outline-none font-bold text-slate-700"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <span className="border-r border-slate-200 h-4"></span>

                  {/* Previous / Next Page */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:text-slate-300 disabled:bg-slate-50/50 disabled:border-slate-100 disabled:cursor-not-allowed transition-all"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-xs font-semibold text-slate-600 px-1">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:text-slate-300 disabled:bg-slate-50/50 disabled:border-slate-100 disabled:cursor-not-allowed transition-all"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
