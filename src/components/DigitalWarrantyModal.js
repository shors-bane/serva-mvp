import React from 'react';
import QRCode from 'qrcode.react';

const DigitalWarrantyModal = ({ booking, isOpen, onClose }) => {
  if (!booking) return null;

  const warrantyUrl = `${window.location.origin}/warranty/${booking.warrantyToken}`;
  
  return isOpen ? (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[8px] flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-panel shadow-2xl border border-edge max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-copper to-teal text-white p-6 rounded-t-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold">Digital Warranty Certificate</h2>
              <p className="text-white/80 text-sm mt-1">Blockchain-Backed Protection</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <div className="text-sm text-ink-faint">Certificate ID</div>
                <div className="font-data font-semibold text-lg text-ink break-all">
                  {booking.warrantyToken ? `${booking.warrantyToken.slice(0, 8)}...${booking.warrantyToken.slice(-4)}` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-ink-faint">Issue Date</div>
                <div className="font-semibold text-ink">{new Date(booking.date || booking.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-ink-faint">Device</div>
                <div className="font-semibold text-ink">{booking.deviceModel}</div>
              </div>
              <div>
                <div className="text-sm text-ink-faint">Repair Type</div>
                <div className="font-semibold text-ink">{booking.issue}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-ink-faint">Technician</div>
                <div className="font-semibold text-ink">{booking.technician}</div>
              </div>
              <div>
                <div className="text-sm text-ink-faint">Valid Until</div>
                <div className="font-semibold text-ink">{new Date(booking.warrantyExpiry).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-sm text-ink-faint">Total Repair Cost</div>
              <div className="text-2xl font-display font-bold text-copper">${booking.cost}</div>
            </div>
          </div>

          <div className="border-t border-edge pt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-display font-semibold text-ink mb-2">Verify Authenticity</h3>
              <p className="text-sm text-ink-muted mb-4">
                Scan this QR code to verify the warranty certificate on the blockchain
              </p>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="bg-surface-elevated p-4 rounded-sharp border-2 border-copper/20">
                <QRCode 
                  value={warrantyUrl}
                  size={200}
                  level="M"
                  renderAs="svg"
                  className="w-full h-full"
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-surface-elevated rounded-sharp px-4 py-3 mb-4">
                <div className="text-xs text-ink-muted mb-2">Verification URL</div>
                <div className="font-data text-xs text-ink break-all">{warrantyUrl}</div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-ink-muted">
                <svg className="w-4 h-4 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Cryptographically Secured</span>
                <svg className="w-4 h-4 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 012 2v6a2 2 0 01-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2h3zm0 0h14v3h-14v-3z" />
                </svg>
                <span>Blockchain Verified</span>
              </div>
            </div>
          </div>

          <div className="border-t border-edge pt-4 mt-4">
            <div className="text-center text-sm text-ink-faint">
              <p>This certificate is permanently recorded on the blockchain</p>
              <p className="mt-1">© 2024 Serva Digital Warranty System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default DigitalWarrantyModal;