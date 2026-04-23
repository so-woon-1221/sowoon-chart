import { toPng, toSvg } from 'html-to-image';
import { type ForwardedRef, forwardRef, type ReactNode, useCallback, useState } from 'react';

type ExportTarget = HTMLElement | SVGSVGElement;

/**
 * Props for the image export trigger button.
 */
export interface ExportImageProps {
  /**
   * Custom icon or content rendered inside the button.
   */
  icon?: ReactNode;
  /**
   * Content rendered while the image export is in progress.
   * @default "exporting..."
   */
  loadingIcon?: ReactNode;
  /**
   * File name used for the downloaded asset.
   * @default "download"
   */
  fileName?: string;
  /**
   * Export format for the generated file.
   * @default "svg"
   */
  fileFormat?: 'svg' | 'png';
  /**
   * Disable the export button.
   * The button is also disabled while an export is already in progress.
   * @default false
   */
  disabled?: boolean;
  /**
   * Called when image export fails.
   */
  onError?: (error: unknown) => void;
}

const hasCurrentTarget = (
  ref: ForwardedRef<ExportTarget>,
): ref is { current: ExportTarget | null } => {
  return Boolean(ref) && typeof ref !== 'function';
};

/**
 * Renders a lightweight button that exports the attached chart element as an image.
 */
const ExportImage = (
  {
    icon = 'svg',
    loadingIcon = 'exporting...',
    fileName = 'download',
    fileFormat = 'svg',
    disabled = false,
    onError,
  }: ExportImageProps,
  ref: ForwardedRef<ExportTarget>,
) => {
  const [isExporting, setIsExporting] = useState(false);
  const toImage = fileFormat === 'png' ? toPng : toSvg;
  const isDisabled = disabled || isExporting;

  const onClick = useCallback(async () => {
    if (isDisabled) {
      return;
    }

    try {
      setIsExporting(true);

      if (!hasCurrentTarget(ref) || !ref.current) {
        throw new Error('Export target is not available.');
      }

      const image = await toImage(ref.current as unknown as HTMLElement);
      const link = document.createElement('a');
      link.download = `${fileName}.${fileFormat}`;
      link.href = image;
      link.click();
    } catch (error) {
      onError?.(error);
    } finally {
      setIsExporting(false);
    }
  }, [fileFormat, fileName, isDisabled, onError, ref, toImage]);

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isExporting}
      title={isExporting ? 'Exporting image...' : `Export as ${fileFormat.toUpperCase()}`}
      style={{
        background: 'none',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {isExporting ? loadingIcon : icon}
    </button>
  );
};

export default forwardRef<ExportTarget, ExportImageProps>(ExportImage);
