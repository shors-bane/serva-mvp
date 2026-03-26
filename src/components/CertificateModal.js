import React, { useEffect } from 'react';

/**
 * CertificateModal
 *
 * Renders a professional digital warranty card inside a full-screen backdrop.
 * The modal closes when the user clicks the backdrop, presses Escape, or
 * clicks the explicit close button.
 *
 * Props:
 *   certificate  – the `certificate` object from the API response
 *   onClose      – callback to close the modal
 */
const CertificateModal = ({ certificate, onClose }) => {
  // ── Keyboard dismiss ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!certificate) return null;

  const {
    bookingId,
    deviceType,
    issue,
    qrDataUrl,
    verificationUrl,
    warrantyMonths = 6,
    issuedAt,
    technicianName,
  } = certificate;

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const deviceIcon =
    deviceType?.toLowerCase() === 'smartphone' ? '📱'
    : deviceType?.toLowerCase() === 'laptop'   ? '💻'
    : deviceType?.toLowerCase() === 'tablet'   ? '📱'
    : '🔧';

  return (
    /* ── Backdrop ────────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Warranty Certificate"
    >
      {/* ── Card (stop click propagation so inner clicks don't close) ──── */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ─────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-80 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow"
          aria-label="Close certificate"
        >
          ✕
        </button>

        {/* ── Header band ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 pt-10 pb-8 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">{deviceIcon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                Digital Warranty Certificate
              </p>
              <h2 className="text-2xl font-bold leading-tight">
                {deviceType
                  ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
                  : 'Device'}{' '}
                Repair
              </h2>
            </div>
          </div>

          {/* Warranty duration pill */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-4 py-1 text-sm font-semibold">
            <span>🛡️</span>
            <span>{warrantyMonths}-Month Warranty Included</span>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="px-8 py-6 space-y-5">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Booking ID</p>
              <p className="font-mono font-semibold text-gray-800 break-all">{bookingId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Issue</p>
              <p className="font-semibold text-gray-800 capitalize">{issue || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Issued On</p>
              <p className="font-semibold text-gray-800">{formattedDate}</p>
            </div>
            {technicianName && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Technician</p>
                <p className="font-semibold text-gray-800">{technicianName}</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200" />

          {/* QR code + scan prompt */}
          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Warranty verification QR code"
                className="w-36 h-36 rounded-xl border-4 border-blue-100 shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 rounded-xl border-4 border-gray-100 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                QR code unavailable
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Scan to verify authenticity</p>
              {verificationUrl && (
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline break-all"
                >
                  {verificationUrl}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Serva Electronics Repair</p>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
