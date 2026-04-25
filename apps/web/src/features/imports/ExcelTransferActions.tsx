import { ChangeEvent, useRef } from "react";
import { Button } from "primereact/button";

type ExcelTransferActionsProps = {
  inputId: string;
  downloadLabel: string;
  importLabel: string;
  downloadDisabled?: boolean;
  importDisabled?: boolean;
  importLoading?: boolean;
  onDownload: () => Promise<void> | void;
  onImport: (file: File) => Promise<void>;
};

export const ExcelTransferActions = ({
  inputId,
  downloadLabel,
  importLabel,
  downloadDisabled = false,
  importDisabled = false,
  importLoading = false,
  onDownload,
  onImport
}: ExcelTransferActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleDownloadClick = () => {
    onDownload();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await onImport(file);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="panel-actions panel-actions--start panel-actions--wrap">
      <Button label={downloadLabel} icon="pi pi-download" text onClick={handleDownloadClick} disabled={downloadDisabled} />
      <input
        ref={fileInputRef}
        id={inputId}
        className="hidden-file-input"
        type="file"
        accept=".xlsx,.xls"
        aria-label={`${importLabel} fichero`}
        onChange={handleImportChange}
      />
      <Button
        label={importLabel}
        icon="pi pi-upload"
        outlined
        loading={importLoading}
        onClick={() => fileInputRef.current?.click()}
        disabled={importDisabled || importLoading}
      />
    </div>
  );
};
