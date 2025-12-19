import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertTriangle, FileText, Calendar, Users, Link2 } from "lucide-react";

interface DuplicateSource {
  id: string;
  title: string;
  doi?: string;
  year?: number;
  authors?: string[];
}

interface DuplicateSourceWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  onMerge?: () => void;
  duplicateInfo: {
    isDuplicate: boolean;
    matchType: "doi" | "title";
    confidence: number;
    similarity?: number;
    existingSource: DuplicateSource;
    message: string;
  };
  isAdmin?: boolean;
}

export function DuplicateSourceWarning({
  isOpen,
  onClose,
  onAddAnyway,
  onMerge,
  duplicateInfo,
  isAdmin = false,
}: DuplicateSourceWarningProps) {
  const { matchType, confidence, existingSource, message } = duplicateInfo;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <DialogTitle className="font-['Tilt_Warp'] text-[18px]">
              Potential Duplicate Detected
            </DialogTitle>
          </div>
          <DialogDescription className="font-['Sniglet'] text-[12px] mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Match Information */}
          <div className="flex items-center gap-2">
            <Badge
              variant={matchType === "doi" ? "default" : "secondary"}
              className="font-['Sniglet'] text-[10px]"
            >
              {matchType === "doi"
                ? "100% DOI Match"
                : `${confidence}% Title Match`}
            </Badge>
            {matchType === "title" && (
              <span className="font-['Sniglet'] text-[10px] text-gray-500 dark:text-gray-400">
                Fuzzy match using Levenshtein distance
              </span>
            )}
          </div>

          {/* Existing Source Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <h4 className="font-['Sniglet'] text-[12px] text-gray-700 dark:text-gray-300 mb-2">
              Existing Source in Library:
            </h4>

            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-['Sniglet'] text-[13px] normal">
                  {existingSource.title}
                </p>
              </div>
            </div>

            {existingSource.authors && existingSource.authors.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
                <p className="font-['Sniglet'] text-[11px] text-gray-600 dark:text-gray-400">
                  {existingSource.authors.slice(0, 3).join(", ")}
                  {existingSource.authors.length > 3 &&
                    ` +${existingSource.authors.length - 3} more`}
                </p>
              </div>
            )}

            {existingSource.year && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
                <p className="font-['Sniglet'] text-[11px] text-gray-600 dark:text-gray-400">
                  {existingSource.year}
                </p>
              </div>
            )}

            {existingSource.doi && (
              <div className="flex items-start gap-2">
                <Link2 className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
                <p className="font-['Sniglet'] text-[11px] text-gray-600 dark:text-gray-400 break-all">
                  {existingSource.doi}
                </p>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="font-['Sniglet'] text-[11px] text-blue-900 dark:text-blue-200">
              {matchType === "doi"
                ? "🔍 DOI matches are 100% accurate. This is very likely the same publication."
                : `🔍 This title is ${confidence}% similar to an existing source. Review carefully before adding.`}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-['Sniglet'] text-[12px] w-full sm:w-auto"
          >
            Cancel
          </Button>

          {isAdmin && onMerge && matchType === "doi" && (
            <Button
              variant="secondary"
              onClick={onMerge}
              className="font-['Sniglet'] text-[12px] w-full sm:w-auto"
            >
              Merge Sources
            </Button>
          )}

          <Button
            onClick={onAddAnyway}
            className="font-['Sniglet'] text-[12px] w-full sm:w-auto"
          >
            Add Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
