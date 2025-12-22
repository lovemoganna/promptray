import React, { useRef, useEffect, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { PromptFormData, Theme } from '../types';
import { Icons } from './Icons';

interface PromptShareImageProps {
  data: PromptFormData;
  theme: Theme;
  onClose?: () => void;
  previewMode?: 'raw' | 'interpolated';
  getCompiledPrompt?: () => string;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PromptShareImage: React.FC<PromptShareImageProps> = ({
  data,
  theme,
  onClose,
  previewMode = 'raw',
  getCompiledPrompt,
  onNotify,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayPrompt =
    previewMode === 'interpolated' && getCompiledPrompt
      ? getCompiledPrompt()
      : data.content;

  const systemInstruction = data.systemInstruction || '';

  // Generate image from the visible card
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!containerRef.current) return null;

    try {
      setImageLoading(true);
      setIsCapturing(true); // Mark that we're capturing, hide UI elements
      
      // Wait a bit for DOM to fully render and UI elements to hide
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!containerRef.current) {
        setIsCapturing(false);
        setImageLoading(false);
        return null;
      }

      // Use higher scale for Retina displays (minimum 2x, up to 3x for better quality)
      const devicePixelRatio = window.devicePixelRatio || 2;
      const scale = Math.min(devicePixelRatio, 3);

      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        scale: scale,
        useCORS: true,
        logging: false,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
        allowTaint: false,
        ignoreElements: (element) => {
          // Exclude all UI buttons and loading overlays
          // Check multiple ways to ensure we catch all UI elements
          const hasExcludeClass = element.classList?.contains('exclude-from-capture');
          const hasExcludeAttr = element.getAttribute?.('data-exclude-capture') === 'true';
          const isInExcludeContainer = element.closest?.('.exclude-from-capture') !== null;
          
          // Also check for common UI element patterns
          const isButton = element.tagName === 'BUTTON';
          const isActionButton = element.closest?.('[class*="absolute top-6"]') !== null;
          
          return hasExcludeClass || hasExcludeAttr || isInExcludeContainer || (isButton && isActionButton);
        },
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setImageDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate image:', error);
      onNotify?.('图片生成失败，请重试', 'error');
      return null;
    } finally {
      // Ensure state is always reset, even on error
      setImageLoading(false);
      setIsCapturing(false);
    }
  }, [onNotify]);

  // Generate image when component mounts or data changes
  useEffect(() => {
    if (!containerRef.current) return;
    generateImage();
  }, [data, theme, displayPrompt, systemInstruction, generateImage]);

  const handleDownload = useCallback(async () => {
    let dataUrl = imageDataUrl;

    if (!dataUrl) {
      dataUrl = await generateImage();
    }

    if (!dataUrl) {
      onNotify?.('图片尚未准备好，请稍后再试', 'error');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${data.title || 'prompt-share'}-share.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify?.('图片下载成功', 'success');
    } catch (error) {
      console.error('Failed to download image:', error);
      onNotify?.('下载失败，请重试', 'error');
    }
  }, [imageDataUrl, data.title, generateImage, onNotify]);

  const handleCopyToClipboard = useCallback(async () => {
    if (isCopying) return; // Prevent multiple simultaneous copies

    setIsCopying(true);
    let dataUrl = imageDataUrl;

    // If the image is not ready yet, generate it on demand
    if (!dataUrl) {
      dataUrl = await generateImage();
    }

    if (!dataUrl) {
      setIsCopying(false);
      onNotify?.('图片尚未准备好，请稍后再试', 'error');
      return;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Check if Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not available');
      }

      // Try to copy image as blob (preferred method)
      try {
        // Check for ClipboardItem support
        if (typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        } else {
          // Fallback: copy as data URL text
          await navigator.clipboard.writeText(dataUrl);
        }
        
        setCopied(true);
        onNotify?.('图片已复制到剪贴板', 'success');
        
        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (clipboardError) {
        // If ClipboardItem fails, try copying as text
        console.warn('ClipboardItem failed, trying text fallback:', clipboardError);
        await navigator.clipboard.writeText(dataUrl);
        setCopied(true);
        onNotify?.('图片链接已复制到剪贴板', 'success');
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      onNotify?.('复制失败，请检查浏览器权限设置', 'error');
    } finally {
      setIsCopying(false);
    }
  }, [imageDataUrl, generateImage, isCopying, onNotify]);

  // Get theme colors and calculate appropriate colors
  const brandColor = theme.colors.brand;
  const bgColor = theme.colors.bg;
  const isLightTheme = theme.id === 'theme-light';

  // Calculate accent color (lighter version of brand color for labels)
  const accentColor = lightenColor(brandColor, 0.3);

  // Background color - darker purple-grey tone
  const cardBgColor = isLightTheme
    ? '#f8f9fa'
    : hexToRgba(darkenColor(bgColor, 0.1), 0.98);

  // Text colors
  const primaryTextColor = isLightTheme ? '#1a1a1a' : '#f5f5f5';
  const secondaryTextColor = isLightTheme ? '#6b7280' : '#d1d5db';
  const labelTextColor = accentColor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[96vw] lg:max-w-6xl 2xl:max-w-[1500px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Container */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: cardBgColor,
            minHeight: '700px',
            boxShadow: isLightTheme
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              : `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${hexToRgba(brandColor, 0.1)}`,
            border: `1px solid ${hexToRgba(brandColor, isLightTheme ? 0.1 : 0.15)}`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* CSS to hide UI elements during capture and code snippet styles */}
          <style>{`
            ${isCapturing ? `
              .exclude-from-capture {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
            ` : ''}
            .prompt-content code {
              font-family: "JetBrains Mono", "Fira Code", monospace;
              font-size: 0.9em;
              padding: 2px 6px;
              border-radius: 4px;
              background: rgba(255, 255, 255, 0.05);
            }
          `}</style>
          {/* Subtle Background Pattern - More subtle */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryTextColor} 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          
          {/* Decorative corner accents - subtle glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(circle, ${hexToRgba(brandColor, 0.08)} 0%, transparent 70%)`,
              filter: 'blur(60px)',
              transform: 'translate(30%, -30%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(circle, ${hexToRgba(brandColor, 0.06)} 0%, transparent 70%)`,
              filter: 'blur(50px)',
              transform: 'translate(-30%, 30%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-10 md:p-14 lg:p-16 flex flex-col h-full min-h-[700px]">
            {/* Header Section */}
            <div className="mb-12">
              {/* Title */}
              <h1
                className="mb-6 leading-[1.1] tracking-[-0.03em]"
                style={{
                  color: primaryTextColor,
                  fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontFamily: '"Victor Mono", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  lineHeight: '1.1',
                  marginBottom: '1.5rem',
                }}
              >
                {data.title || 'Untitled Prompt'}
              </h1>

              {/* Description */}
              {data.description && (
                <p
                  className="leading-relaxed max-w-4xl"
                  style={{
                    color: secondaryTextColor,
                    fontSize: '1.125rem',
                    lineHeight: '1.75',
                    fontFamily: '"Noto Sans SC", "Inter", -apple-system, sans-serif',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    opacity: 0.85,
                  }}
                >
                  {data.description}
                </p>
              )}
            </div>

            {/* Content Sections - Two Column Layout */}
            <div className="flex-1">
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: systemInstruction ? '1fr 1fr' : '1fr',
                  alignItems: 'stretch',
                }}
              >
                {/* System Instruction Column */}
                {systemInstruction && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="rounded-full relative"
                        style={{
                          width: '3px',
                          height: '28px',
                          backgroundColor: brandColor,
                          boxShadow: `0 0 12px ${hexToRgba(brandColor, 0.5)}`,
                        }}
                      />
                      <h2
                        className="text-xs font-bold uppercase tracking-[0.2em]"
                        style={{
                          color: labelTextColor,
                          fontFamily: '"LXGW WenKai", "Victor Mono", "Fira Code", monospace',
                          letterSpacing: '0.1em',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          opacity: 0.7,
                          textTransform: 'uppercase',
                        }}
                      >
                        SYSTEM INSTRUCTION
                      </h2>
                    </div>
                    <div
                      className="rounded-2xl p-8 border relative overflow-hidden flex-1 flex flex-col"
                      style={{
                        backgroundColor: isLightTheme
                          ? 'rgba(0, 0, 0, 0.02)'
                          : 'rgba(255, 255, 255, 0.04)',
                        borderColor: isLightTheme
                          ? 'rgba(0, 0, 0, 0.12)'
                          : 'rgba(255, 255, 255, 0.12)',
                        borderWidth: '1.5px',
                      }}
                    >
                      {/* Subtle left accent */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{
                          background: `linear-gradient(180deg, ${brandColor}, ${hexToRgba(brandColor, 0.3)})`,
                          opacity: 0.6,
                        }}
                      />
                      <div
                        className="leading-relaxed whitespace-pre-wrap break-words relative pl-2 prompt-content"
                        style={{
                          color: primaryTextColor,
                          opacity: 0.95,
                          lineHeight: '1.8',
                          fontSize: '0.9375rem',
                          fontFamily: '"LXGW WenKai", serif',
                          fontWeight: 400,
                          letterSpacing: '0.02em',
                          textAlign: 'justify',
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          maxHeight: systemInstruction.length > 2000 ? '600px' : 'none',
                          overflowY: systemInstruction.length > 2000 ? 'auto' : 'visible',
                        }}
                      >
                        {systemInstruction}
                      </div>
                    </div>
                  </div>
                )}

                {/* User Prompt Column */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="rounded-full relative"
                      style={{
                        width: '3px',
                        height: '28px',
                        backgroundColor: brandColor,
                        boxShadow: `0 0 12px ${hexToRgba(brandColor, 0.5)}`,
                      }}
                    />
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.2em]"
                      style={{
                        color: labelTextColor,
                        fontFamily: '"LXGW WenKai", "Victor Mono", "Fira Code", monospace',
                        letterSpacing: '0.1em',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        opacity: 0.7,
                        textTransform: 'uppercase',
                      }}
                    >
                      USER PROMPT
                    </h2>
                  </div>
                  <div
                    className="rounded-2xl p-8 border relative overflow-hidden flex-1 flex flex-col"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.12)'
                        : 'rgba(255, 255, 255, 0.12)',
                      borderWidth: '1.5px',
                    }}
                  >
                    {/* Subtle left accent */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                      style={{
                        background: `linear-gradient(180deg, ${brandColor}, ${hexToRgba(brandColor, 0.3)})`,
                        opacity: 0.6,
                      }}
                    />
                    <div
                      className="leading-relaxed whitespace-pre-wrap break-words relative pl-2 prompt-content"
                      style={{
                        color: primaryTextColor,
                        opacity: 0.95,
                        lineHeight: '1.8',
                        fontSize: '0.9375rem',
                        fontFamily: '"LXGW WenKai", serif',
                        fontWeight: 400,
                        letterSpacing: '0.02em',
                        textAlign: 'justify',
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        maxHeight: (displayPrompt || '').length > 2000 ? '600px' : 'none',
                        overflowY: (displayPrompt || '').length > 2000 ? 'auto' : 'visible',
                      }}
                    >
                      {displayPrompt || 'No prompt content'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t" style={{ borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }}>
              <div className="flex items-center justify-center gap-3">
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: brandColor,
                    opacity: 0.6,
                    boxShadow: `0 0 8px ${hexToRgba(brandColor, 0.4)}`,
                  }}
                />
                <p
                  className="text-xs text-center tracking-widest uppercase"
                  style={{
                    color: secondaryTextColor,
                    opacity: 0.6,
                    fontFamily: '"Victor Mono", "Fira Code", monospace',
                    letterSpacing: '0.15em',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                >
                  Generated by PromptRay
                </p>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: brandColor,
                    opacity: 0.6,
                    boxShadow: `0 0 8px ${hexToRgba(brandColor, 0.4)}`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Show on Hover (Desktop) or Always (Mobile) */}
          <div
            className={`absolute top-6 right-6 flex items-center gap-2 z-20 exclude-from-capture transition-all duration-300 ${
              isCapturing ? 'opacity-0 pointer-events-none' : ''
            } ${
              isMobile 
                ? 'opacity-100 translate-y-0' 
                : isHovered 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
            data-exclude-capture="true"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2 border"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: primaryTextColor,
              }}
              title="Download Image"
            >
              <Icons.Download size={16} />
              <span className="text-sm font-semibold">Download</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyToClipboard();
              }}
              disabled={isCopying}
              className={`px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2 border ${
                isCopying ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: primaryTextColor,
              }}
              title={copied ? '已复制' : isCopying ? '复制中...' : '复制图片'}
            >
              {copied ? (
                <>
                  <Icons.Check size={16} />
                  <span className="text-sm font-semibold">已复制</span>
                </>
              ) : isCopying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold">复制中...</span>
                </>
              ) : (
                <>
                  <Icons.Copy size={16} />
                  <span className="text-sm font-semibold">Copy</span>
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
                title="Close"
              >
                <Icons.Close size={16} />
              </button>
            )}
          </div>

          {/* Loading Skeleton - Show while image is generating */}
          {imageLoading && !imageDataUrl && !isCapturing && (
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-30 rounded-2xl exclude-from-capture"
              data-exclude-capture="true"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-sm text-white/70 font-medium">正在生成图片...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-gray-500 text-xs font-mono tracking-widest uppercase opacity-70">
          Press ESC to close • Hover over image to show actions
        </div>
      </div>
    </div>
  );
};

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to lighten a color
function lightenColor(color: string, amount: number): string {
  try {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    if (isNaN(num)) return color;

    let r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    let g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    let b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));

    const result = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return (usePound ? '#' : '') + result;
  } catch (e) {
    return color;
  }
}

// Helper function to darken a color
function darkenColor(color: string, amount: number): string {
  try {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    if (isNaN(num)) return color;

    let r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    let g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
    let b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));

    const result = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return (usePound ? '#' : '') + result;
  } catch (e) {
    return color;
  }
}
