"use client";

import React, { useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { calculateFileHash } from "@/lib/hashing";
import { Category } from "@/types/category";
import { SyncFileItem, SyncSummaryResult } from "@/types/sync";
import {
  UploadCloud,
  X,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileImage,
  FolderTree,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSyncComplete?: () => void;
}

type SyncStep = "select" | "processing" | "completed";

export function SyncModal({ isOpen, onClose, categories, onSyncComplete }: SyncModalProps) {
  const [step, setStep] = useState<SyncStep>("select");
  const [selectedFiles, setSelectedFiles] = useState<SyncFileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showUploadedList, setShowUploadedList] = useState<boolean>(false);
  const [showSkippedList, setShowSkippedList] = useState<boolean>(false);
  const [showFailedList, setShowFailedList] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [summary, setSummary] = useState<SyncSummaryResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Reset modal state
  const handleReset = () => {
    setStep("select");
    setSelectedFiles([]);
    setProgressPercent(0);
    setProcessedCount(0);
    setUploadedCount(0);
    setDuplicateCount(0);
    setFailedCount(0);
    setIsPaused(false);
    setSummary(null);
    setStatusMessage("");
    setShowUploadedList(false);
    setShowSkippedList(false);
    setShowFailedList(false);
    isCancelledRef.current = false;
  };

  if (!isOpen) return null;

  // Handle file selection from phone or desktop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    const syncItems: SyncFileItem[] = filesArray.map((f, idx) => ({
      id: `sync-${idx}-${Date.now()}`,
      file: f,
      filename: f.name,
      size: f.size,
      status: "pending",
      progress: 0,
    }));

    setSelectedFiles(syncItems);
  };

  // Start Sync Process
  const startSync = async (filesToProcess: SyncFileItem[] = selectedFiles) => {
    if (filesToProcess.length === 0) return;

    setStep("processing");
    isCancelledRef.current = false;
    setIsPaused(false);

    const total = filesToProcess.length;
    let processed = 0;
    let uploaded = 0;
    let duplicates = 0;
    let failed = 0;

    const uploadedNames: string[] = [];
    const duplicateNames: string[] = [];
    const failedItems: { filename: string; reason: string }[] = [];

    setStatusMessage("Calculating secure image hashes to check for duplicates...");

    // 1. Calculate hashes for all files
    const fileHashes: { item: SyncFileItem; hash: string }[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      if (isCancelledRef.current) break;
      const item = filesToProcess[i];
      item.status = "hashing";

      try {
        const hash = await calculateFileHash(item.file);
        item.hash = hash;
        fileHashes.push({ item, hash });
      } catch (err) {
        console.error("Hashing failed for:", item.filename, err);
        item.status = "error";
        item.errorMessage = "Could not read file";
        failed++;
        failedItems.push({ filename: item.filename, reason: "Could not read file" });
      }

      const hashingProgress = Math.round(((i + 1) / total) * 30);
      setProgressPercent(hashingProgress);
    }

    if (isCancelledRef.current) return;

    // 2. Pre-check all hashes in one fast batch request
    setStatusMessage("Checking database for duplicate designs...");
    let existingHashesSet = new Set<string>();

    try {
      const hashes = fileHashes.map((fh) => fh.hash);
      const res = await fetch("/api/sync/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashes }),
      });

      if (res.ok) {
        const data = await res.json();
        existingHashesSet = new Set(data.existingHashes || []);
      }
    } catch (err) {
      console.warn("Pre-check failed, will check individually on upload", err);
    }

    // 3. Upload only NEW images
    setStatusMessage("Uploading new designs to cloud storage...");

    const itemsToUpload = fileHashes.filter((fh) => {
      if (existingHashesSet.has(fh.hash)) {
        fh.item.status = "skipped_duplicate";
        duplicates++;
        processed++;
        duplicateNames.push(fh.item.filename);
        return false;
      }
      return true;
    });

    setDuplicateCount(duplicates);
    setProcessedCount(processed);

    // Controlled concurrency upload (2 concurrent uploads for stability on mobile)
    const concurrency = 2;
    let currentIndex = 0;

    const uploadWorker = async () => {
      while (currentIndex < itemsToUpload.length && !isCancelledRef.current) {
        const taskIndex = currentIndex++;
        const { item, hash } = itemsToUpload[taskIndex];

        item.status = "uploading";
        item.progress = 20;

        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("file_hash", hash);
          formData.append("filename", item.filename);
          if (selectedCategory) {
            formData.append("category_id", selectedCategory);
          }

          const res = await fetch("/api/sync/upload", {
            method: "POST",
            body: formData,
          });

          const result = await res.json();

          if (res.ok) {
            if (result.duplicate) {
              item.status = "skipped_duplicate";
              duplicates++;
              duplicateNames.push(item.filename);
            } else {
              item.status = "uploaded";
              item.designId = result.design?.design_id;
              uploaded++;
              uploadedNames.push(item.filename);
            }
          } else {
            item.status = "error";
            item.errorMessage = result.error || "Upload failed";
            failed++;
            failedItems.push({ filename: item.filename, reason: result.error || "Upload failed" });
          }
        } catch (err: any) {
          item.status = "error";
          item.errorMessage = "Connection interrupted";
          failed++;
          failedItems.push({ filename: item.filename, reason: "Connection interrupted" });
        }

        processed++;
        setProcessedCount(processed);
        setUploadedCount(uploaded);
        setDuplicateCount(duplicates);
        setFailedCount(failed);

        const currentPct = 30 + Math.round((processed / total) * 70);
        setProgressPercent(Math.min(100, currentPct));
      }
    };

    // Run parallel workers
    const workers = [];
    for (let w = 0; w < concurrency; w++) {
      workers.push(uploadWorker());
    }
    await Promise.all(workers);

    if (isCancelledRef.current) return;

    setProgressPercent(100);
    const finalSummary: SyncSummaryResult = {
      totalProcessed: total,
      uploadedCount: uploaded,
      duplicateCount: duplicates,
      failedCount: failed,
      uploadedFiles: uploadedNames,
      duplicateFiles: duplicateNames,
      failedFiles: failedItems,
    };

    setSummary(finalSummary);
    setStep("completed");

    // Celebrate with confetti if new images were uploaded!
    if (uploaded > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C5A059", "#1C1917", "#EBE5DD", "#F3EFEA"],
        });
      } catch {}
    }

    onSyncComplete?.();
  };

  // Retry Failed items
  const handleRetryFailed = () => {
    const failedItems = selectedFiles.filter((f) => f.status === "error");
    if (failedItems.length > 0) {
      failedItems.forEach((f) => {
        f.status = "pending";
        f.errorMessage = undefined;
      });
      startSync(failedItems);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-modal border border-[#EBE5DD] my-auto transition-all animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE5DD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C1917] flex items-center justify-center text-[#C5A059] shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1C1917]">
                Sync Phone Gallery
              </h2>
              <p className="text-xs text-stone-500">
                Back up your embroidery designs securely to the cloud
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              isCancelledRef.current = true;
              onClose();
              handleReset();
            }}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
            aria-label="Close sync modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEP 1: SELECT PHOTOS ================= */}
        {step === "select" && (
          <div className="py-6 space-y-6">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Tap to Select Box (Huge mobile tap target) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#C5A059]/70 bg-[#FBF8F2] hover:bg-[#F6EFE3] active:scale-[0.99] rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-[#C5A059]">
                <FileImage className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1C1917] block">
                  Tap to Select Photos from Phone
                </span>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                  Select 10, 50, or hundreds of photos from your gallery. Duplicates are automatically skipped!
                </p>
              </div>
              <button
                type="button"
                className="mt-2 px-5 py-2 rounded-full bg-[#1C1917] text-white text-xs font-semibold tracking-wide shadow"
              >
                Choose Photos
              </button>
            </div>

            {/* Selection Status */}
            {selectedFiles.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#EBE5DD] shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-stone-900 block">
                    {selectedFiles.length} photos selected
                  </span>
                  <span className="text-xs text-stone-500">
                    Ready for smart duplicate check & upload
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#C5A059] hover:underline"
                >
                  Change selection
                </button>
              </div>
            )}

            {/* Optional Category Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                <FolderTree className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Assign Category (Optional)</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EBE5DD] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              >
                <option value="">Leave Uncategorized (You can organize later)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-400">
                You do not need to name each design now. The upload is lightning-fast!
              </p>
            </div>

            {/* Action Start Button */}
            <div className="pt-2">
              <button
                onClick={() => startSync()}
                disabled={selectedFiles.length === 0}
                className="w-full py-3.5 rounded-2xl bg-[#1C1917] hover:bg-[#332E2A] text-white font-semibold text-sm tracking-wide shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 border border-[#C5A059]/40 cursor-pointer"
              >
                <UploadCloud className="w-5 h-5 text-[#C5A059]" />
                <span>START SMART SYNC</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: REAL-TIME PROGRESS ================= */}
        {step === "processing" && (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-1.5">
              <h3 className="font-serif-luxury text-xl font-bold text-[#1C1917]">
                Uploading your designs...
              </h3>
              <p className="text-xs text-stone-500">{statusMessage}</p>
            </div>

            {/* Elegant Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3.5 bg-stone-200 rounded-full overflow-hidden p-0.5 border border-stone-300">
                <div
                  className="h-full bg-gradient-to-r from-[#1C1917] via-[#3E3833] to-[#C5A059] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                <span>
                  {processedCount} / {selectedFiles.length} processed
                </span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-3 text-center">
                <span className="block text-lg font-bold text-emerald-700">{uploadedCount}</span>
                <span className="text-[11px] font-medium text-emerald-800">New Uploaded</span>
              </div>

              <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-center">
                <span className="block text-lg font-bold text-amber-700">{duplicateCount}</span>
                <span className="text-[11px] font-medium text-amber-800">Already Existed</span>
              </div>

              <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-3 text-center">
                <span className="block text-lg font-bold text-rose-700">{failedCount}</span>
                <span className="text-[11px] font-medium text-rose-800">Failed</span>
              </div>
            </div>

            <p className="text-center text-xs text-stone-400 italic">
              Please keep this page open while photos are transferring...
            </p>
          </div>
        )}

        {/* ================= STEP 3: COMPLETED SUMMARY ================= */}
        {step === "completed" && summary && (
          <div className="py-6 space-y-6">
            {/* Header Banner */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-[#1C1917]">
                {summary.failedCount > 0 ? "SYNC COMPLETED WITH WARNINGS" : "SYNC COMPLETED"}
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {summary.totalProcessed} photos processed from your phone
              </p>
            </div>

            {/* Reassuring Big Card for Mom (Requirement 31) */}
            <div className="bg-[#FAF3E7] border border-[#C5A059]/40 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-stone-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
                <span>Your designs are safely backed up in the cloud.</span>
              </div>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                You can now safely delete the uploaded photos from your phone if you need more storage space.
              </p>
            </div>

            {/* Counters Summary */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white border border-[#EBE5DD] rounded-xl p-3 text-center shadow-sm">
                <span className="block text-xl font-bold text-emerald-600">
                  ✓ {summary.uploadedCount}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">New Designs</span>
              </div>

              <div className="bg-white border border-[#EBE5DD] rounded-xl p-3 text-center shadow-sm">
                <span className="block text-xl font-bold text-amber-600">
                  ↻ {summary.duplicateCount}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Already in Catalog</span>
              </div>

              <div className="bg-white border border-[#EBE5DD] rounded-xl p-3 text-center shadow-sm">
                <span className="block text-xl font-bold text-rose-600">
                  ⚠ {summary.failedCount}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Failed</span>
              </div>
            </div>

            {/* Inspectable lists */}
            <div className="space-y-2 text-xs">
              {/* Uploaded files toggle */}
              {summary.uploadedFiles.length > 0 && (
                <div className="bg-white border border-[#EBE5DD] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowUploadedList(!showUploadedList)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-stone-800 font-semibold hover:bg-stone-50"
                  >
                    <span>✓ Successfully uploaded ({summary.uploadedFiles.length})</span>
                    {showUploadedList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showUploadedList && (
                    <div className="px-3.5 pb-3 max-h-36 overflow-y-auto space-y-1 text-stone-600 divide-y divide-stone-100">
                      {summary.uploadedFiles.map((fn, i) => (
                        <div key={i} className="pt-1 truncate">
                          ✓ {fn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Duplicates toggle */}
              {summary.duplicateFiles.length > 0 && (
                <div className="bg-white border border-[#EBE5DD] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowSkippedList(!showSkippedList)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-stone-800 font-semibold hover:bg-stone-50"
                  >
                    <span>↻ Already uploaded ({summary.duplicateFiles.length})</span>
                    {showSkippedList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showSkippedList && (
                    <div className="px-3.5 pb-3 max-h-36 overflow-y-auto space-y-1 text-stone-500 divide-y divide-stone-100">
                      {summary.duplicateFiles.map((fn, i) => (
                        <div key={i} className="pt-1 truncate">
                          ↻ {fn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Failed files */}
              {summary.failedFiles.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowFailedList(!showFailedList)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-rose-900 font-semibold"
                  >
                    <span>⚠ Failed ({summary.failedFiles.length})</span>
                    {showFailedList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showFailedList && (
                    <div className="px-3.5 pb-3 max-h-36 overflow-y-auto space-y-1 text-rose-700 divide-y divide-rose-100">
                      {summary.failedFiles.map((f, i) => (
                        <div key={i} className="pt-1">
                          <span className="font-semibold">{f.filename}:</span> {f.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {summary.failedCount > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="w-full sm:w-auto flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs tracking-wide shadow flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>RETRY FAILED</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  handleReset();
                }}
                className="w-full sm:w-auto flex-1 py-3 rounded-xl bg-[#1C1917] hover:bg-[#332E2A] text-white font-semibold text-xs tracking-wide shadow flex items-center justify-center gap-2 border border-[#C5A059]/40 cursor-pointer"
              >
                <span>View Uploaded Designs</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
