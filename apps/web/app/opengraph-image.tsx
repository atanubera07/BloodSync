import { ImageResponse } from 'next/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 90,
        background: '#fffaf8',
        color: '#a32635',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 42, fontWeight: 700 }}>BloodSync</div>
      <div style={{ fontSize: 76, fontWeight: 800, color: '#222', marginTop: 20 }}>
        Make every connection count.
      </div>
      <div style={{ fontSize: 30, marginTop: 30 }}>Private blood donation coordination</div>
    </div>,
    size,
  );
}
