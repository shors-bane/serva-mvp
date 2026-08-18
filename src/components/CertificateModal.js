import React, { useEffect } from 'react';

const CertificateModal = ({ certificate, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
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
    deviceType?.toLowerCase() === 'smartphone' ? (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
    )
    : deviceType?.toLowerCase() === 'laptop'   ? (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    )
    : deviceType?.toLowerCase() === 'tablet'   ? (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
    )
    : (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-[8px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Warranty Certificate"
    >
      <div
        className="relative bg-surface-raised rounded-panel border border-edge w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-void bg-opacity-80 text-copper hover:text-copper-light transition-colors"
          aria-label="Close certificate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="bg-gradient-to-r from-copper to-teal px-8 pt-10 pb-8 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-white">{deviceIcon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Digital Warranty Certificate
              </p>
              <h2 className="text-2xl font-display font-bold leading-tight">
                {deviceType
                  ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
                  : 'Device'}{' '}
                Repair
              </h2>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span>{warrantyMonths}-Month Warranty Included</span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-faint uppercase font-semibold tracking-wide mb-1">Booking ID</p>
              <p className="font-data font-semibold text-ink break-all">{bookingId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase font-semibold tracking-wide mb-1">Issue</p>
              <p className="font-semibold text-ink capitalize">{issue || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase font-semibold tracking-wide mb-1">Issued On</p>
              <p className="font-semibold text-ink">{formattedDate}</p>
            </div>
            {technicianName && (
              <div>
                <p className="text-xs text-ink-faint uppercase font-semibold tracking-wide mb-1">Technician</p>
                <p className="font-semibold text-ink">{technicianName}</p>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-edge" />

          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Warranty verification QR code"
                className="w-36 h-36 rounded-xl border-4 border-copper/20 shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 rounded-xl border-4 border-edge bg-surface-elevated flex items-center justify-center text-ink-faint text-xs text-center p-2">
                QR code unavailable
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-ink-muted font-medium">Scan to verify authenticity</p>
              {verificationUrl && (
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-copper hover:underline break-all"
                >
                  {verificationUrl}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-surface-elevated border-t border-edge flex items-center justify-between">
          <p className="text-xs text-ink-faint">Serva Electronics Repair</p>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-copper hover:text-copper/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
