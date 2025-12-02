'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Download, Link, Check, Twitter, Facebook } from 'lucide-react';
import { toPng } from 'html-to-image';
import ShareCard from './ShareCard';

export default function ShareModal({ venue, isOpen, onClose }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#faf9f7'
      });

      const link = document.createElement('a');
      link.download = `comfrt-${venue.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [venue]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/share/${venue.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [venue]);

  const handleTwitterShare = useCallback(() => {
    const text = `Found a ${venue.comfort_score} comfort score spot: ${venue.name}! Check it out on Comfrt`;
    const url = `${window.location.origin}/share/${venue.id}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  }, [venue]);

  const handleFacebookShare = useCallback(() => {
    const url = `${window.location.origin}/share/${venue.id}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
  }, [venue]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f3f1ed'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
            Share This Spot
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '12px',
              backgroundColor: '#f3f1ed',
              border: 'none',
              cursor: 'pointer',
              color: '#6b6b6b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Preview */}
        <div style={{
          padding: '24px',
          backgroundColor: '#f6f7f5',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
            <ShareCard ref={cardRef} venue={venue} size="large" />
          </div>
        </div>

        {/* Share Options */}
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#6b6b6b',
            marginBottom: '16px'
          }}>
            Share with friends
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderRadius: '16px',
                backgroundColor: '#96a87f',
                color: 'white',
                border: 'none',
                cursor: isGenerating ? 'wait' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              <Download size={20} />
              {isGenerating ? 'Generating...' : 'Download Image'}
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderRadius: '16px',
                backgroundColor: copied ? '#e8f0e5' : '#f3f1ed',
                color: copied ? '#5a7a52' : '#3d3d3d',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {copied ? <Check size={20} /> : <Link size={20} />}
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </button>

            {/* Social Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleTwitterShare}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#1DA1F2',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <Twitter size={18} />
                Twitter
              </button>

              <button
                onClick={handleFacebookShare}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#4267B2',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <Facebook size={18} />
                Facebook
              </button>
            </div>
          </div>

          <p style={{
            fontSize: '13px',
            color: '#9a9a9a',
            textAlign: 'center',
            marginTop: '16px'
          }}>
            Help others find calm, comfortable spaces
          </p>
        </div>
      </div>
    </div>
  );
}
