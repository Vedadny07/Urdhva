/**
 * Generates 2D polygonal footprint coordinate arrays [ [x, z], ... ]
 * for various architectural shapes (rectangle, pentagon, cylinder, hexagon, l-shape, triangle, octagon).
 */
export function getShapeFootprint(shape = 'rectangle', width = 14, length = 12) {
  const w = width / 2;
  const l = length / 2;

  switch ((shape || '').toLowerCase()) {
    case 'cylinder':
    case 'circle': {
      const pts = [];
      const segs = 28;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push([
          Number((Math.cos(theta) * w).toFixed(2)),
          Number((Math.sin(theta) * l).toFixed(2))
        ]);
      }
      pts.push(pts[0]);
      return pts;
    }

    case 'pentagon': {
      const pts = [];
      const segs = 5;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2 - Math.PI / 2;
        pts.push([
          Number((Math.cos(theta) * w).toFixed(2)),
          Number((Math.sin(theta) * l).toFixed(2))
        ]);
      }
      pts.push(pts[0]);
      return pts;
    }

    case 'hexagon': {
      const pts = [];
      const segs = 6;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push([
          Number((Math.cos(theta) * w).toFixed(2)),
          Number((Math.sin(theta) * l).toFixed(2))
        ]);
      }
      pts.push(pts[0]);
      return pts;
    }

    case 'octagon': {
      const pts = [];
      const segs = 8;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2 + Math.PI / 8;
        pts.push([
          Number((Math.cos(theta) * w).toFixed(2)),
          Number((Math.sin(theta) * l).toFixed(2))
        ]);
      }
      pts.push(pts[0]);
      return pts;
    }

    case 'triangle': {
      return [
        [0, -l],
        [Number(w.toFixed(2)), Number(l.toFixed(2))],
        [Number((-w).toFixed(2)), Number(l.toFixed(2))],
        [0, -l]
      ];
    }

    case 'l-shape':
    case 'l_shape': {
      return [
        [Number((-w).toFixed(2)), Number((-l).toFixed(2))],
        [Number(w.toFixed(2)), Number((-l).toFixed(2))],
        [Number(w.toFixed(2)), 0],
        [0, 0],
        [0, Number(l.toFixed(2))],
        [Number((-w).toFixed(2)), Number(l.toFixed(2))],
        [Number((-w).toFixed(2)), Number((-l).toFixed(2))]
      ];
    }

    case 'rectangle':
    default:
      return [
        [Number((-w).toFixed(2)), Number((-l).toFixed(2))],
        [Number(w.toFixed(2)), Number((-l).toFixed(2))],
        [Number(w.toFixed(2)), Number(l.toFixed(2))],
        [Number((-w).toFixed(2)), Number(l.toFixed(2))],
        [Number((-w).toFixed(2)), Number((-l).toFixed(2))]
      ];
  }
}
