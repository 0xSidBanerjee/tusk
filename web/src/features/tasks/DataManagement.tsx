import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Upload, 
  FileJson, 
  FileText, 
  FileCode, 
  Archive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Database,
  Info
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImportResult {
  ListsCreated: number;
  ListsMerged: number;
  TasksImported: number;
  TasksSkipped: { Title: string; Reason: string }[];
}

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataManagement({ isOpen, onClose }: DataManagementProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("export");
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: string) => {
    window.location.href = `/api/v1/export?format=${format}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImportFile(selectedFile);
      setImportError(null);
      setImportResult(null);
      // Auto-start import
      startImport(selectedFile);
    }
  };

  const startImport = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/v1/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(response.data);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    } catch (err: any) {
      setImportError(err.response?.data?.error || "Import failed. Please check the file format.");
      setImportFile(null);
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
  };

  const exportFormats = [
    { id: "json", name: "JSON", icon: FileJson, color: "text-yellow-500", bg: "bg-yellow-500/10", desc: "Standard data exchange format" },
    { id: "yaml", name: "YAML", icon: FileText, color: "text-green-500", bg: "bg-green-500/10", desc: "Human-readable configuration format" },
    { id: "toml", name: "TOML", icon: FileCode, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Minimal configuration format" },
    { id: "csv", name: "CSV", icon: Archive, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Tasks & Lists as a ZIP of CSVs" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-none shadow-2xl">
        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-48 bg-muted/30 border-r p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2 py-4 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-sm">Import / Export</span>
            </div>
            
            <button
              onClick={() => setActiveTab("export")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all",
                activeTab === "export" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all",
                activeTab === "import" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-bold">
                {activeTab === "export" ? "Export Your Workspace" : "Import Workspace Data"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {activeTab === "export" 
                  ? "Download your tasks and lists in various portable formats." 
                  : "Import tasks and lists from a supported file format"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === "export" ? (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {exportFormats.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => handleExport(fmt.id)}
                        className="group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left relative overflow-hidden"
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-colors", fmt.bg)}>
                          <fmt.icon className={cn("w-5 h-5", fmt.color)} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{fmt.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{fmt.desc}</p>
                        </div>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-3 h-3 text-primary" />
                        </div>
                      </button>
                    ))}
                    
                    <div className="col-span-2 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        All exports include your tasks and lists. CSV exports are bundled in a ZIP file for compatibility.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="import"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="h-full flex flex-col"
                  >
                    {!importResult && !isImporting && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) startImport(e.dataTransfer.files[0]);
                        }}
                        className="flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-all cursor-pointer group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".json,.yaml,.yml,.toml,.csv,.zip"
                          className="hidden"
                        />
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold">Select a file to restore</p>
                          <p className="text-[10px] text-muted-foreground mt-1">JSON, YAML, TOML or CSV Zip</p>
                        </div>
                      </div>
                    )}

                    {isImporting && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Database className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">Restoring workspace...</p>
                          <p className="text-[10px] text-muted-foreground mt-1">This will only take a moment</p>
                        </div>
                      </div>
                    )}

                    {importResult && (
                      <div className="space-y-6 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 text-green-600 border border-green-500/20">
                          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-sm">Workspace Restored!</p>
                            <p className="text-[10px] opacity-80">Your data has been successfully imported.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border bg-muted/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Lists</p>
                            <p className="text-3xl font-black">{importResult.ListsCreated + importResult.ListsMerged}</p>
                            <div className="flex gap-2 text-[9px] mt-1 text-muted-foreground">
                              <span>{importResult.ListsCreated} created</span>
                              <span>•</span>
                              <span>{importResult.ListsMerged} merged</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl border bg-muted/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tasks</p>
                            <p className="text-3xl font-black">{importResult.TasksImported}</p>
                            <p className="text-[9px] mt-1 text-muted-foreground">
                              {importResult.TasksSkipped.length} skipped (duplicates)
                            </p>
                          </div>
                        </div>

                        <Button className="w-full h-11 rounded-xl font-bold" onClick={resetImport}>
                          Import Another File
                        </Button>
                      </div>
                    )}

                    {importError && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="font-bold">Import Failed</p>
                          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">{importError}</p>
                        </div>
                        <Button variant="outline" onClick={resetImport} className="rounded-xl px-8">
                          Try Again
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
