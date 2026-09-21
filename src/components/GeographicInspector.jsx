import React from 'react'
import useStore from '../store'
import GeographicBuilding3DPreview from './GeographicBuilding3DPreview'
import VerticalPropertyWorkspace from './VerticalPropertyWorkspace'
import { ArrowLeft, ExternalLink, MapPin, Database, Building2, Layers3, Landmark, Ruler, Hash, ShieldCheck } from 'lucide-react'

function valueOrNA(v) {
  return v === null || v === undefined || v === '' ? 'Not available' : v
}

function formatM(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `${n.toFixed(2).replace(/\.00$/, '')} m` : 'Not available'
}

function formatArea(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `${n.toFixed(2).replace(/\.00$/, '')} m²` : 'Not available'
}

export default function GeographicInspector() {
  const feature = useStore((s) => s.geoSelectedFeature)
  const setGeoSelectedFeature = useStore((s) => s.setGeoSelectedFeature)
  const setGeographicMode = useStore((s) => s.setGeographicMode)
  const setDataSurveyMode = useStore((s) => s.setDataSurveyMode)
  const setDataSurveyConsoleOpen = useStore((s) => s.setDataSurveyConsoleOpen)
  const setGeoPropertyContext = useStore((s) => s.setGeoPropertyContext)
  const geoLocation = useStore((s) => s.geoLocation)
  const buildings = useStore((s) => s.buildings) || []
  const maharashtraUlpinResult = useStore((s) => s.maharashtraUlpinResult)
  const clearMaharashtraUlpinResult = useStore((s) => s.clearMaharashtraUlpinResult)

  const returnToProperty = () => {
    setGeoSelectedFeature(null)
    setGeographicMode(false)
  }

  const openUrdhvaPropertyWorkflow = () => {
    if (!feature) return
    setGeoPropertyContext({
      sourceId: feature.source_id || null,
      source: feature.source || null,
      name: feature.name || feature.building_type || 'Selected geographic building',
      coordinates: feature.coordinates || null,
      heightM: feature.height_m || null,
      renderHeightM: feature.render_height_m || null,
      floors: feature.levels || feature.estimated_floors || null,
      floorsStatus: feature.levels != null ? 'Source-provided' : feature.estimated_floors != null ? 'Estimated from source height' : 'Unavailable',
      dataStatus: feature.data_status || 'footprint_only',
      note: 'Geographic source context only; existing URDHVA property/survey data is not overwritten.',
    })
    setGeographicMode(false)
  }

  if (!feature) {
    const ulpin = maharashtraUlpinResult
    return (
      <div className="h-full min-h-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-cyan-700" />
            <div className="text-sm font-bold text-slate-900">Geographic Explorer</div>
          </div>
          <div className="text-[10px] text-slate-500 truncate">{geoLocation?.label || 'India-wide geographic context'}</div>
        </div>

        <div className="urdhva-inspector-scroll min-h-0 flex-1 overflow-y-scroll p-5 space-y-4">
          {ulpin ? (
            <section className={`rounded-xl border p-4 ${ulpin.status === 'resolved' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-emerald-800">
                <Hash className="w-3.5 h-3.5" /> Maharashtra ULPIN
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-1 break-all">{ulpin.ulpin || 'Not available'}</div>
              <div className="text-[10px] text-slate-600 mt-1">{ulpin.status === 'resolved' ? 'Official parcel result resolved' : ulpin.message || 'Provider not connected'}</div>

              {ulpin.status === 'resolved' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">District</div><div className="text-[10px] font-semibold text-slate-800">{valueOrNA(ulpin.district)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">Taluka / Office</div><div className="text-[10px] font-semibold text-slate-800">{valueOrNA(ulpin.taluka)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">Village / City</div><div className="text-[10px] font-semibold text-slate-800">{valueOrNA(ulpin.village || ulpin.city)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">Plot / Survey</div><div className="text-[10px] font-semibold text-slate-800">{valueOrNA(ulpin.plot_no || ulpin.survey_no || ulpin.cts_no)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">Length</div><div className="text-[10px] font-mono font-bold text-slate-800">{formatM(ulpin.length_m)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2"><div className="text-[9px] text-slate-400">Breadth</div><div className="text-[10px] font-mono font-bold text-slate-800">{formatM(ulpin.breadth_m)}</div></div>
                  <div className="rounded-lg bg-white border border-emerald-100 p-2 col-span-2"><div className="text-[9px] text-slate-400">Parcel area</div><div className="text-[10px] font-mono font-bold text-slate-800">{formatArea(ulpin.area_m2)}</div></div>
                </div>
              )}

              <div className="mt-3 text-[9px] leading-relaxed text-slate-600">
                {ulpin.status === 'resolved'
                  ? 'This parcel highlight is from the connected Maharashtra land-record provider. Building data remains a separate source and is shown only when a real building feature intersects the parcel.'
                  : 'Exact ULPIN-to-parcel coordinates require an authorized Maharashtra land-record API connection or an imported official parcel dataset. URDHVA does not guess coordinates or ULPINs.'}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <a href="https://mahavillages.mahabhumi.gov.in/newjurisdiction.php" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-[9px] font-bold text-emerald-800 hover:bg-emerald-50"><ExternalLink className="w-3 h-3" /> Official MAH LGD</a>
                <a href="https://mahabhunakasha.mahabhumi.gov.in/mobile/www/index.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-[9px] font-bold text-emerald-800 hover:bg-emerald-50"><Landmark className="w-3 h-3" /> Bhu-Naksha</a>
                <a href="https://api.mahabhumi.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-[9px] font-bold text-emerald-800 hover:bg-emerald-50"><Database className="w-3 h-3" /> Mahabhumi API</a>
                <button type="button" onClick={clearMaharashtraUlpinResult} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[9px] font-bold text-slate-700 hover:bg-slate-50">Clear</button>
              </div>
            </section>
          ) : (
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <div className="max-w-[270px] text-center">
                <Building2 className="w-9 h-9 text-slate-300 mx-auto mb-3" />
                <div className="text-xs font-bold text-slate-800">Select a 3D building</div>
                <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Click a source-backed building on the map to inspect its dimensions, height, floor count and provenance.
                </div>
                <button type="button" onClick={returnToProperty} className="mt-4 px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
                  Return to Property 3D
                </button>
              </div>
            </div>
          )}

          {!ulpin && (
            <section className="rounded-xl border border-slate-200 p-3">
              <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-2">Data sources</div>
              <div className="text-[10px] text-slate-600 leading-relaxed">
                Buildings: Overture vector tiles with source attributes. Roads/water: Overture geographic layers. OSM is used for location search and remains available for detailed source workflows. Official ULPIN/parcel data appears only when an authoritative Maharashtra provider is connected.
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[9px] text-slate-500 leading-relaxed">
          Geographic buildings are source records, not official ownership or ULPIN records. Survey-grade height/floor measurement comes from the existing URDHVA LiDAR/drone/survey workflow.
        </div>
      </div>
    )
  }

  const dataStatus = feature.data_status
  const statusLabel = dataStatus === 'source_height'
    ? 'SOURCE HEIGHT'
    : dataStatus === 'source_levels_estimated_height'
      ? 'SOURCE FLOORS • ESTIMATED HEIGHT'
      : 'FOOTPRINT ONLY'
  const statusClasses = dataStatus === 'source_height'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : dataStatus === 'source_levels_estimated_height'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-300'
  const floorCount = feature.levels != null ? Number(feature.levels) : (feature.estimated_floors != null ? Number(feature.estimated_floors) : 0)
  const hasHeight = Number(feature.height_m) > 0


  return (
    <div className="h-full min-h-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-cyan-700">
              <Building2 className="w-3.5 h-3.5" /> Geographic Building
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate">{feature.name || feature.building_type || 'Unnamed building'}</div>
            <div className="text-[9px] text-slate-500 font-mono mt-1 truncate">{feature.source_id || 'Source ID unavailable'}</div>
          </div>
          <button type="button" onClick={() => setGeoSelectedFeature(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">×</button>
        </div>
        <div className={`inline-flex mt-3 px-2 py-1 rounded-md border text-[9px] font-bold ${statusClasses}`}>{statusLabel}</div>
      </div>

      <div className="urdhva-inspector-scroll min-h-0 flex-1 overflow-y-scroll p-4 space-y-3">
        <GeographicBuilding3DPreview feature={feature} propertyRecord={buildings.find((b) => String(b?.id || '') === String(feature?.urdhva_building_id || feature?.property_id || '') || String(b?.name || '').trim().toLowerCase() === String(feature?.name || '').trim().toLowerCase()) || null} />

        <VerticalPropertyWorkspace feature={feature} />

        <section className="rounded-xl border border-slate-200 p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5"><Database className="w-3 h-3" /> Source / provenance</div>
          <div className="text-[11px] font-semibold text-slate-800">{valueOrNA(feature.source)}</div>
          <div className="text-[9px] text-slate-500 mt-1">Provider layer: {valueOrNA(feature.provider_type)}</div>
          <div className="text-[9px] text-slate-500 mt-1">Geometry source: {valueOrNA(feature['@geometry_source'] || feature.geometry_source)}</div>
          <div className="text-[9px] text-slate-500 mt-1">Height source: {valueOrNA(feature.height_source)}</div>
          <div className="text-[9px] text-slate-500 mt-1">Source timestamp: {valueOrNA(feature.source_timestamp)}</div>
          {String(feature.source_id || '').startsWith('way/') && (
            <a className="inline-flex items-center mt-2 text-[9px] font-bold text-cyan-700 hover:text-cyan-900 underline" href={`https://www.openstreetmap.org/${feature.source_id}`} target="_blank" rel="noreferrer">Open source record on OpenStreetMap ↗</a>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 p-3 grid grid-cols-2 gap-2">
          <div><div className="text-[9px] text-slate-400">Latitude</div><div className="text-[11px] font-mono text-slate-800">{feature.coordinates?.[1]?.toFixed(6) || 'Not available'}</div></div>
          <div><div className="text-[9px] text-slate-400">Longitude</div><div className="text-[11px] font-mono text-slate-800">{feature.coordinates?.[0]?.toFixed(6) || 'Not available'}</div></div>
        </section>

        <section className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5"><Layers3 className="w-3 h-3" /> Building attributes</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2"><div className="text-[9px] text-slate-400">Length</div><div className="text-[11px] font-mono font-bold text-slate-800">{formatM(feature.length_m)}</div></div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2"><div className="text-[9px] text-slate-400">Breadth</div><div className="text-[11px] font-mono font-bold text-slate-800">{formatM(feature.breadth_m)}</div></div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2"><div className="text-[9px] text-slate-400">Footprint</div><div className="text-[11px] font-mono font-bold text-slate-800">{formatArea(feature.footprint_area_m2)}</div></div>
            <div className="rounded-lg bg-cyan-50 border border-cyan-100 p-2"><div className="text-[9px] text-cyan-700">Height</div><div className="text-[11px] font-mono font-bold text-slate-800">{formatM(feature.height_m)}</div></div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 col-span-2"><div className="text-[9px] text-amber-700">3D render height</div><div className="text-[11px] font-mono font-bold text-slate-800">{formatM(feature.render_height_m || feature.estimated_height_m)} <span className="text-[8px] font-sans font-medium text-amber-700">(visualization)</span></div></div>
          </div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Above-ground floors</span><span className="font-mono font-bold text-slate-800">{floorCount > 0 ? floorCount : 'Not available'}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Floor data status</span><span className="font-semibold text-slate-800 text-right">{valueOrNA(feature.levels != null ? 'Source-provided' : feature.estimated_floors != null ? 'Estimated from source height' : 'Unavailable')}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Floor height used</span><span className="font-semibold text-slate-800 text-right">{feature.floor_height_m ? `${Number(feature.floor_height_m).toFixed(2)} m` : 'Not available'}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Floor-height source</span><span className="font-semibold text-slate-800 text-right max-w-[60%]">{valueOrNA(feature.floor_height_source || 'Unavailable')}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Underground floors</span><span className="font-mono font-bold text-slate-800">{valueOrNA(feature.levels_underground)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Building type</span><span className="font-semibold text-slate-800 text-right">{valueOrNA(feature.class || feature.building_type)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Building part</span><span className="font-semibold text-slate-800 text-right">{valueOrNA(feature.building_part)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Roof shape</span><span className="font-semibold text-slate-800 text-right">{valueOrNA(feature.roof_shape)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Building parts loaded</span><span className="font-mono font-bold text-slate-800">{Number(feature.parts_count || feature.building_parts?.length || 0)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Min height</span><span className="font-semibold text-slate-800 text-right">{formatM(feature.min_height_m)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">Data status</span><span className="font-semibold text-slate-800 text-right">{valueOrNA(feature.confidence)}</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-slate-500">3D geometry</span><span className="font-semibold text-slate-800 text-right">{feature.geometry ? 'Source footprint' : 'Source geometry unavailable'}</span></div>
        </section>

        {floorCount > 0 && (
          <section className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-2"><Ruler className="w-3 h-3" /> Floor structure</div>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: Math.min(36, floorCount) }, (_, i) => (
                <div key={i} className={`px-2 py-1.5 rounded border text-center text-[9px] font-mono font-bold ${feature.levels != null ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>F{i + 1}</div>
              ))}
            </div>
            <div className="text-[9px] text-slate-500 mt-2">{feature.levels != null ? 'Source-provided floor count. The mini 3D preview separates these floors visually.' : feature.estimated_floors != null ? 'Floor count is estimated from source height for visualization only.' : 'Floor structure unavailable from the source.'}</div>
          </section>
        )}

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-800 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Official cadastral status</div>
          <div className="text-[10px] text-amber-900 mt-1 leading-relaxed">
            Official ULPIN: <strong>Not available from this geographic building source.</strong> A parcel-level ULPIN is only shown when an authoritative Maharashtra source resolves it. Floor/unit identifiers in URDHVA are separate vertical identifiers.
          </div>
        </section>

        <section className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-800">Property Passport handoff</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">Survey status</div><div className="text-[10px] font-semibold text-slate-800">Not verified</div></div>
            <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">Record vs Reality</div><div className="text-[10px] font-semibold text-slate-800">Not assessed</div></div>
            <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">Official ULPIN</div><div className="text-[10px] font-semibold text-slate-800">{feature.ulpin || 'Not available'}</div></div>
            <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">URDHVA vertical ID</div><div className="text-[10px] font-semibold text-slate-800">Pending verified survey</div></div>
          </div>
          <div className="text-[9px] text-slate-600 mt-2 leading-relaxed">This handoff carries the geographic building as context. It does not convert a public footprint into an official ULPIN or overwrite your existing property record.</div>
          <button type="button" onClick={openUrdhvaPropertyWorkflow} className="mt-3 w-full px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Open URDHVA Property Workflow
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Building / property linkage</div>
          <div className="text-[10px] text-slate-600 mt-1 leading-relaxed">Flats/units are not inferred from a public building footprint. Use the existing survey workflow to attach LiDAR/drone/building-plan evidence and then create floor and unit records.</div>
          {hasHeight && <div className="text-[9px] text-emerald-700 font-semibold mt-2">✓ Source height is available for this geographic building.</div>}
          {floorCount > 0 && <div className="text-[9px] text-emerald-700 font-semibold mt-1">✓ Source floor count is available for this geographic building.</div>}
          {feature.enrichment && <div className="text-[9px] text-cyan-700 font-semibold mt-1">✓ Detail enrichment: {feature.enrichment}</div>}
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <button type="button" onClick={() => { setDataSurveyMode('lidarScan'); setDataSurveyConsoleOpen(true) }} className="w-full px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-2">
          <ExternalLink className="w-3.5 h-3.5" /> Send to Survey Workflow
        </button>
        <button type="button" onClick={returnToProperty} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Property 3D
        </button>
      </div>
    </div>
  )
}
