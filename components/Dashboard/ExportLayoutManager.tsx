import React, { ReactNode } from "react"

export interface ExportLayoutManagerProps {
  selectedPlaylistsSection: ReactNode
  unmatchedSongsSection: ReactNode
  mainTableSection: ReactNode
  fixedExportButton: ReactNode
}

export function ExportLayoutManager({
  selectedPlaylistsSection,
  unmatchedSongsSection,
  mainTableSection,
  fixedExportButton,
}: ExportLayoutManagerProps) {
  return (
    <div className="relative">
      {fixedExportButton}

      <div className="flex flex-col min-h-[calc(100vh-90px)] gap-4 pb-8 pt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex-1 min-h-[220px] lg:min-h-[240px] flex flex-col overflow-hidden">
            {selectedPlaylistsSection}
          </div>

          <div className="flex-1 min-h-[220px] lg:min-h-[240px] flex flex-col overflow-hidden">
            {unmatchedSongsSection}
          </div>
        </div>

        <div className="flex-1 min-h-[280px] overflow-hidden">{mainTableSection}</div>
      </div>
    </div>
  )
}
