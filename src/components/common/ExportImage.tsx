import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  type ReactNode,
  useCallback,
  useMemo
} from 'react'
import { toPng, toSvg } from 'html-to-image'

interface Props {
  icon?: ReactNode
  fileName?: string
  fileFormat?: 'svg' | 'png'
  // ref: RefObject<SVGSVGElement>
}

const ExportImage = (props: Props, ref: ForwardedRef<HTMLElement>) => {
  let { icon, fileName, fileFormat } = props as Props
  if (fileFormat === undefined) {
    fileFormat = 'svg'
  }
  if (fileName === undefined) {
    fileName = 'download'
  }
  if (icon === undefined) {
    icon = 'svg'
  }

  const svg = ref as MutableRefObject<HTMLElement>

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
    if (svg.current) {
      const image = await toImage(svg.current as unknown as HTMLElement)
      const link = document.createElement('a')
      link.download = `${fileName}.${fileFormat}`
      link.href = image
      link.click()
    }
  }, [fileFormat, fileName, svg, toImage])

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

export default forwardRef<HTMLElement, Props>(ExportImage)
