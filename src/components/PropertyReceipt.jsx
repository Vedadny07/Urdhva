import React from 'react'
import useStore from '../store'
import { Printer, X } from 'lucide-react'

function generateReceiptRef(ulpin) {
  const clean = (ulpin || 'UNIT').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const stamp = Date.now().toString().slice(-6)
  return `URDHVA/RCPT/${clean}/${stamp}`
}

const TYPE_LABELS = {
  floor: 'Residential / Commercial Floor',
  parking: 'Parking Level',
  basement: 'Basement Level',
}

export default function PropertyReceipt() {
  const receiptTarget = useStore((s) => s.receiptTarget)
  const closePropertyReceipt = useStore((s) => s.closePropertyReceipt)

  if (!receiptTarget || !receiptTarget.unit || !receiptTarget.building) return null

  const { unit, building } = receiptTarget
  const ownership = unit.ownership || null
  const generatedAt = new Date()
  const receiptRef = generateReceiptRef(unit.ulpin)
  const unitTypeLabel = TYPE_LABELS[unit.type] || unit.type || 'Unit'
  const floorLabel = unit.type === 'floor'
    ? `Floor ${unit.floorNumber}`
    : unit.type === 'parking'
    ? `Parking Level ${Math.abs(unit.floorNumber)}`
    : unit.type === 'basement'
    ? `Basement Level ${Math.abs(unit.floorNumber)}`
    : `Level ${unit.floorNumber}`

  const handlePrint = () => window.print()

  return (
    <>
      {/* Print-only styling: hide everything on the page except the receipt
          when the browser print dialog is used. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #urdhva-property-receipt, #urdhva-property-receipt * { visibility: visible; }
          #urdhva-property-receipt {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .receipt-no-print { display: none !important; }
        }
      `}</style>

      <div data-floating-panel="true" className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 receipt-modal-overlay">
        <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl bg-white">
          {/* Toolbar — hidden on print */}
          <div className="receipt-no-print sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-slate-800 rounded-t-2xl">
            <span className="text-white text-sm font-bold">Property Receipt Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={closePropertyReceipt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          {/* Receipt content — always plain black-on-white so it prints
              cleanly regardless of the app's theme. */}
          <div id="urdhva-property-receipt" className="bg-white text-black p-8 font-sans">
            <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-5">
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">URDHVA — 3D Cadastral Intelligence Platform</h1>
                <p className="text-xs mt-0.5">ULPIN Property Ownership Receipt</p>
              </div>
              <div className="text-right text-[11px] leading-snug">
                <p><span className="font-bold">Receipt No:</span> {receiptRef}</p>
                <p><span className="font-bold">Generated:</span> {generatedAt.toLocaleString()}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-5 border border-black border-collapse">
              <tbody>
                <ReceiptRow label="ULPIN (14-digit standard + vertical unit suffix)" value={unit.ulpin} mono />
                <ReceiptRow label="Building" value={building.name} />
                <ReceiptRow label="Building ID" value={building.id} mono />
                <ReceiptRow label="Floor / Level" value={floorLabel} />
                <ReceiptRow label="Unit Type" value={unitTypeLabel} />
                <ReceiptRow label="Unit Status" value={(unit.status || 'approved').toUpperCase()} />
              </tbody>
            </table>

            <h2 className="text-sm font-extrabold uppercase tracking-wide border-b border-black pb-1 mb-2">Ownership Details</h2>
            {ownership ? (
              <table className="w-full text-sm mb-5 border border-black border-collapse">
                <tbody>
                  <ReceiptRow label="Owner Name" value={ownership.ownerName} />
                  <ReceiptRow label="Ownership Type" value={ownership.ownershipType} />
                  <ReceiptRow label="Share %" value={`${ownership.sharePercent}%`} />
                  <ReceiptRow label="Registration No." value={ownership.registrationNo} mono />
                  <ReceiptRow label="Mutation Date" value={ownership.mutationDate} />
                  <ReceiptRow label="Verification Status" value={ownership.verificationStatus} />
                  {ownership.contact && <ReceiptRow label="Contact" value={ownership.contact} />}
                  <ReceiptRow
                    label="Co-Owners"
                    value={
                      ownership.coOwners && ownership.coOwners.length > 0
                        ? ownership.coOwners.map(c => `${c.name} (${c.sharePercent}%)`).join(', ')
                        : 'None'
                    }
                  />
                </tbody>
              </table>
            ) : (
              // Fallback when the richer ownership record hasn't been captured yet
              // for this unit (e.g. common-area parking/basement records).
              <table className="w-full text-sm mb-5 border border-black border-collapse">
                <tbody>
                  <ReceiptRow label="Registered To" value={unit.owner || 'Unregistered'} />
                  <ReceiptRow label="Note" value="Detailed ownership record not yet captured for this unit." />
                </tbody>
              </table>
            )}

            <h2 className="text-sm font-extrabold uppercase tracking-wide border-b border-black pb-1 mb-2">Dimensions</h2>
            <table className="w-full text-sm mb-5 border border-black border-collapse">
              <tbody>
                <ReceiptRow
                  label="Approved Dimensions (W × H × L)"
                  value={unit.approvedDimensions ? `${unit.approvedDimensions.join(' × ')} m` : 'N/A'}
                />
                <ReceiptRow
                  label="Actual Dimensions (W × H × L)"
                  value={unit.actualDimensions ? `${unit.actualDimensions.join(' × ')} m` : 'N/A'}
                />
                <ReceiptRow
                  label="Elevation Range"
                  value={unit.zRange ? `${unit.zRange[0]}m to ${unit.zRange[1]}m` : 'N/A'}
                />
              </tbody>
            </table>

            {unit.families && unit.families.length > 0 && (
              <>
                <h2 className="text-sm font-extrabold uppercase tracking-wide border-b border-black pb-1 mb-2">
                  Registered Occupants ({unit.families.length})
                </h2>
                <table className="w-full text-sm mb-5 border border-black border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1 text-left text-xs">Name</th>
                      <th className="border border-black px-2 py-1 text-left text-xs">Unit</th>
                      <th className="border border-black px-2 py-1 text-left text-xs">Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unit.families.map((f, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-1 text-xs">{f.name}</td>
                        <td className="border border-black px-2 py-1 text-xs">{f.unit || f.flatNumber || '—'}</td>
                        <td className="border border-black px-2 py-1 text-xs">{f.area || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <p className="text-[10px] mt-6 pt-3 border-t border-black leading-relaxed">
              This receipt is a system-generated extract from the Urdhva 3D Cadastral Intelligence Platform
              for demonstration/reference purposes and does not by itself constitute a legal title document.
              Reference No. {receiptRef} was generated on {generatedAt.toLocaleString()}.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function ReceiptRow({ label, value, mono }) {
  return (
    <tr>
      <td className="border border-black px-3 py-1.5 text-xs font-bold w-1/2 align-top">{label}</td>
      <td className={`border border-black px-3 py-1.5 text-xs align-top ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</td>
    </tr>
  )
}
