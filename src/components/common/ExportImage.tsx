import { type ReactNode, type RefObject, useCallback, useMemo } from 'react'
import { toPng, toSvg } from 'html-to-image'

interface Props {
  icon?: ReactNode
  fileName?: string
  fileFormat?: 'svg' | 'png'
  ref: RefObject<SVGSVGElement>
}

const ExportImage = ({
  icon,
  fileName = 'download',
  fileFormat = 'svg',
  ref
}: Props) => {
  const toImage = useMemo(() => {
    switch (fileFormat) {
      case 'svg':
        return toSvg
      case 'png':
        return toPng
      default:
        return toSvg
    }
  }, [fileFormat])

  const onClick = useCallback(async () => {
    if (ref.current) {
      console.log(ref)
      const image = await toImage(ref.current as unknown as HTMLElement)
      const link = document.createElement('a')
      link.download = `${fileName}.${fileFormat}`
      link.href = image
      link.click()
    }
  }, [fileFormat, fileName, ref, toImage])

  return (
    <button
      onClick={onClick}
      title={`Export as ${fileFormat.toUpperCase()}`}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      {icon ?? fileFormat}
    </button>
  )
}

export default ExportImage
